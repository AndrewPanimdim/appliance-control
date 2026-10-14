import type { Connection, PowerState } from '../../domain/device.ts'

export type Unsubscribe = () => void

// Everything above this line talks to the interface only, so the transport
// can be swapped (fake -> MQTT -> backend) without touching any screen.
export interface DeviceTransport {
  connect(): Promise<void>
  disconnect(): void

  sendPower(deviceId: string, target: 'on' | 'off', commandId: string): Promise<void>

  onState(handler: (deviceId: string, power: PowerState, ackId?: string) => void): Unsubscribe
  onConnection(handler: (deviceId: string, status: Connection) => void): Unsubscribe
  // The app's own link to the cloud (not a device's link).
  onLink(handler: (connected: boolean) => void): Unsubscribe
}
