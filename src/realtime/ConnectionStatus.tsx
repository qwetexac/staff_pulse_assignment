import type { ConnectionStatus as ConnectionStatusValue } from '@/realtime/types'
import { StatusDot, StatusRoot } from '@/realtime/ConnectionStatus.styles'

const STATUS_LABEL: Record<ConnectionStatusValue, string> = {
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
}

type ConnectionStatusProps = {
  status: ConnectionStatusValue
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  return (
    <StatusRoot $status={status} role="status" aria-live="polite">
      <StatusDot $status={status} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </StatusRoot>
  )
}
