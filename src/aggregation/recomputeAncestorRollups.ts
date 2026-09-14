import type { OrgNode } from '@/api/types'
import {
  groupChildrenByParentId,
  rollupFromSelfAndChildren,
  type NodeRollup,
} from '@/aggregation/aggregateOrgTree'

export type RollupMetric = 'headcount' | 'budget' | 'performance'

export function cellFlashKey(nodeId: string, metric: RollupMetric): string {
  return `${nodeId}:${metric}`
}

export type AncestorRollupUpdate = {
  rollups: Map<string, NodeRollup>
  changedMetricsById: Map<string, Set<RollupMetric>>
}

function diffRollupMetrics(
  previous: NodeRollup | undefined,
  next: NodeRollup,
): Set<RollupMetric> {
  const changed = new Set<RollupMetric>()
  if (previous === undefined || previous.totalHeadcount !== next.totalHeadcount) {
    changed.add('headcount')
  }
  if (previous === undefined || previous.totalBudget !== next.totalBudget) {
    changed.add('budget')
  }
  if (
    previous === undefined ||
    previous.averagePerformance !== next.averagePerformance
  ) {
    changed.add('performance')
  }
  return changed
}

/**
 * Recomputes rollups for `changedNodeId` and each ancestor (`parentId` chain).
 * Child/sibling rollups are reused from `previous` — no descendant walk.
 * Returns a new Map; entries that are not on the chain keep the same objects.
 */
export function recomputeAncestorRollups(
  nodes: readonly OrgNode[],
  previous: ReadonlyMap<string, NodeRollup>,
  changedNodeId: string,
): AncestorRollupUpdate {
  const rollups = new Map(previous)
  const changedMetricsById = new Map<string, Set<RollupMetric>>()

  const byId = new Map<string, OrgNode>()
  for (const node of nodes) {
    byId.set(node.id, node)
  }

  if (!byId.has(changedNodeId)) {
    return { rollups, changedMetricsById }
  }

  const childrenByParentId = groupChildrenByParentId(nodes)
  const seen = new Set<string>()
  let currentId: string | null = changedNodeId

  while (currentId !== null) {
    if (seen.has(currentId)) {
      break
    }
    seen.add(currentId)

    const node = byId.get(currentId)
    if (!node) {
      break
    }

    const children = childrenByParentId.get(currentId) ?? []
    const childRollups: NodeRollup[] = []
    for (const child of children) {
      const childRollup = rollups.get(child.id)
      if (childRollup) {
        childRollups.push(childRollup)
      }
    }

    const nextRollup = rollupFromSelfAndChildren(node, childRollups)
    const changedMetrics = diffRollupMetrics(rollups.get(currentId), nextRollup)
    rollups.set(currentId, nextRollup)
    if (changedMetrics.size > 0) {
      changedMetricsById.set(currentId, changedMetrics)
    }

    currentId = node.parentId
  }

  return { rollups, changedMetricsById }
}
