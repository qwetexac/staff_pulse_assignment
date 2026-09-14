import { describe, expect, it } from 'vitest'
import type { OrgNode } from '@/api/types'
import { aggregateOrgTree } from '@/aggregation/aggregateOrgTree'

const UPDATED_AT = '2026-01-01T00:00:00.000Z'

function orgNode(
  fields: Pick<
    OrgNode,
    'id' | 'parentId' | 'headcount' | 'budget' | 'performance'
  > &
    Partial<Pick<OrgNode, 'name'>>,
): OrgNode {
  return {
    name: fields.name ?? fields.id,
    updatedAt: UPDATED_AT,
    ...fields,
  }
}

describe('aggregateOrgTree', () => {
  it('returns an empty map for an empty tree', () => {
    const rollups = aggregateOrgTree([])
    expect(rollups.size).toBe(0)
  })

  it('rolls a leaf up to its own metrics', () => {
    const leaf = orgNode({
      id: 't',
      parentId: 'd',
      headcount: 10,
      budget: 1000,
      performance: 80,
    })

    const rollups = aggregateOrgTree([leaf])
    expect(rollups.get('t')).toEqual({
      totalHeadcount: 10,
      totalBudget: 1000,
      weightedPerformanceSum: 800,
      averagePerformance: 80,
    })
  })

  it('includes a node and its one descendant; performance is headcount-weighted', () => {
    const department = orgNode({
      id: 'd',
      parentId: null,
      headcount: 4,
      budget: 400,
      performance: 50,
    })
    const team = orgNode({
      id: 't',
      parentId: 'd',
      headcount: 6,
      budget: 600,
      performance: 100,
    })

    const rollups = aggregateOrgTree([department, team])

    expect(rollups.get('t')).toEqual({
      totalHeadcount: 6,
      totalBudget: 600,
      weightedPerformanceSum: 600,
      averagePerformance: 100,
    })
    expect(rollups.get('d')).toEqual({
      totalHeadcount: 10,
      totalBudget: 1000,
      weightedPerformanceSum: 800,
      averagePerformance: 80,
    })
  })

  it('uses average performance 0 when total headcount is 0', () => {
    const empty = orgNode({
      id: 'x',
      parentId: null,
      headcount: 0,
      budget: 100,
      performance: 50,
    })

    const rollups = aggregateOrgTree([empty])
    expect(rollups.get('x')).toEqual({
      totalHeadcount: 0,
      totalBudget: 100,
      weightedPerformanceSum: 0,
      averagePerformance: 0,
    })
  })

  it('rolls metrics through three nested levels', () => {
    const division = orgNode({
      id: 'div',
      parentId: null,
      headcount: 2,
      budget: 200,
      performance: 40,
    })
    const department = orgNode({
      id: 'dept',
      parentId: 'div',
      headcount: 3,
      budget: 300,
      performance: 60,
    })
    const team = orgNode({
      id: 'team',
      parentId: 'dept',
      headcount: 5,
      budget: 500,
      performance: 100,
    })

    const rollups = aggregateOrgTree([division, department, team])

    expect(rollups.get('team')).toEqual({
      totalHeadcount: 5,
      totalBudget: 500,
      weightedPerformanceSum: 500,
      averagePerformance: 100,
    })
    expect(rollups.get('dept')).toEqual({
      totalHeadcount: 8,
      totalBudget: 800,
      weightedPerformanceSum: 680,
      averagePerformance: 85,
    })
    expect(rollups.get('div')).toEqual({
      totalHeadcount: 10,
      totalBudget: 1000,
      weightedPerformanceSum: 760,
      averagePerformance: 76,
    })
  })

  it('sums every sibling under the same parent rather than keeping one', () => {
    const parent = orgNode({
      id: 'p',
      parentId: null,
      headcount: 4,
      budget: 400,
      performance: 50,
    })
    const first = orgNode({
      id: 'a',
      parentId: 'p',
      headcount: 6,
      budget: 600,
      performance: 100,
    })
    const second = orgNode({
      id: 'b',
      parentId: 'p',
      headcount: 10,
      budget: 200,
      performance: 80,
    })

    const rollups = aggregateOrgTree([parent, first, second])

    expect(rollups.get('a')).toEqual({
      totalHeadcount: 6,
      totalBudget: 600,
      weightedPerformanceSum: 600,
      averagePerformance: 100,
    })
    expect(rollups.get('b')).toEqual({
      totalHeadcount: 10,
      totalBudget: 200,
      weightedPerformanceSum: 800,
      averagePerformance: 80,
    })
    expect(rollups.get('p')).toEqual({
      totalHeadcount: 20,
      totalBudget: 1200,
      weightedPerformanceSum: 1600,
      averagePerformance: 80,
    })
  })

  it('yields the same rollups regardless of input order', () => {
    const division = orgNode({
      id: 'div',
      parentId: null,
      headcount: 2,
      budget: 200,
      performance: 40,
    })
    const department = orgNode({
      id: 'dept',
      parentId: 'div',
      headcount: 3,
      budget: 300,
      performance: 60,
    })
    const team = orgNode({
      id: 'team',
      parentId: 'dept',
      headcount: 5,
      budget: 500,
      performance: 100,
    })

    const parentFirst = aggregateOrgTree([division, department, team])
    const childFirst = aggregateOrgTree([team, department, division])
    const mixed = aggregateOrgTree([department, team, division])

    expect(Object.fromEntries(childFirst)).toEqual(
      Object.fromEntries(parentFirst),
    )
    expect(Object.fromEntries(mixed)).toEqual(Object.fromEntries(parentFirst))
  })
})
