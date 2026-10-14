// The contract shared by the app and the device firmware.
// Keep this file and the firmware in sync.

export const topics = {
  cmd: (id: string) => `devices/${id}/cmd`, // app -> device
  state: (id: string) => `devices/${id}/state`, // device -> app (retained)
  status: (id: string) => `devices/${id}/status`, // device -> app (Last Will)
}

export interface CmdMessage {
  id: string // command id, echoed back as ackId
  power: 'on' | 'off'
  ts: number // epoch ms; the device can ignore stale commands
}

export interface StateMessage {
  power: 'on' | 'off'
  ackId?: string // present when this state answers a command
  ts: number
}

// Incoming payloads are untrusted data: validate before using them.
export function parseStateMessage(raw: string): StateMessage | null {
  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return null
    const { power, ackId, ts } = data as Record<string, unknown>
    if (power !== 'on' && power !== 'off') return null
    if (typeof ts !== 'number') return null
    if (ackId !== undefined && typeof ackId !== 'string') return null
    return { power, ackId, ts }
  } catch {
    return null
  }
}
