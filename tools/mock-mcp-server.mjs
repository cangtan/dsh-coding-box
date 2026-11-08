#!/usr/bin/env node
/**
 * Minimal stdio MCP server used to self-test dsh-coding-box's MCP page.
 * Speaks newline-delimited JSON-RPC: initialize, tools/list, tools/call.
 */
process.stdin.setEncoding('utf8')

let buffer = ''

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function handle(message) {
  if (message.method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'dsh-coding-box-mock', version: '1.0.0' },
      },
    })
    return
  }
  if (message.method === 'notifications/initialized') return
  if (message.method === 'ping') {
    send({ jsonrpc: '2.0', id: message.id, result: {} })
    return
  }
  if (message.method === 'tools/list') {
    send({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: [{
          name: 'echo',
          description: 'Echo back the given text (self-test fixture).',
          inputSchema: {
            type: 'object',
            properties: { text: { type: 'string', description: 'Text to echo.' } },
            required: ['text'],
            additionalProperties: false,
          },
        }],
      },
    })
    return
  }
  if (message.method === 'tools/call') {
    const name = message.params?.name
    const args = message.params?.arguments ?? {}
    if (name === 'echo') {
      send({
        jsonrpc: '2.0',
        id: message.id,
        result: { content: [{ type: 'text', text: `echo: ${String(args.text ?? '')}` }] },
      })
      return
    }
    send({
      jsonrpc: '2.0',
      id: message.id,
      result: { isError: true, content: [{ type: 'text', text: `unknown tool: ${name}` }] },
    })
    return
  }
  if (message.id !== undefined) {
    send({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: 'method not found' } })
  }
}

process.stdin.on('data', (chunk) => {
  buffer += chunk
  for (;;) {
    const index = buffer.indexOf('\n')
    if (index < 0) break
    const line = buffer.slice(0, index).trim()
    buffer = buffer.slice(index + 1)
    if (!line) continue
    try {
      handle(JSON.parse(line))
    } catch {
      // ignore malformed input
    }
  }
})
