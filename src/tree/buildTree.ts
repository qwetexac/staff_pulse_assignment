import type { OrgNode } from '@/api/types'

export type TreeNode = OrgNode & {
  children: TreeNode[]
}

/**
 * Builds a forest from the flat API array. Pure — does not mutate `nodes`.
 * Preserves input order among siblings.
 */
export function buildTree(nodes: readonly OrgNode[]): TreeNode[] {
  const byId = new Map<string, TreeNode>()

  for (const node of nodes) {
    byId.set(node.id, { ...node, children: [] })
  }

  const roots: TreeNode[] = []

  for (const node of nodes) {
    const current = byId.get(node.id)
    if (!current) {
      continue
    }

    if (node.parentId === null) {
      roots.push(current)
      continue
    }

    const parent = byId.get(node.parentId)
    if (parent) {
      parent.children.push(current)
    } else {
      // Orphan — treat as root so data is still visible.
      roots.push(current)
    }
  }

  return roots
}

/**
 * Default expanded ids: roots and their children (second level expanded),
 * so teams (third level) are visible on first load.
 */
export function getDefaultExpandedIds(roots: readonly TreeNode[]): Set<string> {
  const expanded = new Set<string>()
  for (const root of roots) {
    expanded.add(root.id)
    for (const child of root.children) {
      expanded.add(child.id)
    }
  }
  return expanded
}
