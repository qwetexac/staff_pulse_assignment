import { useEffect, useRef } from 'react'
import type { TreeNode } from '@/tree/buildTree'
import { getPerformanceLevel } from '@/tree/performance'
import type { AppliedOrgNodePatch } from '@/realtime/types'
import {
  ChildList,
  CollapseInner,
  CollapseTrack,
  Headcount,
  NodeRow,
  NodeSelectButton,
  PerformanceDot,
  ToggleButton,
  TreeItem,
} from '@/tree/Tree.styles'

type TreeNodeItemProps = {
  node: TreeNode
  expandedIds: ReadonlySet<string>
  selectedId: string | null
  lastPatch: AppliedOrgNodePatch | null
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}

function ownMetricChanged(
  lastPatch: AppliedOrgNodePatch | null,
  nodeId: string,
  metric: 'headcount' | 'performance',
): boolean {
  if (lastPatch === null || lastPatch.nodeId !== nodeId) {
    return false
  }
  return lastPatch.previous[metric] !== lastPatch.next[metric]
}

export function TreeNodeItem({
  node,
  expandedIds,
  selectedId,
  lastPatch,
  onToggle,
  onSelect,
}: TreeNodeItemProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id
  const performanceLevel = getPerformanceLevel(node.performance)
  const rowRef = useRef<HTMLDivElement>(null)
  const flashHeadcount = ownMetricChanged(lastPatch, node.id, 'headcount')

  useEffect(() => {
    if (!isSelected) {
      return
    }
    rowRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [isSelected])

  return (
    <TreeItem>
      <NodeRow ref={rowRef} $selected={isSelected} aria-selected={isSelected}>
        <ToggleButton
          type="button"
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={
            hasChildren
              ? `${isExpanded ? 'Collapse' : 'Expand'} ${node.name}`
              : undefined
          }
          $hidden={!hasChildren}
          disabled={!hasChildren}
          onClick={() => {
            onToggle(node.id)
          }}
        >
          {hasChildren ? (isExpanded ? '−' : '+') : null}
        </ToggleButton>

        <PerformanceDot
          $level={performanceLevel}
          title={`Performance: ${node.performance}`}
          aria-label={`Performance ${node.performance} (${performanceLevel})`}
        />

        <NodeSelectButton
          type="button"
          onClick={() => {
            onSelect(node.id)
          }}
        >
          {node.name}
        </NodeSelectButton>

        <Headcount
          key={
            flashHeadcount
              ? `flash-${lastPatch?.revision ?? 'idle'}`
              : 'headcount'
          }
          $flashing={flashHeadcount}
        >
          {node.headcount} people
        </Headcount>
      </NodeRow>

      {hasChildren ? (
        <CollapseTrack
          $open={isExpanded}
          aria-hidden={!isExpanded}
          inert={!isExpanded}
        >
          <CollapseInner>
            <ChildList role="group">
              {node.children.map((child) => (
                <TreeNodeItem
                  key={child.id}
                  node={child}
                  expandedIds={expandedIds}
                  selectedId={selectedId}
                  lastPatch={lastPatch}
                  onToggle={onToggle}
                  onSelect={onSelect}
                />
              ))}
            </ChildList>
          </CollapseInner>
        </CollapseTrack>
      ) : null}
    </TreeItem>
  )
}
