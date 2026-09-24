export const CHANNELS_ENDPOINT = '/api/dsh-im-connect/channels'
export const CHANNEL_SESSION_PREFIX = 'im:'

export type ChannelSession = {
  sessionId: string
  title: string
  updatedAt?: number
  running: boolean
}

export type ChannelAccount = {
  id: string
  name: string
  platform: string
  connected: boolean
  status: string
}

export type ChannelGroup = {
  id: string
  label: string
  sessions: ChannelSession[]
  /** Configured accounts of this platform; present so an account that has not received a message yet still shows up. */
  accounts: ChannelAccount[]
}

/** DSH 会话头不能写 origin=im，频道会话只靠 id 前缀。 */
export function isChannelSession(id: string): boolean {
  return id.startsWith(CHANNEL_SESSION_PREFIX)
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback
}

function updatedAt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value !== '') {
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

export function parseChannelSession(value: unknown): ChannelSession | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const row = value as Record<string, unknown>
  const sessionId = text(row.sessionId)
  if (sessionId === '') return undefined
  return {
    sessionId,
    title: text(row.title) || text(row.chatId) || sessionId,
    updatedAt: updatedAt(row.updatedAt),
    running: row.running === true,
  }
}

function parseAccounts(value: unknown, platform: string): ChannelAccount[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (item === null || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const id = text(row.id)
    if (id === '') return []
    return [{ id, name: text(row.name, id), platform: text(row.platform, platform), connected: row.connected === true, status: text(row.status) }]
  })
}

export function parseChannelGroups(payload: unknown, fallbackLabel = ''): ChannelGroup[] {
  const root = payload !== null && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  const raw = Array.isArray(root.groups) ? root.groups : Array.isArray(payload) ? payload : []
  const accountsByPlatform = new Map<string, { label: string; accounts: ChannelAccount[] }>()
  if (Array.isArray(root.channels)) {
    for (const item of root.channels) {
      if (item === null || typeof item !== 'object') continue
      const channel = item as Record<string, unknown>
      const id = text(channel.id)
      const accounts = parseAccounts(channel.accounts, id)
      if (id !== '' && accounts.length > 0) accountsByPlatform.set(id, { label: text(channel.label, id), accounts })
    }
  }
  const groups = raw.flatMap((item, index) => {
    if (item === null || typeof item !== 'object') return []
    const group = item as Record<string, unknown>
    const sessions = Array.isArray(group.sessions) ? group.sessions.flatMap(session => {
      const parsed = parseChannelSession(session)
      return parsed === undefined ? [] : [parsed]
    }) : []
    const id = text(group.id, `channel-${index}`)
    return [{
      id,
      label: text(group.label, text(group.title, fallbackLabel)),
      sessions,
      accounts: accountsByPlatform.get(id)?.accounts ?? [],
    }]
  })
  // Platforms with a configured account but no conversation yet (nobody has messaged the bot) still get a group,
  // so a freshly connected Feishu / DingTalk account is visible right away instead of an empty tab.
  for (const [id, info] of accountsByPlatform) {
    if (!groups.some(group => group.id === id)) groups.push({ id, label: info.label, sessions: [], accounts: info.accounts })
  }
  return groups
}

/** 读取 IM 频道分组；失败时交给界面显示空态或错误。 */
export async function loadChannelGroups(signal?: AbortSignal, fallbackLabel = ''): Promise<ChannelGroup[]> {
  const response = await fetch(CHANNELS_ENDPOINT, { cache: 'no-store', signal })
  let payload: unknown
  try {
    payload = await response.json() as unknown
  } catch {
    throw new Error(response.ok ? '频道会话数据格式无效' : '无法读取频道会话')
  }
  const root = payload !== null && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  if (!response.ok) throw new Error(text(root.error, '无法读取频道会话'))
  if (root.ok === false) throw new Error(text(root.error, '无法读取频道会话'))
  return parseChannelGroups(payload, fallbackLabel)
}
