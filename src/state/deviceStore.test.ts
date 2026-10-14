import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Device } from '../domain/device.ts'
import { FakeTransport } from '../services/transport/FakeTransport.ts'
import { createDeviceStore } from './deviceStore.ts'

const seed: Device[] = [
  { id: 'a', name: 'Lamp', power: 'unknown', connection: 'unknown' },
  { id: 'b', name: 'Heater', power: 'unknown', connection: 'unknown' },
]

function setup() {
  const fake = new FakeTransport([
    { id: 'a', power: 'off', online: true },
    { id: 'b', power: 'on', online: false },
  ])
  fake.latencyMs = 100
  const controller = createDeviceStore(fake, seed, { timeoutMs: 1000 })
  return { fake, controller, state: () => controller.store.getState() }
}

describe('device store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts as unknown, then learns state from retained messages', async () => {
    const { controller, state } = setup()
    expect(state().devices.a?.power).toBe('unknown')
    expect(state().linkUp).toBe(false)

    await controller.start()

    expect(state().linkUp).toBe(true)
    expect(state().devices.a).toMatchObject({ power: 'off', connection: 'online' })
    expect(state().devices.b).toMatchObject({ power: 'unknown', connection: 'offline' })
  })

  it('goes pending, then confirmed only when the device acknowledges', async () => {
    const { controller, state } = setup()
    await controller.start()

    const done = state().requestPower('a', 'on')
    expect(state().lastCommand.a?.status).toBe('pending')
    expect(state().devices.a?.power).toBe('off') // not changed yet

    await vi.advanceTimersByTimeAsync(100)
    await done

    expect(state().lastCommand.a?.status).toBe('confirmed')
    expect(state().devices.a?.power).toBe('on')
  })

  it('times out when the device never answers, and keeps the old state', async () => {
    const { fake, controller, state } = setup()
    await controller.start()
    fake.ignoreCommands = true

    void state().requestPower('a', 'on')
    await vi.advanceTimersByTimeAsync(1000)

    expect(state().lastCommand.a?.status).toBe('timeout')
    expect(state().devices.a?.power).toBe('off')
  })

  it('refuses commands for an offline device', async () => {
    const { controller, state } = setup()
    await controller.start()

    await state().requestPower('b', 'on')

    expect(state().lastCommand.b).toBeUndefined()
  })

  it('ignores a second command while one is pending', async () => {
    const { controller, state } = setup()
    await controller.start()

    void state().requestPower('a', 'on')
    const firstId = state().lastCommand.a?.id
    await state().requestPower('a', 'off')

    expect(state().lastCommand.a?.id).toBe(firstId)
    expect(state().lastCommand.a?.target).toBe('on')
  })

  it('fails a pending command if the device drops offline', async () => {
    const { fake, controller, state } = setup()
    await controller.start()

    void state().requestPower('a', 'on')
    fake.setDeviceOnline('a', false)

    expect(state().lastCommand.a?.status).toBe('failed')
    expect(state().devices.a).toMatchObject({ power: 'unknown', connection: 'offline' })
  })

  it('marks everything unknown and fails pending commands when the app loses its link', async () => {
    const { fake, controller, state } = setup()
    await controller.start()

    void state().requestPower('a', 'on')
    fake.setLink(false)

    expect(state().linkUp).toBe(false)
    expect(state().lastCommand.a?.status).toBe('failed')
    expect(state().devices.a).toMatchObject({ power: 'unknown', connection: 'unknown' })
  })

  it('recovers state after the link comes back', async () => {
    const { fake, controller, state } = setup()
    await controller.start()
    fake.setLink(false)
    fake.setLink(true)

    expect(state().linkUp).toBe(true)
    expect(state().devices.a).toMatchObject({ power: 'off', connection: 'online' })
  })

  it('follows a physical button press without any command', async () => {
    const { fake, controller, state } = setup()
    await controller.start()

    fake.physicalToggle('a')

    expect(state().devices.a?.power).toBe('on')
    expect(state().lastCommand.a).toBeUndefined()
  })
})
