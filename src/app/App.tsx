import { useAuth } from '../features/auth/AuthProvider.tsx'
import { LoginPage } from '../features/auth/LoginPage.tsx'
import { DeviceListPage } from '../features/devices/DeviceListPage.tsx'
import { DevPanel } from '../features/devices/DevPanel.tsx'
import type { FakeTransport } from '../services/transport/FakeTransport.ts'
import { supabase } from '../services/supabase.ts'

export function App({ fake }: { fake: FakeTransport }) {
  const { session, loading } = useAuth()

  if (loading) return <p className="app muted">Loading…</p>
  if (!session) return <LoginPage />

  return (
    <main className="app">
      <div className="topbar">
        <h1>Appliance Remote</h1>
        <span className="muted">{session.user.email}</span>
        <button type="button" className="link" onClick={() => void supabase.auth.signOut()}>
          Sign out
        </button>
      </div>
      <DeviceListPage />
      <DevPanel transport={fake} deviceId="plug-001" />
    </main>
  )
}
