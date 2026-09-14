import type { ReactNode } from 'react'
import { useOrgTree } from '@/api/useOrgTree'
import { OrgDashboard } from '@/OrgDashboard'
import { ConnectionStatus, useOrgTreeStream } from '@/realtime'
import type { ConnectionStatus as ConnectionStatusValue } from '@/realtime/types'
import { CACHE_STALE_TIME_MS } from '@/shared/constants'
import {
  AppShell,
  Header,
  HeaderCopy,
  Panel,
  StatusBody,
  StatusMessage,
  StatusTitle,
  Subtitle,
  Title,
} from '@/shared/ui'

function LoadingState() {
  return (
    <StatusMessage role="status" aria-live="polite">
      <StatusTitle>Loading organization</StatusTitle>
      <StatusBody>Fetching the latest org tree…</StatusBody>
    </StatusMessage>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <StatusMessage $tone="danger" role="alert">
      <StatusTitle>Could not load org tree</StatusTitle>
      <StatusBody>{message}</StatusBody>
    </StatusMessage>
  )
}

function EmptyState() {
  return (
    <StatusMessage role="status">
      <StatusTitle>No organization data</StatusTitle>
      <StatusBody>
        The API returned an empty tree. Try again once nodes are available.
      </StatusBody>
    </StatusMessage>
  )
}

function AppHeader({ status }: { status: ConnectionStatusValue }) {
  return (
    <Header>
      <HeaderCopy>
        <Title>Staff Pulse</Title>
        <Subtitle>
          Organization structure — divisions, departments, and teams
        </Subtitle>
      </HeaderCopy>
      <ConnectionStatus status={status} />
    </Header>
  )
}

export default function App() {
  const live = useOrgTreeStream()
  const staleTime =
    live.status === 'connected'
      ? Number.POSITIVE_INFINITY
      : CACHE_STALE_TIME_MS
  const { data, error, isLoading, revision } = useOrgTree({ staleTime })

  if (!isLoading && error === null && data !== undefined && data.length > 0) {
    return (
      <AppShell>
        <AppHeader status={live.status} />
        <OrgDashboard
          nodes={data}
          dataRevision={revision}
          lastPatch={live.lastPatch}
        />
      </AppShell>
    )
  }

  let content: ReactNode

  if (isLoading || (data === undefined && error === null)) {
    content = <LoadingState />
  } else if (error) {
    content = <ErrorState message={error.message} />
  } else {
    content = <EmptyState />
  }

  return (
    <AppShell>
      <AppHeader status={live.status} />
      <Panel>{content}</Panel>
    </AppShell>
  )
}
