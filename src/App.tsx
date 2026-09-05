import { useState } from 'react'
import { Button, ButtonGroup, Chip } from '@heroui/react'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [activeView, setActiveView] = useState<'dashboard' | 'onboarding' | 'demo'>('dashboard')

  // Top navigation switch helper using HeroUI ButtonGroup
  const switcher = (
    <div className="fixed top-3 right-4 z-50 p-1 bg-white/85 backdrop-blur-md rounded-full border border-stone-200 shadow-sm">
      <ButtonGroup variant="secondary" className="gap-1">
        <Button
          size="sm"
          variant={activeView === 'dashboard' ? 'primary' : 'ghost'}
          onPress={() => setActiveView('dashboard')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
            activeView === 'dashboard'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Dashboard
        </Button>
        <Button
          size="sm"
          variant={activeView === 'onboarding' ? 'primary' : 'ghost'}
          onPress={() => setActiveView('onboarding')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
            activeView === 'onboarding'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Onboarding
        </Button>
        <Button
          size="sm"
          variant={activeView === 'demo' ? 'primary' : 'ghost'}
          onPress={() => setActiveView('demo')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition ${
            activeView === 'demo'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Vite Demo
        </Button>
      </ButtonGroup>
    </div>
  )

  if (activeView === 'dashboard') {
    return (
      <div className="relative min-h-screen bg-[#F6F4EE]">
        {switcher}
        <Dashboard />
      </div>
    )
  }

  if (activeView === 'onboarding') {
    return (
      <div className="relative min-h-screen bg-[#F6F4EE]">
        {switcher}
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
    <>
      {switcher}

      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2">
            <Chip color="accent">HeroUI v3</Chip>
            <Chip color="success">Tailwind CSS v4</Chip>
          </div>
          <h1>Get started with HeroUI</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button onPress={() => setCount((c) => c + 1)}>
            Count is {count}
          </Button>
          <ButtonGroup variant="secondary">
            <Button onPress={() => setCount(0)}>Reset</Button>
            <Button variant="outline" onPress={() => setCount((c) => c + 5)}>+5</Button>
          </ButtonGroup>
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://heroui.com/docs" target="_blank">
                HeroUI v3 Docs
              </a>
            </li>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
