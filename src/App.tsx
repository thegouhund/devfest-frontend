import { useState } from 'react'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import { ChatProvider } from './context/ChatContext'
import './App.css'
function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'onboarding'>('dashboard')

  return (
    <ChatProvider>
      <div className="min-h-screen bg-[#F0EEE6]">
        {activeView === 'onboarding' ? (
          <Onboarding
            onComplete={(data) => {
              console.log('Onboarding complete:', data)
              setActiveView('dashboard')
            }}
          />
        ) : (
          <Dashboard />
        )}
      </div>
    </ChatProvider>
  )
}

export default App
