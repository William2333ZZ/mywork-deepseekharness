/**
 * Tiny zero-dependency helpers so this plugin loads from ANY install form
 * (npm, tarball, git, or a local `link:` checkout outside $DSH_HOME) without
 * importing `@deepseek-ai/dsh-tools` or `@deepseek-ai/schemastery`, which a
 * checkout outside the profile cannot resolve.
 *
 *   • defineRawTool(...)  → a ToolDefinition with raw JSON Schema parameters
 *                           (the same shape `defineTool` produces; the tools
 *                           registry accepts raw definitions, as MCP tools do).
 *   • configSchema(defaults) → a Standard Schema v1 object Cordis accepts as
 *                           the plugin `Config`, filling defaults.
 */

/** Convert the compact `{ name: { type, required, description } }` spec to JSON Schema. */
export function parametersToJsonSchema(spec) {
  const properties = {}
  const required = []
  for (const [key, def] of Object.entries(spec || {})) {
    const p = { type: def.type, description: def.description || '' }
    if (def.type === 'array') p.items = def.items || {}
    if (def.enum) p.enum = def.enum
    properties[key] = p
    if (def.required) required.push(key)
  }
  const schema = { type: 'object', properties }
  if (required.length > 0) schema.required = required
  return schema
}

/**
 * Build a raw tool definition.
 * @param {object} o - { name, description, parameters, execute, render? }
 *   `execute(args, exec)` returns a JSON value; `render(args, value)` returns
 *   ContentBlock[] (defaults to pretty JSON text).
 */
export function defineRawTool(o) {
  const parameters = parametersToJsonSchema(o.parameters)
  const render = o.render || ((_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }])
  return {
    name: o.name,
    description: o.description,
    parameters,
    output: {
      schema: {},
      render(args, value) { return render(args, value) },
    },
    async execute(args, exec) {
      const a = (args && typeof args === 'object') ? args : {}
      for (const key of parameters.required || []) {
        if (a[key] === undefined || a[key] === null || a[key] === '') throw new Error(`missing required argument: ${key}`)
      }
      return o.execute(a, exec)
    },
  }
}

/** Standard Schema v1 object that merges user config over `defaults`. */
export function configSchema(defaults, validate) {
  return {
    '~standard': {
      version: 1,
      vendor: 'dsh-mywork',
      validate(value) {
        const input = (value && typeof value === 'object' && !Array.isArray(value)) ? value : {}
        const merged = { ...defaults, ...input }
        if (validate) {
          const issue = validate(merged)
          if (issue) return { issues: [{ message: String(issue) }] }
        }
        return { value: merged }
      },
    },
  }
}

/**
 * Same-origin / login guard for plugin HTTP routes: defer to the host
 * connection service's `requestRejection` (Host/Origin/Fetch-Metadata and
 * token checks) when present. Returns a truthy value after writing the
 * rejection, or `false` to let the handler run.
 */
export function rejectUntrusted(ctx, req, res, json) {
  let connection
  try { connection = ctx.get('connection') } catch { connection = undefined }
  if (!connection || typeof connection.requestRejection !== 'function') return false
  let code
  try { code = connection.requestRejection(req) } catch { code = 503 }
  if (code === undefined) return false
  json(res, { error: code === 401 ? 'login required' : code === 403 ? 'untrusted or cross-site request rejected' : 'auth unavailable' }, code)
  return true
}
