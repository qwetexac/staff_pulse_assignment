import { describe, expect, it } from 'vitest'
import type { OrgNode } from '@/api/types'
import { aggregateOrgTree } from '@/aggregation/aggregateOrgTree'
import { recomputeAncestorRollups } from '@/aggregation/recomputeAncestorRollups'

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

describe('recomputeAncestorRollups', () => {
  it('matches a full re-aggregate after patching a leaf, and only rewrites the ancestor chain', () => {
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
    const otherDept = orgNode({
      id: 'other-dept',
      parentId: 'div',
      headcount: 8,
      budget: 800,
      performance: 50,
    })
    const otherTeam = orgNode({
      id: 'other-team',
      parentId: 'other-dept',
      headcount: 4,
      budget: 400,
      performance: 25,
    })

    const nodes = [division, department, team, otherDept, otherTeam]
    const previous = aggregateOrgTree(nodes)
    const otherDeptRollup = previous.get('other-dept')
    const otherTeamRollup = previous.get('other-team')

    team.headcount = 15
    team.budget = 1500
    team.performance = 80

    const { rollups, changedMetricsById } = recomputeAncestorRollups(
      nodes,
      previous,
      'team',
    )

    const full = aggregateOrgTree(nodes)
    expect(rollups.get('team')).toEqual(full.get('team'))
    expect(rollups.get('dept')).toEqual(full.get('dept'))
    expect(rollups.get('div')).toEqual(full.get('div'))
    expect(rollups.get('other-dept')).toEqual(full.get('other-dept'))
    expect(rollups.get('other-team')).toEqual(full.get('other-team'))

    expect(rollups.get('other-dept')).toBe(otherDeptRollup)
    expect(rollups.get('other-team')).toBe(otherTeamRollup)

    expect([...changedMetricsById.keys()].sort()).toEqual([
      'dept',
      'div',
      'team',
    ])
    expect(changedMetricsById.get('team')).toEqual(
      new Set(['headcount', 'budget', 'performance']),
    )
  })

  it('does not rewrite siblings when only performance changes on a node', () => {
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

    const nodes = [parent, first, second]
    const previous = aggregateOrgTree(nodes)
    const sibling = previous.get('b')

    first.performance = 40

    const { rollups, changedMetricsById } = recomputeAncestorRollups(
      nodes,
      previous,
      'a',
    )

    expect(rollups.get('b')).toBe(sibling)
    expect(changedMetricsById.has('b')).toBe(false)
    expect(changedMetricsById.get('a')).toEqual(new Set(['performance']))
    expect(changedMetricsById.get('p')).toEqual(new Set(['performance']))
    expect(rollups.get('p')).toEqual(aggregateOrgTree(nodes).get('p'))
  })

  it('returns the previous map unchanged for an unknown id', () => {
    const leaf = orgNode({
      id: 't',
      parentId: null,
      headcount: 10,
      budget: 1000,
      performance: 80,
    })
    const previous = aggregateOrgTree([leaf])
    const { rollups, changedMetricsById } = recomputeAncestorRollups(
      [leaf],
      previous,
      'missing',
    )

    expect(rollups.get('t')).toBe(previous.get('t'))
    expect(changedMetricsById.size).toBe(0)
  })
})
