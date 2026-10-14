import type { Connection, PowerState } from '../../domain/device.ts'
import type { DeviceTransport, Unsubscribe } from './DeviceTransport.ts'

export interface FakeDeviceSpec {
  id: string
  power?: 'on' | 'off'
  online?: boolean
}

interface FakeDevice {
  power: 'on' | 'off'
  online: boolean
}

type StateHandler = (deviceId: string, power: PowerState, ackId?: string) => void
type ConnectionHandler = (deviceId: string, status: Connection) => void
type LinkHandler = (connected: boolean) => void

// An in-memory pretend device fleet. Lets you build and test the whole app
// with no hardware, and simulate the failures that matter.
export class FakeTransport implements DeviceTransport {
  latencyMs = 600
  // When true, devices silently ignore commands (no relay change, no ack).
  ignoreCommands = false

  private devices = new Map<string, FakeDevice>()
  private connected = false
  private stateHandlers = new Set<StateHandler>()
  private connectionHandlers = new Set<ConnectionHandler>()
  private linkHandlers = new Set<LinkHandler>()

  constructor(specs: FakeDeviceSpec[]) {
    for (const spec of specs) {
      this.devices.set(spec.id, {
        power: spec.power ?? 'off',
        online: spec.online ?? true,
      })
    }
  }

  async connect(): Promise<void> {
    this.connected = true
    this.linkHandlers.forEach((h) => h(true))
    // Like retained MQTT messages: a fresh subscriber immediately learns
    // each device's connection and last state.
    for (const [id, dev] of this.devices) {
      this.connectionHandlers.forEach((h) => h(id, dev.online ? 'online' : 'offline'))
      if (dev.online) this.stateHandlers.forEach((h) => h(id, dev.power))
    }
  }

  disconnect(): void {
    this.connected = false
    this.linkHandlers.forEach((h) => h(false))
  }

  async sendPower(deviceId: string, target: 'on' | 'off', commandId: string): Promise<void> {
    if (!this.connected) throw new Error('Not connected')
    const dev = this.devices.get(deviceId)
    // Like real MQTT: publishing to a dead device succeeds, nobody answers.
    if (!dev || !dev.online || this.ignoreCommands) return

    setTimeout(() => {
      if (!dev.online || !this.connected) return
      dev.power = target
      this.stateHandlers.forEach((h) => h(deviceId, target, commandId))
    }, this.latencyMs)
  }

  onState(handler: StateHandler): Unsubscribe {
    this.stateHandlers.add(handler)
    return () => this.stateHandlers.delete(handler)
  }

  onConnection(handler: ConnectionHandler): Unsubscribe {
    this.connectionHandlers.add(handler)
    return () => this.connectionHandlers.delete(handler)
  }

  onLink(handler: LinkHandler): Unsubscribe {
    this.linkHandlers.add(handler)
    return () => this.linkHandlers.delete(handler)
  }

  // ---- Simulation helpers (used by the dev panel and tests) ----

  setDeviceOnline(deviceId: string, online: boolean): void {
    const dev = this.devices.get(deviceId)
    if (!dev) return
    dev.online = online
    this.connectionHandlers.forEach((h) => h(deviceId, online ? 'online' : 'offline'))
    if (online) this.stateHandlers.forEach((h) => h(deviceId, dev.power))
  }

  // Someone pressed the physical button: state changes with no command.
  physicalToggle(deviceId: string): void {
    const dev = this.devices.get(deviceId)
    if (!dev || !dev.online) return
    dev.power = dev.power === 'on' ? 'off' : 'on'
    this.stateHandlers.forEach((h) => h(deviceId, dev.power))
  }

  // The app loses (or regains) its own internet connection.
  setLink(connected: boolean): void {
    if (connected) void this.connect()
    else this.disconnect()
  }
}
