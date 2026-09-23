export interface StorageLike {
  get<T = unknown>(key: string, fallback?: T): T | undefined
  set(key: string, value: unknown, ttlMs?: number): void
  remove(key: string): void
  clear(): void
}

interface Envelope {
  __fsd: true
  value: unknown
  expiresAt?: number
}

interface StorageBackend {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  key(index: number): string | null
  readonly length: number
}

function createMemoryBackend(): StorageBackend {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size
    },
  }
}

function resolveBackend(kind: 'local' | 'session'): StorageBackend {
  if (typeof globalThis === 'undefined') return createMemoryBackend()
  const scope = globalThis as { localStorage?: Storage; sessionStorage?: Storage }
  const target = kind === 'session' ? scope.sessionStorage : scope.localStorage
  if (!target) return createMemoryBackend()
  try {
    const probe = '__fsd_probe__'
    target.setItem(probe, '1')
    target.removeItem(probe)
    return target
  } catch {
    // 隐私模式 / 禁用 Storage：降级为内存实现
    return createMemoryBackend()
  }
}

function isEnvelope(value: unknown): value is Envelope {
  return (
    typeof value === 'object' && value !== null && (value as { __fsd?: unknown }).__fsd === true
  )
}

export function createStorage(
  namespace: string,
  backend: 'local' | 'session' = 'local',
): StorageLike {
  const store = resolveBackend(backend)
  const prefix = `${namespace}:`
  // 调用方已写全键名（如 'fsd:token'）时不重复拼接
  const toFullKey = (key: string): string => (key.startsWith(prefix) ? key : `${prefix}${key}`)

  const readRaw = (key: string): string | null => {
    try {
      return store.getItem(toFullKey(key))
    } catch {
      return null
    }
  }

  const writeRaw = (key: string, value: string): void => {
    try {
      store.setItem(toFullKey(key), value)
    } catch {
      // 超出配额等场景静默降级，不抛异常
    }
  }

  const removeKey = (key: string): void => {
    try {
      store.removeItem(toFullKey(key))
    } catch {
      // 忽略
    }
  }

  return {
    get<T = unknown>(key: string, fallback?: T): T | undefined {
      const raw = readRaw(key)
      if (raw === null) return fallback
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        console.warn(`[utils/storage] JSON 解析失败，回落默认值: ${key}`)
        return fallback
      }
      if (!isEnvelope(parsed)) {
        console.warn(`[utils/storage] 非本命名空间的数据，回落默认值: ${key}`)
        return fallback
      }
      if (parsed.expiresAt !== undefined && parsed.expiresAt <= Date.now()) {
        removeKey(key)
        return fallback
      }
      return parsed.value as T
    },

    set(key: string, value: unknown, ttlMs?: number): void {
      const envelope: Envelope = {
        __fsd: true,
        value,
        ...(ttlMs === undefined ? {} : { expiresAt: Date.now() + ttlMs }),
      }
      writeRaw(key, JSON.stringify(envelope))
    },

    remove(key: string): void {
      removeKey(key)
    },

    clear(): void {
      const keys: string[] = []
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i)
        if (key !== null && key.startsWith(prefix)) keys.push(key)
      }
      for (const key of keys) removeKey(key)
    },
  }
}

export const storage: StorageLike = createStorage('fsd', 'local')
