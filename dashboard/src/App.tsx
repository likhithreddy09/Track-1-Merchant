import { useEffect, useState } from 'react'
import { Landing } from './components/Landing'
import { Onboarding } from './components/Onboarding'
import { Dashboard } from './components/Dashboard'
import { clearSession, loadSession, saveSession, type MerchantSession } from './lib/session'

type Screen = 'landing' | 'setup' | 'dashboard'

function initialState(): { screen: Screen; session: MerchantSession | null } {
  const saved = typeof window !== 'undefined' ? loadSession() : null
  if (saved) return { screen: 'dashboard', session: saved }
  return { screen: 'landing', session: null }
}

export default function App() {
  const boot = initialState()
  const [screen, setScreen] = useState<Screen>(boot.screen)
  const [session, setSession] = useState<MerchantSession | null>(boot.session)

  useEffect(() => {
    const area = session?.place.neighbourhood || 'Neighbourhood'
    const titles: Record<Screen, string> = {
      landing: 'Paytm Neighbourhood — Merchant AI',
      setup: 'Setup · Neighbourhood Merchant AI',
      dashboard: session
        ? `${session.shopName} · ${session.shopType.label} · ${area}`
        : 'Dashboard · Paytm Neighbourhood',
    }
    document.title = titles[screen]
  }, [screen, session])

  function startSession(payload: MerchantSession) {
    saveSession(payload)
    setSession(payload)
    setScreen('dashboard')
  }

  function resetToSetup() {
    clearSession()
    setSession(null)
    setScreen('setup')
  }

  if (screen === 'landing') {
    return <Landing onGetStarted={() => setScreen('setup')} />
  }

  if (screen === 'setup' || !session) {
    return (
      <Onboarding
        onHome={() => {
          clearSession()
          setSession(null)
          setScreen('landing')
        }}
        onStart={startSession}
      />
    )
  }

  return (
    <div className="app-shell">
      <Dashboard
        location={session.location}
        place={session.place}
        shopType={session.shopType}
        shopName={session.shopName}
        onReset={resetToSetup}
      />
    </div>
  )
}
