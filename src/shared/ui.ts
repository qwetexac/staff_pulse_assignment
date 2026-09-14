import styled from 'styled-components'

export const AppShell = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space.xl} ${({ theme }) => theme.space.lg};
`

export const Header = styled.header`
  margin-bottom: ${({ theme }) => theme.space.lg};
`

export const Title = styled.h1`
  margin: 0 0 ${({ theme }) => theme.space.xs};
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.brand};
`

export const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Panel = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadow};
  padding: ${({ theme }) => theme.space.lg};
`

export const StatusMessage = styled.div<{ $tone?: 'neutral' | 'danger' }>`
  padding: ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $tone }) =>
    $tone === 'danger' ? theme.colors.dangerSoft : theme.colors.brandSoft};
  color: ${({ theme, $tone }) =>
    $tone === 'danger' ? theme.colors.danger : theme.colors.text};
`

export const StatusTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.xs};
  font-size: 1.1rem;
`

export const StatusBody = styled.p`
  margin: 0;
  color: inherit;
`
