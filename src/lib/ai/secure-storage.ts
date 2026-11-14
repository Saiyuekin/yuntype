// AI 密钥安全存储 — 默认"仅本次会话",可选持久保存
//
// 设计要点:
//  - 默认写入 sessionStorage:关闭标签页即自动清除,密钥不再长期滞留磁盘
//  - 读取顺序:先会话、后本地 — 兼容旧版本遗留在 localStorage 的配置,也支持"持久"模式
//  - 保存时清理另一份存储,任意时刻只有一份副本
//  - 所有读写都 try/catch:隐私模式 / 存储被禁用时静默降级,不影响功能

export const CHAT_CONFIG_KEY = 'yuntype_ai_chat_config'
export const IMAGE_CONFIG_KEY = 'yuntype_ai_image_config'

const PREF_KEY = 'yuntype_ai_session_only'

const AI_KEYS = [CHAT_CONFIG_KEY, IMAGE_CONFIG_KEY]

/** 当前是否为"仅本次会话"模式(默认是) */
export function isSessionOnly(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== 'false'
  } catch {
    return true
  }
}

/** 切换保存模式;切到会话模式时,把已持久化的密钥搬进 sessionStorage 并清除本地副本 */
export function setSessionOnly(sessionOnly: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, String(sessionOnly))
  } catch {}
  if (sessionOnly) {
    for (const key of AI_KEYS) {
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          sessionStorage.setItem(key, raw)
          localStorage.removeItem(key)
        }
      } catch {}
    }
  }
}

/** 读取密钥配置:sessionStorage 优先,localStorage 兜底(旧数据/持久模式) */
export function loadSecret<T>(storageKey: string): T | null {
  try {
    const fromSession = sessionStorage.getItem(storageKey)
    if (fromSession) return JSON.parse(fromSession) as T
    const fromLocal = localStorage.getItem(storageKey)
    if (fromLocal) return JSON.parse(fromLocal) as T
  } catch {}
  return null
}

/** 保存密钥配置:按当前模式写入,并清掉另一份,避免双副本 */
export function saveSecret<T>(storageKey: string, value: T): void {
  const [primary, secondary] = isSessionOnly()
    ? ([sessionStorage, localStorage] as const)
    : ([localStorage, sessionStorage] as const)
  try {
    primary.setItem(storageKey, JSON.stringify(value))
  } catch {}
  try {
    secondary.removeItem(storageKey)
  } catch {}
}

/** 一键清除全部已存 AI 密钥(聊天 + 生图,两处存储都清) */
export function clearAllAIKeys(): void {
  for (const key of AI_KEYS) {
    try {
      sessionStorage.removeItem(key)
    } catch {}
    try {
      localStorage.removeItem(key)
    } catch {}
  }
}
