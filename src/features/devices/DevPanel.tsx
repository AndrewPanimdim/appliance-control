import { useState } from 'react'
import type { FakeTransport } from '../../services/transport/FakeTransport.ts'

// Development-only controls for the fake transport: break things on purpose
// and watch how the app behaves.
export function DevPanel({ transport, deviceId }: { transport: FakeTransport; deviceId: string }) {
  const [deviceOnline, setDeviceOnline] = useState(true)
  const [linkUp, setLinkUp] = useState(true)
  const [ignore, setIgnore] = useState(false)

  return (
    <details className="dev">
      <summary>Dev panel (fake device)</summary>
      <div className="dev-row">
        <label>
          <input
            type="checkbox"
            checked={deviceOnline}
            onChange={(e) => {
              setDeviceOnline(e.target.checked)
              transport.setDeviceOnline(deviceId, e.target.checked)
            }}
          />
          Device online
        </label>
        <label>
          <input
            type="checkbox"
            checked={linkUp}
            onChange={(e) => {
              setLinkUp(e.target.checked)
              transport.setLink(e.target.checked)
            }}
          />
          App has internet
        </label>
        <label>
          <input
            type="checkbox"
            checked={ignore}
            onChange={(e) => {
              setIgnore(e.target.checked)
              transport.ignoreCommands = e.target.checked
            }}
          />
          Device ignores commands (causes a timeout)
        </label>
        <button type="button" onClick={() => transport.physicalToggle(deviceId)}>
          Press the physical button
        </button>
      </div>
    </details>
  )
}
