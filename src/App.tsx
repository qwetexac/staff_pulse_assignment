import type { ReactNode } from 'react'
import { useOrgTree } from '@/api/useOrgTree'
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
import { OrgTreeView } from '@/tree'

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

export default function App() {
  const { data, error, isLoading } = useOrgTree()

  let content: ReactNode

  if (isLoading) {
    content = <LoadingState />
  } else if (error) {
    content = <ErrorState message={error.message} />
  } else if (data !== undefined && data.length === 0) {
    content = <EmptyState />
  } else if (data !== undefined) {
    content = <OrgTreeView nodes={data} />
  } else {
    content = <LoadingState />
  }

  return (
    <AppShell>
      <Header>
        <Title>Staff Pulse</Title>
        <Subtitle>
          Organization structure — divisions, departments, and teams
        </Subtitle>
      </Header>
      <Panel>{content}</Panel>
    </AppShell>
  )
}
