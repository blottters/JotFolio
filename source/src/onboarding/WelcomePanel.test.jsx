import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { WelcomePanel } from './WelcomePanel.jsx'

function renderPanel(props = {}) {
  return render(
    <>
      <button type="button">Outside</button>
      <WelcomePanel
        onImport={vi.fn()}
        onPickTheme={vi.fn()}
        onOpenAdd={vi.fn()}
        onOpenGraph={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />
    </>
  )
}

describe('WelcomePanel accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('moves initial focus into the dialog', async () => {
    renderPanel()

    const firstImport = screen.getByRole('button', { name: /Readwise/ })
    await waitFor(() => expect(firstImport).toHaveFocus())
    expect(screen.getByRole('button', { name: 'Outside' })).not.toHaveFocus()
  })

  it('keeps Tab focus inside the dialog', async () => {
    renderPanel()

    const firstImport = screen.getByRole('button', { name: /Readwise/ })
    const skip = screen.getByRole('button', { name: /Skip/ })
    await waitFor(() => expect(firstImport).toHaveFocus())

    skip.focus()
    fireEvent.keyDown(skip, { key: 'Tab' })
    expect(firstImport).toHaveFocus()

    fireEvent.keyDown(firstImport, { key: 'Tab', shiftKey: true })
    expect(skip).toHaveFocus()
  })
})
