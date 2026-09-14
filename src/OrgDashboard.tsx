import { useState } from 'react'
import type { OrgNode } from '@/api/types'
import type { AppliedOrgNodePatch } from '@/realtime/types'
import { useOrgTableRows } from '@/aggregation/useOrgTableRows'
import { OrgTable } from '@/table'
import { OrgTreeView } from '@/tree'
import {
  DashboardRoot,
  Hint,
  Pane,
  PaneTitle,
  Split,
  Toolbar,
  TreeScroll,
  ViewToggle,
  ViewToggleButton,
} from '@/OrgDashboard.styles'

type OrgDashboardProps = {
  nodes: readonly OrgNode[]
  dataRevision: number
  lastPatch: AppliedOrgNodePatch | null
}

type NarrowView = 'tree' | 'table'

export function OrgDashboard({
  nodes,
  dataRevision,
  lastPatch,
}: OrgDashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [narrowView, setNarrowView] = useState<NarrowView>('tree')
  const { rows, flashes } = useOrgTableRows(nodes, lastPatch)

  return (
    <DashboardRoot>
      <Toolbar>
        <ViewToggle role="group" aria-label="Switch between tree and table">
          <ViewToggleButton
            type="button"
            $active={narrowView === 'tree'}
            aria-pressed={narrowView === 'tree'}
            onClick={() => {
              setNarrowView('tree')
            }}
          >
            Tree
          </ViewToggleButton>
          <ViewToggleButton
            type="button"
            $active={narrowView === 'table'}
            aria-pressed={narrowView === 'table'}
            onClick={() => {
              setNarrowView('table')
            }}
          >
            Table
          </ViewToggleButton>
        </ViewToggle>
        <Hint>Switch views, or widen the window to see both.</Hint>
      </Toolbar>

      <Split>
        <Pane $visibleOnNarrow={narrowView === 'tree'} aria-label="Tree view">
          <PaneTitle>Organization tree</PaneTitle>
          <TreeScroll>
            <OrgTreeView
              nodes={nodes}
              dataRevision={dataRevision}
              selectedId={selectedId}
              lastPatch={lastPatch}
              onSelect={setSelectedId}
            />
          </TreeScroll>
        </Pane>
        <Pane $visibleOnNarrow={narrowView === 'table'} aria-label="Table view">
          <PaneTitle>Analytical table</PaneTitle>
          <OrgTable
            rows={rows}
            flashes={flashes}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Pane>
      </Split>
    </DashboardRoot>
  )
}
