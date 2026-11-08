/**
 * dsh-coding-box — Web sidebar panel.
 *
 * One sidebar entry opens a toolbox with a left navigation and one page per
 * tool: overview, Codegraph, Skills and MCP. Every page reads and mutates the
 * Host half through /dsh-coding-box/api.
 */
window.__ModuleLoader__.load({
  id: 'dsh-coding-box',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'settings.dshCodingBox'

    const en = {
      'nav.title': 'dsh-coding-box',
      'nav.overview': 'Overview',
      'nav.codegraph': 'Codegraph',
      'nav.skills': 'Skills',
      'nav.mcp': 'MCP',
      'page.subtitle': 'Vibe-coding toolbox: one page per tool, more coming.',
      'page.refresh': 'Refresh',
      'page.loading': 'Loading…',
      'page.failed': 'Could not read the toolbox state.',
      'overview.codegraph.desc': 'Semantic code graph: symbols, call paths, change impact.',
      'overview.codegraph.installed': 'Installed {version}',
      'overview.codegraph.notInstalled': 'Not installed',
      'overview.codegraph.projects': '{count} indexed projects',
      'overview.skills.desc': 'Local skills from project and user roots.',
      'overview.skills.count': '{count} skills',
      'overview.mcp.desc': 'Connect local stdio MCP servers and expose their tools.',
      'overview.mcp.status': '{connected}/{total} connected · {tools} tools',
      'overview.open': 'Open',
      'overview.more.title': 'More tools land here',
      'overview.more.desc': 'Every tool gets its own page and its own module switch, so this workshop can keep growing without crowding one screen.',
      'codegraph.title': 'Codegraph',
      'codegraph.desc': 'Install Codegraph, see which projects are indexed, and index or sync one project at a time.',
      'codegraph.installed': 'Installed {version}',
      'codegraph.notInstalled': 'Not installed',
      'codegraph.install': 'Install',
      'codegraph.installing': 'Installing…',
      'codegraph.upgrade': 'Upgrade',
      'codegraph.autoInstall': 'Install automatically when switched on',
      'codegraph.active.title': 'Active workspace',
      'codegraph.workspace.note': 'Follows the most recently active session. Switch workspace in the sidebar; there is nothing to configure here.',
      'codegraph.active.none': 'No workspace resolved yet.',
      'codegraph.index': 'Index project',
      'codegraph.sync': 'Sync',
      'codegraph.remove': 'Remove',
      'codegraph.indexed': 'indexed',
      'codegraph.notIndexed': 'not indexed',
      'codegraph.source.workspace': 'workspace',
      'codegraph.source.agent': 'session',
      'codegraph.source.manual': 'added',
      'codegraph.projects.title': 'Projects',
      'codegraph.projects.empty': 'No projects found. Add a path below.',
      'codegraph.add.title': 'Add a project',
      'codegraph.add.placeholder': 'D:\\path\\to\\project',
      'codegraph.add.action': 'Add',
      'codegraph.working': 'Working…',
      'skills.title': 'Skills',
      'skills.desc': 'Discover, enable, create and remove local skills from the project and user roots.',
      'skills.empty': 'No skills found on disk yet.',
      'skills.count': '{count} skills',
      'skills.modelOff': 'model off',
      'skills.new': 'New skill',
      'skills.name': 'Name',
      'skills.descriptionField': 'Description',
      'skills.body': 'Instructions',
      'skills.create': 'Create',
      'skills.cancel': 'Cancel',
      'skills.delete': 'Delete',
      'skills.open': 'Open',
      'skills.close': 'Close',
      'skills.workspace': 'Workspace: {path}',
      'skills.scope.project': 'Project',
      'skills.scope.global': 'Global',
      'skills.scope.projectHint': 'From this workspace (project root). Switching workspace switches this list.',
      'skills.scope.globalHint': 'Shared across workspaces.',
      'skills.root': 'Save under',
      'skills.rootProject': 'Project',
      'skills.rootUser': 'User',
      'skills.invalidName': 'Use kebab-case: lowercase letters, digits and single dashes.',
      'skills.deleteConfirm': 'Delete this skill? It moves to the dsh-coding-box trash folder.',
      'mcp.title': 'MCP servers',
      'mcp.desc': 'Connect local stdio MCP servers. Their tools appear to the agent as mcp__<server>__<tool>.',
      'mcp.empty': 'No MCP servers yet.',
      'mcp.add': 'Add server',
      'mcp.name': 'Name',
      'mcp.command': 'Command',
      'mcp.args': 'Arguments',
      'mcp.argsHint': 'Space separated, for example: -y @modelcontextprotocol/server-filesystem D:\\work',
      'mcp.env': 'Environment',
      'mcp.envHint': 'One KEY=VALUE per line. Values stay in the local state file.',
      'mcp.create': 'Add',
      'mcp.cancel': 'Cancel',
      'mcp.reconnect': 'Reconnect',
      'mcp.delete': 'Remove',
      'mcp.deleteConfirm': 'Remove this MCP server and its tools?',
      'mcp.tools': '{count} tools',
      'mcp.status.connected': 'connected',
      'mcp.status.connecting': 'connecting',
      'mcp.status.failed': 'failed',
      'mcp.status.stopped': 'stopped',
      'mcp.invalidName': 'Use 1-32 characters: letters, digits, "_" or "-".',
      'mcp.commandRequired': 'Command is required.',
      'toast.saved': 'Saved',
      'toast.installed': 'Codegraph installed',
      'toast.upgraded': 'Codegraph upgraded',
      'toast.indexed': 'Index updated',
      'toast.deleted': 'Skill deleted',
      'toast.created': 'Skill created',
      'toast.mcpAdded': 'MCP server added',
      'toast.mcpRemoved': 'MCP server removed',
    }

    const zh = {
      'nav.title': 'dsh-coding-box',
      'nav.overview': '概览',
      'nav.codegraph': 'Codegraph',
      'nav.skills': 'Skills',
      'nav.mcp': 'MCP',
      'page.subtitle': 'vibe coding 工具箱：一个工具一页，后面还会继续加。',
      'page.refresh': '刷新',
      'page.loading': '加载中…',
      'page.failed': '读不到工具箱状态。',
      'overview.codegraph.desc': '语义代码图谱：符号、调用链、改动影响。',
      'overview.codegraph.installed': '已安装 {version}',
      'overview.codegraph.notInstalled': '未安装',
      'overview.codegraph.projects': '{count} 个已索引项目',
      'overview.skills.desc': '项目与用户目录里的本地 skills。',
      'overview.skills.count': '{count} 个 skill',
      'overview.mcp.desc': '连接本地 stdio MCP 服务器，把它们的工具交给 Agent。',
      'overview.mcp.status': '{connected}/{total} 已连接 · {tools} 个工具',
      'overview.open': '打开',
      'overview.more.title': '更多工具会加在这里',
      'overview.more.desc': '每个工具都有独立页面和独立开关，所以工具箱可以一直扩展，而不用挤在同一屏里。',
      'codegraph.title': 'Codegraph',
      'codegraph.desc': '安装 Codegraph，看清哪些项目已索引，再逐个索引或增量同步。',
      'codegraph.installed': '已安装 {version}',
      'codegraph.notInstalled': '未安装',
      'codegraph.install': '安装',
      'codegraph.installing': '安装中…',
      'codegraph.upgrade': '升级',
      'codegraph.autoInstall': '开启时自动安装',
      'codegraph.active.title': '当前工作区',
      'codegraph.workspace.note': '跟随最近活跃的会话工作区，切换工作区会自动生效，这里不需要设置。',
      'codegraph.active.none': '还没有解析到工作区。',
      'codegraph.index': '索引项目',
      'codegraph.sync': '增量同步',
      'codegraph.remove': '移除',
      'codegraph.indexed': '已索引',
      'codegraph.notIndexed': '未索引',
      'codegraph.source.workspace': '工作区',
      'codegraph.source.agent': '会话',
      'codegraph.source.manual': '手动添加',
      'codegraph.projects.title': '项目',
      'codegraph.projects.empty': '没有发现项目，可以在下面添加路径。',
      'codegraph.add.title': '添加项目',
      'codegraph.add.placeholder': 'D:\\路径\\到\\项目',
      'codegraph.add.action': '添加',
      'codegraph.working': '处理中…',
      'skills.title': 'Skills',
      'skills.desc': '发现、启用、创建和删除项目与用户目录里的本地 skills。',
      'skills.empty': '磁盘上还没发现 skill。',
      'skills.count': '{count} 个 skill',
      'skills.modelOff': '模型不可用',
      'skills.new': '新建 skill',
      'skills.name': '名称',
      'skills.descriptionField': '描述',
      'skills.body': '指令正文',
      'skills.create': '创建',
      'skills.cancel': '取消',
      'skills.delete': '删除',
      'skills.open': '打开',
      'skills.close': '关闭',
      'skills.workspace': '工作区：{path}',
      'skills.scope.project': '项目级',
      'skills.scope.global': '全局',
      'skills.scope.projectHint': '来自当前工作区（项目根），切工作区会自动换。',
      'skills.scope.globalHint': '所有工作区共享。',
      'skills.root': '保存位置',
      'skills.rootProject': '项目',
      'skills.rootUser': '用户',
      'skills.invalidName': '用 kebab-case：小写字母、数字和单个连字符。',
      'skills.deleteConfirm': '删除这个 skill？它会移到 dsh-coding-box 的回收目录。',
      'mcp.title': 'MCP 服务器',
      'mcp.desc': '连接本地 stdio MCP 服务器，工具会以 mcp__<服务器>__<工具> 的形式出现在 Agent 手里。',
      'mcp.empty': '还没有 MCP 服务器。',
      'mcp.add': '添加服务器',
      'mcp.name': '名称',
      'mcp.command': '命令',
      'mcp.args': '参数',
      'mcp.argsHint': '空格分隔，例如：-y @modelcontextprotocol/server-filesystem D:\\work',
      'mcp.env': '环境变量',
      'mcp.envHint': '每行一个 KEY=VALUE，值保存在本地状态文件里。',
      'mcp.create': '添加',
      'mcp.cancel': '取消',
      'mcp.reconnect': '重连',
      'mcp.delete': '移除',
      'mcp.deleteConfirm': '移除这个 MCP 服务器和它的工具？',
      'mcp.tools': '{count} 个工具',
      'mcp.status.connected': '已连接',
      'mcp.status.connecting': '连接中',
      'mcp.status.failed': '失败',
      'mcp.status.stopped': '已停止',
      'mcp.invalidName': '用 1-32 个字符：字母、数字、"_" 或 "-"。',
      'mcp.commandRequired': '命令不能为空。',
      'toast.saved': '已保存',
      'toast.installed': 'Codegraph 安装完成',
      'toast.upgraded': 'Codegraph 已升级',
      'toast.indexed': '索引已更新',
      'toast.deleted': 'Skill 已删除',
      'toast.created': 'Skill 已创建',
      'toast.mcpAdded': 'MCP 服务器已添加',
      'toast.mcpRemoved': 'MCP 服务器已移除',
    }

    const CSS = `
.cb-shell { display: flex; height: 100%; min-height: 0; color: var(--dsw-alias-label-primary); }
.cb-nav { width: 196px; flex: none; box-sizing: border-box; padding: 18px 10px; display: flex; flex-direction: column; gap: 3px; border-right: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base); overflow: auto; }
.cb-nav-title { font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-secondary); padding: 4px 10px 8px; }
.cb-nav-item { appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); text-align: left; padding: 7px 10px; border-radius: 8px; font-size: 13px; font-family: inherit; cursor: pointer; }
.cb-nav-item:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.cb-nav-item[data-active="true"] { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-weight: 600; }
.cb-content { flex: 1 1 auto; min-width: 0; overflow: auto; padding: 22px 26px 48px; }
.cb-inner { width: 100%; max-width: 880px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
.cb-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.cb-title { font-size: 18px; font-weight: 600; line-height: 1.4; }
.cb-sub { margin-top: 2px; font-size: 13px; color: var(--dsw-alias-label-secondary); }
.cb-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.cb-spacer { flex: 1 1 auto; }
.cb-card { border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.cb-card.clickable { cursor: pointer; }
.cb-card.clickable:hover { border-color: var(--dsw-alias-border-l2); }
.cb-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.cb-card-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
.cb-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); flex: none; }
.cb-dot.on { background: var(--dsw-alias-state-success-primary); }
.cb-dot.warn { background: var(--dsw-alias-state-warn-primary); }
.cb-dot.err { background: var(--dsw-alias-state-error-primary); }
.cb-desc { font-size: 13px; line-height: 1.5; color: var(--dsw-alias-label-secondary); }
.cb-meta { font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary); display: flex; flex-wrap: wrap; gap: 4px 12px; }
.cb-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; }
.cb-btn { appearance: none; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); border-radius: 8px; padding: 5px 10px; font-size: 12px; line-height: 1.4; cursor: pointer; font-family: inherit; }
.cb-btn:hover:not(:disabled) { border-color: var(--dsw-alias-border-l2); }
.cb-btn:disabled { opacity: .5; cursor: default; }
.cb-btn.primary { background: var(--dsw-alias-brand-primary); border-color: transparent; color: #fff; }
.cb-btn.danger { color: var(--dsw-alias-state-error-primary); }
.cb-btn.ghost { background: transparent; border-color: transparent; color: var(--dsw-alias-label-secondary); }
.cb-switch { position: relative; width: 36px; height: 20px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); cursor: pointer; padding: 0; flex: none; transition: background .15s ease; }
.cb-switch[data-on="true"] { background: var(--dsw-alias-brand-primary); border-color: transparent; }
.cb-switch:disabled { opacity: .5; cursor: default; }
.cb-thumb { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.25); transition: transform .15s ease; }
.cb-switch[data-on="true"] .cb-thumb { transform: translateX(16px); }
.cb-input, .cb-textarea, .cb-select { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); border-radius: 8px; padding: 6px 8px; font-size: 13px; font-family: inherit; }
.cb-textarea { min-height: 84px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
.cb-field { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.cb-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cb-list { display: flex; flex-direction: column; border-top: 1px solid var(--dsw-alias-border-l1); }
.cb-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.cb-item-main { flex: 1 1 auto; min-width: 0; }
.cb-item-name { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.cb-item-desc { font-size: 12px; color: var(--dsw-alias-label-secondary); line-height: 1.45; margin-top: 2px; overflow-wrap: anywhere; }
.cb-badge { font-size: 10px; line-height: 1.4; padding: 1px 6px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); font-weight: 500; }
.cb-badge.ok { color: var(--dsw-alias-state-success-primary); border-color: currentColor; }
.cb-badge.err { color: var(--dsw-alias-state-error-primary); border-color: currentColor; }
.cb-empty { font-size: 12px; color: var(--dsw-alias-label-secondary); padding: 8px 0; }
.cb-error { font-size: 12px; color: var(--dsw-alias-state-error-primary); white-space: pre-wrap; }
.cb-note { font-size: 11px; line-height: 1.45; color: var(--dsw-alias-label-secondary); }
.cb-pre { margin: 0; max-height: 260px; overflow: auto; background: var(--dsw-alias-bg-base); border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 8px 10px; font-size: 11px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
.cb-form { display: grid; gap: 10px; border: 1px dashed var(--dsw-alias-border-l2); border-radius: 10px; padding: 12px; }
.cb-inline { display: flex; gap: 8px; align-items: flex-end; }
.cb-fade { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.cb-placeholder { border: 1px dashed var(--dsw-alias-border-l2); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
.cb-group { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
.cb-group-head { display: flex; align-items: center; gap: 8px; }
.cb-tool-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.cb-chip { font-size: 11px; padding: 1px 7px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); }
@media (max-width: 720px) { .cb-nav { width: 136px; } .cb-content { padding: 18px 16px 40px; } }
`

    async function request(method, url, body) {
      const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: body === undefined ? undefined : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }
      if (!response.ok || !payload || payload.ok === false) {
        throw new Error(payload?.error || `HTTP ${response.status}`)
      }
      return payload
    }

    function Switch(props) {
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': props.checked ? 'true' : 'false',
        'aria-label': props.label,
        title: props.label,
        className: 'cb-switch',
        'data-on': props.checked ? 'true' : 'false',
        disabled: props.disabled,
        onClick: () => { if (!props.disabled) props.onChange(!props.checked) },
      }, h('span', { className: 'cb-thumb' }))
    }

    function statusDot(status) {
      if (status === 'connected') return 'cb-dot on'
      if (status === 'failed') return 'cb-dot err'
      if (status === 'connecting') return 'cb-dot warn'
      return 'cb-dot'
    }

    function useToolbox() {
      const [state, setState] = React.useState(null)
      const [error, setError] = React.useState('')
      const [busy, setBusy] = React.useState('')
      const [notice, setNotice] = React.useState('')

      const load = React.useCallback(async (withSpinner) => {
        if (withSpinner) setBusy('load')
        try {
          const data = await request('GET', '/dsh-coding-box/api/state')
          setState(data)
          setError('')
        } catch (failure) {
          setError(String(failure?.message ?? failure))
        } finally {
          if (withSpinner) setBusy('')
        }
      }, [])

      React.useEffect(() => { load(true) }, [load])

      const act = React.useCallback(async (label, body, success) => {
        setBusy(label)
        setNotice('')
        try {
          const data = await request('POST', '/dsh-coding-box/api/action', body)
          setState(data)
          setError('')
          if (success) setNotice(success)
          return data
        } catch (failure) {
          setError(String(failure?.message ?? failure))
          return null
        } finally {
          setBusy('')
        }
      }, [])

      return { state, error, busy, notice, load, act, setError }
    }

    function PageHead(props) {
      return h('div', { className: 'cb-head' },
        h('div', null,
          h('div', { className: 'cb-title' }, props.title),
          props.subtitle ? h('div', { className: 'cb-sub' }, props.subtitle) : null),
        props.children)
    }

    function OverviewPage(props) {
      const { t, state, go } = props
      const projects = state.workspace.projects || []
      const indexed = projects.filter((project) => project.indexed).length
      const mcpServers = state.mcp.servers || []
      const connected = mcpServers.filter((server) => server.status === 'connected').length
      const toolCount = mcpServers.reduce((total, server) => total + server.tools.length, 0)

      const card = (id, title, description, status) => h('div', {
        className: 'cb-card clickable',
        role: 'button',
        tabIndex: 0,
        key: id,
        onClick: () => go(id),
        onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') go(id) },
      },
      h('div', { className: 'cb-card-title' }, h('span', { className: 'cb-dot' + (status.on ? ' on' : '') }), title),
      h('div', { className: 'cb-desc' }, description),
      h('div', { className: 'cb-meta' }, h('span', null, status.text)),
      h('div', { className: 'cb-row' }, h('span', { className: 'cb-fade' }, t('overview.open') + ' →')))

      return h('div', { className: 'cb-inner' },
        h(PageHead, { title: t('nav.title'), subtitle: t('page.subtitle') }),
        h('div', { className: 'cb-tool-grid' },
          card('codegraph', t('nav.codegraph'), t('overview.codegraph.desc'), {
            on: state.modules.codegraph,
            text: state.codegraph.installed
              ? t('overview.codegraph.installed').replace('{version}', state.codegraph.version || '') + ' · ' + t('overview.codegraph.projects').replace('{count}', String(indexed))
              : t('overview.codegraph.notInstalled'),
          }),
          card('skills', t('nav.skills'), t('overview.skills.desc'), {
            on: state.modules.skills,
            text: t('overview.skills.count').replace('{count}', String(state.skills.count)),
          }),
          card('mcp', t('nav.mcp'), t('overview.mcp.desc'), {
            on: state.modules.mcp && connected > 0,
            text: t('overview.mcp.status')
              .replace('{connected}', String(connected))
              .replace('{total}', String(mcpServers.length))
              .replace('{tools}', String(toolCount)),
          })),
        h('div', { className: 'cb-placeholder' },
          h('div', { className: 'cb-card-title' }, t('overview.more.title')),
          h('div', { className: 'cb-desc' }, t('overview.more.desc'))))
    }

    function CodegraphPage(props) {
      const { t, state, busy, act } = props
      const info = state.codegraph
      const projects = state.workspace.projects || []
      const active = projects.find((project) => project.active)
      const [draft, setDraft] = React.useState('')
      const working = busy === 'codegraph' || busy === 'initProject' || busy === 'syncProject' || info.installing

      return h('div', { className: 'cb-inner' },
        h(PageHead, {
          title: t('codegraph.title'),
          subtitle: t('codegraph.desc'),
        }, h(Switch, {
          checked: state.modules.codegraph,
          disabled: Boolean(busy),
          label: t('codegraph.title'),
          onChange: (next) => act('module', { action: 'setModule', module: 'codegraph', enabled: next }, t('toast.saved')),
        })),

        h('section', { className: 'cb-card' },
          h('div', { className: 'cb-card-head' },
            h('div', { className: 'cb-meta' },
              h('span', null, info.installed ? t('codegraph.installed').replace('{version}', info.version || '') : t('codegraph.notInstalled')),
              info.installed ? h('span', { className: 'cb-mono' }, info.bin) : null,
              info.installed && info.source === 'local' ? h('span', { className: 'cb-badge' }, 'local') : null),
            h('div', { className: 'cb-row' },
              info.installed
                ? h('button', { type: 'button', className: 'cb-btn', disabled: Boolean(busy), onClick: () => act('codegraph', { action: 'upgradeCodegraph' }, t('toast.upgraded')) }, t('codegraph.upgrade'))
                : h('button', { type: 'button', className: 'cb-btn primary', disabled: Boolean(busy), onClick: () => act('codegraph', { action: 'installCodegraph' }, t('toast.installed')) }, busy === 'codegraph' ? t('codegraph.installing') : t('codegraph.install')))),
          h('label', { className: 'cb-row', style: { cursor: 'pointer', fontSize: '12px' } },
            h('input', {
              type: 'checkbox',
              checked: info.autoInstall !== false,
              disabled: Boolean(busy),
              onChange: (event) => act('codegraph', { action: 'setAutoInstall', autoInstall: event.target.checked }),
            }),
            h('span', null, t('codegraph.autoInstall')))),
        working ? h('div', { className: 'cb-fade' }, t('codegraph.working')) : null,

        h('section', { className: 'cb-card' },
          h('div', { className: 'cb-card-title' }, t('codegraph.active.title')),
          h('div', { className: 'cb-note' }, t('codegraph.workspace.note')),
          active
            ? h('div', null,
              h('div', { className: 'cb-item-name' }, active.name, h('span', { className: 'cb-badge' + (active.indexed ? ' ok' : '') }, active.indexed ? t('codegraph.indexed') : t('codegraph.notIndexed'))),
              h('div', { className: 'cb-item-desc cb-mono' }, active.path),
              h('div', { className: 'cb-row', style: { marginTop: '8px' } },
                h('button', { type: 'button', className: 'cb-btn primary', disabled: Boolean(busy), onClick: () => act('initProject', { action: 'initProject', path: active.path }, t('toast.indexed')) }, t('codegraph.index')),
                h('button', { type: 'button', className: 'cb-btn', disabled: Boolean(busy) || !active.indexed, onClick: () => act('syncProject', { action: 'syncProject', path: active.path }, t('toast.indexed')) }, t('codegraph.sync'))))
            : h('div', { className: 'cb-empty' }, t('codegraph.active.none')),
          info.projectStatus ? h('pre', { className: 'cb-pre' }, info.projectStatus) : null),

        h('section', { className: 'cb-card' },
          h('div', { className: 'cb-card-title' }, t('codegraph.projects.title')),
          projects.length === 0
            ? h('div', { className: 'cb-empty' }, t('codegraph.projects.empty'))
            : h('div', { className: 'cb-list' }, projects.map((project) => h('div', { className: 'cb-item', key: project.path },
              h('div', { className: 'cb-item-main' },
                h('div', { className: 'cb-item-name' },
                  project.name,
                  project.active ? h('span', { className: 'cb-badge ok' }, t('codegraph.active.title')) : null,
                  h('span', { className: 'cb-badge' + (project.indexed ? ' ok' : '') }, project.indexed ? t('codegraph.indexed') : t('codegraph.notIndexed')),
                  project.sources.map((source) => h('span', { className: 'cb-badge', key: source }, t('codegraph.source.' + source)))),
                h('div', { className: 'cb-item-desc cb-mono' }, project.path)),
              h('div', { className: 'cb-row' },
                h('button', {
                  type: 'button', className: 'cb-btn ghost', disabled: Boolean(busy),
                  onClick: () => act('initProject', { action: 'initProject', path: project.path }, t('toast.indexed')),
                }, t('codegraph.index')),
                h('button', {
                  type: 'button', className: 'cb-btn ghost', disabled: Boolean(busy) || !project.indexed,
                  onClick: () => act('syncProject', { action: 'syncProject', path: project.path }, t('toast.indexed')),
                }, t('codegraph.sync')),
                project.sources.includes('manual')
                  ? h('button', {
                    type: 'button', className: 'cb-btn ghost danger', disabled: Boolean(busy),
                    onClick: () => act('removeProject', { action: 'removeProject', path: project.path }),
                  }, t('codegraph.remove'))
                  : null))))),

        h('section', { className: 'cb-card' },
          h('div', { className: 'cb-card-title' }, t('codegraph.add.title')),
          h('div', { className: 'cb-inline' },
            h('input', {
              className: 'cb-input', value: draft, spellCheck: false,
              placeholder: t('codegraph.add.placeholder'),
              onChange: (event) => setDraft(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter' && draft.trim()) {
                  act('addProject', { action: 'addProject', path: draft.trim() }, t('toast.saved')).then((result) => { if (result) setDraft('') })
                }
              },
            }),
            h('button', {
              type: 'button', className: 'cb-btn', disabled: Boolean(busy) || !draft.trim(),
              onClick: () => act('addProject', { action: 'addProject', path: draft.trim() }, t('toast.saved')).then((result) => { if (result) setDraft('') }),
            }, t('codegraph.add.action')))))
    }

    function SkillsPage(props) {
      const { t, state, busy, act, setError } = props
      const skills = state.skills.items || []
      const [creating, setCreating] = React.useState(false)
      const [draft, setDraft] = React.useState({ name: '', description: '', body: '', root: 'project' })
      const [preview, setPreview] = React.useState(null)
      const [formError, setFormError] = React.useState('')

      const create = async () => {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.name.trim())) {
          setFormError(t('skills.invalidName'))
          return
        }
        setFormError('')
        const result = await act('skill', {
          action: 'createSkill',
          name: draft.name.trim(),
          description: draft.description,
          body: draft.body,
          root: draft.root,
        }, t('toast.created'))
        if (result) {
          setCreating(false)
          setDraft({ name: '', description: '', body: '', root: 'project' })
        }
      }

      const open = async (skill) => {
        try {
          const result = await request('POST', '/dsh-coding-box/api/action', { action: 'readSkill', name: skill.name })
          setPreview({ skill: result.skill, content: result.content })
          setError('')
        } catch (failure) {
          setError(String(failure?.message ?? failure))
        }
      }

      const remove = async (skill) => {
        if (!window.confirm(t('skills.deleteConfirm'))) return
        await act('skill', { action: 'deleteSkill', name: skill.name }, t('toast.deleted'))
      }

      const row = (skill) => h('div', { className: 'cb-item', key: skill.name },
        h('div', { className: 'cb-item-main' },
          h('div', { className: 'cb-item-name' },
            skill.name,
            h('span', { className: 'cb-badge' }, skill.rootLabel),
            skill.modelInvocable ? null : h('span', { className: 'cb-badge' }, t('skills.modelOff'))),
          h('div', { className: 'cb-item-desc' }, skill.description || '—'),
          h('div', { className: 'cb-item-desc cb-mono' }, skill.path)),
        h('div', { className: 'cb-row' },
          h('button', { type: 'button', className: 'cb-btn ghost', disabled: Boolean(busy), onClick: () => open(skill) }, t('skills.open')),
          h(Switch, {
            checked: skill.modelInvocable,
            disabled: Boolean(busy),
            label: t('skills.modelOff'),
            onChange: (next) => act('skill', { action: 'toggleSkill', name: skill.name, modelInvocable: next }, t('toast.saved')),
          }),
          h('button', { type: 'button', className: 'cb-btn ghost danger', disabled: Boolean(busy), onClick: () => remove(skill) }, t('skills.delete'))))

      const group = (title, hint, list) => h('div', { className: 'cb-group', key: title },
        h('div', { className: 'cb-group-head' },
          h('span', { className: 'cb-card-title' }, title),
          h('span', { className: 'cb-badge' }, String(list.length))),
        h('div', { className: 'cb-note' }, hint),
        list.length === 0
          ? h('div', { className: 'cb-empty' }, '—')
          : h('div', { className: 'cb-list' }, list.map(row)))

      return h('div', { className: 'cb-inner' },
        h(PageHead, { title: t('skills.title'), subtitle: t('skills.desc') },
          h(Switch, {
            checked: state.modules.skills,
            disabled: Boolean(busy),
            label: t('skills.title'),
            onChange: (next) => act('module', { action: 'setModule', module: 'skills', enabled: next }, t('toast.saved')),
          })),
        h('section', { className: 'cb-card' },
          h('div', { className: 'cb-row' },
            h('span', { className: 'cb-meta' }, t('skills.count').replace('{count}', String(skills.length))),
            h('div', { className: 'cb-spacer' }),
            h('button', { type: 'button', className: 'cb-btn', disabled: Boolean(busy), onClick: () => { setCreating(!creating); setFormError('') } }, creating ? t('skills.cancel') : t('skills.new'))),
          creating ? h('div', { className: 'cb-form' },
            h('label', { className: 'cb-field' }, h('span', null, t('skills.name')), h('input', {
              className: 'cb-input', value: draft.name, spellCheck: false, placeholder: 'my-skill',
              onChange: (event) => setDraft({ ...draft, name: event.target.value }),
            })),
            h('label', { className: 'cb-field' }, h('span', null, t('skills.descriptionField')), h('input', {
              className: 'cb-input', value: draft.description,
              onChange: (event) => setDraft({ ...draft, description: event.target.value }),
            })),
            h('label', { className: 'cb-field' }, h('span', null, t('skills.root')), h('select', {
              className: 'cb-select', value: draft.root,
              onChange: (event) => setDraft({ ...draft, root: event.target.value }),
            }, h('option', { value: 'project' }, t('skills.rootProject')), h('option', { value: 'user' }, t('skills.rootUser')))),
            h('label', { className: 'cb-field' }, h('span', null, t('skills.body')), h('textarea', {
              className: 'cb-textarea', value: draft.body,
              onChange: (event) => setDraft({ ...draft, body: event.target.value }),
            })),
            formError ? h('div', { className: 'cb-error' }, formError) : null,
            h('div', { className: 'cb-row' },
              h('button', { type: 'button', className: 'cb-btn primary', disabled: Boolean(busy), onClick: create }, t('skills.create')),
              h('button', { type: 'button', className: 'cb-btn ghost', onClick: () => setCreating(false) }, t('skills.cancel')))) : null,
          h('div', { className: 'cb-note' }, t('skills.workspace').replace('{path}', state.workspace.projectRoot || state.workspace.path)),
          skills.length === 0
            ? h('div', { className: 'cb-empty' }, t('skills.empty'))
            : [
              group(t('skills.scope.project'), t('skills.scope.projectHint'), skills.filter((skill) => skill.scope === 'project')),
              group(t('skills.scope.global'), t('skills.scope.globalHint'), skills.filter((skill) => skill.scope !== 'project')),
            ],
          preview ? h('div', null,
            h('div', { className: 'cb-row' },
              h('span', { className: 'cb-item-name cb-mono' }, preview.skill.path),
              h('div', { className: 'cb-spacer' }),
              h('button', { type: 'button', className: 'cb-btn ghost', onClick: () => setPreview(null) }, t('skills.close'))),
            h('pre', { className: 'cb-pre' }, preview.content)) : null))
    }

    function McpPage(props) {
      const { t, state, busy, act } = props
      const servers = state.mcp.servers || []
      const [adding, setAdding] = React.useState(false)
      const [draft, setDraft] = React.useState({ name: '', command: '', args: '', env: '' })
      const [formError, setFormError] = React.useState('')

      const add = async () => {
        if (!/^[A-Za-z0-9_-]{1,32}$/.test(draft.name.trim())) {
          setFormError(t('mcp.invalidName'))
          return
        }
        if (!draft.command.trim()) {
          setFormError(t('mcp.commandRequired'))
          return
        }
        setFormError('')
        const result = await act('mcp', {
          action: 'addMcpServer',
          name: draft.name.trim(),
          command: draft.command.trim(),
          args: draft.args,
          env: draft.env,
          enabled: true,
        }, t('toast.mcpAdded'))
        if (result) {
          setAdding(false)
          setDraft({ name: '', command: '', args: '', env: '' })
        }
      }

      return h('div', { className: 'cb-inner' },
        h(PageHead, { title: t('mcp.title'), subtitle: t('mcp.desc') },
          h(Switch, {
            checked: state.modules.mcp,
            disabled: Boolean(busy),
            label: t('mcp.title'),
            onChange: (next) => act('module', { action: 'setModule', module: 'mcp', enabled: next }, t('toast.saved')),
          })),
        h('section', { className: 'cb-card' },
          h('div', { className: 'cb-row' },
            h('span', { className: 'cb-meta' }, t('mcp.tools').replace('{count}', String(servers.reduce((total, server) => total + server.tools.length, 0)))),
            h('div', { className: 'cb-spacer' }),
            h('button', { type: 'button', className: 'cb-btn', disabled: Boolean(busy), onClick: () => { setAdding(!adding); setFormError('') } }, adding ? t('mcp.cancel') : t('mcp.add'))),
          adding ? h('div', { className: 'cb-form' },
            h('div', { className: 'cb-grid2' },
              h('label', { className: 'cb-field' }, h('span', null, t('mcp.name')), h('input', {
                className: 'cb-input', value: draft.name, spellCheck: false, placeholder: 'filesystem',
                onChange: (event) => setDraft({ ...draft, name: event.target.value }),
              })),
              h('label', { className: 'cb-field' }, h('span', null, t('mcp.command')), h('input', {
                className: 'cb-input', value: draft.command, spellCheck: false, placeholder: 'npx',
                onChange: (event) => setDraft({ ...draft, command: event.target.value }),
              }))),
            h('label', { className: 'cb-field' }, h('span', null, t('mcp.args')), h('input', {
              className: 'cb-input', value: draft.args, spellCheck: false, placeholder: '-y @modelcontextprotocol/server-filesystem D:\\\\work',
              onChange: (event) => setDraft({ ...draft, args: event.target.value }),
            })),
            h('div', { className: 'cb-note' }, t('mcp.argsHint')),
            h('label', { className: 'cb-field' }, h('span', null, t('mcp.env')), h('textarea', {
              className: 'cb-textarea', value: draft.env, spellCheck: false, placeholder: 'KEY=VALUE',
              onChange: (event) => setDraft({ ...draft, env: event.target.value }),
            })),
            h('div', { className: 'cb-note' }, t('mcp.envHint')),
            formError ? h('div', { className: 'cb-error' }, formError) : null,
            h('div', { className: 'cb-row' },
              h('button', { type: 'button', className: 'cb-btn primary', disabled: Boolean(busy), onClick: add }, t('mcp.create')),
              h('button', { type: 'button', className: 'cb-btn ghost', onClick: () => setAdding(false) }, t('mcp.cancel')))) : null,
          servers.length === 0
            ? h('div', { className: 'cb-empty' }, t('mcp.empty'))
            : h('div', { className: 'cb-list' }, servers.map((server) => h('div', { className: 'cb-item', key: server.name },
              h('div', { className: 'cb-item-main' },
                h('div', { className: 'cb-item-name' },
                  h('span', { className: statusDot(server.status) }),
                  server.name,
                  h('span', { className: 'cb-badge' + (server.status === 'connected' ? ' ok' : server.status === 'failed' ? ' err' : '') }, t('mcp.status.' + server.status)),
                  h('span', { className: 'cb-badge' }, t('mcp.tools').replace('{count}', String(server.tools.length)))),
                h('div', { className: 'cb-item-desc cb-mono' }, [server.command, ...server.args].join(' ')),
                server.tools.length ? h('div', { className: 'cb-row', style: { marginTop: '6px' } }, server.tools.map((tool) => h('span', { className: 'cb-chip', key: tool }, tool))) : null,
                server.error ? h('div', { className: 'cb-error', style: { marginTop: '6px' } }, server.error) : null),
              h('div', { className: 'cb-row' },
                h(Switch, {
                  checked: server.enabled,
                  disabled: Boolean(busy),
                  label: server.name,
                  onChange: (next) => act('mcp', { action: 'toggleMcpServer', name: server.name, enabled: next }, t('toast.saved')),
                }),
                h('button', {
                  type: 'button', className: 'cb-btn ghost', disabled: Boolean(busy),
                  onClick: () => act('mcp', { action: 'reconnectMcpServer', name: server.name }),
                }, t('mcp.reconnect')),
                h('button', {
                  type: 'button', className: 'cb-btn ghost danger', disabled: Boolean(busy),
                  onClick: () => {
                    if (!window.confirm(t('mcp.deleteConfirm'))) return
                    act('mcp', { action: 'removeMcpServer', name: server.name }, t('toast.mcpRemoved'))
                  },
                }, t('mcp.delete'))))))))
    }

    function CodingBoxPanel(props) {
      const t = props.t ?? ((key) => key)
      const toolbox = useToolbox()
      const { state, error, busy, notice } = toolbox
      const [page, setPage] = React.useState('overview')

      const go = (next) => { setPage(next) }
      const navItems = [
        { id: 'overview', label: t('nav.overview') },
        { id: 'codegraph', label: t('nav.codegraph') },
        { id: 'skills', label: t('nav.skills') },
        { id: 'mcp', label: t('nav.mcp') },
      ]

      return h('div', { className: 'cb-shell' },
        h('style', null, CSS),
        h('nav', { className: 'cb-nav' },
          h('div', { className: 'cb-nav-title' }, t('nav.title')),
          navItems.map((item) => h('button', {
            key: item.id,
            type: 'button',
            className: 'cb-nav-item',
            'data-active': page === item.id ? 'true' : 'false',
            onClick: () => go(item.id),
          }, item.label)),
          h('div', { className: 'cb-spacer' }),
          h('button', {
            type: 'button', className: 'cb-btn ghost', style: { textAlign: 'left' }, disabled: Boolean(busy),
            onClick: () => toolbox.load(false),
          }, t('page.refresh'))),
        h('div', { className: 'cb-content' },
          error ? h('div', { className: 'cb-error', style: { marginBottom: '12px' } }, error) : null,
          notice ? h('div', { className: 'cb-fade', style: { marginBottom: '12px' } }, notice) : null,
          !state
            ? h('div', { className: 'cb-fade' }, busy ? t('page.loading') : t('page.failed'))
            : page === 'codegraph'
              ? h(CodegraphPage, { t, state, busy, act: toolbox.act })
              : page === 'skills'
                ? h(SkillsPage, { t, state, busy, act: toolbox.act, setError: toolbox.setError })
                : page === 'mcp'
                  ? h(McpPage, { t, state, busy, act: toolbox.act })
                  : h(OverviewPage, { t, state, go })))
    }

    /** Sidebar glyph: a toolbox with a small graph, drawn in the host's stroke style. */
    function PanelIcon(props) {
      const size = props?.size ?? 20
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true, style: { display: 'block' },
      },
      h('rect', { x: 3, y: 7.5, width: 18, height: 12.5, rx: 2.5 }),
      h('path', { d: 'M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5' }),
      h('path', { d: 'M3 12.5h18' }),
      h('circle', { cx: 8.5, cy: 12.5, r: 1.15, fill: 'currentColor', stroke: 'none' }),
      h('circle', { cx: 12, cy: 16.2, r: 1.15, fill: 'currentColor', stroke: 'none' }),
      h('circle', { cx: 15.5, cy: 12.5, r: 1.15, fill: 'currentColor', stroke: 'none' }))
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-coding-box: dictionaries')
      const t = ctx.locale.bind(NS)
      ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: 'dsh-coding-box',
        locale: NS,
        inject: () => ({ t }),
      }, CodingBoxPanel)), 'dsh-coding-box: main panel')
      ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: 'dsh-coding-box',
        order: 20,
        label: () => t('nav.title'),
        locale: NS,
      }, PanelIcon)), 'dsh-coding-box: sidebar entry')
    }

    return { inject: ['slots', 'locale'], apply }
  },
})
