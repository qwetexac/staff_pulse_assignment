import { useCallback, useMemo, useState } from 'react'
import type { OrgNode } from '@/api/types'
import { buildTree, getDefaultExpandedIds } from '@/tree/buildTree'
import { TreeNodeItem } from '@/tree/TreeNodeItem'
import { TreeList } from '@/tree/Tree.styles'

type OrgTreeViewProps = {
  nodes: readonly OrgNode[]
}

export function OrgTreeView({ nodes }: OrgTreeViewProps) {
  const roots = useMemo(() => buildTree(nodes), [nodes])
  const rootSignature = roots.map((root) => root.id).join('|')

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => getDefaultExpandedIds(roots),
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [seededFor, setSeededFor] = useState(rootSignature)

  // Adjust expanded defaults when the dataset's root ids change (new fetch),
  // without resetting on referential SWR updates of the same tree.
  if (seededFor !== rootSignature) {
    setSeededFor(rootSignature)
    setExpandedIds(getDefaultExpandedIds(roots))
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

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
  }, [])

  return (
    <TreeList role="tree" aria-label="Organization tree">
      {roots.map((root) => (
        <TreeNodeItem
          key={root.id}
          node={root}
          expandedIds={expandedIds}
          selectedId={selectedId}
          onToggle={handleToggle}
          onSelect={handleSelect}
        />
      ))}
    </TreeList>
  )
}
