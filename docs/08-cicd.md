# 八、CI/CD 自动化

> CI/CD 是前端工程化从「能上线」到「放心上线」的分水岭：它把代码检查、测试、构建、发布变成机器自动执行的流水线，用一致的产物与可回滚的流程替代人工操作。AI 时代代码生成效率大幅提升，交付瓶颈进一步转移到验证与发布环节，能否设计可靠的流水线与质量门禁，成为中高级前端工程师的核心竞争力。本领域题目从基础概念入手，逐步深入到流水线编排、发布策略与全链路质量保障。

**题量分布**：Basic 3 题 · Intermediate 3 题 · Advanced 3 题（共 9 题）

**🎬 配套漫画**：[EP.08 CI/CD 流水线](../comics/ep08-cicd-pipeline.svg)

---

## 🟢 Basic（基础）

### CICD-B1｜CI 与 CD 概念辨析：持续集成 / 持续交付 / 持续部署

- **题型**：理论概念题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  请解释 CI（持续集成）与 CD（持续交付 / 持续部署）各自的含义与区别，说明「持续交付」和「持续部署」一词之差背后的关键差异，并描述一条典型 CI 流水线包含哪些阶段、每个阶段失败意味着什么。
- **考察要点**：
  - 准确区分 CI（频繁合入 + 自动验证）、持续交付（随时可发布 + 人工确认）、持续部署（自动发布到生产）
  - 理解流水线阶段划分与「快速失败」原则
  - 知道做好 CD 的前置条件：主干健康、测试可信、发布可回滚
- **参考答案要点**：
  - CI（持续集成）：成员频繁向主干合入小批量代码，每次合入自动触发构建 + 测试，尽早暴露集成冲突与回归
  - 持续交付（Continuous Delivery）：CI 之后产物始终处于「随时可发布」状态，最后的生产发布需要人工确认；持续部署（Continuous Deployment）：验证通过后自动发布到生产，无需人工介入
  - 一词之差的本质：最后一个「发布到生产」的动作是否自动化、是否保留人工审批卡点
  - 典型阶段：代码检查（lint）→ 类型检查 → 单元测试 → 构建 → 安全扫描 → 部署测试环境 →（审批）→ 生产发布；任一阶段失败立即终止整条流水线（快速失败），把问题挡在最便宜的阶段
  - 落地基础：小步提交、主干开发或短生命周期分支、自动化测试可信、制品唯一且不可变（build once, deploy many）

### CICD-B2｜前端 CI/CD 与后端的差异：静态资源、CDN 与哈希缓存

- **题型**：理论概念题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  与后端服务相比，前端项目的 CI/CD 有哪些显著差异？请从产物形态、部署方式、回滚策略、缓存策略四个角度展开，并解释「带内容哈希的文件名 + 长缓存 + 入口文件不缓存」这套组合为什么是前端静态资源发布的标准做法。
- **考察要点**：
  - 理解前端产物是无状态的静态资源，无需数据库迁移、进程重启等步骤
  - 知道前端部署 = 上传 CDN/对象存储，天然支持多版本共存与秒级回滚
  - 掌握指纹哈希文件名与 HTTP 缓存头的配合关系
  - 理解回滚的本质是切回旧版本入口，以及发布顺序的坑
- **参考答案要点**：
  - 产物形态：前端构建产物是纯静态文件（JS/CSS/HTML/图片），无运行时状态；后端是服务进程，涉及依赖环境、数据库迁移、健康检查、优雅停机
  - 部署方式：前端把产物上传 CDN/对象存储即可全球分发；后端通常要滚动/蓝绿替换实例并观察指标
  - 回滚策略：前端只要保留旧版本产物目录，把入口（HTML 或 manifest）切回去即秒级回滚；后端回滚还可能牵连数据兼容问题
  - 缓存策略：内容哈希文件名（如 `app.a1b2c3.js`）保证内容一变 URL 必变 → 可对带哈希资源设置一年长缓存；入口 HTML 引用带哈希资源但自身无哈希 → HTML 必须设 `Cache-Control: no-cache` 强制重新验证，保证用户先拿到新入口
  - 发布顺序：必须先上传新静态资源、再更新 HTML；反过来会出现「新 HTML 引用了还不存在的哈希文件」的 404 窗口期
  - CI 层面的差异：前端产物应在 CI 中构建而非开发机手工上传，构建环境要固定 Node 版本与 lockfile，保证产物可复现；旧版本产物不能发布后立刻删除，需保留若干版本支持回滚

### CICD-B3｜编写最简 GitHub Actions 工作流

- **题型**：实际场景应用题
- **难度**：Basic ★★☆☆☆
- **问题描述**：
  为一个使用 pnpm 的前端项目编写最简可用的 GitHub Actions 工作流 `.github/workflows/ci.yml`，要求：① push 到 main 与所有 Pull Request 触发；② 检出代码；③ 安装并使用 Node 20；④ 启用 pnpm；⑤ 安装依赖；⑥ 执行构建。给出完整 YAML 并逐段解释关键字段的作用。
- **考察要点**：
  - 理解 workflow / job / step 三层结构与 `on` 触发器语法
  - 知道 `actions/checkout`、`pnpm/action-setup`、`actions/setup-node` 三个基础 action 的职责与先后依赖
  - 会用 `with` 传递参数（node-version、cache 等）
  - 理解 `run` 步骤在同一 job 中共享工作区与 shell 环境
- **参考答案要点**：

```yaml
name: CI # 工作流名称，显示在 GitHub Actions 页面

on: # 触发条件
  push: # push 到 main 触发
    branches: [main]
  pull_request: # 任何 PR 触发，保证待合并分支都被验证

jobs: # 一个 workflow 可包含多个 job，本例只有一个
  build: # job id，也是页面上的任务名
    runs-on: ubuntu-latest # 运行环境：GitHub 提供的 Ubuntu 虚拟机
    steps:
      - uses: actions/checkout@v4 # 第一步：把仓库代码拉到虚拟机工作目录
      - uses: pnpm/action-setup@v4 # 安装 pnpm，版本优先读 package.json 的 packageManager 字段
      - uses: actions/setup-node@v4 # 安装 Node
        with:
          node-version: 20 # 指定 Node 大版本
          cache: pnpm # 按 lockfile 哈希缓存 pnpm store，加速后续安装
      - run: pnpm install --frozen-lockfile # 严格按 lockfile 安装，依赖不一致直接报错
      - run: pnpm build # 执行构建脚本
```

  - `on`：声明触发事件；`push.branches` 限定只有 main 的 push 触发，PR 触发覆盖所有来源分支
  - `jobs.<id>.runs-on`：指定虚拟机镜像，前端项目一般用 ubuntu-latest（快、计费因子低）
  - `steps`：`uses` 复用社区封装的 action，`run` 在虚拟机 shell 中执行命令；同一 job 内的步骤顺序执行、共享文件系统
  - 顺序依赖：`setup-node` 的 `cache: pnpm` 依赖 pnpm 已可用，所以 `pnpm/action-setup` 必须放在它之前
  - `--frozen-lockfile`：lockfile 与 package.json 不一致时直接失败，避免 CI 中「偷偷升级依赖」造成不可复现
  - 进阶方向：多 job 拆分 + `needs` 编排、Node 版本矩阵、`actions/cache` 手动缓存、构建产物上传 artifact

## 🟡 Intermediate（进阶）

### CICD-I1｜完整 CI 流水线：lint → typecheck → test → build → 上传 artifact

- **题型**：实际场景应用题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  在 CICD-B3 基础上扩展出一条团队级 CI 流水线，要求：① lint、typecheck、test、build 四个阶段；② 用 `actions/cache` 做 pnpm store 缓存；③ Node 18/20/22 三个版本的测试矩阵（矩阵仅作用于 test，其余步骤用 Node 20）；④ 测试通过后把构建产物上传为 artifact 供后续部署使用。给出完整 YAML，并说明并行与 `needs` 依赖编排的关系。
- **考察要点**：
  - 会用 job 拆分职责并通过 `needs` 编排依赖关系
  - 掌握 `strategy.matrix` 与 `fail-fast` 的语义
  - 会配置 `actions/cache` 的 key 命中逻辑（lockfile 哈希 + 前缀回退）
  - 会用 `actions/upload-artifact` 在 job 之间传递产物
- **参考答案要点**：

```yaml
name: CI-Pipeline

on:
  push:
    branches: [main]
  pull_request:

jobs:
  lint: # 最快失败的检查，独立成 job
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/cache@v4 # 缓存 pnpm store，lockfile 不变则直接命中
        with:
          path: ~/.local/share/pnpm/store # pnpm 在 Linux 下的默认 store 目录
          key: pnpm-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: |
            pnpm-${{ runner.os }}- # lockfile 变动时按前缀回退复用旧缓存
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck: # 与 lint 无依赖，会被并行调度
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/cache@v4
        with:
          path: ~/.local/share/pnpm/store
          key: pnpm-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: |
            pnpm-${{ runner.os }}-
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test: # 单元测试：Node 版本矩阵
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false # 某版本失败不取消其余版本，便于定位兼容性问题
      matrix:
        node: [18, 20, 22] # 为每个版本生成一个独立 job
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }} # 注入矩阵变量
      - uses: actions/cache@v4
        with:
          path: ~/.local/share/pnpm/store
          key: pnpm-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: |
            pnpm-${{ runner.os }}-
      - run: pnpm install --frozen-lockfile
      - run: pnpm test -- --coverage

  build: # 构建并上传制品：依赖前三个 job 全部通过
    needs: [lint, typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/cache@v4
        with:
          path: ~/.local/share/pnpm/store
          key: pnpm-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: |
            pnpm-${{ runner.os }}-
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-artifact@v4 # 产物上传，供后续部署 job/workflow 下载
        with:
          name: dist
          path: dist/
          retention-days: 7 # 制品保留 7 天
```

  - 并行与编排：lint/typecheck/test 之间无 `needs` 依赖，GitHub 会并行调度缩短总时长；build 通过 `needs: [lint, typecheck, test]` 等三者全绿后执行——「快速失败在前，高成本动作在后」
  - 缓存 key 用 `hashFiles('pnpm-lock.yaml')`：lockfile 不变则命中，跳过大部分下载；`restore-keys` 提供前缀回退，lockfile 小改动也能复用大部分缓存；`setup-node` 的 `cache: pnpm` 是等价的内置简化写法
  - 矩阵：为 matrix 中每个值生成独立 job；`fail-fast: false` 保证 22 失败不取消 18/20 的运行，能看清「是否只有某个 Node 版本坏」
  - artifact 是 job 间的官方传值方式；上传后可被部署 workflow 用 `download-artifact` 消费，实现 build once, deploy many
  - 优化权衡：每个 job 都重复 install，可进一步用「缓存 node_modules」或 monorepo 任务裁剪（只测变更包）提速，但会牺牲一定隔离性

### CICD-I2｜蓝绿部署 vs 金丝雀发布 vs 滚动发布，以及前端灰度方案

- **题型**：理论概念题 + 技术选型题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  请分别说明蓝绿部署、金丝雀发布、滚动发布三种策略的原理、优缺点与适用场景；再结合前端静态资源「无状态、秒级回滚」的特点，说明前端如何实现类似金丝雀的灰度发布（如网关按流量比例、按 Cookie/用户标签定向），以及灰度期间如何保证新旧版本共存不出错。
- **考察要点**：
  - 准确说出三种策略的机制差异与风险面（爆炸半径、资源成本、回滚速度）
  - 能结合场景做技术选型论证
  - 理解前端灰度的实现层：网关/边缘层按流量或身份分流入口文件
  - 理解新旧版本共存的产物保留与兼容问题
- **参考答案要点**：
  - 蓝绿部署：维护两套等价环境，发布时把流量从蓝整体切到绿，验证失败秒级切回；优点是切换与回滚都极快；缺点是资源双倍成本，共享依赖（数据库 schema）必须双向兼容；适合可用性要求高、发布频率不高的系统
  - 金丝雀发布：小比例流量先打新版本，观察错误率/性能指标后逐步放量 1% → 10% → 50% → 100%；爆炸半径最小，但需要灰度规则引擎与完善观测，发布周期长；适合大用户量、高风险变更
  - 滚动发布：多实例逐批替换直至全部更新；资源开销居中、无需双倍环境；缺点是新旧共存时间长、发布与回滚都较慢；适合实例较多的无状态服务
  - 前端灰度本质：静态资源哈希文件名让新旧 chunk 可同时存在，灰度只需控制「哪些用户拿到新版本的入口 HTML/manifest」——实现层在网关、CDN 边缘函数或 BFF，而非前端代码本身
  - 常见分流手段：按随机百分比（流量灰度）、按 Cookie/登录白名单（内部员工先试）、按用户 ID 哈希取模（稳定命中同一版本）、按地区/设备/渠道定向
  - 共存注意事项：旧版本产物至少保留一个回滚周期，不能发布后立刻清理；localStorage/接口数据结构跨版本要兼容或做迁移；灰度看板盯 JS 错误率、白屏率、Web Vitals，异常即暂停放量并回切规则

### CICD-I3｜前端项目门禁检查规则设计

- **题型**：架构设计题
- **难度**：Intermediate ★★★☆☆
- **问题描述**：
  你负责为一个 20 人前端团队设计 Merge Request 门禁规则，目标：不合规代码进不了 main。请说明：① 分支保护 + required checks 的机制；② commitlint、ESLint、typecheck、单测覆盖率阈值、bundle size 预算、可访问性（accessibility）检查分别如何作为卡点落地（各用什么工具、在哪一步执行）；③ 当某类检查误报率过高时，如何设计豁免机制而不让门禁形同虚设。
- **考察要点**：
  - 理解分支保护规则与 required status checks 的配合机制
  - 能为每类检查指定具体工具与执行位置（本地 pre-commit / CI 卡点 / 双层）
  - 理解阈值类门禁需要基线与增量视角，避免历史欠账阻塞所有人
  - 能设计有约束的豁免机制（白名单 + 到期时间 + 评审记录）
- **参考答案要点**：
  - 机制层：main 设为 protected branch——禁止 force push、禁止直接 push、要求 PR + 至少 1 人 approve；required status checks 勾选各 CI job，任一未通过则 Merge 按钮禁用
  - commitlint：husky + @commitlint/cli 校验 commit message 符合 Conventional Commits；本地 pre-commit 提前拦截 + CI 对 PR 的所有 commit 复核（防止本地绕过）
  - ESLint / typecheck：CI 必过卡点；本地配 lint-staged 只检查暂存文件降低摩擦；类型检查用 `tsc --noEmit` 全量跑，保证跨模块类型一致性
  - 覆盖率阈值：vitest/jest thresholds 设全局下限（如行覆盖 70%）+ 增量覆盖率不得低于 main 基线，双视角防止存量代码遮蔽增量劣化
  - bundle size 预算：size-limit 或 bundlesize 对比 main 基线，产物体积超出预算（如 +10KB gzip）即失败并要求说明理由；按入口/分包分别设预算避免互相掩盖
  - accessibility：axe-core 集成进组件测试或 E2E（Playwright + axe），critical 级 violation 即失败，普通级别先报告不阻断
  - 豁免机制：① 白名单文件/规则列表必须带到期时间，过期自动恢复卡点（技术债显式化）；② PR 标签豁免（如 `[skip-a11y]`）需 reviewer 二次确认并强制填写原因；③ 渐进收紧：新门禁先告警不阻断，观察误报率后再转为强制
  - 治理原则：门禁配置本身也走 PR 评审变更，谁也关不掉门；定期统计误报率与拦截量，优先修工具与规则而不是扩大豁免

## 🔴 Advanced（高级）

### CICD-A1｜云原生构建（CNB）理念下的前端构建流程设计

- **题型**：架构设计题
- **难度**：Advanced ★★★★★
- **问题描述**：
  传统 CI（如 GitHub Actions）把构建串在虚拟机 job 里，而 CNB（Cloud Native Build，云原生构建）主张用「声明式流水线 + 云端环境池 + 细粒度缓存 + 制品库」重构构建过程。请设计一个前端应用的 CNB 构建流程，覆盖：① pipeline as code 如何描述（给出思路或 YAML 片段）；② 依赖与编译中间产物等构建缓存如何在云端复用与失效；③ 构建产物如何推送到制品库并保证不可变；④ lint/test/build/upload 等原子任务如何并行编排；⑤ 与 GitHub Actions 等传统方案的理念差异。
- **考察要点**：
  - 理解 pipeline as code：流水线本身版本化、可评审、可复用
  - 掌握缓存分层设计与失效策略，以及缓存污染的安全防护
  - 理解制品库不可变性与 build once, deploy many 的可信链路
  - 能从环境模型、并发模型、缓存模型三个维度对比 CNB 与传统 CI
- **参考答案要点**：
  - pipeline as code：流水线定义与代码同仓管理（如 `.cnb.yml`），声明「触发事件 → 任务拓扑 → 环境镜像 → 执行命令」；修改流水线与修改代码走同样的 PR 评审；公共任务可抽成模板被跨仓库引用
  - 思路示意：

```yaml
# .cnb.yml 思路示意：以分支为维度声明流水线
main:
  push: # main 分支 push 触发
    - stage: check # 阶段一：无依赖任务并行
      tasks:
        - name: lint
          image: node:20 # 每个原子任务声明自己的容器环境
          script: pnpm install --frozen-lockfile && pnpm lint
        - name: test
          image: node:20
          script: pnpm install --frozen-lockfile && pnpm test -- --coverage
    - stage: build # 阶段二：check 通过后执行
      tasks:
        - name: build
          image: node:20
          script: pnpm install --frozen-lockfile && pnpm build
          cache: pnpm-store # 声明复用云端命名缓存
        - name: upload
          script: cnb-artifact push dist/ # 构建产物推送制品库
```

  - 缓存分层：① 包管理 store（pnpm store），key 跟随 lockfile 哈希；② 编译中间产物（webpack/turbopack 持久缓存），key 跟随分支 + 源码指纹，放云端对象存储；③ 环境镜像/容器层缓存，环境拉起接近秒级
  - 缓存安全：按分支隔离，PR 产出的缓存不投毒主干（主干缓存只读共享或单独命名空间）；缓存命中后做完整性校验再写入
  - 制品库：产物推送制品库并打唯一版本/摘要，部署阶段只允许从制品库拉取——测过的就是发布的；制品不可变，回滚 = 重新部署历史制品而非重新构建
  - 原子任务并行：任务间只声明依赖形成 DAG，无依赖即自动并行；单任务失败不影响无关分支，空闲环境由调度器自动填充，整体吞吐远高于 job 级串行
  - 与 GitHub Actions 的理念差异：① 环境模型——Actions 一条 job 绑定一个 runner 环境，CNB 把任务下沉为容器级原子单元，镜像即代码、即取即用；② 缓存模型——Actions 靠显式 cache step，CNB 把缓存作为平台一等公民统一调度；③ 并发模型——DAG 细粒度并行 vs job 级并行；④ 本质相通：声明式、版本化、可复现，传统方案靠拆分任务 + 精细缓存也能逼近 CNB 效果

### CICD-A2｜多环境 CI/CD 流水线设计：dev/test/staging/prod

- **题型**：架构设计题
- **难度**：Advanced ★★★★☆
- **问题描述**：
  为一个前后端分离的中大型前端项目设计四环境（dev/test/staging/prod）CI/CD 流水线。要求说明：① 分支模型与环境的映射关系（什么分支/动作部署到什么环境）；② 环境变量（API 地址、第三方密钥等）注入的安全做法；③ staging → prod 之间的人工审批卡点如何落地；④ 如何用 tag 触发生产发布；⑤ 发布失败时的回滚方案（静态资源与边缘配置两个层面）。
- **考察要点**：
  - 能设计分支模型与环境的一一映射，并坚持 build once, deploy many
  - 理解前端密钥的现实：打进 bundle 即公开，真密钥必须放服务端
  - 掌握 GitHub Environments 保护规则 / required reviewers 实现审批卡点
  - 理解 tag 即制品锚点、发布即部署制品、回滚必须流水线化
- **参考答案要点**：
  - 分支映射（trunk-based 简化版）：feature/* → PR 只跑 CI 不部署；合入 main → 自动部署 dev；dev 验证通过 → promote 部署 test；test 通过（可含自动 E2E）→ promote 部署 staging；staging 验收后由 main 打 tag（v1.2.3）触发 prod 发布
  - 映射原则：同一个 commit 构建出的制品从 dev 一路走到 prod，只换配置不重新构建；禁止「每个环境各构建一次」，否则生产上跑的从来不是你测过的那份代码
  - 环境变量安全：公开变量（API 地址、公开 Key）按环境用 env 文件在构建时注入；密钥放 CI 平台的 Environment Secrets，仅对应 environment 的 job 可读且日志自动脱敏；认清前端现实——打进 bundle 的任何 key 都会泄露，真正敏感的密钥放服务端，前端通过网关签名/短时 token 间接使用
  - 审批卡点：GitHub 给 prod 配置 Environments 的 required reviewers，部署 job 声明 `environment: production` 后自动挂起等待指定人点击批准；企业内也可自建审批系统，审批通过回调触发部署 workflow
  - tag 触发发布：

```yaml
on:
  push:
    tags:
      - 'v*.*.*' # 仅符合语义化版本的 tag 触发生产发布
```

  - tag 发布 job：按 tag 从制品库下载对应制品（而不是重新构建）→ 部署 CDN/静态服务器 → 写入发布记录（版本号、commit、时间、操作人）形成可审计的发布履历
  - 回滚方案两层：① 静态资源层——CDN/对象存储保留最近 N 个版本目录，回滚 = 把网关/入口切回上一版本目录，秒级生效；② 边缘配置层——灰度规则、限流、路由等边缘配置同样按版本管理，可一键还原；回滚本身必须是一条流水线（一键触发 + 自动记录），严禁手工 SSH 上服务器改文件

### CICD-A3｜全链路质量保障：测试金字塔、性能门禁、安全扫描与监控闭环

- **题型**：架构设计题
- **难度**：Advanced ★★★★★
- **问题描述**：
  为一个面向 C 端的电商前端设计「从提交到线上」的全链路质量保障方案，要求覆盖四个层面：① 测试金字塔的分层、工具选型与比例建议；② 性能预算与 Lighthouse CI 门禁（预算指标、卡在哪一步、超预算怎么办）；③ 安全扫描（npm audit 依赖漏洞、密钥泄露检测如何进流水线）；④ 上线后监控回归（错误率、Web Vitals 告警如何与发布流程形成闭环）。请给出整体架构思路与关键落地细节。
- **考察要点**：
  - 理解测试金字塔：越往上越慢越贵，E2E 只覆盖核心业务链路
  - 会为 Lighthouse CI 设计合理阈值与降噪手段，避免不可信门禁
  - 知道安全扫描的分级阻断策略与 pre-commit + CI 双层密钥拦截
  - 能设计「发布 → 按版本观测 → 告警 → 回滚」的自动闭环
- **参考答案要点**：
  - 测试金字塔：单元测试（vitest/jest，约 70%，覆盖纯逻辑、hooks、工具函数）→ 组件测试（Testing Library，约 20%，验证交互与渲染）→ E2E（Playwright，约 10%，只覆盖登录/加购/下单/支付等核心路径）；分层原则：低层尽量多、高层只测「坏了直接影响生意」的链路，E2E 进 staging 级流水线运行
  - 性能门禁：Lighthouse CI 在 CI 中对构建产物跑审计，卡在 build 之后、部署之前；预算示例 LCP ≤ 2.5s、CLS ≤ 0.1、TBT ≤ 200ms、关键分包体积上限；用 `lhci autorun` + 静态服务器把环境噪声压到最低；超预算时输出资源清单 diff 做增量归因，确需放行走豁免流程并声明理由
  - 安全扫描：依赖漏洞——`pnpm audit --audit-level high` 卡 CI，high/critical 阻断、低级别周报跟进；密钥泄露——gitleaks/trufflehog 扫描提交与 diff，pre-commit + CI 双层拦截，历史仓库做一次性清洗；供应链——lockfile 锁定 + Dependabot/Renovate 定期升级 + 使用可信镜像源
  - 上线后监控闭环：RUM 采集（Sentry 错误监控 + Web Vitals 上报），所有指标按发布版本号聚合；发布完成后自动对比上一版本的错误率、白屏率、LCP p75，超阈值 → 告警到值班群 → 一键回滚流水线
  - 闭环要点：发布记录带版本指纹，监控平台按版本切片对比而非全局均值；告警无人响应超时自动升级；回滚与放量（灰度比例）同样由流水线执行，全程可审计
  - 度量文化：定期复盘门禁误报率与拦截次数，把逃逸缺陷数、MTTR 纳入团队指标，让阈值随质量水位演进，而不是一次性配置后常年不动

---

## 📌 本领域高频考点速记

- CI = 频繁合入 + 自动验证；持续交付要人工点发布，持续部署连这一步都自动化
- 前端产物 = 静态资源：哈希文件名长缓存 + HTML no-cache + 保留历史版本可秒级回滚
- Actions 三件套顺序：checkout → pnpm/action-setup → setup-node（`cache: pnpm` 依赖 pnpm 先装好）
- 多 job 用 `needs` 编排：lint/typecheck/test 并行快速失败，build 后置，artifact 传产物
- 矩阵配 `fail-fast: false` 才能看清「哪个 Node 版本坏」；缓存 key 跟 lockfile 哈希
- 蓝绿换流量、金丝雀控比例、滚动逐批替换；前端灰度 = 网关按流量/Cookie 分流新入口
- 门禁 = 分支保护 + required checks；阈值用增量视角，豁免必须带到期时间与评审记录
- build once, deploy many：一个制品走遍 dev → prod，只换配置不重新构建
- tag 触发生产发布，回滚 = 切回历史制品目录，回滚本身也要流水线化
- 密钥进 bundle 等于公开，真密钥放服务端；audit 高危卡 CI，gitleaks 双层拦泄露
- 质量闭环 = 发布带版本指纹 + RUM 按版本对比 + 异常告警触发一键回滚
