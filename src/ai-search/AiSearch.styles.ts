import styled from 'styled-components'

export const SearchRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  flex: 1 1 280px;
  min-width: 0;
`

export const SearchHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  min-width: 0;
`

export const SearchLabel = styled.label`
  flex: 0 0 auto;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const SearchInput = styled.input`
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

export const SearchStatus = styled.p<{ $tone: 'fallback' | 'structured' }>`
  margin: 0;
  min-width: 0;
  flex: 1 1 auto;
  text-align: right;
  font-size: 0.8rem;
  color: ${({ theme, $tone }) =>
    $tone === 'fallback' ? theme.colors.warning : theme.colors.brand};
`
