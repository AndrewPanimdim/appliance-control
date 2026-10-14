import { describe, expect, it } from 'vitest'
import { parseStateMessage, topics } from './protocol.ts'

describe('protocol', () => {
  it('builds topics from a device id', () => {
    expect(topics.cmd('plug-001')).toBe('devices/plug-001/cmd')
    expect(topics.state('plug-001')).toBe('devices/plug-001/state')
    expect(topics.status('plug-001')).toBe('devices/plug-001/status')
  })

  it('accepts a valid state message', () => {
    expect(parseStateMessage('{"power":"on","ackId":"x","ts":1}')).toEqual({
      power: 'on',
      ackId: 'x',
      ts: 1,
    })
  })

  it.each([
    ['not json', 'hello'],
    ['wrong power value', '{"power":"maybe","ts":1}'],
    ['missing ts', '{"power":"on"}'],
    ['bad ackId type', '{"power":"on","ts":1,"ackId":5}'],
    ['not an object', '42'],
    ['null', 'null'],
  ])('rejects %s', (_label, raw) => {
    expect(parseStateMessage(raw)).toBeNull()
  })
})
