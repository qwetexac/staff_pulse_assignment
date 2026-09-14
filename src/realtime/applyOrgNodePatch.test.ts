import { describe, expect, it } from 'vitest'
import type { OrgNode } from '@/api/types'
import { applyOrgNodePatch } from '@/realtime/applyOrgNodePatch'
import type { OrgNodePatch } from '@/realtime/types'

function node(fields: Partial<OrgNode> & Pick<OrgNode, 'id'>): OrgNode {
  return {
    name: fields.name ?? fields.id,
    parentId: fields.parentId ?? null,
    headcount: fields.headcount ?? 10,
    budget: fields.budget ?? 1000,
    performance: fields.performance ?? 50,
    updatedAt: fields.updatedAt ?? '2026-01-01T00:00:00.000Z',
    id: fields.id,
  }
}

function patch(fields: Partial<OrgNodePatch> & Pick<OrgNodePatch, 'id'>): OrgNodePatch {
  return {
    headcount: fields.headcount ?? 12,
    budget: fields.budget ?? 1200,
    performance: fields.performance ?? 70,
    updatedAt: fields.updatedAt ?? '2026-01-02T00:00:00.000Z',
    id: fields.id,
  }
}

describe('applyOrgNodePatch', () => {
  it('mutates the matching node in place and leaves siblings untouched', () => {
    const target = node({ id: 'a', headcount: 10 })
    const sibling = node({ id: 'b', headcount: 8 })
    const nodes = [target, sibling]
    const siblingRef = sibling

    const applied = applyOrgNodePatch(nodes, patch({ id: 'a', headcount: 22 }))

    expect(applied).toEqual({
      nodeId: 'a',
      previous: { headcount: 10, budget: 1000, performance: 50 },
      next: { headcount: 22, budget: 1200, performance: 70 },
    })
    expect(nodes[0]).toBe(target)
    expect(target.headcount).toBe(22)
    expect(nodes[1]).toBe(siblingRef)
    expect(sibling.headcount).toBe(8)
  })

  it('returns null for an unknown id', () => {
    const nodes = [node({ id: 'a' })]
    expect(applyOrgNodePatch(nodes, patch({ id: 'missing' }))).toBeNull()
    expect(nodes[0]?.headcount).toBe(10)
  })

  it('returns null when the patch timestamp is not newer', () => {
    const nodes = [node({ id: 'a', updatedAt: '2026-06-01T00:00:00.000Z' })]
    expect(
      applyOrgNodePatch(
        nodes,
        patch({ id: 'a', updatedAt: '2026-05-01T00:00:00.000Z' }),
      ),
    ).toBeNull()
    expect(nodes[0]?.headcount).toBe(10)
  })

  it('updates updatedAt but returns null when metrics are unchanged', () => {
    const existing = node({
      id: 'a',
      headcount: 12,
      budget: 1200,
      performance: 70,
    })
    const nodes = [existing]
    const applied = applyOrgNodePatch(
      nodes,
      patch({
        id: 'a',
        headcount: 12,
        budget: 1200,
        performance: 70,
        updatedAt: '2026-02-01T00:00:00.000Z',
      }),
    )

    expect(applied).toBeNull()
    expect(existing.updatedAt).toBe('2026-02-01T00:00:00.000Z')
  })
})
