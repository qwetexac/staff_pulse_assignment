import { useEffect, useState } from 'react'
import type { OrgNode } from '@/api/types'
import {
  aggregateOrgTree,
  type NodeRollup,
} from '@/aggregation/aggregateOrgTree'
import {
  cellFlashKey,
  recomputeAncestorRollups,
  type RollupMetric,
} from '@/aggregation/recomputeAncestorRollups'
import type { AppliedOrgNodePatch } from '@/realtime/types'
import { CELL_FLASH_DURATION_MS } from '@/shared/constants'
import { buildTableRows, type OrgTableRow } from '@/table/tableModel'

export type CellFlashMap = ReadonlyMap<string, number>

type TableMetricsState = {
  nodes: readonly OrgNode[]
  rollups: Map<string, NodeRollup>
  rows: OrgTableRow[]
  flashes: Map<string, number>
  patchRevision: number
}

function pruneFlashes(
  flashes: ReadonlyMap<string, number>,
  now: number,
): Map<string, number> {
  const next = new Map<string, number>()
  for (const [key, startedAt] of flashes) {
    if (now - startedAt < CELL_FLASH_DURATION_MS) {
      next.set(key, startedAt)
    }
  }
  return next
}

function mergeFlashes(
  previous: ReadonlyMap<string, number>,
  changedMetricsById: ReadonlyMap<string, Set<RollupMetric>>,
  receivedAt: number,
): Map<string, number> {
  const next = pruneFlashes(previous, receivedAt)
  for (const [nodeId, metrics] of changedMetricsById) {
    for (const metric of metrics) {
      next.set(cellFlashKey(nodeId, metric), receivedAt)
    }
  }
  return next
}

function patchRows(
  rows: readonly OrgTableRow[],
  rollups: ReadonlyMap<string, NodeRollup>,
  changedIds: ReadonlySet<string>,
): OrgTableRow[] {
  return rows.map((row) => {
    if (!changedIds.has(row.id)) {
      return row
    }
    const rollup = rollups.get(row.id)
    if (!rollup) {
      return row
    }
    return {
      ...row,
      totalHeadcount: rollup.totalHeadcount,
      totalBudget: rollup.totalBudget,
      averagePerformance: rollup.averagePerformance,
    }
  })
}

function createFullState(
  nodes: readonly OrgNode[],
  patchRevision: number,
): TableMetricsState {
  const rollups = aggregateOrgTree(nodes)
  return {
    nodes,
    rollups,
    rows: buildTableRows(nodes, rollups),
    flashes: new Map(),
    patchRevision,
  }
}

function applyPatchToState(
  state: TableMetricsState,
  lastPatch: AppliedOrgNodePatch,
): TableMetricsState {
  const { rollups, changedMetricsById } = recomputeAncestorRollups(
    state.nodes,
    state.rollups,
    lastPatch.nodeId,
  )

  return {
    nodes: state.nodes,
    rollups,
    rows: patchRows(state.rows, rollups, new Set(changedMetricsById.keys())),
    flashes: mergeFlashes(
      state.flashes,
      changedMetricsById,
      lastPatch.receivedAt,
    ),
    patchRevision: lastPatch.revision,
  }
}

/**
 * Full-forest aggregate when `nodes` is replaced; ancestor-only rollup update
 * when a live patch arrives against the same array.
 */
export function useOrgTableRows(
  nodes: readonly OrgNode[],
  lastPatch: AppliedOrgNodePatch | null,
) {
  const [state, setState] = useState(() =>
    createFullState(nodes, lastPatch?.revision ?? 0),
  )

  let next = state
  if (state.nodes !== nodes) {
    next = createFullState(nodes, lastPatch?.revision ?? 0)
  } else if (
    lastPatch !== null &&
    lastPatch.revision !== state.patchRevision
  ) {
    next = applyPatchToState(state, lastPatch)
  }

  if (next !== state) {
    setState(next)
  }

  useEffect(() => {
    if (next.flashes.size === 0) {
      return
    }

    let earliest = Number.POSITIVE_INFINITY
    for (const startedAt of next.flashes.values()) {
      if (startedAt < earliest) {
        earliest = startedAt
      }
    }

    const delay = Math.max(0, earliest + CELL_FLASH_DURATION_MS - Date.now())
    const timer = window.setTimeout(() => {
      setState((current) => {
        const pruned = pruneFlashes(current.flashes, Date.now())
        if (pruned.size === current.flashes.size) {
          return current
        }
        return { ...current, flashes: pruned }
      })
    }, delay)

    return () => {
      window.clearTimeout(timer)
    }
  }, [next.flashes])

  return { rows: next.rows, flashes: next.flashes as CellFlashMap }
}
