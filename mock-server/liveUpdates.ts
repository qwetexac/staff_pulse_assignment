import type { OrgNode } from './generateOrgTree.ts'

export const LIVE_UPDATE_INTERVAL_MS = 2_500
export const SSE_HEARTBEAT_MS = 15_000

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export type OrgNodePatch = {
  id: string
  headcount: number
  budget: number
  performance: number
  updatedAt: string
}

/**
 * Picks a random node and jitters its metrics in place so GET and SSE share
 * the same in-memory array.
 */
export function applyRandomNodePatch(nodes: OrgNode[]): OrgNodePatch | null {
  if (nodes.length === 0) {
    return null
  }

  const node = nodes[randomInt(0, nodes.length - 1)]
  if (!node) {
    return null
  }

  const headcount = Math.max(0, node.headcount + randomInt(-2, 4))
  const budget = Math.max(0, node.budget + randomInt(-8_000, 12_000))
  let performance = clamp(node.performance + randomInt(-8, 8), 0, 100)

  if (
    headcount === node.headcount &&
    budget === node.budget &&
    performance === node.performance
  ) {
    performance = performance >= 100 ? performance - 1 : performance + 1
  }

  node.headcount = headcount
  node.budget = budget
  node.performance = performance
  node.updatedAt = new Date().toISOString()

  return {
    id: node.id,
    headcount: node.headcount,
    budget: node.budget,
    performance: node.performance,
    updatedAt: node.updatedAt,
  }
}
