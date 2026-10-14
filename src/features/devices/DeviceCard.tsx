import type { CommandStatus } from '../../domain/command.ts'
import type { Device } from '../../domain/device.ts'
import { useDeviceStore } from '../../state/StoreProvider.tsx'
import { PowerButton } from './PowerButton.tsx'

function describe(status: CommandStatus | undefined): string | null {
  switch (status) {
    case 'pending':
      return 'Waiting for the device…'
    case 'timeout':
      return 'No response from the device. Its state is unchanged.'
    case 'failed':
      return 'The command failed.'
    default:
      return null
  }
}

function connectionLabel(device: Device): string {
  if (device.connection === 'online') return 'Online'
  if (device.connection === 'offline') return 'Offline'
  return 'Unknown'
}

export function DeviceCard({ deviceId }: { deviceId: string }) {
  const device = useDeviceStore((s) => s.devices[deviceId])
  const command = useDeviceStore((s) => s.lastCommand[deviceId])
  const requestPower = useDeviceStore((s) => s.requestPower)

  if (!device) return null

  const canControl = device.connection === 'online'
  const message = describe(command?.status)

  return (
    <article className="card">
      <header className="card-head">
        <h2>{device.name}</h2>
        <span className={`dot dot-${device.connection}`} aria-hidden="true" />
        <span className="muted">{connectionLabel(device)}</span>
      </header>

      <PowerButton
        power={device.power}
        disabled={!canControl}
        pending={command?.status === 'pending'}
        onToggle={(target) => void requestPower(deviceId, target)}
      />

      <p className={`note${command?.status === 'timeout' || command?.status === 'failed' ? ' note-error' : ''}`} role="status">
        {message ?? (canControl ? ' ' : 'Controls are disabled until the device is online.')}
      </p>
    </article>
  )
}
