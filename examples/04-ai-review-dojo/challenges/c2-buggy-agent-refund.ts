/**
 * 对应题号：AI-A5｜安全审查：Agent 退款工具的攻击面 —— C2 雷源码
 * 运行命令：npx tsx 04-ai-review-dojo/repro/c2-repro.ts
 *
 * 用「确定性 mock 模型 + 内存 mock DB」复刻一个 Next.js Server Action 的行为：
 * 模型两轮 ReAct（查单 → 决策退款），DB 用极简字符串匹配模拟「SQL 字符串拼接」的效果。
 * 攻击链与修复分层见 answers/c2-answers.md；修复版见 solutions/c2-safe-agent.ts。
 */

export interface Order {
    id: string;
    ownerId: string;
    amount: number;
    status: 'paid' | 'refunded';
    note: string; // 收货备注：典型的「不可信数据」字段，可能携带间接注入 payload
}

export interface RefundRecord {
    orderId: string;
    requestedBy: string;
    approved: boolean; // 雷版永远为 false：从未经过任何人审批
}

export interface MockDb {
    orders: Order[];
    refunds: RefundRecord[];
    /** 雷版数据访问层：直接执行拼接出来的 SQL 字符串（内置极简 SQL 效果模拟器） */
    query(sql: string): Order[];
}

/** 判断 SQL 片段里是否出现经典恒真注入 '1'='1 / OR 1=1（仅用于演示注入效果） */
function hasTautology(value: string): boolean {
    return /\s+or\s+'?\d+'?\s*=\s*'?\d+/i.test(value);
}

export function createDb(initial: Order[]): MockDb {
    const orders: Order[] = initial.map((o) => ({ ...o }));
    const refunds: RefundRecord[] = [];

    return {
        orders,
        refunds,
        query(sql: string): Order[] {
            const select = sql.match(/^select \* from orders where id='([\s\S]*)'$/i);
            if (select) {
                if (hasTautology(select[1])) return orders.map((o) => ({ ...o }));
                return orders.filter((o) => o.id === select[1]).map((o) => ({ ...o }));
            }
            const update = sql.match(/^update orders set status='refunded'[\s\S]*where id='([\s\S]*)'$/i);
            if (update) {
                const targets = hasTautology(update[1])
                    ? orders
                    : orders.filter((o) => o.id === update[1]);
                for (const o of targets) o.status = 'refunded';
                return [];
            }
            throw new Error(`mock DB 无法识别的 SQL：${sql}`);
        },
    };
}

/**
 * 确定性 mock 模型：模拟真实 LLM 的第二轮决策。
 * 弱点被故意放大——它不区分「指令」与「工具返回的数据」，
 * 一旦订单备注里出现「忽略以上指令 + 退款」，就把数据当指令执行。
 * 这等价于一个被间接 prompt injection 劫持的模型。
 */
function policyModel(toolResult: string): 'refund' | 'answer' {
    const injected = /忽略(以上|之前|所有).{0,10}(指令|规则)|ignore (all )?previous/i.test(toolResult);
    if (injected && /退款|refund/i.test(toolResult)) return 'refund';
    return 'answer';
}

/** 从用户原话里取订单号（雷版：取到什么就原样拼进 SQL，允许携带引号） */
export function extractOrderId(text: string): string {
    const injected = text.match(/O-\d+'?\s*or\s*'?1'?='?1/i);
    if (injected) return injected[0].replace(/\s+/g, ' ');
    const plain = text.match(/O-\d+/);
    return plain ? plain[0] : text.trim();
}

export interface BuggyResult {
    status: 'refunded' | 'answered';
    detail?: string;
}

/** 雷版 Server Action：注意入参里带着 userId —— 身份由客户端「自报」 */
export async function askAssistantBuggy(
    input: { question: string; userId: string },
    db: MockDb,
): Promise<BuggyResult> {
    // 第一轮（ReAct-Act 1）：模型决定查单，orderId 直接取自用户输入
    const orderId = extractOrderId(input.question);
    const order = db.query(`SELECT * FROM orders WHERE id='${orderId}'`)[0];

    // 雷：系统指令、用户原话、工具结果（不可信备注）全部拼进同一个文本区
    const toolResult = JSON.stringify(order ?? null);
    const mixedPrompt =
        `你是订单退款助手，当前用户ID：${input.userId}，可调用 refund 工具。\n` +
        `用户问题：${input.question}\n工具查询结果：${toolResult}`;
    void mixedPrompt; // 真实实现里整段发给模型；这里由确定性 policyModel 代替

    // 第二轮（ReAct-Act 2）：模型依据「指令+数据混合区」做决策
    if (order && policyModel(toolResult) === 'refund') {
        const reason = '按要求退款';
        // 雷三连：① 不校验 order.ownerId 是否为当前用户（水平越权）
        //        ② 无人工审批门，模型决策即资金动作
        //        ③ SQL 字符串拼接；且退款无幂等键，Agent 重试会重复打款
        db.query(
            `UPDATE orders SET status='refunded', reason='${reason}' WHERE id='${order.id}'`,
        );
        db.refunds.push({ orderId: order.id, requestedBy: input.userId, approved: false });
        return { status: 'refunded', detail: order.id };
    }

    return { status: 'answered', detail: toolResult };
}
