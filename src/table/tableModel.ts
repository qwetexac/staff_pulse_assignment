import type { OrgNode } from '@/api/types'
import type { NodeRollup } from '@/aggregation'

export type OrgTableRow = {
  id: string
  name: string
  depth: number
  levelLabel: string
  totalHeadcount: number
  totalBudget: number
  averagePerformance: number
}

export type SortColumn =
  | 'name'
  | 'level'
  | 'headcount'
  | 'budget'
  | 'performance'

export type SortDirection = 'asc' | 'desc'

export type SortState = {
  column: SortColumn
  direction: SortDirection
}

export const TABLE_COLUMNS: ReadonlyArray<{
  column: SortColumn
  label: string
  numeric: boolean
}> = [
  { column: 'name', label: 'Division/Unit', numeric: false },
  { column: 'level', label: 'Level', numeric: false },
  { column: 'headcount', label: 'Total Headcount', numeric: true },
  { column: 'budget', label: 'Total Budget', numeric: true },
  { column: 'performance', label: 'Average Performance', numeric: true },
]

const LEVEL_LABELS = ['Division', 'Department', 'Team'] as const

export function getLevelLabel(depth: number): string {
  return LEVEL_LABELS[depth] ?? `Level ${depth}`
}

export function getNodeDepths(
  nodes: ReadonlyArray<Pick<OrgNode, 'id' | 'parentId'>>,
): Map<string, number> {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const depths = new Map<string, number>()

  const depthOf = (id: string): number => {
    const cached = depths.get(id)
    if (cached !== undefined) {
      return cached
    }

    const node = byId.get(id)
    if (!node || node.parentId === null || !byId.has(node.parentId)) {
      depths.set(id, 0)
      return 0
    }

    const depth = depthOf(node.parentId) + 1
    depths.set(id, depth)
    return depth
  }

  for (const node of nodes) {
    depthOf(node.id)
  }

  return depths
}

export function buildTableRows(
  nodes: readonly OrgNode[],
  rollups: ReadonlyMap<string, NodeRollup>,
): OrgTableRow[] {
  const depths = getNodeDepths(nodes)

  return nodes.map((node) => {
    const depth = depths.get(node.id) ?? 0
    const rollup = rollups.get(node.id)

    return {
      id: node.id,
      name: node.name,
      depth,
      levelLabel: getLevelLabel(depth),
      totalHeadcount: rollup?.totalHeadcount ?? node.headcount,
      totalBudget: rollup?.totalBudget ?? node.budget,
      averagePerformance: rollup?.averagePerformance ?? node.performance,
    }
  })
}
