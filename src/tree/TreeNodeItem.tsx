import { useEffect, useRef } from 'react'
import type { TreeNode } from '@/tree/buildTree'
import { getPerformanceLevel } from '@/tree/performance'
import {
  ChildList,
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
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}

export function TreeNodeItem({
  node,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
}: TreeNodeItemProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id
  const performanceLevel = getPerformanceLevel(node.performance)
  const rowRef = useRef<HTMLDivElement>(null)

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

        <Headcount>{node.headcount} people</Headcount>
      </NodeRow>

      {hasChildren && isExpanded ? (
        <ChildList role="group">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ChildList>
      ) : null}
    </TreeItem>
  )
}
