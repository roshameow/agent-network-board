# Open Agentic Web Challenge 公开调研记录

## 0. 元信息

- 调研时间：**2026-11-18 16:22 CST（UTC+8）**。
- 调研范围：公开网页与公开 GitHub 仓库；仅读取，不登录、不注册、不提交、不使用浏览器自动化、不修改平台状态。
- 初始建议来源：`/Users/wenliu/Code/competition/kilo/docs/DEVPOST_NEXT_COMPETITIONS.md`（快照 2026-11-18，推荐排序第 2 项）。该文件只作为选题线索，以下结论均重新从一手来源核验。
- 规范版本：[MVP Profile 0.2，文档日期 2026-11-06](https://github.com/cognizant-ai-labs/agentic-web/blob/fd872b9221aeb8ff762b75a5badbf84b23c133cc/docs/worldwide_agentic_web_mvp_spec.md)。GitHub 文件历史显示最后一次规范提交为 [`fd872b9`](https://github.com/cognizant-ai-labs/agentic-web/commit/fd872b9221aeb8ff762b75a5badbf84b23c133cc.patch)（2026-11-10 07:50:31 -0800），早于 11 月 11 日提交期开始；检索时未发现之后对该文件的修改。仓库当前 HEAD 为 `a39df2b`（2026-11-17），但规范正文仍为上述版本。由于规则未固定 commit，提交前必须再次核对。

### 主要来源

| 编号 | 来源 | 用途 |
| --- | --- | --- |
| S1 | [Devpost 官方赛事页](https://cognizant-agenticweb.devpost.com/) | 项目说明、交付物、奖项、评委、评审标准、UTC 截止 |
| S2 | [Devpost 官方规则](https://cognizant-agenticweb.devpost.com/rules) | 日期、资格、新旧项目、知识产权、提交与评审的权威条款 |
| S3 | [MVP 规范固定版本](https://github.com/cognizant-ai-labs/agentic-web/blob/fd872b9221aeb8ff762b75a5badbf84b23c133cc/docs/worldwide_agentic_web_mvp_spec.md) | 技术合规要求 |
| S4 | [cognizant-ai-labs/agentic-web 仓库](https://github.com/cognizant-ai-labs/agentic-web) | 规范、示例、发布文件与运行原则 |
| S5 | [World Wide Agentic Web 官网 FAQ](https://worldwideagenticweb.org/) |  initiative 目标、赛道与主题背景 |
| S6 | [Cognizant 官方新闻稿](https://news.cognizant.com/2026-11-12-The-Open-Agentic-Web-Challenge-building-an-agent-economy-that-works-for-everyone) | $13,000 奖池、Davos 公布、合作伙伴 |
| S7 | [最高人民检察院公开《民法典》全文](https://www.spp.gov.cn/spp/ssmfdyflvdtpgz/202005/t20200512_478406.shtml) | 中国大陆成年年龄 |
| S8 | [财政部、税务总局公告 2020 年第 3 号](https://www.gov.cn/zhengce/zhengceku/2020-01/22/content_5471604.htm) | 境外所得申报背景；非参赛资格条款 |
| S9 | [官方仓库 agentic websites 列表](https://github.com/cognizant-ai-labs/agentic-web/blob/main/docs/agentic_websites.md) | 可用于真联动的公开 agent 站点候选 |

优先级：S2 官方规则 > S1 赛事页 > S3 固定规范 > S4/S5/S6 说明性材料。S2 第 11 节明确写明，规则与赛事网站等其他材料冲突时，以 Official Rules 为准。

---

## 1. 赛事与关键日期

| 事件 | 官方时间 | 北京时间（UTC+8） | 依据 |
| --- | --- | --- | --- |
| 提交期开始 | 2026-11-11 20:00 PST | 2026-11-12 12:00 | S2 §1 |
| 提交截止 | 2027-01-11 08:00 PST / 16:00 UTC | **2027-01-12 00:00** | S1、S2 §1 |
| 评审期 | 2027-01-11 10:00 PST 至 2027-01-18 17:00 PST | 2027-01-12 02:00 至 2027-01-19 09:00 | S2 §1 |
| 获奖公布 | 约 2027-01-19 08:00 PST | 约 2027-01-20 00:00 | S2 §1 |

换算依据：11 月与 1 月美国太平洋时间均为 PST（UTC−8）。S1 的结构化事件数据写作 `2026-11-11T23:15:00-05:00`（即 20:15 PST），与规则中的 20:00 PST 有 15 分钟差异；因 S2 明确优先，记录时采用规则时间。S1 同时明确写有“Submit ... before January 11, 2027 at 16:00 UTC”，与规则截止时间一致。

从本次调研日（11 月 18 日）到太平洋时间截止日约 **54 个日历日**。

## 2. 主办方与形式

- Sponsor / Administrator：Cognizant Technology Solutions Corporation（S2 §2）。
- 官方赛事页称技术贡献来自 Cognizant AI Lab、MIT Media Lab NANDA、Mozilla Otari 与 AWS（S1）。
- 规则还列出 UT Austin School of Computing 与 AI Commons 为 Partners（S2 §2）；Cognizant 新闻稿另提到联合国 ITU-T SG17（S6）。这些是宣传与合作背景，不是参赛硬性技术条件；S6 明确写“使用这些技术不是参赛必需”。
- 线上、公开赛事；个人、团队、组织均可参加（S1、S2 §3）。S2 未列学生身份、邀请码或团队人数限制。
- 官方邮件：info@worldwideagenticweb.org（S1）。

## 3. 资格：成年个人、中国大陆居民

### 3.1 赛事规则的直接要求

S2 §3 明确允许：

- 在参赛时达到**居住地法定成年年龄**的个人；
- 由合格个人组成的团队；
- 在参赛时已成立的组织；
- 符合上述条件且仅可竞争员工奖的 Sponsor / Partners / affiliates 员工。

S2 排除的情形包括：

- 居住地或组织注册地所在国家／州／省／地区，其美国法律或当地法律禁止参赛或领奖；示例包括 Brazil、Quebec、Russia、Crimea、Cuba、Iran、North Korea，以及美国财政部 OFAC 全面制裁的其他国家；
- 主办／执行相关实体及其员工、代理人、直系亲属或同住家庭成员；
- 评委、向评委汇报或与评委同团队者，以及相关关联实体；
- 主办方自由裁量下造成实际或表面利益冲突者。

S1 将参与范围概括为“Above legal age of majority in country of residence”和“All countries/territories, excluding standard exceptions”。

### 3.2 中国大陆成年年龄

S7 所载《中华人民共和国民法典》第十七条：“十八周岁以上的自然人为成年人。不满十八周岁的自然人为未成年人。”第十八条规定成年人为完全民事行为能力人。赛事规则采用的是**居住地法定成年年龄**，因此本调研按中国大陆居民 **≥18 周岁**理解；不把 16 周岁以上以劳动收入为主要生活来源的民法例外自行扩展为赛事资格。

### 3.3 初步结论

对一名**中国大陆居民、年满 18 周岁、未受雇于主办方/合作方及其关联方、不是评委或相关利益冲突人员、且当地法律允许参与和领奖**的自然人：

- 规则明文允许个人参加；
- 规则列举的排除地区中**没有中国大陆**；公开规则文本未显示学生或邀请限制；
- 因此初步判断为**很可能符合个人参赛资格**。

这不是资格保证，原因包括：

1. S2 仍保留“当地法律禁止”“OFAC 全面制裁国家”和主办方利益冲突自由裁量等兜底条款；
2. 资格由 Sponsor / Administrator 最终决定，且规则可能变更（S2 §6、§11）；
3. 若参赛者同时具有其他税收居民身份、受制裁身份或与主办方存在关系，结论可能改变；
4. 获奖后的身份验证、W-8BEN（非美国居民可能需要）、汇款／汇兑费用与居住国税务需由获奖者自行处理（S2 §8）。S8 说明中国税收居民取得境外所得可能涉及申报及境外税额抵免；本记录不构成法律或税务意见。

**行动项**：由主代理在注册时以自身实际情况确认资格；本 worker 未提交任何资格声明。

## 4. 奖金

S1 / S2 §8：

| 奖项 | 现金 | Otari credits | 其他 | 数量 |
| --- | ---: | ---: | --- | ---: |
| 一等 | $5,000 | $1,500 | Swag、社媒宣传 | 1 |
| 二等 | $3,000 | $750 | Swag、社媒宣传 | 1 |
| 三等 | $2,000 | $500 | Swag、社媒宣传 | 1 |
| 员工奖 | — | $250 | Swag、社媒宣传 | 1 |

- Devpost 醒目显示 **$10,000 in cash**，即前三项现金之和。
- 四项 credits 合计 $3,250；与 $10,000 现金相加为 **$13,250**，而 S6 新闻稿写 **$13,000 prize fund**。若只看面向普通参赛者的前三等奖，$10,000 + $2,750 = $12,750；若把员工奖 $250 计入则为 $13,000。新闻稿的 $13,000 可按“含员工奖的总额”解释，但页面没有展开公式。
- 因此文档同时记录两种官方口径：**Devpost：$10,000 现金；Cognizant：$13,000 奖池**。不要在提交文案中自行改写金额或承诺税费。
- 每个提交最多获一个奖；员工参赛者仅可获员工奖（S2 §8）。
- 获奖须通过身份、资格和创作角色核验并签署_required forms_；奖品不可转让，主办方可替代等值或更高价值奖品（S2 §8）。

## 5. 项目要求与新旧作品规则

S2 §4：

- 必须是使用标准开放 Web 技术构建、**符合规范**的可运行开放智能体网站；规范版本为提交期开始时 S3 所处版本。
- 必须公开可访问，在当前浏览器中稳定运行，并与视频／文字描述一致。
- **New & Existing**：作品必须是参赛者新建，或者在赛事提交期开始后经过**实质性更新**的既有作品；后者必须说明更新内容。
- 第三方 SDK、API、数据必须有使用授权并符合许可。
- 提交必须是原创、参赛者单独拥有、不侵犯他人 IP；多人或多组织提交需授权代表。
- 不得使用来自 Sponsor / Administrator 的资金或优惠支持开发或衍生该项目。
- 允许多次提交，但每次必须唯一且实质不同。
- 使用开源软件时须遵守许可，并在提交中创建增强／构建于底层开源产品之上的软件。

**对 GhostBBS 的结论**：不得把既有 GhostBBS 或已提交作品原样重复提交。本项目的“Agent Network Board”应新建，最多复用可披露的通用架构思路和有权复用的通用代码；若复用任何既有代码，应在提交说明中如实列明来源与本次实质新增内容。

## 6. 开放智能体网站规范（S3 / S4）

规范标题为 *Minimum Viable Specification for a Worldwide Agentic Web*，MVP Profile 0.2，2026-11-06。三大支柱：

1. **Common Multi Agent Representation**：以 Neuro SAN HOCON 数据模型为规范表示；JSON 是合法序列化。发布的 `.network.json` 必须是解析后的纯数据，不得依赖本地 include、环境变量或发布者专有路径。网络需有稳定名称、描述、front agent；每个 agent 有唯一名称、function description、LLM instructions（如适用）、可调用 agent／工具清单及 JSON Schema 输入。
2. **Browser Execution and Site Composition**：普通浏览器中的 JavaScript runtime 解析／验证网络，运行 agent loop，处理 streaming、工具调用、委派和错误；支持 MCP、同站点注册动作、写入前用户确认、有限执行预算及失败关闭。
3. **Pluggable Inference**：站点可提供默认模型路由，也可提供 BYOK；BYOK 时密钥只留在调用方浏览器并仅发给所选 router，不得进入 URL、manifest、网络 JSON、prompt、action arguments、trace、analytics 或 peer 请求；peer manifest 不能替换 caller 的 router。

### 6.1 最小公共文件（S3 §3.3）

| 文件 | 作用 |
| --- | --- |
| `agent-manifest.json` | 列出一个或多个网络的 `name`、`front_man`、`hocon`，以及 LLM router、peer policy、可选品牌／MCP／linking／deployment／action 元数据 |
| Network definition | 通常为 `<network>.network.json`；路径由 manifest 的 `hocon` 指定；必须是解析后的 JSON，公共 GET 可达 |
| `links.json` | 将网络定义中的符号化 peer 名称映射到具体 peer network URL |
| 可选 coded-tool bundle | 若使用，需要在隔离 Web Worker 中执行并处理 SRI / CSP |

文件名 `*.network.json` 是参考实现惯例，而非互操作硬性要求；真正关键是 manifest 的 `hocon` 指向。跨源获取公共工件时发布方必须允许标准 CORS；生产环境要求 HTTPS（loopback 开发除外）。

### 6.2 peer 调用与安全边界（S3 §3.2、§5）

- peer 由 URL 标识，最后一个路径段是网络名；例如 `https://peer.example/agents/transit` 对应 `https://peer.example/agents/agent-manifest.json` 中名为 `transit` 的条目。
- 精确匹配网络名；不匹配必须失败，不能退而选择别的网络。
- peer 的 agents 在**调用方浏览器**运行，继承调用方 router、模型策略和预算；用户 key 绝不发给 peer 站点。
- 默认每次联系第三方来源前，都要显示来源与用途并取得用户同意；放宽须是用户显式选择。每个额外 hop 重复检查。
- private context（`sly_data`）跨网络默认拒绝，只有显式允许字段才可传递。
- 无效网络、循环、超限、拒绝来源等必须可见地失败；写入结果未知时不得谎报成功。
- 对等网络指令必须视为不可信输入；schema 验证不等于信任。
- 规范不要求中央注册表或服务器端 agent runtime，也不要求 peer 提供代码执行。

### 6.3 互操作验收（S3 §6）

规范要求可演示：两 agent 网络与 manifest、HTTPS 发布、浏览器运行（默认推理；若提供 BYOK 也要演示）、内部 agent + MCP 或本地 site action、用户同意后加载第二来源网络、用户 key 不泄露且 peer 不能改 router、private context 默认不传递、以及无效网络／循环／超预算／拒绝来源的可见停止。

S4 的 README 还明确说明：`.json` 是配置而非代码；用户控制 LLM provider/key，站点宿主不支付 LLM 调用；网络可通过 URL 相互引用；可调用 MCP 与 WebMCP。S4 示例 manifest 的字段可直接作为实现参考。

## 7. Devpost 交付物

S1 / S2 §4 要求提交：

1. 公共开放智能体网站 URL，其中包含：
   - 公共可访问且符合规范的 `.json`，描述 agent network 及能力；
   - 能在浏览器运行 agent network 的 `runtime` 文件；
   - 用户或 agent 与网络交互的界面；
   - 可选的用户配置 LLM 和 key 的界面；
   - 网络至少能与该网站交互，并可选地与其他 agentic 网站交互或被其调用。
2. 解释功能与特性的文本描述。
3. 演示视频：**少于 2 分钟**；包含浏览器中运行画面；包含参赛者本人讲解（赛事页明确写“not AI generated”）；公开可见于 YouTube 并在表单提供链接；未经许可不含第三方商标、版权音乐或其他素材。
4. 一张或多张网站截图。
5. 若使用 Otari：填写账户邮箱，并用一两句话说明遇到的问题与改进建议。
6. 鼓励描述并链接赛事期间额外构建且分享给社区的工具／服务，这会计入 Potential Impact。

语言要求（S2 §4）：所有材料须为英文；否则需为视频、文字说明、测试说明及其他材料提供英文翻译。因此内部中文文档不能替代正式英文提交材料。

测试要求：作品须在评审期结束前免费、无限制地供 Sponsor / Administrator / Judges 访问；评委可以只看文字、图片和视频，不保证亲自测试。

## 8. 评审

S1 列出评委：Babak Hodjat（Cognizant Chief AI Officer）、Ramesh Raskar（MIT Research / NANDA founder）、Risto Miikkulainen（UT Austin CS Professor）。S2 §6 说明评委可能变化，也可能采用专家、同伴或 AI 辅助分析。

- **Stage 1（pass/fail）**：是否为符合提交要求的开放智能体网站。
- **Stage 2（四项等权）**：
  1. Technological Implementation：构建质量及规范使用有效性；
  2. Design：是否完整连贯，而非仅技术 PoC；
  3. Potential Impact：是否对真实人群的真实问题给出可信且已演示的方案，是否包含分享给社区的工具／服务；
  4. Quality of the Idea：是否为有创意、非显而易见的开放智能体网站用法，是否真正理解问题空间。
- 平局依次比较上述标准；全部相同则由评委投票。
- 分数与获奖由 Sponsor / Administrator 最终裁量。

## 9. 调研中需要保留的坑与可复用方法

1. **以规则页为准**：Devpost 概览、结构化事件数据、新闻稿和规则存在时间／金额口径差异；先读规则，再读概览，冲突时引用规则第 11 节。
2. **固定规范 commit**：规范明确“actively evolving”。规则说“提交期开始时发布版本”，因此调研时保存 commit `fd872b9`、文档日期和文件历史；提交前重新核对，不假定当前 main 永久不变。
3. **区分现金、credits 和员工奖**：$10,000 是现金；$13,000 是新闻稿总额口径；不要相加重复宣传。
4. **“未排除”不等于“保证合资格”**：保留当地法律、OFAC、利益冲突和主办方最终裁量四项限定。
5. **BYOK 与公开演示**：默认 inference 不是强制，但如果没有站点付费默认路由，就必须做可用的 BYOK 设置界面，并证明 key 不进入 trace 或 peer 请求。
6. **真实性是本项目最大风险**：trust / audit UI 的数据必须来自真实 manifest、网络定义和 runtime 事件；不能像 GhostBBS 那样用模拟 agent 冒充真实网络。

## 10. 待主代理确认

- 是否已注册 Devpost 并实际达到法定年龄、居住地和资源条件；本 worker 未验证账号状态。
- 是否使用个人身份、团队或组织身份报名；本计划目前按成年个人设计。
- 采用哪个 LLM router / key，是否申请 Otari credits；不得在仓库提交任何密钥。
- 最终部署域名、CORS 配置、代码仓库许可证与英文提交文案。
