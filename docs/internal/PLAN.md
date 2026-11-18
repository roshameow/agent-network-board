# Agent Network Board 实施计划

> 本文件是待执行方案，不代表代码、站点、视频或提交已经存在。事实依据见 `RESEARCH.md`；注册状态见 `REGISTRATION_STATUS.md`。

## 1. 目标

在 2027-01-11 08:00 PST（北京时间 2027-01-12 00:00）前，完成并提交一个真正运行于浏览器的开放智能体网站。它把 agent 的**发现、能力声明、任务交接、信任证据和审计**放在同一块看板上，并使每一步都能追溯到真实的网络工件或 runtime 事件。

### 非目标

- 不做 GhostBBS 的复制、换皮或“模拟 agent 演示”。
- 不伪造发现结果、信任评分、工具回执、调用轨迹或视频。
- 不依赖中央注册服务器或私有后端来冒充开放智能体网络；规范允许纯静态 HTTPS 部署。
- 不把 LLM 密钥、private context 或用户隐私写入仓库、trace、截图或视频。

## 2. 产品定义

### 2.1 用户故事

1. 用户输入一个公开 agent site URL 或 agent network URL。
2. 应用真实获取该站点的 `agent-manifest.json`、网络定义和 `links.json`，展示发布来源、HTTP 状态、工件 SHA-256、网络名、front agent、输入 schema 和可调用能力。
3. 用户把任务交给本地协调 agent；协调 agent 依据发布的能力声明选择内部 specialist 或已获同意的 peer network。
4. 浏览器 runtime 实际执行委派与工具调用；界面只显示 runtime 发出的事件和真实回执。
5. 用户看到每次跨源访问的同意卡片、实际访问的 origin、调用参数、结果状态、耗时和错误。
6. 用户可导出脱敏审计 JSON，用于核对“声明了什么”和“实际做了什么”。

### 2.2 真实性最低标准

| 看板内容 | 必须来自 |
| --- | --- |
| Agent 名称、能力、schema、peer 链接 | 实际抓取的 `agent-manifest.json` / `.network.json` / `links.json` |
| 网络图中的节点与边 | 同站点网络定义中的 `tools` 引用与 peer 映射 |
| 任务交接 | runtime 的真实 agent-to-agent / peer 调用 |
| 网站状态变化 | 真实 site action 的返回值和 UI 状态 |
| 信任证据 | 对实际工件与访问行为的确定性检查结果 |
| 审计时间线 | runtime trace、同意记录、工具回执和错误对象 |
| 失败状态 | 真实的 unavailable / denied / unknown outcome，不用预设脚本掩盖 |

若 peer 不可达、CORS 不允许、schema 无效或用户拒绝同意，界面必须显示失败／未知；不得回退到写死的假回答。

## 3. 技术架构

### 3.1 发布文件（计划）

```text
/
├── index.html                         # 用户与 agent 交互界面
├── styles.css
├── agent-manifest.json                # 本站点发布的公共索引
├── agent_network_board.network.json   # 解析后的纯数据 agent network
├── links.json                         # peer 名称到真实 URL 的映射
├── site.js                            # 加载 runtime，连接 UI 状态和事件
├── site-actions.js                    # 真实站点动作：发现、检查、审计、任务卡
├── runtime/                           # 浏览器 runtime（可基于允许许可的参考实现）
├── ui/                                # 看板组件
├── tests/                             # 纯逻辑与网络工件校验
├── LICENSE                            # 待主代理确认
└── README.md                          # 正式英文说明（实施阶段新增）
```

规范不强制上述具体文件名；manifest 的 `hocon` 必须准确指向网络定义。所有跨源公共工件需要正确 CORS；生产环境使用 HTTPS。

### 3.2 Agent network

计划中的 front agent 与内部 specialists：

| Agent | 职责 | 真实能力 |
| --- | --- | --- |
| `board_front` | 接收任务、决定调用哪个 specialist、汇总真实结果 | 调用 `capability_scout`、`handoff_planner`、`evidence_auditor` |
| `capability_scout` | 从真实 URL 发现并解析 manifest / network / links | 调用 site action `discover_agent_site`、`inspect_network` |
| `handoff_planner` | 根据已声明的输入 schema 和任务要求选择交接目标 | 调用内部 agent 或符合 URL 约定的 peer network，并经用户同意 |
| `evidence_auditor` | 将本轮真实 trace 转为可解释的信任证据和审计时间线 | 调用 site action `get_audit_view`，读取脱敏 runtime 事件 |

每个 agent 都需要：

- 网络内唯一 `name`；
- `function.description`；
- `function.parameters` 为 JSON Schema；
- 明确的 `instructions`，要求只依据工具结果回答，不确定时说 unknown；
- 显式的 `tools` 列表；空列表表示没有下游依赖；
- 如使用 private context，显式声明允许的字段；默认不跨网络传递。

### 3.3 真实站点动作

site action 必须是浏览器中实际执行的 JS 函数，并向 runtime 声明名称、目的、输入 schema、effect 和 handler：

- `discover_agent_site(url)`：真实 GET 公共 manifest；返回 URL、HTTP 状态、内容类型、SHA-256、解析结果和错误。
- `inspect_network(manifestUrl, networkName)`：精确查找网络，解析 `hocon` 指向的 JSON；验证 front agent 和 schema；返回结构化结果。
- `get_board_state()`：读取看板当前选择、任务状态和审计计数，使 agent 的回答与页面真实状态一致。
- `set_handoff_card(...)`：把真实交接提案写入 UI；写操作在 runtime 层要求用户确认。
- `get_audit_view()`：返回脱敏后的 runtime 事件，不返回 key 或 private context。

只读动作和写动作必须分开声明；任何写操作都要显示目标 origin 与参数，并绑定 request id 与 receipt。

### 3.4 发现与真实 peer

首轮候选来源为官方仓库的 [Agentic Websites 列表](https://github.com/cognizant-ai-labs/agentic-web/blob/main/docs/agentic_websites.md)，包括 WWAW 自身以及 shutdown-clerk、Plainly、Agent Customs、Agent Atlas 等公开站点。实施时先逐个验证：

1. manifest / network URL 当前是否可达；
2. 是否返回允许浏览器跨源读取的 CORS 头；
3. 网络名与 front agent 是否匹配；
4. 是否允许被其他站点调用；
5. 是否有可公开演示的实际能力。

同时部署一个由本项目控制的第二个静态 agent site（独立 origin 或子域），作为稳定 peer。这样即使第三方站点暂时下线，也能演示真实的跨源加载和交接，而不是模拟数据。对任何 peer 都遵守：精确网络名、先同意、继承 caller router、key 不发送、private context 默认不传、每跳重复检查。

### 3.5 信任证据设计

不输出无法验证的“综合信誉分”。显示逐项证据与状态：

- URL 是 HTTPS（loopback 开发除外）；
- manifest 公共 GET 成功且 CORS 可用；
- manifest 中目标网络名精确匹配；
- `front_man` 存在于网络定义且指向真实 agent；
- network 是解析后的数据，没有本地 include、环境变量或发布者私有路径；
- agent 输入 schema 可解析；
- 声明的 peer policy / allowed origins 与实际请求目标；
- 工件 SHA-256 与首次发现时是否一致；
- 用户是否批准本次跨源联系；
- 实际结果是 succeeded、refused、cancelled、unknown 还是 error。

每项显示 `PASS / FAIL / UNKNOWN` 和证据来源；未知不解释为通过。

### 3.6 LLM 与密钥

- 优先实现 BYOK 面板：用户选择 router base URL、model 和 key；密钥只在调用方浏览器保存，并只发送到所选 router。
- 如后续获得授权的默认推理路径，可增加站点默认配置；不得在公开 JSON 或代码中放密钥。
- 若使用 Otari：遵循官方仓库说明，验证浏览器直连 CORS / 支持模型；提交时填写账户邮箱并写真实反馈。
- 视频演示前确认所选 provider 允许当前部署 origin；否则改用可直连的 router，不在现场临时伪造结果。

### 3.7 审计与隐私

审计事件字段：`eventId`、`timestamp`、`requestId`、`eventType`、`agent`、`tool`、`destinationOrigin`、`argumentsDigest`、`status`、`durationMs`、`receiptDigest`、`errorCode`。

- 不保存完整 API key、完整 prompt 中的敏感输入、private context 或凭证。
- 对外部请求先展示来源和用途；同意记录只表明用户做了选择，不表示远端指令可信。
- 写入状态未知时明确标为 `unknown`，不自动重试不确定写操作。
- 提供“清空本地审计”和“删除 BYOK profile”。

## 4. 界面结构

单页四区即可，重点是让评委一眼看出不是聊天机器人 PoC：

1. **Discovery**：URL 输入、抓取状态、manifest 原文折叠、解析后的 network 卡片。
2. **Network Board**：本地 agents 与 peers 的图／卡片；边来自真实 `tools` 和 links；显示输入 schema。
3. **Task Handoff**：任务输入、选定目标、同意卡片、运行状态、真实回执。
4. **Trust & Audit**：逐项证据、事件时间线、导出 JSON。

可选 BYOK 设置放在独立面板，避免把密钥字段放到公开演示主画面。所有界面文案应为英文，方便直接录制提交视频。

## 5. 实施里程碑

从 2026-11-18 起，按截止前留 5 天以上缓冲安排：

| 阶段 | 日期 | 交付 |
| --- | --- | --- |
| M0 决策与报名 | 11-18 至主代理完成 | 主代理确认参赛身份并完成官方注册；本 worker 不操作平台 |
| M1 规范与最小 runtime | 11-19 至 11-22 | 两个内部 agent、manifest、解析后 network JSON、基础验证、BYOK 面板 |
| M2 发现与站点动作 | 11-23 至 11-29 | 真实 manifest/network 抓取、能力 schema 展示、site actions、审计事件 |
| M3 交接与信任 | 11-30 至 12-06 | 第二 origin peer、用户同意流程、真实 peer 执行、逐项证据面板 |
| M4 加固与公开部署 | 12-07 至 12-13 | HTTPS + CORS、单元测试、七项互操作检查、公开仓库与英文 README |
| M5 提交素材 | 12-14 至 12-21 | <2 分钟真人讲解 YouTube 视频、截图、英文描述、社区工具说明（如有） |
| M6 缓冲与提交 | 12-22 至 2027-01-05 | 重读规则／规范、修复问题、提前提交 |
| 截止 | 2027-01-11 08:00 PST | 不再依赖最后时刻提交 |

## 6. 验收清单

### 6.1 规范与功能

- [ ] 公共 HTTPS 站点可访问，当前浏览器稳定运行。
- [ ] public `.network.json` 是解析后的纯数据，front agent 正确。
- [ ] `agent-manifest.json`、network、`links.json` 均可公共 GET；跨源工件 CORS 正确。
- [ ] `runtime` 在浏览器中执行网络，而不是服务器替它执行。
- [ ] 至少两个内部 agent 发生真实委派。
- [ ] 至少一个 grounded capability：MCP 或注册的本地 site action。
- [ ] 网络与网站状态真实互动；跨源 peer 在用户同意后真实运行。
- [ ] 外部站点可凭 URL 约定发现并调用本网络。
- [ ] BYOK key 不出现在 URL、manifest、prompt、trace、analytics、peer 请求。
- [ ] private context 默认不跨网络传递。
- [ ] 无效网络、循环、超预算、拒绝来源均有可见失败。
- [ ] S3 §6 的七项互操作演示可逐项说明。

### 6.2 提交

- [ ] Devpost 表格填写公共站点 URL、文字说明、YouTube 公开视频、截图。
- [ ] 视频 <2 分钟、浏览器实拍、真人讲解、非 AI 生成、素材权利清晰。
- [ ] 如使用 Otari，填写账户邮箱和真实使用反馈。
- [ ] 英文材料齐全；如中文视频，提供英文字幕／翻译。
- [ ] 说明项目为新建；若复用代码，列明来源、许可证和实质新增。
- [ ] 仓库公开、许可证明确、无密钥和私有数据。
- [ ] 在 2027-01-05 前完成首次正式提交，留出修改草稿时间。

### 6.3 评分映射

| 评审项 | 对应证据 |
| --- | --- |
| Technological Implementation | 规范文件、真实 runtime、跨源加载、schema 验证、失败关闭、BYOK 边界 |
| Design | 四区看板、清晰同意流程、错误状态、导出审计、响应式可用性 |
| Potential Impact | 解决“发现后如何判断能力、如何安全交接、如何事后核验”的真实问题；公开可复用工具／组件 |
| Quality of the Idea | 把 manifest 能力声明与运行时审计并置，用可验证证据代替不可信信誉分 |

## 7. 风险与应对

| 风险 | 应对 |
| --- | --- |
| 规范继续演进 | 提交前重读固定 commit 与 main；保持工件可重新生成；记录变更 |
| 第三方 peer 下线或 CORS 不允许 | 自建第二 origin peer；第三方发现仅使用当时真实抓取结果 |
| 没有可用默认 LLM | 完成 BYOK；视频前实测 provider；必要时使用 Otari credits，但不承诺额度 |
| 被误认为模拟 agent | 每个显示值标注来源；保留原始工件、trace 和导出审计；视频展示失败与成功两种真实状态 |
| 误将 GhostBBS 复用为提交物 | 新仓库、新网络、新 UI；只复用有权使用的通用模式并如实披露 |
| 中国大陆资格／领奖不确定性 | 主代理注册前确认；文档只写“初步判断很可能合资格”，不作保证 |
| 视频语言或素材问题 | 英文旁白或中配英字；不使用无许可商标／音乐；保留真人录制证据 |
| 截止前平台故障 | 提前提交草稿；保存所有素材与校验清单；不把注册或提交交给本 worker |

## 8. 当前状态

- 已完成：公开来源研究、赛事／规范事实核对、方案设计。
- 未完成：注册、代码、部署、测试、视频、截图、Devpost 提交。
- 本 worker 没有修改任何平台状态；注册与最终提交由主代理负责。
