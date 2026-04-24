import { describe, it, expect } from 'vitest'

describe('test setup', () => {
  it('has localStorage', () => {
    localStorage.setItem('k', 'v')
    expect(localStorage.getItem('k')).toBe('v')
  })
})
