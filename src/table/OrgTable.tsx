import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import {
  AiSearchInput,
  applyOrgTableSearch,
  emptySearchMessage,
  parseNaturalLanguageQuery,
  searchStatusMessage,
} from '@/ai-search'
import { NAME_FILTER_DEBOUNCE_MS, SORT_CLICK_DELAY_MS } from '@/shared/constants'
import { useDebouncedValue } from '@/shared/useDebouncedValue'
import { getPerformanceLevel } from '@/tree/performance'
import {
  formatAveragePerformance,
  formatBudget,
  formatHeadcount,
} from '@/table/format'
import {
  nextSortOnClick,
  nextSortOnDoubleClick,
  TABLE_COLUMNS,
  type OrgTableRow,
  type SortColumn,
  type SortState,
} from '@/table/tableModel'
import { sortRows } from '@/table/tableQuery'
import { scrollRowIntoTableView } from '@/table/scrollRowIntoView'
import {
  clampTableFocus,
  moveTableFocus,
  type TableFocus,
} from '@/table/tableKeyboard'
import { cellFlashKey } from '@/aggregation/recomputeAncestorRollups'
import { type CellFlashMap } from '@/aggregation/useOrgTableRows'
import {
  BodyRow,
  Caption,
  Cell,
  EmptyFilterMessage,
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
  flashes: CellFlashMap
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

function focusCellSelector(rowIndex: number, columnIndex: number): string {
  return `[data-focus-cell="${rowIndex}-${columnIndex}"]`
}

export function OrgTable({ rows, flashes, selectedId, onSelect }: OrgTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState<SortState | null>(null)
  const [rawFocus, setRawFocus] = useState<TableFocus | null>(null)
  const debouncedQuery = useDebouncedValue(searchQuery, NAME_FILTER_DEBOUNCE_MS)
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const headRef = useRef<HTMLTableSectionElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldMoveDomFocusRef = useRef(false)
  const sortClickTimerRef = useRef<number | null>(null)

  const parsedSearch = useMemo(
    () => parseNaturalLanguageQuery(debouncedQuery),
    [debouncedQuery],
  )

  const visibleRows = useMemo(() => {
    const filtered = applyOrgTableSearch(rows, parsedSearch)
    return sortRows(filtered, sort)
  }, [rows, parsedSearch, sort])

  const searchStatus = searchStatusMessage(parsedSearch)

  const focus =
    rawFocus === null
      ? null
      : clampTableFocus(rawFocus, visibleRows.length, TABLE_COLUMNS.length)

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

  useEffect(() => {
    if (!shouldMoveDomFocusRef.current || focus === null || !bodyRef.current) {
      return
    }
    shouldMoveDomFocusRef.current = false

    const cell = bodyRef.current.querySelector(
      focusCellSelector(focus.rowIndex, focus.columnIndex),
    )
    if (cell instanceof HTMLElement) {
      cell.focus()
    }

    const row = cell instanceof HTMLElement ? cell.closest('tr') : null
    if (row instanceof HTMLElement && scrollRef.current) {
      scrollRowIntoTableView(scrollRef.current, row, headRef.current)
    }
  }, [focus])

  const clearSortClickTimer = () => {
    if (sortClickTimerRef.current !== null) {
      window.clearTimeout(sortClickTimerRef.current)
      sortClickTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearSortClickTimer()
    }
  }, [])

  const handleSortClick = (column: SortColumn) => {
    clearSortClickTimer()
    sortClickTimerRef.current = window.setTimeout(() => {
      sortClickTimerRef.current = null
      setSort((current) => nextSortOnClick(current, column))
    }, SORT_CLICK_DELAY_MS)
  }

  const handleSortDoubleClick = (column: SortColumn) => {
    clearSortClickTimer()
    setSort((current) => nextSortOnDoubleClick(current, column))
  }

  const handleGridKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (visibleRows.length === 0) {
      return
    }

    const origin =
      focus ??
      ({ rowIndex: 0, columnIndex: 0 } satisfies TableFocus)

    if (event.key === 'Enter') {
      const row = visibleRows[origin.rowIndex]
      if (!row) {
        return
      }
      event.preventDefault()
      onSelect(row.id)
      return
    }

    const next = moveTableFocus(
      origin,
      event.key,
      visibleRows.length,
      TABLE_COLUMNS.length,
    )
    if (next === null) {
      return
    }

    event.preventDefault()
    shouldMoveDomFocusRef.current = true
    setRawFocus(next)
  }

  const isTabbableCell = (rowIndex: number, columnIndex: number) => {
    if (focus === null) {
      return rowIndex === 0 && columnIndex === 0
    }
    return focus.rowIndex === rowIndex && focus.columnIndex === columnIndex
  }

  return (
    <TableRoot>
      <TableToolbar>
        <AiSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          status={searchStatus}
          parsedKind={parsedSearch.kind}
        />
      </TableToolbar>

      <TableScroll ref={scrollRef}>
        <Table role="grid" aria-rowcount={visibleRows.length} onKeyDown={handleGridKeyDown}>
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
                    title="Click to sort ascending. Double-click to reverse."
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
            {visibleRows.map((row, rowIndex) => {
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
                  <NameCell
                    $depth={row.depth}
                    $keyboardFocused={
                      focus?.rowIndex === rowIndex && focus.columnIndex === 0
                    }
                    tabIndex={isTabbableCell(rowIndex, 0) ? 0 : -1}
                    data-focus-cell={`${rowIndex}-0`}
                    role="gridcell"
                    onFocus={() => {
                      setRawFocus({ rowIndex, columnIndex: 0 })
                    }}
                  >
                    {row.name}
                  </NameCell>
                  <Cell
                    $keyboardFocused={
                      focus?.rowIndex === rowIndex && focus.columnIndex === 1
                    }
                    tabIndex={isTabbableCell(rowIndex, 1) ? 0 : -1}
                    data-focus-cell={`${rowIndex}-1`}
                    role="gridcell"
                    onFocus={() => {
                      setRawFocus({ rowIndex, columnIndex: 1 })
                    }}
                  >
                    {row.levelLabel}
                  </Cell>
                  <Cell
                    key={`headcount-${flashes.get(cellFlashKey(row.id, 'headcount')) ?? 'idle'}`}
                    $numeric
                    $flashing={flashes.has(cellFlashKey(row.id, 'headcount'))}
                    $keyboardFocused={
                      focus?.rowIndex === rowIndex && focus.columnIndex === 2
                    }
                    tabIndex={isTabbableCell(rowIndex, 2) ? 0 : -1}
                    data-focus-cell={`${rowIndex}-2`}
                    role="gridcell"
                    onFocus={() => {
                      setRawFocus({ rowIndex, columnIndex: 2 })
                    }}
                  >
                    {formatHeadcount(row.totalHeadcount)}
                  </Cell>
                  <Cell
                    key={`budget-${flashes.get(cellFlashKey(row.id, 'budget')) ?? 'idle'}`}
                    $numeric
                    $flashing={flashes.has(cellFlashKey(row.id, 'budget'))}
                    $keyboardFocused={
                      focus?.rowIndex === rowIndex && focus.columnIndex === 3
                    }
                    tabIndex={isTabbableCell(rowIndex, 3) ? 0 : -1}
                    data-focus-cell={`${rowIndex}-3`}
                    role="gridcell"
                    onFocus={() => {
                      setRawFocus({ rowIndex, columnIndex: 3 })
                    }}
                  >
                    {formatBudget(row.totalBudget)}
                  </Cell>
                  <PerformanceCell
                    key={`performance-${flashes.get(cellFlashKey(row.id, 'performance')) ?? 'idle'}`}
                    $numeric
                    $tone={performanceLevel}
                    $flashing={flashes.has(cellFlashKey(row.id, 'performance'))}
                    $keyboardFocused={
                      focus?.rowIndex === rowIndex && focus.columnIndex === 4
                    }
                    tabIndex={isTabbableCell(rowIndex, 4) ? 0 : -1}
                    data-focus-cell={`${rowIndex}-4`}
                    role="gridcell"
                    onFocus={() => {
                      setRawFocus({ rowIndex, columnIndex: 4 })
                    }}
                  >
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
          {emptySearchMessage(parsedSearch)}
        </EmptyFilterMessage>
      ) : null}
    </TableRoot>
  )
}
