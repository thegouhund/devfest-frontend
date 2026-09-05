import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { ApiError, setUnauthorizedHandler, tokenStore } from '@/lib/api'
import * as authApi from '@/lib/auth-api'
import type { Profile, RegisterInput } from '@/lib/auth-api'

/**
 * anonymous       — belum punya token
 * needs-profile   — punya token tingkat akun, profil aktif belum dipilih
 * ready           — token sudah menyematkan profil
 */
export type AuthStatus = 'loading' | 'anonymous' | 'needs-profile' | 'ready'

interface AuthContextType {
  status: AuthStatus
  profile: Profile | null
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>
  register: (input: RegisterInput, rememberMe: boolean) => Promise<Profile>
  selectProfile: (profileId: string, pin?: string) => Promise<void>
  logout: () => void
  /** Kembali ke layar pilih profil tanpa membuang token akun. */
  switchProfile: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStore.read() ? 'loading' : 'anonymous'
  )
  const [profile, setProfile] = useState<Profile | null>(null)
  const [persist, setPersist] = useState(true)

  const clearSession = useCallback(() => {
    tokenStore.clear()
    setProfile(null)
    setStatus('anonymous')
  }, [])

  // 401 di endpoint mana pun berarti sesi sudah tidak berlaku.
  useEffect(() => {
    setUnauthorizedHandler(clearSession)
  }, [clearSession])

  // Token disimpan tanpa profil aktif — 403 dari /profiles/me yang memberi tahu
  // bahwa tokennya masih tahap pertama, bukan bahwa sesinya rusak.
  const resolveToken = useCallback(async () => {
    if (!tokenStore.read()) return
    try {
      setProfile(await authApi.getActiveProfile())
      setStatus('ready')
    } catch (error) {
      if (error instanceof ApiError && error.needsProfile) {
        setProfile(null)
        setStatus('needs-profile')
        return
      }
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    void resolveToken()
  }, [resolveToken])

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const { access_token } = await authApi.login(email, password)
      setPersist(rememberMe)
      tokenStore.write(access_token, rememberMe)
      setProfile(null)
      setStatus('needs-profile')
    },
    []
  )

  // Token dari /register sudah menunjuk profil admin — tidak perlu select-profile.
  const register = useCallback(async (input: RegisterInput, rememberMe: boolean) => {
    const { access_token } = await authApi.register(input)
    setPersist(rememberMe)
    tokenStore.write(access_token, rememberMe)
    const active = await authApi.getActiveProfile()
    setProfile(active)
    setStatus('ready')
    return active
  }, [])

  const selectProfile = useCallback(
    async (profileId: string, pin?: string) => {
      const { access_token } = await authApi.selectProfile(profileId, pin)
      tokenStore.write(access_token, persist)
      setProfile(await authApi.getActiveProfile())
      setStatus('ready')
    },
    [persist]
  )

  const switchProfile = useCallback(() => {
    setProfile(null)
    setStatus('needs-profile')
  }, [])

  const refreshProfile = useCallback(async () => {
    setProfile(await authApi.getActiveProfile())
  }, [])

  return (
    <AuthContext.Provider
      value={{
        status,
        profile,
        login,
        register,
        selectProfile,
        logout: clearSession,
        switchProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
