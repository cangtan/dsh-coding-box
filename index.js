/**
 * dsh-coding-box — a vibe-coding toolbox for DeepSeek Harness.
 *
 * Host half: a module switchboard with one page per tool — Codegraph (install,
 * project registry, index/sync), Skills (local skill management) and MCP
 * (stdio server manager) — plus the JSON API the sidebar panel talks to.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export const name = 'dsh-coding-box'

const API_PREFIX = '/dsh-coding-box/api'
const MAX_TOOL_OUTPUT = 100_000
const VERSION = '0.2.0'

/** Root of DSH's per-user configuration. */
function dshHome() {
  return process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
}

/** Plugin-owned state and tool directory (never the profile directory). */
function storeDir() {
  return path.join(dshHome(), 'dsh-coding-box')
}

function stateFile() {
  return path.join(storeDir(), 'state.json')
}

function defaultState(config) {
  const codegraph = config?.codegraph ?? {}
  const skills = config?.skills ?? {}
  const mcp = config?.mcp ?? {}
  return {
    modules: {
      codegraph: codegraph.enabled === true,
      skills: skills.enabled !== false,
      mcp: mcp.enabled !== false,
    },
    codegraph: {
      autoInstall: codegraph.autoInstall !== false,
      packageName: typeof codegraph.packageName === 'string' && codegraph.packageName
        ? codegraph.packageName
        : '@colbymchenry/codegraph',
      version: '',
      projects: [],
    },
    skills: {
      extraRoots: Array.isArray(skills.extraRoots) ? skills.extraRoots.filter((v) => typeof v === 'string') : [],
    },
    mcp: {
      servers: Array.isArray(mcp.servers) ? mcp.servers : [],
    },
  }
}

function mergeState(base, saved) {
  if (!saved || typeof saved !== 'object') return base
  return {
    modules: { ...base.modules, ...(saved.modules ?? {}) },
    codegraph: { ...base.codegraph, ...(saved.codegraph ?? {}) },
    skills: { ...base.skills, ...(saved.skills ?? {}) },
    mcp: { ...base.mcp, ...(saved.mcp ?? {}) },
  }
}

function loadState(config) {
  const base = defaultState(config)
  try {
    return mergeState(base, JSON.parse(fs.readFileSync(stateFile(), 'utf8')))
  } catch {
    return base
  }
}

async function saveState(state) {
  await fsp.mkdir(storeDir(), { recursive: true })
  const target = stateFile()
  const temporary = `${target}.${process.pid}.tmp`
  await fsp.writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  await fsp.rename(temporary, target)
}

// ---------------------------------------------------------------------------
// Process helpers
// ---------------------------------------------------------------------------

function shellQuote(value) {
  const text = String(value)
  if (text === '') return '""'
  return /[\s"&|<>^()]/.test(text) ? `"${text.replace(/"/g, '\\"')}"` : text
}

/** Run one shell command line; resolves with captured output instead of throwing. */
function run(command, options = {}) {
  const { cwd, timeoutMs = 60_000, signal } = options
  return new Promise((resolve) => {
    let settled = false
    let timedOut = false
    const child = spawn(command, {
      cwd,
      shell: true,
      windowsHide: true,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    const finish = (code) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      signal?.removeEventListener?.('abort', onAbort)
      resolve({ code, stdout, stderr, timedOut })
    }
    const stop = () => {
      try { child.kill() } catch { /* already gone */ }
    }
    const onAbort = () => stop()
    const timer = timeoutMs > 0
      ? setTimeout(() => { timedOut = true; stop() }, timeoutMs)
      : undefined
    signal?.addEventListener?.('abort', onAbort, { once: true })
    child.stdout?.on('data', (chunk) => { stdout += chunk })
    child.stderr?.on('data', (chunk) => { stderr += chunk })
    child.on('error', (error) => {
      stderr += String(error?.message ?? error)
      finish(-1)
    })
    child.on('close', (code) => finish(typeof code === 'number' ? code : -1))
  })
}

function trimOutput(text) {
  if (text.length <= MAX_TOOL_OUTPUT) return text
  return `${text.slice(0, MAX_TOOL_OUTPUT)}\n… output truncated (${text.length} chars)`
}

function jsonResponse(res, body, status = 200) {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
    'cache-control': 'no-store',
  })
  res.end(text)
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 1_000_000) {
        reject(new Error('request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('error', reject)
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8').trim()
      if (!text) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(text))
      } catch (error) {
        reject(new Error(`invalid JSON body: ${String(error?.message ?? error)}`))
      }
    })
  })
}

// ---------------------------------------------------------------------------
// Codegraph
// ---------------------------------------------------------------------------

function codegraphLocalDir() {
  return path.join(storeDir(), 'codegraph')
}

function codegraphLocalBin() {
  const bin = process.platform === 'win32'
    ? path.join(codegraphLocalDir(), 'node_modules', '.bin', 'codegraph.cmd')
    : path.join(codegraphLocalDir(), 'node_modules', '.bin', 'codegraph')
  return fs.existsSync(bin) ? bin : undefined
}

async function codegraphPathBin() {
  const result = await run(process.platform === 'win32' ? 'where codegraph' : 'command -v codegraph', { timeoutMs: 15_000 })
  if (result.code !== 0) return undefined
  const line = result.stdout.split(/\r?\n/).map((entry) => entry.trim()).find(Boolean)
  return line || undefined
}

async function resolveCodegraphBin() {
  return codegraphLocalBin() ?? (await codegraphPathBin())
}

async function codegraphVersion(bin) {
  const result = await run(`${shellQuote(bin)} version`, { timeoutMs: 30_000 })
  const text = `${result.stdout}\n${result.stderr}`
  if (result.code !== 0) return ''
  const match = /\b(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)\b/.exec(text)
  if (match) return match[1]
  return text.trim().split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? ''
}

async function installCodegraph(state) {
  const dir = codegraphLocalDir()
  await fsp.mkdir(dir, { recursive: true })
  const command = [
    shellQuote('npm'),
    'install',
    '--prefix', shellQuote(dir),
    '--no-fund',
    '--no-audit',
    '--loglevel=error',
    shellQuote(state.codegraph.packageName),
  ].join(' ')
  const result = await run(command, { timeoutMs: 20 * 60_000 })
  if (result.code !== 0) {
    const suffix = result.timedOut ? ' (timed out)' : ''
    throw new Error(`npm install failed${suffix}: ${trimOutput(result.stderr || result.stdout).slice(0, 4000)}`)
  }
  const bin = codegraphLocalBin()
  if (!bin) throw new Error('npm install finished but the codegraph binary is missing')
  const version = await codegraphVersion(bin)
  state.codegraph.version = version
  await saveState(state)
  return { bin, version }
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

function projectRootFor(cwd) {
  try {
    let dir = path.resolve(cwd)
    for (;;) {
      if (fs.existsSync(path.join(dir, '.git'))) return dir
      const parent = path.dirname(dir)
      if (parent === dir) return path.resolve(cwd)
      dir = parent
    }
  } catch {
    return path.resolve(cwd)
  }
}

function skillRoots(cwd, extraRoots) {
  const project = projectRootFor(cwd)
  const roots = [
    { id: 'project-dsh', label: 'Project .dsh', dir: path.join(project, '.dsh', 'skills'), rank: 100 },
    { id: 'project-agents', label: 'Project .agents', dir: path.join(project, '.agents', 'skills'), rank: 200 },
  ]
  for (const extra of extraRoots ?? []) {
    roots.push({ id: `custom:${extra}`, label: 'Custom', dir: extra, rank: 300 })
  }
  roots.push({ id: 'user-dsh', label: 'User .dsh', dir: path.join(dshHome(), 'skills'), rank: 400 })
  roots.push({ id: 'user-agents', label: 'User .agents', dir: path.join(os.homedir(), '.agents', 'skills'), rank: 500 })
  const seen = new Set()
  return roots.filter((root) => {
    const key = path.resolve(root.dir).toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/.exec(text)
  if (!match) return { data: {}, body: text, present: false, raw: '' }
  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const entry = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
    if (!entry) continue
    let value = entry[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    data[entry[1]] = value
  }
  return { data, body: text.slice(match[0].length), present: true, raw: match[0] }
}

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback
  const text = String(value).trim().toLowerCase()
  if (['true', 'yes', 'on', '1'].includes(text)) return true
  if (['false', 'no', 'off', '0'].includes(text)) return false
  return fallback
}

function setFrontmatterKey(text, key, value) {
  const { body, present, raw } = parseFrontmatter(text)
  const line = `${key}: ${value}`
  if (!present) return `---\n${line}\n---\n\n${text}`
  const lines = raw.replace(/^---\r?\n/, '').replace(/\r?\n---[ \t]*\r?\n?$/, '').split(/\r?\n/)
  const index = lines.findIndex((entry) => new RegExp(`^${key}\\s*:`).test(entry))
  if (index >= 0) lines[index] = line
  else {
    const description = lines.findIndex((entry) => /^description\s*:/.test(entry))
    if (description >= 0) lines.splice(description + 1, 0, line)
    else lines.push(line)
  }
  return `---\n${lines.join('\n')}\n---\n${body}`
}

async function discoverSkills(cwd, extraRoots) {
  const roots = skillRoots(cwd, extraRoots)
  const found = new Map()
  for (const root of roots) {
    let entries
    try {
      entries = await fsp.readdir(root.dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      let file
      if (entry.isDirectory()) file = path.join(root.dir, entry.name, 'SKILL.md')
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) file = path.join(root.dir, entry.name)
      else continue
      let text
      try {
        text = await fsp.readFile(file, 'utf8')
      } catch {
        continue
      }
      const { data } = parseFrontmatter(text)
      const fallbackName = entry.isDirectory() ? entry.name : path.basename(entry.name, '.md')
      const skillName = data.name || fallbackName
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName)) continue
      if (found.has(skillName)) continue
      found.set(skillName, {
        name: skillName,
        description: data.description ?? '',
        whenToUse: data.whenToUse ?? '',
        path: file,
        root: root.id,
        rootLabel: root.label,
        rootDir: root.dir,
        rank: root.rank,
        scope: root.rank < 400 ? 'project' : 'global',
        modelInvocable: !parseBoolean(data['disable-model-invocation'], false),
        userInvocable: parseBoolean(data['user-invocable'], true),
        bodyBytes: Buffer.byteLength(text, 'utf8'),
      })
    }
  }
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name))
}

async function createSkill(cwd, extraRoots, input) {
  const skillName = String(input.name ?? '').trim()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName)) {
    throw new Error('invalid name: use kebab-case (lowercase letters, digits and single dashes)')
  }
  const description = String(input.description ?? '').trim()
  if (!description) throw new Error('description is required')
  const roots = skillRoots(cwd, extraRoots)
  const root = input.root === 'user'
    ? roots.find((entry) => entry.id === 'user-dsh')
    : roots.find((entry) => entry.id === 'project-dsh')
  if (!root) throw new Error('no skill root available')
  const target = path.join(root.dir, skillName, 'SKILL.md')
  if (fs.existsSync(target)) throw new Error(`skill already exists: ${target}`)
  const body = String(input.body ?? '').trim()
  const content = [
    '---',
    `name: ${skillName}`,
    `description: ${description}`,
    '---',
    '',
    `# ${skillName}`,
    '',
    body || 'Describe when to use this skill and the exact steps to follow.',
    '',
  ].join('\n')
  await fsp.mkdir(path.dirname(target), { recursive: true })
  await fsp.writeFile(target, content, 'utf8')
  return { name: skillName, path: target, root: root.id }
}

async function deleteSkill(skill) {
  const trash = path.join(storeDir(), 'trash')
  await fsp.mkdir(trash, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const source = path.basename(skill.path) === 'SKILL.md' ? path.dirname(skill.path) : skill.path
  const target = path.join(trash, `${stamp}-${path.basename(source)}`)
  await fsp.rename(source, target)
  return { movedTo: target }
}

async function setSkillInvocation(skill, modelInvocable) {
  const text = await fsp.readFile(skill.path, 'utf8')
  const next = setFrontmatterKey(text, 'disable-model-invocation', modelInvocable ? 'false' : 'true')
  await fsp.writeFile(skill.path, next, 'utf8')
  return { name: skill.name, modelInvocable }
}

// ---------------------------------------------------------------------------
// MCP (stdio) client
// ---------------------------------------------------------------------------

const MCP_PROTOCOL_VERSION = '2024-11-05'

class McpClient {
  constructor(definition, log) {
    this.definition = definition
    this.log = log
    this.child = undefined
    this.buffer = ''
    this.stderr = ''
    this.nextId = 1
    this.pending = new Map()
    this.closed = false
    this.serverInfo = undefined
    this.onClose = undefined
  }

  connect() {
    const { command, args = [], env = {}, cwd } = this.definition
    const line = [command, ...args].map(shellQuote).join(' ')
    this.child = spawn(line, {
      shell: true,
      windowsHide: true,
      cwd: cwd || undefined,
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    this.child.stdout.setEncoding('utf8')
    this.child.stdout.on('data', (chunk) => this.onData(chunk))
    this.child.stderr.setEncoding('utf8')
    this.child.stderr.on('data', (chunk) => {
      this.stderr = (this.stderr + chunk).slice(-8000)
    })
    this.child.on('exit', (code) => this.onExit(code))
    this.child.on('error', (error) => this.onExit(-1, error))
    return this.handshake()
  }

  async handshake() {
    const init = await this.request('initialize', {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'dsh-coding-box', version: VERSION },
    }, 20_000)
    this.serverInfo = init?.serverInfo
    this.notify('notifications/initialized', {})
    const list = await this.request('tools/list', {}, 20_000)
    return Array.isArray(list?.tools) ? list.tools : []
  }

  request(method, params, timeoutMs = 60_000) {
    if (this.closed) return Promise.reject(new Error('MCP connection is closed'))
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`MCP ${method} timed out after ${timeoutMs} ms`))
      }, timeoutMs)
      this.pending.set(id, { resolve, reject, timer })
      this.write({ jsonrpc: '2.0', id, method, params })
    })
  }

  notify(method, params) {
    this.write({ jsonrpc: '2.0', method, params })
  }

  write(message) {
    if (!this.child?.stdin?.writable) throw new Error('MCP process is not running')
    this.child.stdin.write(`${JSON.stringify(message)}\n`)
  }

  onData(chunk) {
    this.buffer += chunk
    for (;;) {
      const index = this.buffer.indexOf('\n')
      if (index < 0) break
      const line = this.buffer.slice(0, index).trim()
      this.buffer = this.buffer.slice(index + 1)
      if (!line) continue
      let message
      try {
        message = JSON.parse(line)
      } catch {
        continue
      }
      if (message.id !== undefined && (message.result !== undefined || message.error !== undefined)) {
        const pending = this.pending.get(message.id)
        if (!pending) continue
        this.pending.delete(message.id)
        clearTimeout(pending.timer)
        if (message.error) pending.reject(new Error(message.error.message ?? JSON.stringify(message.error)))
        else pending.resolve(message.result)
        continue
      }
      if (message.id !== undefined && message.method) {
        // Server-initiated request: answer "method not found" so it does not hang.
        this.write({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'not supported' } })
      }
    }
  }

  onExit(code, error) {
    if (this.closed) return
    this.closed = true
    const reason = error ? String(error.message ?? error) : `MCP process exited with code ${code}${this.stderr ? `\n${this.stderr.trim().slice(-2000)}` : ''}`
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer)
      pending.reject(new Error(reason))
    }
    this.pending.clear()
    this.onClose?.(reason)
  }

  close() {
    if (this.closed) {
      try { this.child?.kill() } catch { /* gone */ }
      return
    }
    this.closed = true
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer)
      pending.reject(new Error('MCP connection closed'))
    }
    this.pending.clear()
    try { this.child?.stdin?.end() } catch { /* gone */ }
    try { this.child?.kill() } catch { /* gone */ }
  }
}

function mcpToolName(server, tool) {
  const raw = String(tool).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 40)
  return `mcp__${server}__${raw}`.slice(0, 64)
}

function sanitizeJsonSchema(schema) {
  if (!schema || typeof schema !== 'object') return { type: 'object', properties: {}, additionalProperties: true }
  const copy = JSON.parse(JSON.stringify(schema))
  delete copy.$schema
  if (!copy.type) copy.type = 'object'
  return copy
}

// ---------------------------------------------------------------------------
// The toolbox
// ---------------------------------------------------------------------------

class CodingBox {
  constructor(ctx, config) {
    this.ctx = ctx
    this.state = loadState(config)
    if ('projectPath' in (this.state.codegraph ?? {})) {
      delete this.state.codegraph.projectPath
      saveState(this.state).catch(() => {})
    }
    this.moduleDisposers = []
    this.mcpToolDisposers = []
    this.mcp = new Map()
    this.promptDisposer = undefined
    this.runtimeReady = false
    this.promptReady = false
    this.installing = undefined
    this.versionCache = undefined
    this.statusCache = new Map()
  }

  log(message) {
    try {
      console.log(`[dsh-coding-box] ${message}`)
    } catch { /* logging is best effort */ }
  }

  // -- lifecycle ------------------------------------------------------------

  attachRuntime() {
    this.runtimeReady = true
    this.log('tools ready')
    this.applyModules()
  }

  detachRuntime() {
    this.runtimeReady = false
    this.disposeModules()
    this.stopAllMcp()
  }

  attachPrompt() {
    this.promptReady = true
    this.refreshPromptSection()
  }

  detachPrompt() {
    this.promptReady = false
    this.disposePromptSection()
  }

  refreshPromptSection() {
    this.disposePromptSection()
    if (!this.promptReady || !this.state.modules.codegraph) return
    const systemPrompt = this.ctx.get('systemPrompt')
    if (!systemPrompt?.section) return
    try {
      this.promptDisposer = systemPrompt.section({
        name: 'dsh-coding-box-codegraph',
        order: 400,
        text: 'Codegraph semantic index is available for this workspace. For questions about where a symbol is defined, who calls it, or what a change affects, prefer the codegraph_* tools (codegraph_explore, codegraph_query, codegraph_node, codegraph_impact) over text search; use codegraph_status when a call reports a missing index.',
      })
    } catch (error) {
      this.log(`prompt section failed: ${String(error?.message ?? error)}`)
    }
  }

  disposePromptSection() {
    if (!this.promptDisposer) return
    try {
      this.promptDisposer()
    } catch { /* already gone */ }
    this.promptDisposer = undefined
  }

  applyModules() {
    if (!this.runtimeReady) return
    this.disposeModules()
    if (this.state.modules.codegraph) this.registerCodegraphTools()
    if (this.state.modules.skills) this.registerSkillTools()
    this.refreshPromptSection()
    if (this.state.modules.mcp) {
      this.connectEnabledMcp()
      this.rebuildMcpTools()
    } else {
      this.stopAllMcp()
    }
  }

  disposeModules() {
    for (const dispose of this.moduleDisposers.splice(0)) {
      try { dispose() } catch { /* already gone */ }
    }
    for (const dispose of this.mcpToolDisposers.splice(0)) {
      try { dispose() } catch { /* already gone */ }
    }
  }

  // -- working directory ----------------------------------------------------

  /** The workspace the toolbox follows: the most recently active session's directory. */
  resolveCwd() {
    const dirs = this.agentDirectories()
    const fallback = this.ctx.get('workingDirectory')?.defaultDirectory
    return dirs[dirs.length - 1]?.dir ?? (typeof fallback === 'string' && fallback ? fallback : process.cwd())
  }

  /** Resolve the directory of the session that actually called a tool. */
  async toolCwd(exec, explicit) {
    if (typeof explicit === 'string' && explicit) return path.resolve(explicit)
    const workingDirectory = this.ctx.get('workingDirectory')
    const agent = exec?.agent
    if (workingDirectory?.ensure && agent) {
      try {
        return await workingDirectory.ensure(agent, exec?.signal)
      } catch { /* fall back to the panel workspace */ }
    }
    return this.resolveCwd()
  }

  agentDirectories() {
    const found = []
    try {
      const agents = this.ctx.get('agents')
      const workingDirectory = this.ctx.get('workingDirectory')
      for (const agent of agents?.list?.() ?? []) {
        const session = agent?.session ?? agent
        if (!session) continue
        const dir = workingDirectory?.get?.(session)
        if (typeof dir === 'string' && dir) found.push({ id: String(agent?.id ?? session?.id ?? ''), dir })
      }
    } catch { /* fall through */ }
    return found
  }

  // -- Codegraph ------------------------------------------------------------

  async codegraphInfo() {
    const bin = await resolveCodegraphBin()
    let version = ''
    if (bin) {
      const cached = this.versionCache
      if (cached && cached.bin === bin && Date.now() - cached.at < 5 * 60_000) version = cached.version
      else {
        version = await codegraphVersion(bin)
        this.versionCache = { bin, version, at: Date.now() }
      }
    }
    if (bin && version && version !== this.state.codegraph.version) {
      this.state.codegraph.version = version
      saveState(this.state).catch(() => {})
    }
    return {
      installed: Boolean(bin),
      bin: bin ?? '',
      version: version || this.state.codegraph.version || '',
      source: bin && codegraphLocalBin() === bin ? 'local' : bin ? 'path' : '',
    }
  }

  async ensureCodegraph({ install = false } = {}) {
    const info = await this.codegraphInfo()
    if (info.installed) return info
    if (!install) return info
    if (!this.installing) {
      this.log('installing codegraph')
      this.installing = installCodegraph(this.state)
        .then(({ version }) => this.log(`codegraph installed ${version}`))
        .finally(() => { this.installing = undefined })
    }
    await this.installing
    return await this.codegraphInfo()
  }

  async runCodegraph(args, { cwd, signal } = {}) {
    const bin = await resolveCodegraphBin()
    if (!bin) throw new Error('Codegraph is not installed. Open the Codegraph page and install it first.')
    const command = [shellQuote(bin), ...args.map(shellQuote)].join(' ')
    const result = await run(command, { cwd: cwd || this.resolveCwd(), timeoutMs: 5 * 60_000, signal })
    const output = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join('\n')
    if (result.code !== 0) {
      const message = result.timedOut ? 'codegraph timed out' : `codegraph exited with code ${result.code}`
      throw new Error(`${message}\n${trimOutput(output).slice(0, 4000)}`)
    }
    return trimOutput(output)
  }

  /** Every project this installation knows about, plus manually added ones. */
  listProjects() {
    const candidates = new Map()
    const add = (dir, source) => {
      if (typeof dir !== 'string' || !dir) return
      let absolute
      try { absolute = path.resolve(dir) } catch { return }
      if (!candidates.has(absolute)) candidates.set(absolute, { path: absolute, sources: [source] })
      else if (!candidates.get(absolute).sources.includes(source)) candidates.get(absolute).sources.push(source)
    }
    try {
      for (const workspace of this.ctx.get('workspaceRegistry')?.list?.() ?? []) add(workspace.path, 'workspace')
    } catch { /* optional */ }
    for (const agent of this.agentDirectories()) add(agent.dir, 'agent')
    for (const project of this.state.codegraph.projects ?? []) add(project, 'manual')

    const active = this.resolveCwd()
    return [...candidates.values()].map((project) => {
      const indexDir = path.join(project.path, '.codegraph')
      let indexedAt
      try { indexedAt = fs.statSync(indexDir).mtime.toISOString() } catch { indexedAt = undefined }
      return {
        path: project.path,
        name: path.basename(project.path),
        sources: project.sources,
        exists: fs.existsSync(project.path),
        indexed: Boolean(indexedAt),
        indexedAt,
        active: path.resolve(project.path) === path.resolve(active),
      }
    }).sort((a, b) => Number(b.active) - Number(a.active) || Number(b.indexed) - Number(a.indexed) || a.name.localeCompare(b.name))
  }

  async projectStatus(projectPath) {
    const cached = this.statusCache.get(projectPath)
    if (cached && Date.now() - cached.at < 20_000) return cached.text
    try {
      const text = await this.runCodegraph(['status'], { cwd: projectPath })
      this.statusCache.set(projectPath, { at: Date.now(), text })
      return text
    } catch (error) {
      return String(error?.message ?? error)
    }
  }

  registerCodegraphTools() {
    const tools = this.ctx.get('tools')
    if (!tools) return
    const tool = (definition) => {
      try { this.moduleDisposers.push(tools.register(definition)) } catch (error) {
        this.log(`tool registration failed: ${String(error?.message ?? error)}`)
      }
    }
    const textOutput = {
      schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'], additionalProperties: false },
      render: (_args, value) => [{ type: 'text', text: value.text }],
    }
    const projectPath = {
      type: 'string',
      description: 'Optional indexed project root. Defaults to the calling session workspace.',
    }

    tool({
      name: 'codegraph_explore',
      description: 'Explore a project code graph: relevant symbols with source and call paths, in one shot. Prefer this over grep for "where/how is X used" questions. Requires the dsh-coding-box Codegraph module.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Symbol name or natural-language question about the code.' }, projectPath },
        required: ['query'],
        additionalProperties: false,
      },
      output: textOutput,
      execute: async (args, exec) => ({
        text: await this.runCodegraph(['explore', String(args.query)], { cwd: await this.toolCwd(exec, args.projectPath), signal: exec.signal }),
      }),
    })

    tool({
      name: 'codegraph_query',
      description: 'Search symbols in a project code graph by name or substring. Returns matches as JSON. Requires the dsh-coding-box Codegraph module.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Symbol search text.' },
          kind: { type: 'string', description: 'Optional symbol kind filter, such as function or class.' },
          limit: { type: 'number', description: 'Maximum number of results.' },
          projectPath,
        },
        required: ['search'],
        additionalProperties: false,
      },
      output: textOutput,
      execute: async (args, exec) => {
        const command = ['query', String(args.search), '--json']
        if (args.kind) command.push('--kind', String(args.kind))
        if (args.limit) command.push('--limit', String(Math.trunc(Number(args.limit))))
        return { text: await this.runCodegraph(command, { cwd: await this.toolCwd(exec, args.projectPath), signal: exec.signal }) }
      },
    })

    tool({
      name: 'codegraph_node',
      description: 'Read one symbol (source and callers) or one file with line numbers from a project code graph. Requires the dsh-coding-box Codegraph module.',
      parameters: {
        type: 'object',
        properties: { symbol: { type: 'string', description: 'Symbol name or repo-relative file path.' }, projectPath },
        required: ['symbol'],
        additionalProperties: false,
      },
      output: textOutput,
      execute: async (args, exec) => ({
        text: await this.runCodegraph(['node', String(args.symbol)], { cwd: await this.toolCwd(exec, args.projectPath), signal: exec.signal }),
      }),
    })

    tool({
      name: 'codegraph_impact',
      description: 'Analyze what code is affected by changing a symbol. Requires the dsh-coding-box Codegraph module.',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Symbol name to analyze.' },
          depth: { type: 'number', description: 'Traversal depth.' },
          projectPath,
        },
        required: ['symbol'],
        additionalProperties: false,
      },
      output: textOutput,
      execute: async (args, exec) => {
        const command = ['impact', String(args.symbol), '--json']
        if (args.depth) command.push('--depth', String(Math.trunc(Number(args.depth))))
        return { text: await this.runCodegraph(command, { cwd: await this.toolCwd(exec, args.projectPath), signal: exec.signal }) }
      },
    })

    tool({
      name: 'codegraph_status',
      description: 'Show Codegraph install state and the calling session workspace index statistics. Requires the dsh-coding-box Codegraph module.',
      parameters: { type: 'object', properties: { projectPath }, required: [], additionalProperties: false },
      output: textOutput,
      execute: async (args, exec) => {
        const info = await this.codegraphInfo()
        const target = await this.toolCwd(exec, args.projectPath)
        const indexed = fs.existsSync(path.join(target, '.codegraph'))
        const status = indexed
          ? await this.runCodegraph(['status'], { cwd: target, signal: exec.signal })
          : 'No .codegraph index in this project yet. Open the Codegraph page in dsh-coding-box to index it.'
        return { text: `codegraph ${info.version || '(unknown version)'} · ${info.source || 'missing'}\nproject: ${target}\nindexed: ${indexed}\n\n${status}` }
      },
    })
  }

  // -- Skills ---------------------------------------------------------------

  async listSkills(cwd) {
    return discoverSkills(cwd || this.resolveCwd(), this.state.skills.extraRoots)
  }

  async findSkill(skillName, cwd) {
    const skills = await this.listSkills(cwd)
    const found = skills.find((skill) => skill.name === skillName)
    if (!found) throw new Error(`unknown skill: ${skillName}`)
    return found
  }

  registerSkillTools() {
    const tools = this.ctx.get('tools')
    if (!tools) return
    try {
      this.moduleDisposers.push(tools.register({
        name: 'skill_manage',
        description: 'List, create, delete and enable/disable local skills for this project or the user. Use "list" before acting. Requires the dsh-coding-box Skills module.',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'create', 'delete', 'set_invocation'],
              description: 'list: show skills; create: add one; delete: move one to trash; set_invocation: toggle model access.',
            },
            name: { type: 'string', description: 'Skill name (kebab-case); required for create, delete and set_invocation.' },
            description: { type: 'string', description: 'One-line description for create.' },
            body: { type: 'string', description: 'Instruction body for create.' },
            root: { type: 'string', enum: ['project', 'user'], description: 'Where to create the skill; project by default.' },
            modelInvocable: { type: 'boolean', description: 'For set_invocation: whether the model may use the skill.' },
          },
          required: ['action'],
          additionalProperties: false,
        },
        output: {
          schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'], additionalProperties: false },
          render: (_args, value) => [{ type: 'text', text: value.text }],
        },
        execute: async (args, exec) => {
          const action = String(args.action)
          const cwd = await this.toolCwd(exec)
          if (action === 'list') {
            const skills = await this.listSkills(cwd)
            if (skills.length === 0) return { text: 'No local skills found.' }
            return {
              text: skills.map((skill) => `${skill.name}${skill.modelInvocable ? '' : ' [model-disabled]'} — ${skill.description} (${skill.scope}/${skill.rootLabel}: ${skill.path})`).join('\n'),
            }
          }
          if (action === 'create') {
            const created = await createSkill(cwd, this.state.skills.extraRoots, args)
            return { text: `Created skill "${created.name}" at ${created.path}` }
          }
          if (action === 'delete' || action === 'set_invocation') {
            const skill = await this.findSkill(String(args.name ?? ''), cwd)
            if (action === 'delete') {
              const result = await deleteSkill(skill)
              return { text: `Deleted skill "${skill.name}"; moved to ${result.movedTo}` }
            }
            const modelInvocable = args.modelInvocable !== false
            await setSkillInvocation(skill, modelInvocable)
            return { text: `Skill "${skill.name}" model access ${modelInvocable ? 'enabled' : 'disabled'}` }
          }
          throw new Error(`unknown action: ${action}`)
        },
      }))
    } catch (error) {
      this.log(`skill tool failed: ${String(error?.message ?? error)}`)
    }
  }

  // -- MCP ------------------------------------------------------------------

  mcpDefinition(name) {
    return (this.state.mcp.servers ?? []).find((server) => server.name === name)
  }

  connectEnabledMcp() {
    for (const definition of this.state.mcp.servers ?? []) {
      if (!definition.enabled) continue
      this.connectMcp(definition.name).catch((error) => this.log(`mcp ${definition.name}: ${String(error?.message ?? error)}`))
    }
  }

  async connectMcp(name) {
    const definition = this.mcpDefinition(name)
    if (!definition) throw new Error(`unknown MCP server: ${name}`)
    const existing = this.mcp.get(name)
    if (existing?.status === 'connected' || existing?.status === 'connecting') return existing
    if (existing?.client) existing.client.close()

    const entry = {
      name,
      definition,
      status: 'connecting',
      error: '',
      tools: [],
      serverInfo: undefined,
      client: undefined,
    }
    this.mcp.set(name, entry)

    const client = new McpClient({
      command: definition.command,
      args: definition.args ?? [],
      env: definition.env ?? {},
      cwd: definition.cwd,
    }, (message) => this.log(message))
    entry.client = client
    client.onClose = (reason) => {
      if (entry.status === 'connected' || entry.status === 'connecting') {
        entry.status = 'failed'
        entry.error = reason
        entry.tools = []
        this.rebuildMcpTools()
      }
    }

    try {
      const tools = await client.connect()
      entry.tools = tools.map((tool) => ({
        name: String(tool.name ?? ''),
        description: String(tool.description ?? ''),
        inputSchema: tool.inputSchema,
      })).filter((tool) => tool.name)
      entry.serverInfo = client.serverInfo
      entry.status = 'connected'
      entry.error = ''
      this.log(`mcp ${name} connected (${entry.tools.length} tools)`)
    } catch (error) {
      entry.status = 'failed'
      entry.error = String(error?.message ?? error)
      try { client.close() } catch { /* gone */ }
    }
    this.rebuildMcpTools()
    return entry
  }

  stopMcp(name) {
    const entry = this.mcp.get(name)
    if (!entry) return
    try { entry.client?.close() } catch { /* gone */ }
    entry.status = 'stopped'
    entry.tools = []
    this.rebuildMcpTools()
  }

  stopAllMcp() {
    for (const name of [...this.mcp.keys()]) this.stopMcp(name)
  }

  rebuildMcpTools() {
    for (const dispose of this.mcpToolDisposers.splice(0)) {
      try { dispose() } catch { /* already gone */ }
    }
    if (!this.runtimeReady || !this.state.modules.mcp) return
    const tools = this.ctx.get('tools')
    if (!tools) return
    for (const entry of this.mcp.values()) {
      if (entry.status !== 'connected') continue
      for (const tool of entry.tools) {
        try {
          const dispose = tools.register({
            name: mcpToolName(entry.name, tool.name),
            description: `${tool.description || `MCP tool "${tool.name}"`} (MCP server "${entry.name}")`,
            parameters: sanitizeJsonSchema(tool.inputSchema),
            output: {
              schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'], additionalProperties: false },
              render: (_args, value) => [{ type: 'text', text: value.text }],
            },
            execute: async (args) => {
              const result = await entry.client.request('tools/call', { name: tool.name, arguments: args ?? {} }, 120_000)
              const blocks = Array.isArray(result?.content) ? result.content : []
              const text = blocks.map((block) => {
                if (block.type === 'text') return String(block.text ?? '')
                if (block.type === 'image') return `[image ${block.mimeType ?? 'unknown'} omitted]`
                if (block.type === 'resource') return `[resource ${block.resource?.uri ?? ''}]`
                return JSON.stringify(block)
              }).filter(Boolean).join('\n')
              if (result?.isError) throw new Error(text || `MCP tool "${tool.name}" failed`)
              return { text: text || '(MCP tool returned no content)' }
            },
          })
          this.mcpToolDisposers.push(dispose)
        } catch (error) {
          this.log(`mcp tool ${entry.name}/${tool.name}: ${String(error?.message ?? error)}`)
        }
      }
    }
  }

  async addMcpServer(input) {
    const name = String(input.name ?? '').trim()
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(name)) throw new Error('server name must be 1-32 characters: letters, digits, "_" or "-"')
    if (this.mcpDefinition(name)) throw new Error(`MCP server already exists: ${name}`)
    const command = String(input.command ?? '').trim()
    if (!command) throw new Error('command is required')
    const args = Array.isArray(input.args)
      ? input.args.map(String)
      : String(input.args ?? '').split(/\s+/).filter(Boolean)
    const env = {}
    for (const line of String(input.env ?? '').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const index = trimmed.indexOf('=')
      if (index <= 0) continue
      env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim()
    }
    const definition = { name, command, args, env, cwd: String(input.cwd ?? '').trim() || undefined, enabled: input.enabled !== false }
    this.state.mcp.servers.push(definition)
    await saveState(this.state)
    if (this.state.modules.mcp) {
      await this.connectMcp(name)
    }
    return definition
  }

  async removeMcpServer(name) {
    const index = (this.state.mcp.servers ?? []).findIndex((server) => server.name === name)
    if (index < 0) throw new Error(`unknown MCP server: ${name}`)
    this.stopMcp(name)
    this.mcp.delete(name)
    this.state.mcp.servers.splice(index, 1)
    await saveState(this.state)
  }

  async toggleMcpServer(name, enabled) {
    const definition = this.mcpDefinition(name)
    if (!definition) throw new Error(`unknown MCP server: ${name}`)
    definition.enabled = enabled
    await saveState(this.state)
    if (enabled && this.state.modules.mcp) await this.connectMcp(name)
    else this.stopMcp(name)
  }

  // -- UI API ---------------------------------------------------------------

  async snapshot({ withStatus = false } = {}) {
    const cwd = this.resolveCwd()
    const [codegraph, skills] = await Promise.all([this.codegraphInfo(), this.listSkills(cwd)])
    const projects = this.listProjects()
    let projectStatus = ''
    if (withStatus && codegraph.installed && projects.some((project) => project.active && project.indexed)) {
      projectStatus = await this.projectStatus(cwd)
    }

    let catalog = { count: 0, complete: false, available: false, names: [] }
    try {
      const skillsService = this.ctx.get('skills')
      if (skillsService?.snapshot) {
        const observed = await skillsService.snapshot({ cwd })
        catalog = { available: true, count: observed.skills.length, complete: observed.complete, names: observed.skills.map((entry) => entry.name) }
      }
    } catch (error) {
      catalog = { available: true, count: 0, complete: false, names: [], error: String(error?.message ?? error) }
    }

    return {
      ok: true,
      version: VERSION,
      modules: { ...this.state.modules },
      workspace: {
        path: cwd,
        projectRoot: projectRootFor(cwd),
        projects: projects.map((project) => ({ path: project.path, name: project.name, indexed: project.indexed, indexedAt: project.indexedAt, sources: project.sources, active: project.active })),
      },
      codegraph: {
        ...codegraph,
        autoInstall: this.state.codegraph.autoInstall,
        installing: Boolean(this.installing),
        projectStatus,
      },
      skills: {
        enabled: this.state.modules.skills,
        count: skills.length,
        catalog,
        roots: skillRoots(cwd, this.state.skills.extraRoots).map((root) => ({
          id: root.id,
          label: root.label,
          dir: root.dir,
          exists: fs.existsSync(root.dir),
          scope: root.rank < 400 ? 'project' : 'global',
        })),
        items: skills,
      },
      mcp: {
        enabled: this.state.modules.mcp,
        servers: [...this.mcp.values()].map((entry) => ({
          name: entry.name,
          command: entry.definition.command,
          args: entry.definition.args ?? [],
          envKeys: Object.keys(entry.definition.env ?? {}),
          cwd: entry.definition.cwd,
          enabled: entry.definition.enabled !== false,
          status: entry.status,
          error: entry.error,
          serverInfo: entry.serverInfo,
          tools: entry.tools.map((tool) => tool.name),
        })),
      },
      debug: { agents: this.agentDirectories() },
    }
  }

  async action(input) {
    const action = String(input?.action ?? '')
    if (action === 'refresh') return await this.snapshot({ withStatus: true })

    if (action === 'setModule' || action === 'toggleModule') {
      const module = String(input.module ?? '')
      if (!['codegraph', 'skills', 'mcp'].includes(module)) throw new Error(`unknown module: ${module}`)
      const enabled = input.enabled === true
      if (module === 'codegraph' && enabled) {
        const info = await this.ensureCodegraph({ install: this.state.codegraph.autoInstall })
        if (!info.installed) throw new Error('Codegraph is not installed. Install it first, or enable automatic installation.')
      }
      this.state.modules[module] = enabled
      await saveState(this.state)
      this.applyModules()
      return await this.snapshot({ withStatus: true })
    }

    if (action === 'installCodegraph' || action === 'upgradeCodegraph') {
      await this.ensureCodegraph({ install: true })
      return await this.snapshot({ withStatus: true })
    }

    if (action === 'setAutoInstall') {
      this.state.codegraph.autoInstall = input.autoInstall !== false
      await saveState(this.state)
      return await this.snapshot()
    }

    if (action === 'addProject') {
      const target = path.resolve(String(input.path ?? '').trim())
      if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) throw new Error(`not a directory: ${target}`)
      const projects = this.state.codegraph.projects ?? []
      if (!projects.includes(target)) {
        projects.push(target)
        this.state.codegraph.projects = projects
        await saveState(this.state)
      }
      return await this.snapshot({ withStatus: true })
    }

    if (action === 'removeProject') {
      const target = path.resolve(String(input.path ?? ''))
      this.state.codegraph.projects = (this.state.codegraph.projects ?? []).filter((entry) => path.resolve(entry) !== target)
      await saveState(this.state)
      return await this.snapshot({ withStatus: true })
    }

    if (action === 'initProject' || action === 'syncProject') {
      const target = path.resolve(String(input.path ?? '') || this.resolveCwd())
      this.statusCache.delete(target)
      await this.runCodegraph([action === 'initProject' ? 'init' : 'sync'], { cwd: target })
      return await this.snapshot({ withStatus: true })
    }

    if (action === 'toggleSkill') {
      const skill = await this.findSkill(String(input.name ?? ''))
      await setSkillInvocation(skill, input.modelInvocable === true)
      return await this.snapshot({ withStatus: true })
    }

    if (action === 'createSkill') {
      const created = await createSkill(this.resolveCwd(), this.state.skills.extraRoots, input)
      return { ...(await this.snapshot({ withStatus: true })), created }
    }

    if (action === 'deleteSkill') {
      const skill = await this.findSkill(String(input.name ?? ''))
      const result = await deleteSkill(skill)
      return { ...(await this.snapshot({ withStatus: true })), deleted: result }
    }

    if (action === 'readSkill') {
      const skill = await this.findSkill(String(input.name ?? ''))
      const content = await fsp.readFile(skill.path, 'utf8')
      return { ok: true, skill, content }
    }

    if (action === 'addMcpServer') {
      const definition = await this.addMcpServer(input)
      return { ...(await this.snapshot()), added: definition.name }
    }

    if (action === 'removeMcpServer') {
      await this.removeMcpServer(String(input.name ?? ''))
      return await this.snapshot()
    }

    if (action === 'toggleMcpServer') {
      await this.toggleMcpServer(String(input.name ?? ''), input.enabled === true)
      return await this.snapshot()
    }

    if (action === 'reconnectMcpServer') {
      const name = String(input.name ?? '')
      this.stopMcp(name)
      await this.connectMcp(name)
      return await this.snapshot()
    }

    throw new Error(`unknown action: ${action}`)
  }
}

// ---------------------------------------------------------------------------
// Plugin entry
// ---------------------------------------------------------------------------

export function apply(ctx, config) {
  const box = new CodingBox(ctx, config)
  box.log(`loaded (codegraph=${box.state.modules.codegraph}, skills=${box.state.modules.skills}, mcp=${box.state.modules.mcp})`)

  // Registration must wait for each service to exist: on a cold start the
  // plugin row can be applied before these services are provided.
  ctx.effect(() => ctx.inject(['tools'], (child) => {
    child.effect(() => {
      box.attachRuntime()
      return () => box.detachRuntime()
    }, 'dsh-coding-box: modules')
  }), 'dsh-coding-box: tools injection')

  ctx.effect(() => ctx.inject(['systemPrompt'], (child) => {
    child.effect(() => {
      box.attachPrompt()
      return () => box.detachPrompt()
    }, 'dsh-coding-box: prompt section')
  }), 'dsh-coding-box: prompt injection')

  ctx.effect(() => ctx.inject(['webServer'], (child) => {
    child.effect(() => {
      const webServer = child.get('webServer')
      return webServer.register({
        kind: 'prefix',
        path: API_PREFIX,
        handler: async (req, res) => {
          const url = new URL(req.url ?? '/', 'http://localhost')
          try {
            if (req.method === 'GET' && url.pathname === `${API_PREFIX}/state`) {
              jsonResponse(res, await box.snapshot({ withStatus: true }))
              return
            }
            if (req.method === 'POST' && url.pathname === `${API_PREFIX}/action`) {
              const body = await readJsonBody(req)
              jsonResponse(res, await box.action(body))
              return
            }
            jsonResponse(res, { ok: false, error: 'not found' }, 404)
          } catch (error) {
            const message = String(error?.message ?? error)
            box.log(`api error: ${message}`)
            jsonResponse(res, { ok: false, error: message }, 500)
          }
        },
      })
    }, 'dsh-coding-box: settings api')
  }), 'dsh-coding-box: web api injection')
}
