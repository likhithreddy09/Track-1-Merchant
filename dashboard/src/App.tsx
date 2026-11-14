import { useEffect, useState } from 'react'
import { Landing } from './components/Landing'
import { Onboarding } from './components/Onboarding'
import { Dashboard } from './components/Dashboard'
import type { GeoPoint, PlaceInfo, ShopType } from './types'

type Screen = 'landing' | 'setup' | 'dashboard'

type Session = {
  location: GeoPoint
  place: PlaceInfo
  shopType: ShopType
  shopName: string
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [session, setSession] = useState<Session | null>(null)

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

  if (screen === 'landing') {
    return <Landing onGetStarted={() => setScreen('setup')} />
  }

  if (screen === 'setup' || !session) {
    return (
      <Onboarding
        onHome={() => setScreen('landing')}
        onStart={(payload) => {
          setSession(payload)
          setScreen('dashboard')
        }}
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
        onReset={() => {
          setSession(null)
          setScreen('setup')
        }}
      />
    </div>
  )
}
