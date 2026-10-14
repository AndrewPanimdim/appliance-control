import type { PowerState } from '../../domain/device.ts'

interface Props {
  power: PowerState
  disabled: boolean
  pending: boolean
  onToggle: (target: 'on' | 'off') => void
}

export function PowerButton({ power, disabled, pending, onToggle }: Props) {
  const label = pending ? '…' : power === 'on' ? 'ON' : power === 'off' ? 'OFF' : '?'
  const next = power === 'on' ? 'off' : 'on'

  return (
    <button
      type="button"
      className={`power power-${power}${pending ? ' power-pending' : ''}`}
      disabled={disabled || pending || power === 'unknown'}
      aria-pressed={power === 'on'}
      aria-label={`Turn ${next}`}
      onClick={() => onToggle(next)}
    >
      {label}
    </button>
  )
}
