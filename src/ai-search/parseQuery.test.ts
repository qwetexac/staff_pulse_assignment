import { describe, expect, it } from 'vitest'
import { parseNaturalLanguageQuery } from '@/ai-search/parseQuery'

describe('parseNaturalLanguageQuery', () => {
  it('returns empty for blank input', () => {
    expect(parseNaturalLanguageQuery('')).toEqual({ kind: 'empty' })
    expect(parseNaturalLanguageQuery('   ')).toEqual({ kind: 'empty' })
  })

  it('parses a single field-operator-value clause', () => {
    expect(parseNaturalLanguageQuery('performance below 60')).toEqual({
      kind: 'structured',
      filters: [{ field: 'performance', operator: 'lt', value: 60 }],
    })
    expect(parseNaturalLanguageQuery('budget over 1000000')).toEqual({
      kind: 'structured',
      filters: [{ field: 'budget', operator: 'gt', value: 1_000_000 }],
    })
    expect(parseNaturalLanguageQuery('budget over 1,000,000')).toEqual({
      kind: 'structured',
      filters: [{ field: 'budget', operator: 'gt', value: 1_000_000 }],
    })
  })

  it('parses AND-clauses including unit-as-field ("people")', () => {
    expect(
      parseNaturalLanguageQuery(
        'performance below 60 and more than 50 people',
      ),
    ).toEqual({
      kind: 'structured',
      filters: [
        { field: 'performance', operator: 'lt', value: 60 },
        { field: 'headcount', operator: 'gt', value: 50 },
      ],
    })
  })

  it('accepts operator synonyms and optional units', () => {
    expect(parseNaturalLanguageQuery('headcount under 20')).toEqual({
      kind: 'structured',
      filters: [{ field: 'headcount', operator: 'lt', value: 20 }],
    })
    expect(parseNaturalLanguageQuery('performance below 60%')).toEqual({
      kind: 'structured',
      filters: [{ field: 'performance', operator: 'lt', value: 60 }],
    })
    expect(parseNaturalLanguageQuery('budget over $250000')).toEqual({
      kind: 'structured',
      filters: [{ field: 'budget', operator: 'gt', value: 250_000 }],
    })
  })

  it('falls back to text search when the query is not a comparison', () => {
    expect(parseNaturalLanguageQuery('Engineering')).toEqual({
      kind: 'text',
      query: 'Engineering',
    })
    expect(parseNaturalLanguageQuery('performance below')).toEqual({
      kind: 'text',
      query: 'performance below',
    })
  })

  it('falls back for ranking queries and OR clauses (out of scope)', () => {
    expect(parseNaturalLanguageQuery('top 5 by performance')).toEqual({
      kind: 'text',
      query: 'top 5 by performance',
    })
    expect(
      parseNaturalLanguageQuery('performance below 60 or budget over 1000'),
    ).toEqual({
      kind: 'text',
      query: 'performance below 60 or budget over 1000',
    })
  })

  it('falls back when a unit contradicts the field', () => {
    expect(parseNaturalLanguageQuery('performance below 60 people')).toEqual({
      kind: 'text',
      query: 'performance below 60 people',
    })
  })
})
