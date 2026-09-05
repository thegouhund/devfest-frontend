import { useEffect } from 'react'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import ProfileSelect from './components/ProfileSelect'
import ElderlyShell from './components/ElderlyShell'
import { ChatProvider } from './context/ChatContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NAV_PATHS, ROUTES, navigate, usePath } from './lib/router'
import './App.css'

const PUBLIC_PATHS: string[] = [ROUTES.login, ROUTES.onboarding]
const APP_PATHS = Object.values(NAV_PATHS)

function Routes() {
  const { status, logout, profile } = useAuth()
  const path = usePath()

  // URL disamakan dengan status sesi: path yang tidak boleh diakses
  // digantikan (replace, bukan push) supaya tombol kembali tidak
  // memantul ke halaman yang baru saja ditolak.
  useEffect(() => {
    if (status === 'loading') return

    if (status === 'anonymous') {
      if (!PUBLIC_PATHS.includes(path)) navigate(ROUTES.login, true)
      return
    }

    if (status === 'needs-profile') {
      if (path !== ROUTES.selectProfile) navigate(ROUTES.selectProfile, true)
      return
    }

    // Onboarding dibiarkan terbuka walau sesi sudah 'ready': akun memang
    // sudah dibuat di langkah 1, tapi alurnya belum selesai.
    if (path === ROUTES.onboarding) return
    if (!APP_PATHS.includes(path)) navigate(ROUTES.dashboard, true)
  }, [status, path])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-ink-500">
        Memuat sesi…
      </div>
    )
  }

  if (path === ROUTES.onboarding) {
    return (
      <Onboarding
        onComplete={() => navigate(ROUTES.dashboard, true)}
        onCancel={() => navigate(ROUTES.login, true)}
        onNavigateToLogin={() => navigate(ROUTES.login, true)}
      />
    )
  }

  if (status === 'anonymous') {
    return <Login onNavigateToRegister={() => navigate(ROUTES.onboarding)} />
  }

  if (status === 'needs-profile') return <ProfileSelect />

  // Mode lansia punya shell sendiri, jadi Dashboard tidak ikut memuat data
  // yang memang tidak ditampilkan di sana.
  if (profile?.ui_mode === 'elderly') return <ElderlyShell onLogout={logout} />

  return <Dashboard onLogout={logout} />
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <div className="min-h-screen bg-sand flex flex-col">
          <Routes />
        </div>
      </ChatProvider>
    </AuthProvider>
  )
}

export default App
