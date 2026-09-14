import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    min-height: 100%;
  }

  body {
    margin: 0;
    color: ${({ theme }) => theme.colors.text};
    background:
      radial-gradient(circle at top left, ${({ theme }) => theme.colors.brandSoft} 0%, transparent 42%),
      linear-gradient(180deg, ${({ theme }) => theme.colors.background} 0%, ${({ theme }) => theme.colors.backgroundAccent} 100%);
    font-family: ${({ theme }) => theme.fonts.sans};
    line-height: 1.5;
  }

  button {
    font: inherit;
  }

  code {
    font-family: ${({ theme }) => theme.fonts.mono};
  }
`
