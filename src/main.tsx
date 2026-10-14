import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import { App } from './app/App.tsx'
import type { Device } from './domain/device.ts'
import { AuthProvider } from './features/auth/AuthProvider.tsx'
import { FakeTransport } from './services/transport/FakeTransport.ts'
import { createDeviceStore } from './state/deviceStore.ts'
import { StoreProvider } from './state/StoreProvider.tsx'

// Phase 1: a fake transport, so the whole app works with no hardware.
// Later this line becomes `new MqttTransport(...)`; nothing else changes.
const fake = new FakeTransport([
  { id: 'plug-001', power: 'off', online: true },
  { id: 'plug-002', power: 'on', online: true },
  { id: 'plug-003', power: 'off', online: false },
])

const seed: Device[] = [
  { id: 'plug-001', name: 'Desk lamp', power: 'unknown', connection: 'unknown' },
  { id: 'plug-002', name: 'Fan', power: 'unknown', connection: 'unknown' },
  { id: 'plug-003', name: 'Garage heater', power: 'unknown', connection: 'unknown' },
]

const controller = createDeviceStore(fake, seed)

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element in index.html')

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <StoreProvider controller={controller}>
        <App fake={fake} />
      </StoreProvider>
    </AuthProvider>
  </StrictMode>,
)
