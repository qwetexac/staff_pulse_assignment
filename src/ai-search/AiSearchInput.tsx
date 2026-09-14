import { SEARCH_PLACEHOLDER } from '@/ai-search/constants'
import type { ParseResult } from '@/ai-search/types'
import {
  SearchHeader,
  SearchInput,
  SearchLabel,
  SearchRoot,
  SearchStatus,
} from '@/ai-search/AiSearch.styles'

const SEARCH_INPUT_ID = 'ai-search-input'
const SEARCH_STATUS_ID = 'ai-search-status'

type AiSearchInputProps = {
  value: string
  onChange: (value: string) => void
  status: string | null
  parsedKind: ParseResult['kind']
}

export function AiSearchInput({
  value,
  onChange,
  status,
  parsedKind,
}: AiSearchInputProps) {
  return (
    <SearchRoot>
      <SearchHeader>
        <SearchLabel htmlFor={SEARCH_INPUT_ID}>Search</SearchLabel>
        {status === null ? null : (
          <SearchStatus
            id={SEARCH_STATUS_ID}
            role="status"
            $tone={parsedKind === 'text' ? 'fallback' : 'structured'}
          >
            {status}
          </SearchStatus>
        )}
      </SearchHeader>
      <SearchInput
        id={SEARCH_INPUT_ID}
        type="search"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        placeholder={SEARCH_PLACEHOLDER}
        aria-label="Search organization units with natural language or a name"
        aria-describedby={status === null ? undefined : SEARCH_STATUS_ID}
      />
    </SearchRoot>
  )
}
