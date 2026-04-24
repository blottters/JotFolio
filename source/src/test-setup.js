import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

// Provide a clean localStorage before each test
beforeEach(() => {
  localStorage.clear()
})
