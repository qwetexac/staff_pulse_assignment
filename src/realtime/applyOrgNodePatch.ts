import type { OrgNode } from '@/api/types'
import type { AppliedOrgNodePatch, OrgNodePatch } from '@/realtime/types'

/**
 * Mutates the matching node in `nodes`. Skips unknown ids, stale timestamps,
 * and no-op metric payloads. Does not change `id` / `name` / `parentId`.
 */
export function applyOrgNodePatch(
  nodes: OrgNode[],
  patch: OrgNodePatch,
): Omit<AppliedOrgNodePatch, 'revision' | 'receivedAt'> | null {
  const node = nodes.find((candidate) => candidate.id === patch.id)
  if (!node) {
    return null
  }

  if (patch.updatedAt <= node.updatedAt) {
    return null
  }

  if (
    node.headcount === patch.headcount &&
    node.budget === patch.budget &&
    node.performance === patch.performance
  ) {
    node.updatedAt = patch.updatedAt
    return null
  }

  const previous = {
    headcount: node.headcount,
    budget: node.budget,
    performance: node.performance,
  }

  node.headcount = patch.headcount
  node.budget = patch.budget
  node.performance = patch.performance
  node.updatedAt = patch.updatedAt

  return {
    nodeId: node.id,
    previous,
    next: {
      headcount: node.headcount,
      budget: node.budget,
      performance: node.performance,
    },
  }
}
