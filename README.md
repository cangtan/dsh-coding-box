# dsh-coding-box

给 vibe coding 用的 DeepSeek Harness 工具箱：一个侧边栏入口、一个总览页，每个工具独立一页。

- 侧边栏图标（排在 Plugins、Schedules 之后）打开主面板
- 面板左侧是工具箱导航：**概览 / Codegraph / Skills / MCP**
- 每个工具独立开关、独立页面；新增工具不需要挤进同一屏

本仓库根目录就是插件包，通过 `plugin_manager install_bundle D:\workspace\dsh-coding-box` 以 `link:` 方式装进 desktop profile；改完文件后重新安装即可生效。

## 页面

### 概览

三张工具卡（Codegraph / Skills / MCP）显示当前状态和一键跳转，底部是「更多工具会加在这里」的位置。以后新增模块就在 `client.js` 的导航里加一项、在 `index.js` 的 `applyModules()` 里加注册。

### Codegraph

回答「到底索引了哪个项目」，且不需要先设置：

- **当前工作区**：显示 box 跟随的工作区路径（最近活跃的会话），以及它的 `已索引 / 未索引` 状态；直接在这里 `索引项目` / `增量同步`
- **项目列表**：自动汇总三类来源 —— 工作区（`workspaceRegistry`）、最近活跃会话目录、手动添加的路径；每行显示路径、索引状态、来源，并可 `索引` / `同步` / `移除`（仅手动添加的）
- **添加项目**：填一个绝对路径就能加进来（只记录，不改那个目录）
- **安装区**：版本、来源（local / PATH）、`安装` / `升级`、自动安装开关
- 索引状态来自 `codegraph status`，只对当前工作区实时查询

没有「当前项目」这种全局指针：切换会话/工作区后，面板和工具都会自动跟着走。

### Skills

- 扫描项目 `.dsh/skills`、`.agents/skills` 与用户 `~/.dsh/skills`、`~/.agents/skills`
- 页面按 **项目级 / 全局** 分组：项目级来自当前工作区（项目根 = 最近的 `.git` 祖先），切工作区自动换；全局的始终显示
- 新建（项目 / 用户根）、打开预览、`模型可用` 开关（改写 frontmatter 的 `disable-model-invocation`）、删除（进 `~/.dsh/dsh-coding-box/trash`）

### 跟随工作区

工具箱里没有「当前项目」这种全局设置：

- **面板**：跟随最近活跃的会话工作区（会话切换后刷新面板即可）
- **Agent 工具**：每次调用按**发起调用的会话**用 `workingDirectory.ensure(agent)` 解析目录；需要指向别的项目时显式传 `projectPath`
- **Skills**：项目级根按同一工作区计算，全局根不受影响

### MCP

自研的本地 stdio MCP 客户端管理：

- 添加服务器：名称、命令、参数、`KEY=VALUE` 环境变量
- 添加后立即连接、握手、`tools/list`，工具以 `mcp__<服务器>__<工具>` 名字注册给 Agent
- 每行可 `启用/停用`、`重连`、`移除`；显示连接状态、工具数量与工具名
- 连接失败会保留错误信息，方便排查（命令、参数、stderr 尾部）

> 目前只支持 stdio 传输。HTTP Streamable MCP 还没做，需要的话再加。

## 工具（给 Agent）

| 工具 | 说明 |
|---|---|
| `codegraph_explore` | 相关符号源码 + 调用路径 |
| `codegraph_query` | 搜索符号（JSON） |
| `codegraph_node` | 单个符号源码/调用者，或按行读文件 |
| `codegraph_impact` | 改动影响面 |
| `codegraph_status` | 安装与当前项目索引状态 |
| `skill_manage` | `list / create / delete / set_invocation` |
| `mcp__<server>__<tool>` | 由 MCP 页面连接的服务器动态提供 |

Codegraph 的 5 个工具都支持可选的 `projectPath`，默认用当前项目。

## 状态与配置

- 运行时状态：`~/.dsh/dsh-coding-box/state.json`（模块开关、手动项目、codegraph 版本、MCP 服务器定义）
- MCP 环境变量的值以明文保存在该文件里，注意不要提交到仓库
- 插件默认配置：`cordis.patch.yml` 里的 `dsh-coding-box` 行（首次默认值；之后以 `state.json` 为准）

```yaml
- insert:
    - id: dsh-coding-box
      name: dsh-coding-box
      config:
        codegraph:
          enabled: false
          autoInstall: true
          packageName: '@colbymchenry/codegraph'
        skills:
          enabled: true
        mcp:
          enabled: true
          servers: []
```

## 结构

```
dsh-coding-box/
  package.json        # name: dsh-coding-box
  cordis.patch.yml
  index.js            # Host：模块、Codegraph、Skills、MCP 客户端、JSON API
  client.js           # Web：侧边栏图标 + 工具箱面板（概览/Codegraph/Skills/MCP）
  locale/en.json      # 插件展示标题/描述
  locale/zh.json
  icon.svg
  tools/              # 开发辅助：asar 读取脚本、MCP 自测用 mock server
  README.md
```

HTTP API（同源，仅本机）：`GET /dsh-coding-box/api/state`，`POST /dsh-coding-box/api/action`。

### 冷启动时序

Host 用 `ctx.inject(['tools' | 'systemPrompt' | 'webServer'], child => child.effect(...))` 等服务就绪后再注册，避免应用冷启动时插件早于服务创建、fiber 显示 active 但什么都没挂上。

## 验证记录（2026-11-08）

- 安装：`install_bundle D:\workspace\dsh-coding-box` → `application: applied`
- 客户端：`main` 槽 key `dsh-coding-box`，`sidebar.panellist` id `dsh-coding-box`（order 20），`settings.section` 不含它
- Codegraph：识别出两个项目（均已索引），当前工作区标注正确；`initProject` 重跑后 6 文件 / 151 节点；非法路径添加会返回错误；`codegraph_status` 在未传 `projectPath` 时按调用会话解析到 `D:\workspace\dsh-coding-box`
- MCP：用 `tools/mock-mcp-server.mjs` 走通端到端 —— 添加 → `connected` → 发现 `echo` 工具 → 移除后服务器与工具都消失
- Skills：新建 → 会话目录立即出现；关闭模型可用 → 立即消失；删除 → 进回收站

未验证：面板与各页的实际渲染（本会话没有浏览器控制能力，无法截图/看 DOM）；客户端改动后需要刷新一次页面。

已知限制：

- `/dsh-coding-box/api/*` 没有额外鉴权，仅依赖 DSH Web 服务只监听本机
- Codegraph 安装/索引是同步 HTTP 请求，大仓库首次索引会等较久
- MCP 目前只有 stdio；服务器进程随插件卸载/停用而关闭，不跨重启保活连接（重启后自动重连）

## 卸载

`plugin_manager remove_bundle dsh-coding-box`，然后按需删除 `~/.dsh/dsh-coding-box`（含 codegraph 安装、回收站、MCP 定义）和项目里的 `.codegraph/`。
