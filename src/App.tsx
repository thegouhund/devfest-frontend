import { useState } from 'react'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'onboarding'>('dashboard')

  if (activeView === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#F0EEE6]">
        <Onboarding
          onComplete={(data) => {
            console.log('Onboarding complete:', data)
            setActiveView('dashboard')
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0EEE6]">
      <Dashboard />
    </div>
  )
}

export default App
