import { useMemo } from 'react'
import type { OrgNode } from '@/api/types'
import { aggregateOrgTree } from '@/aggregation/aggregateOrgTree'
import { buildTableRows } from '@/table/tableModel'

/**
 * Rollups + table rows. Depends only on `nodes`, so sort, filter, selection,
 * and the tree/table toggle cannot re-run aggregation.
 */
export function useOrgTableRows(nodes: readonly OrgNode[]) {
  const rollups = useMemo(() => aggregateOrgTree(nodes), [nodes])
  return useMemo(() => buildTableRows(nodes, rollups), [nodes, rollups])
}
