const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const PREFIX = '/api/v1'

const TOKEN_KEY = 'nadiku.token'

export class ApiError extends Error {
  status: number
  /** Error per-field dari respons 422, dikunci dengan nama field terakhir di `loc`. */
  fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }

  /** Token valid tapi belum menunjuk profil, atau profil aktif tidak berhak. */
  get needsProfile() {
    return this.status === 403
  }
}

// Token disimpan di localStorage kalau "ingat saya", kalau tidak di sessionStorage.
export const tokenStore = {
  read(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  write(token: string, persist: boolean) {
    try {
      tokenStore.clear()
      ;(persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
    } catch {
      /* penyimpanan diblokir; sesi hanya bertahan selama tab hidup */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      /* abaikan */
    }
  },
}

type Detail422 = { loc: (string | number)[]; msg: string }

const parseError = async (res: Response): Promise<ApiError> => {
  let detail: unknown
  try {
    detail = (await res.json())?.detail
  } catch {
    detail = undefined
  }

  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {}
    for (const item of detail as Detail422[]) {
      const field = String(item.loc?.[item.loc.length - 1] ?? '')
      if (field && !fieldErrors[field]) fieldErrors[field] = item.msg
    }
    const first = Object.values(fieldErrors)[0]
    return new ApiError(res.status, first ?? 'Data yang dikirim tidak valid', fieldErrors)
  }

  if (typeof detail === 'string') return new ApiError(res.status, detail)

  if (res.status === 500) return new ApiError(res.status, 'Terjadi gangguan di server. Coba lagi nanti.')
  return new ApiError(res.status, `Permintaan gagal (${res.status})`)
}

let onUnauthorized: (() => void) | null = null

/** Dipanggil sekali oleh AuthProvider supaya 401 di endpoint mana pun membersihkan sesi. */
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler
}

interface RequestOptions {
  method?: string
  /** Dikirim sebagai JSON. Pakai `form` untuk urlencoded, `body` untuk FormData. */
  json?: unknown
  form?: Record<string, string>
  body?: BodyInit
  query?: Record<string, string | number | undefined | null>
  /** Kirim tanpa header Authorization (dipakai login & register). */
  anonymous?: boolean
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', json, form, body, query, anonymous } = options

  const url = new URL(`${PREFIX}${path}`, BASE_URL)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
    }
  }

  const headers: Record<string, string> = {}
  if (!anonymous) {
    const token = tokenStore.read()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let payload: BodyInit | undefined = body
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(json)
  } else if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    payload = new URLSearchParams(form)
  }

  let res: Response
  try {
    res = await fetch(url, { method, headers, body: payload })
  } catch {
    throw new ApiError(0, 'Tidak dapat terhubung ke server. Periksa koneksi Anda.')
  }

  if (res.status === 401) {
    tokenStore.clear()
    onUnauthorized?.()
    throw await parseError(res)
  }

  if (!res.ok) throw await parseError(res)

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
