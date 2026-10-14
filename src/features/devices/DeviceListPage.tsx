import { useShallow } from 'zustand/react/shallow'
import { useDeviceStore } from '../../state/StoreProvider.tsx'
import { DeviceCard } from './DeviceCard.tsx'

export function DeviceListPage() {
  const ids = useDeviceStore(useShallow((s) => Object.keys(s.devices)))
  const linkUp = useDeviceStore((s) => s.linkUp)

  return (
    <>
      {!linkUp && (
        <div className="banner" role="alert">
          No connection. Device states are unknown and controls are disabled.
        </div>
      )}
      <section className="grid" aria-label="Devices">
        {ids.map((id) => (
          <DeviceCard key={id} deviceId={id} />
        ))}
      </section>
    </>
  )
}
