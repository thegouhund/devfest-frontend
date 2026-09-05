import { useState } from 'react'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import ProfileSelect from './components/ProfileSelect'
import ElderlyShell from './components/ElderlyShell'
import { ChatProvider } from './context/ChatContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

function Routes() {
  const { status, logout, profile } = useAuth()
  const [wantsRegister, setWantsRegister] = useState(false)

  // Onboarding tetap tampil sampai selesai: akun sudah dibuat di langkah 1,
  // jadi status berubah ke 'ready' di tengah alur dan tidak boleh menendang
  // user ke Dashboard sebelum langkah profil & persetujuan rampung.
  if (wantsRegister) {
    return (
      <Onboarding
        onComplete={() => setWantsRegister(false)}
        onCancel={() => setWantsRegister(false)}
        onNavigateToLogin={() => setWantsRegister(false)}
      />
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-ink-500">
        Memuat sesi…
      </div>
    )
  }

  if (status === 'anonymous') {
    return <Login onNavigateToRegister={() => setWantsRegister(true)} />
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
