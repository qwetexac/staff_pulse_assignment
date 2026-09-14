import type { ReactNode } from 'react'
import { useOrgTree } from '@/api/useOrgTree'
import { OrgDashboard } from '@/OrgDashboard'
import {
  AppShell,
  Header,
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

function AppHeader() {
  return (
    <Header>
      <Title>Staff Pulse</Title>
      <Subtitle>
        Organization structure — divisions, departments, and teams
      </Subtitle>
    </Header>
  )
}

export default function App() {
  const { data, error, isLoading } = useOrgTree()

  if (!isLoading && error === null && data !== undefined && data.length > 0) {
    return (
      <AppShell>
        <AppHeader />
        <OrgDashboard nodes={data} />
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
      <AppHeader />
      <Panel>{content}</Panel>
    </AppShell>
  )
}
