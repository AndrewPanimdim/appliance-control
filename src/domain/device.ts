// 'unknown' is a real value: before the first message arrives, or after the
// connection drops, the honest answer is "I don't know", not "off".
export type PowerState = 'on' | 'off' | 'unknown'
export type Connection = 'online' | 'offline' | 'unknown'

export interface Device {
  id: string // e.g. 'plug-001'
  name: string // e.g. 'Desk lamp'
  power: PowerState // last state CONFIRMED by the device
  connection: Connection
  lastSeen?: number // epoch ms of the last message from the device
}
