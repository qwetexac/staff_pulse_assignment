import type { OrgNode } from '@/api/types'

export type NodeRollup = {
  totalHeadcount: number
  totalBudget: number
  averagePerformance: number
  /**
   * Σ (headcount × performance) over the node and its descendants.
   * Exposed so Stage 03 can recombine a node with its children without
   * re-walking the full subtree.
   */
  weightedPerformanceSum: number
}

/**
 * Combines a node's own metrics with already-rolled-up children.
 * Pure. Stage 03 can call this for the patched node and each ancestor
 * instead of `aggregateOrgTree` over the whole forest.
 */
export function rollupFromSelfAndChildren(
  node: Pick<OrgNode, 'headcount' | 'budget' | 'performance'>,
  childRollups: readonly NodeRollup[],
): NodeRollup {
  let totalHeadcount = node.headcount
  let totalBudget = node.budget
  let weightedPerformanceSum = node.headcount * node.performance

  for (const child of childRollups) {
    totalHeadcount += child.totalHeadcount
    totalBudget += child.totalBudget
    weightedPerformanceSum += child.weightedPerformanceSum
  }

  return {
    totalHeadcount,
    totalBudget,
    weightedPerformanceSum,
    averagePerformance:
      totalHeadcount === 0 ? 0 : weightedPerformanceSum / totalHeadcount,
  }
}

export function groupChildrenByParentId(
  nodes: readonly OrgNode[],
): Map<string, OrgNode[]> {
  const childrenByParentId = new Map<string, OrgNode[]>()

  for (const node of nodes) {
    if (node.parentId === null) {
      continue
    }
    const siblings = childrenByParentId.get(node.parentId)
    if (siblings) {
      siblings.push(node)
    } else {
      childrenByParentId.set(node.parentId, [node])
    }
  }

  return childrenByParentId
}

/**
 * Bottom-up rollups for every node: totals include the node itself and all
 * descendants; average performance is weighted by headcount.
 * Returns an empty Map for an empty input (does not throw).
 */
export function aggregateOrgTree(
  nodes: readonly OrgNode[],
): Map<string, NodeRollup> {
  const rollups = new Map<string, NodeRollup>()
  if (nodes.length === 0) {
    return rollups
  }

  const childrenByParentId = groupChildrenByParentId(nodes)

  const visiting = new Set<string>()

  const visit = (node: OrgNode): NodeRollup => {
    const existing = rollups.get(node.id)
    if (existing) {
      return existing
    }

    if (visiting.has(node.id)) {
      // Cycle in parentId links — treat as a leaf so we still return.
      const self = rollupFromSelfAndChildren(node, [])
      rollups.set(node.id, self)
      return self
    }

    visiting.add(node.id)
    const children = childrenByParentId.get(node.id) ?? []
    const childRollups = children.map(visit)
    visiting.delete(node.id)

    const rollup = rollupFromSelfAndChildren(node, childRollups)
    rollups.set(node.id, rollup)
    return rollup
  }

  for (const node of nodes) {
    visit(node)
  }

  return rollups
}
