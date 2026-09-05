import { useEffect, useState } from 'react'

/**
 * Router minimal di atas History API. Aplikasi ini hanya butuh path datar
 * tanpa parameter atau nested route, jadi belum sepadan menambah dependensi
 * router. Kalau nanti butuh URL berparameter (mis. /riwayat/:sessionId),
 * ganti dengan react-router.
 */
export const navigate = (path: string, replace = false) => {
  if (window.location.pathname === path) return
  window.history[replace ? 'replaceState' : 'pushState']({}, '', path)
  // pushState tidak memicu popstate, jadi listener dibangunkan manual.
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export const usePath = (): string => {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const sync = () => setPath(window.location.pathname)
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  return path
}

export const ROUTES = {
  login: '/login',
  onboarding: '/onboarding',
  selectProfile: '/pilih-profil',
  dashboard: '/dashboard',
  measure: '/ukur-bpm',
  history: '/riwayat',
  activities: '/aktivitas',
  family: '/keluarga',
  copilot: '/copilot',
} as const

/** Path untuk tiap tab di dalam shell Dashboard. */
export const NAV_PATHS: Record<string, string> = {
  dashboard: ROUTES.dashboard,
  rppg: ROUTES.measure,
  riwayat: ROUTES.history,
  aktivitas: ROUTES.activities,
  keluarga: ROUTES.family,
  copilot: ROUTES.copilot,
}

export const navIdFromPath = (path: string): string =>
  Object.keys(NAV_PATHS).find((id) => NAV_PATHS[id] === path) ?? 'dashboard'
