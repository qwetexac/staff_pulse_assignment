import { useEffect, useMemo, useRef, useState } from 'react'
import { NAME_FILTER_DEBOUNCE_MS } from '@/shared/constants'
import { useDebouncedValue } from '@/shared/useDebouncedValue'
import { getPerformanceLevel } from '@/tree/performance'
import {
  formatAveragePerformance,
  formatBudget,
  formatHeadcount,
} from '@/table/format'
import {
  TABLE_COLUMNS,
  type OrgTableRow,
  type SortColumn,
  type SortState,
} from '@/table/tableModel'
import { filterRowsByName, sortRows } from '@/table/tableQuery'
import { scrollRowIntoTableView } from '@/table/scrollRowIntoView'
import {
  BodyRow,
  Caption,
  Cell,
  EmptyFilterMessage,
  FilterInput,
  FilterLabel,
  HeaderCell,
  NameCell,
  PerformanceCell,
  SortButton,
  SortMark,
  Table,
  TableHead,
  TableRoot,
  TableScroll,
  TableToolbar,
} from '@/table/Table.styles'

type OrgTableProps = {
  rows: readonly OrgTableRow[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function sortMark(sort: SortState | null, column: SortColumn): string {
  if (sort?.column !== column) {
    return ''
  }
  return sort.direction === 'asc' ? '↑' : '↓'
}

function ariaSort(
  sort: SortState | null,
  column: SortColumn,
): 'ascending' | 'descending' | 'none' {
  if (sort?.column !== column) {
    return 'none'
  }
  return sort.direction === 'asc' ? 'ascending' : 'descending'
}

export function OrgTable({ rows, selectedId, onSelect }: OrgTableProps) {
  const [nameQuery, setNameQuery] = useState('')
  const [sort, setSort] = useState<SortState | null>(null)
  const debouncedQuery = useDebouncedValue(nameQuery, NAME_FILTER_DEBOUNCE_MS)
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const headRef = useRef<HTMLTableSectionElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const visibleRows = useMemo(() => {
    const filtered = filterRowsByName(rows, debouncedQuery)
    return sortRows(filtered, sort)
  }, [rows, debouncedQuery, sort])

  useEffect(() => {
    if (selectedId === null || !bodyRef.current || !scrollRef.current) {
      return
    }

    const selectedRow = bodyRef.current.querySelector(
      `[data-node-id="${CSS.escape(selectedId)}"]`,
    )
    if (!(selectedRow instanceof HTMLElement)) {
      return
    }

    scrollRowIntoTableView(scrollRef.current, selectedRow, headRef.current)
  }, [selectedId])

  const handleSortClick = (column: SortColumn) => {
    setSort((current) => {
      if (current?.column === column) {
        return current
      }
      return { column, direction: 'asc' }
    })
  }

  const handleSortDoubleClick = (column: SortColumn) => {
    setSort((current) => {
      if (current?.column !== column) {
        return { column, direction: 'desc' }
      }
      return {
        column,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      }
    })
  }

  return (
    <TableRoot>
      <TableToolbar>
        <FilterLabel>
          Filter by name
          <FilterInput
            type="search"
            value={nameQuery}
            onChange={(event) => {
              setNameQuery(event.target.value)
            }}
            placeholder="Start typing a unit name…"
            aria-label="Filter organization units by name"
          />
        </FilterLabel>
      </TableToolbar>

      <TableScroll ref={scrollRef}>
        <Table>
          <Caption>Aggregated organization metrics</Caption>
          <TableHead ref={headRef}>
            <tr>
              {TABLE_COLUMNS.map((column) => (
                <HeaderCell
                  key={column.column}
                  $numeric={column.numeric}
                  aria-sort={ariaSort(sort, column.column)}
                  scope="col"
                >
                  <SortButton
                    type="button"
                    $numeric={column.numeric}
                    title="Click to sort. Double-click to reverse order."
                    onClick={() => {
                      handleSortClick(column.column)
                    }}
                    onDoubleClick={() => {
                      handleSortDoubleClick(column.column)
                    }}
                  >
                    {column.label}
                    <SortMark aria-hidden="true">
                      {sortMark(sort, column.column)}
                    </SortMark>
                  </SortButton>
                </HeaderCell>
              ))}
            </tr>
          </TableHead>
          <tbody ref={bodyRef}>
            {visibleRows.map((row) => {
              const isSelected = row.id === selectedId
              const performanceLevel = getPerformanceLevel(
                row.averagePerformance,
              )

              return (
                <BodyRow
                  key={row.id}
                  $selected={isSelected}
                  data-node-id={row.id}
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(row.id)
                  }}
                >
                  <NameCell $depth={row.depth}>{row.name}</NameCell>
                  <Cell>{row.levelLabel}</Cell>
                  <Cell $numeric>{formatHeadcount(row.totalHeadcount)}</Cell>
                  <Cell $numeric>{formatBudget(row.totalBudget)}</Cell>
                  <PerformanceCell $numeric $tone={performanceLevel}>
                    {formatAveragePerformance(row.averagePerformance)}
                  </PerformanceCell>
                </BodyRow>
              )
            })}
          </tbody>
        </Table>
      </TableScroll>

      {visibleRows.length === 0 ? (
        <EmptyFilterMessage role="status">
          No units match that name.
        </EmptyFilterMessage>
      ) : null}
    </TableRoot>
  )
}
