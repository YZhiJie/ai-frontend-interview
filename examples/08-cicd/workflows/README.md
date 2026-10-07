# CI/CD workflow 参考样例

本目录是《八、CI/CD 自动化》题库配套的**参考样例**，故意放在 `examples/` 而不是仓库根的
`.github/workflows/`——GitHub 只识别 `.github/workflows/*.yml`，放在这里不会被真实触发。
使用时把需要的文件复制到目标仓库的 `.github/workflows/` 目录即可。

## 文件 → 题号映射

| 文件 | 题号 | 内容 |
| --- | --- | --- |
| [b3-basic.yml](b3-basic.yml) | CICD-B3 | 最简 workflow：checkout → pnpm/action-setup@v4(9.15.4) → setup-node@v4(带缓存) → install → build |
| [i1-full-ci.yml](i1-full-ci.yml) | CICD-I1 | lint / typecheck / test（Node 18/20/22 矩阵，fail-fast:false）→ build → upload-artifact@v4；actions/cache@v4 pnpm store 缓存（附与 setup-node cache 二选一的注释） |
| [i3-gates.yml](i3-gates.yml) | CICD-I3 | 门禁集合：commitlint（可选）、ESLint、tsc、vitest 覆盖率阈值、size-limit 包体预算、a11y、markdown-link-check；注释标注哪些设为 required checks 与豁免机制 |
| [a2-multi-env.yml](a2-multi-env.yml) | CICD-A2 | dev/test/staging/prod 四环境流水线：`environment:` 隔离、production required reviewers、`v*.*.*` tag 发布、回滚流水线占位；build once, deploy many |
| [a3-quality.yml](a3-quality.yml) | CICD-A3 | Node 测试矩阵 + Lighthouse CI（@lhci/cli，附最小 lighthouserc 注释）+ pnpm audit + dependency-review-action@v4 + gitleaks-action@v2 + 监控闭环注释 |
| [a1-cnb.sample.yml](a1-cnb.sample.yml) | CICD-A1 | **注释化**的 CNB（云原生构建）pipeline 示例：pipeline as code、云端缓存分层、制品库不可变、DAG 原子任务，以及与 GitHub Actions 的理念差异 |

## 设计要点速记

- **Actions 三件套顺序**：checkout@v4 → pnpm/action-setup@v4 → setup-node@v4
  （`cache: pnpm` 依赖 pnpm 先装好）。
- **缓存二选一**：`setup-node` 的 `cache: pnpm` 与 `actions/cache@v4` 显式缓存是等价写法，
  不要同时开；key 跟 `hashFiles('pnpm-lock.yaml')`，`restore-keys` 提供前缀回退。
- **矩阵配 `fail-fast: false`**：才能看清「是否只有某个 Node 版本坏」。
- **多 job 用 `needs` 编排**：lint/typecheck/test 并行快速失败，build 后置，
  artifact 实现 job/环境间传值。
- **门禁 = 分支保护 + required checks**：阈值类检查用全局下限 + 增量基线双视角；
  豁免必须带到期时间与评审记录。
- **多环境**：一个制品从 dev 走到 prod，只换配置不重新构建；密钥进 bundle 等于公开，
  真密钥放服务端；回滚 = 切回历史制品目录，且回滚本身也要流水线化。
- **CNB（A1）差异**：容器级原子任务环境、平台一等公民缓存、细粒度 DAG 并行、
  制品库不可变是可信链路（build once, deploy many）的基础。

## YAML 合法性校验

样例可用仓库 `examples/` 已安装的 `js-yaml` 做解析校验（仅校验语法，
`uses:` 指向的 action 是否真实存在不影响解析）：

```bash
cd examples
node --input-type=module -e "import yaml from 'js-yaml';import fs from 'fs';for(const f of fs.readdirSync('08-cicd/workflows').filter(x=>x.endsWith('.yml'))){yaml.load(fs.readFileSync('08-cicd/workflows/'+f,'utf8'));console.log('ok',f)}"
```
