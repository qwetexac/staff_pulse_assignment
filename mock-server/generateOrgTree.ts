import { createSeededRng, pick, randomInt } from './rng.ts'

export type OrgNode = {
  id: string
  name: string
  parentId: string | null
  headcount: number
  budget: number
  performance: number
  updatedAt: string
}

/** Fixed seed so restarts yield an identical org tree. */
export const ORG_TREE_SEED = 42_4242

const DIVISION_NAMES = [
  'Engineering',
  'Product',
  'Operations',
  'Go-to-Market',
  'People',
] as const

const DEPARTMENT_SUFFIXES = [
  'Platform',
  'Core',
  'Growth',
  'Enablement',
  'Quality',
  'Infrastructure',
  'Analytics',
  'Support',
] as const

const TEAM_SUFFIXES = [
  'Alpha',
  'Beta',
  'Gamma',
  'Delta',
  'Echo',
  'Foxtrot',
  'Squad',
  'Pod',
] as const

/**
 * Builds a flat org-tree of ≥40 nodes with three nesting levels
 * (division → department → team). Pure + deterministic for a given seed.
 */
export function generateOrgTree(seed: number = ORG_TREE_SEED): OrgNode[] {
  const rng = createSeededRng(seed)
  const nodes: OrgNode[] = []
  const baseTime = Date.UTC(2026, 0, 15, 12, 0, 0)

  let sequence = 0
  const nextId = (prefix: string): string => {
    sequence += 1
    return `${prefix}-${String(sequence).padStart(3, '0')}`
  }

  const makeNode = (
    name: string,
    parentId: string | null,
    idPrefix: string,
  ): OrgNode => {
    const headcount = randomInt(rng, 4, 48)
    const budget = headcount * randomInt(rng, 8_000, 22_000)
    const performance = randomInt(rng, 15, 98)
    const updatedAt = new Date(
      baseTime + randomInt(rng, 0, 86_400_000),
    ).toISOString()

    return {
      id: nextId(idPrefix),
      name,
      parentId,
      headcount,
      budget,
      performance,
      updatedAt,
    }
  }

  for (const divisionName of DIVISION_NAMES) {
    const division = makeNode(`${divisionName} Division`, null, 'div')
    nodes.push(division)

    const departmentCount = randomInt(rng, 3, 4)
    for (let d = 0; d < departmentCount; d += 1) {
      const deptSuffix = pick(rng, DEPARTMENT_SUFFIXES)
      const department = makeNode(
        `${divisionName} ${deptSuffix}`,
        division.id,
        'dept',
      )
      nodes.push(department)

      const teamCount = randomInt(rng, 2, 3)
      for (let t = 0; t < teamCount; t += 1) {
        const teamSuffix = pick(rng, TEAM_SUFFIXES)
        const team = makeNode(
          `${department.name} ${teamSuffix}`,
          department.id,
          'team',
        )
        nodes.push(team)
      }
    }
  }

  if (nodes.length < 40) {
    throw new Error(
      `Org tree generator produced ${nodes.length} nodes; expected ≥40`,
    )
  }

  return nodes
}
