import styled from 'styled-components'
import {
  PANE_BODY_MAX_HEIGHT,
  SPLIT_VIEW_MIN_WIDTH_PX,
} from '@/shared/constants'

const splitView = `@media (min-width: ${SPLIT_VIEW_MIN_WIDTH_PX}px)`

export const TableRoot = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
`

export const TableToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.md};
`

export const FilterLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  flex: 1 1 220px;
  min-width: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const FilterInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`

export const TableScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  max-height: ${PANE_BODY_MAX_HEIGHT};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};

  ${splitView} {
    max-height: none;
  }
`

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
`

export const Caption = styled.caption`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

export const TableHead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 1;
  background: ${({ theme }) => theme.colors.surface};
`

export const HeaderCell = styled.th<{ $numeric?: boolean }>`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  text-align: ${({ $numeric }) => ($numeric ? 'right' : 'left')};
  font-weight: 600;
  font-size: 0.82rem;
  letter-spacing: 0.02em;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`

export const SortButton = styled.button<{ $numeric?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: ${({ $numeric }) => ($numeric ? 'flex-end' : 'flex-start')};
  gap: ${({ theme }) => theme.space.xs};
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: inherit;
  cursor: pointer;
  user-select: none;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`

export const SortMark = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.brand};
`

export const BodyRow = styled.tr<{ $selected?: boolean }>`
  cursor: pointer;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.brandSoft : 'transparent'};

  &:hover {
    background: ${({ theme, $selected }) =>
      $selected ? theme.colors.brandSoft : theme.colors.background};
  }
`

export const Cell = styled.td<{ $numeric?: boolean }>`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  text-align: ${({ $numeric }) => ($numeric ? 'right' : 'left')};
  color: ${({ theme }) => theme.colors.text};
`

export const NameCell = styled(Cell)<{ $depth: number }>`
  padding-left: ${({ theme, $depth }) =>
    `calc(${theme.space.md} + ${$depth} * ${theme.space.lg})`};
  font-weight: 600;
`

export const PerformanceCell = styled(Cell)<{
  $tone: 'high' | 'medium' | 'low'
}>`
  color: ${({ theme, $tone }) => theme.colors.performance[$tone]};
  font-weight: 600;
`

export const EmptyFilterMessage = styled.p`
  margin: ${({ theme }) => theme.space.lg} 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
`
