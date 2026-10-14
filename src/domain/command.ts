export type CommandStatus = 'pending' | 'confirmed' | 'failed' | 'timeout'

export interface PowerCommand {
  id: string // unique per attempt; the device echoes it back as ackId
  deviceId: string
  target: 'on' | 'off'
  status: CommandStatus
  sentAt: number // epoch ms
}
