import { createStore, type StoreApi } from 'zustand/vanilla'
import type { CommandStatus, PowerCommand } from '../domain/command.ts'
import type { Device, PowerState } from '../domain/device.ts'
import type { DeviceTransport } from '../services/transport/DeviceTransport.ts'

export interface DeviceStoreState {
  devices: Record<string, Device>
  lastCommand: Record<string, PowerCommand> // latest command per device
  linkUp: boolean // the app's own connection to the cloud
  requestPower: (deviceId: string, target: 'on' | 'off') => Promise<void>
}

export type DeviceStore = StoreApi<DeviceStoreState>

export interface DeviceController {
  store: DeviceStore
  start: () => Promise<void>
  stop: () => void
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createDeviceStore(
  transport: DeviceTransport,
  seed: Device[],
  options: { timeoutMs?: number } = {},
): DeviceController {
  const timeoutMs = options.timeoutMs ?? 5000
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  let unsubscribers: Array<() => void> = []

  const store: DeviceStore = createStore<DeviceStoreState>()(() => ({
    devices: Object.fromEntries(seed.map((d) => [d.id, d])),
    lastCommand: {},
    linkUp: false,
    requestPower,
  }))

  // ---- helpers (all go through the store, so there is one source of truth) ----

  function patchDevice(deviceId: string, patch: Partial<Device>): void {
    store.setState((s) => {
      const device = s.devices[deviceId]
      if (!device) return s
      return { devices: { ...s.devices, [deviceId]: { ...device, ...patch } } }
    })
  }

  // Move a pending command to its final status. Does nothing if it was
  // already settled or has been replaced by a newer command.
  function settle(deviceId: string, commandId: string, status: CommandStatus): void {
    const cmd = store.getState().lastCommand[deviceId]
    if (!cmd || cmd.id !== commandId || cmd.status !== 'pending') return

    const timer = timers.get(commandId)
    if (timer) clearTimeout(timer)
    timers.delete(commandId)

    store.setState((s) => ({
      lastCommand: { ...s.lastCommand, [deviceId]: { ...cmd, status } },
    }))
  }

  function settlePending(deviceId: string, status: CommandStatus): void {
    const cmd = store.getState().lastCommand[deviceId]
    if (cmd?.status === 'pending') settle(deviceId, cmd.id, status)
  }

  async function requestPower(deviceId: string, target: 'on' | 'off'): Promise<void> {
    const { devices, lastCommand, linkUp } = store.getState()
    const device = devices[deviceId]

    // Don't allow commands that cannot land.
    if (!device || !linkUp || device.connection !== 'online') return
    if (lastCommand[deviceId]?.status === 'pending') return

    const cmd: PowerCommand = {
      id: newId(),
      deviceId,
      target,
      status: 'pending',
      sentAt: Date.now(),
    }
    store.setState((s) => ({ lastCommand: { ...s.lastCommand, [deviceId]: cmd } }))

    // No confirmation in time => timeout. Never pretend it worked.
    timers.set(
      cmd.id,
      setTimeout(() => settle(deviceId, cmd.id, 'timeout'), timeoutMs),
    )

    try {
      await transport.sendPower(deviceId, target, cmd.id)
    } catch {
      settle(deviceId, cmd.id, 'failed')
    }
  }

  // ---- reacting to the outside world ----

  function onState(deviceId: string, power: PowerState, ackId?: string): void {
    patchDevice(deviceId, { power, lastSeen: Date.now() })
    const cmd = store.getState().lastCommand[deviceId]
    if (ackId && cmd && cmd.id === ackId) {
      // Confirmed only if the device really reached the state we asked for.
      settle(deviceId, cmd.id, power === cmd.target ? 'confirmed' : 'failed')
    }
  }

  function onConnection(deviceId: string, status: Device['connection']): void {
    patchDevice(deviceId, { connection: status })
    if (status === 'offline') {
      patchDevice(deviceId, { power: 'unknown' })
      settlePending(deviceId, 'failed')
    }
  }

  function onLink(connected: boolean): void {
    if (connected) {
      store.setState({ linkUp: true })
      return
    }
    // Without a link we can't know anything about the devices.
    for (const deviceId of Object.keys(store.getState().devices)) {
      settlePending(deviceId, 'failed')
    }
    store.setState((s) => ({
      linkUp: false,
      devices: Object.fromEntries(
        Object.entries(s.devices).map(([id, d]) => [
          id,
          { ...d, power: 'unknown' as const, connection: 'unknown' as const },
        ]),
      ),
    }))
  }

  function stop(): void {
    unsubscribers.forEach((unsubscribe) => unsubscribe())
    unsubscribers = []
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
  }

  async function start(): Promise<void> {
    stop()
    unsubscribers = [
      transport.onLink(onLink),
      transport.onConnection(onConnection),
      transport.onState(onState),
    ]
    await transport.connect()
  }

  return { store, start, stop }
}
