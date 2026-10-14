import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useStore } from 'zustand'
import type { DeviceController, DeviceStoreState } from './deviceStore.ts'

const ControllerContext = createContext<DeviceController | null>(null)

export function StoreProvider({
  controller,
  children,
}: {
  controller: DeviceController
  children: ReactNode
}) {
  // Connect when the app mounts, disconnect when it unmounts.
  useEffect(() => {
    void controller.start()
    return () => controller.stop()
  }, [controller])

  return <ControllerContext.Provider value={controller}>{children}</ControllerContext.Provider>
}

export function useDeviceStore<T>(selector: (state: DeviceStoreState) => T): T {
  const controller = useContext(ControllerContext)
  if (!controller) throw new Error('useDeviceStore must be used inside <StoreProvider>')
  return useStore(controller.store, selector)
}
