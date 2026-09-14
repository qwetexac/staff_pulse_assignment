import { useCallback, useMemo, useState } from 'react'
import type { OrgNode } from '@/api/types'
import type { AppliedOrgNodePatch } from '@/realtime/types'
import { buildTree, getDefaultExpandedIds } from '@/tree/buildTree'
import { TreeNodeItem } from '@/tree/TreeNodeItem'
import { TreeList } from '@/tree/Tree.styles'

type OrgTreeViewProps = {
  nodes: readonly OrgNode[]
  dataRevision: number
  selectedId: string | null
  lastPatch: AppliedOrgNodePatch | null
  onSelect: (id: string) => void
}

function getAncestorIds(
  nodes: readonly OrgNode[],
  nodeId: string,
): string[] {
  const byId = new Map<string, OrgNode>()
  for (const node of nodes) {
    byId.set(node.id, node)
  }

  const ancestors: string[] = []
  const seen = new Set<string>()
  let current = byId.get(nodeId)

  while (current?.parentId) {
    if (seen.has(current.parentId)) {
      break
    }
    seen.add(current.parentId)
    const parent = byId.get(current.parentId)
    if (!parent) {
      break
    }
    ancestors.push(parent.id)
    current = parent
  }

  return ancestors
}

export function OrgTreeView({
  nodes,
  dataRevision,
  selectedId,
  lastPatch,
  onSelect,
}: OrgTreeViewProps) {
  const roots = useMemo(() => {
    void dataRevision
    return buildTree(nodes)
  }, [nodes, dataRevision])
  const rootSignature = roots.map((root) => root.id).join('|')

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => getDefaultExpandedIds(roots),
  )
  const [seededFor, setSeededFor] = useState(rootSignature)
  const [revealedId, setRevealedId] = useState<string | null>(null)

  // Adjust expanded defaults when the dataset's root ids change (new fetch),
  // without resetting on referential SWR updates of the same tree.
  if (seededFor !== rootSignature) {
    setSeededFor(rootSignature)
    setExpandedIds(getDefaultExpandedIds(roots))
  }

  // Reveal a node selected from the table by expanding its ancestors.
  if (selectedId !== null && selectedId !== revealedId) {
    setRevealedId(selectedId)
    const ancestorIds = getAncestorIds(nodes, selectedId)
    if (ancestorIds.length > 0) {
      setExpandedIds((current) => {
        let changed = false
        const next = new Set(current)
        for (const id of ancestorIds) {
          if (!next.has(id)) {
            next.add(id)
            changed = true
          }
        }
        return changed ? next : current
      })
    }
  }

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  return (
    <TreeList role="tree" aria-label="Organization tree">
      {roots.map((root) => (
        <TreeNodeItem
          key={root.id}
          node={root}
          expandedIds={expandedIds}
          selectedId={selectedId}
          lastPatch={lastPatch}
          onToggle={handleToggle}
          onSelect={onSelect}
        />
      ))}
    </TreeList>
  )
}
