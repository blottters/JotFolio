import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { WelcomePanel } from './WelcomePanel.jsx'

function renderPanel(props = {}) {
  return render(
    <>
      <button type="button">Outside</button>
      <WelcomePanel
        onOpenAdd={vi.fn()}
        onLoadSample={vi.fn()}
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

    const firstAction = screen.getByRole('button', { name: 'Create first note' })
    await waitFor(() => expect(firstAction).toHaveFocus())
    expect(screen.getByRole('button', { name: 'Outside' })).not.toHaveFocus()
  })

  it('keeps Tab focus inside the dialog', async () => {
    renderPanel()

    const firstAction = screen.getByRole('button', { name: 'Create first note' })
    const skip = screen.getByRole('button', { name: /Skip/ })
    await waitFor(() => expect(firstAction).toHaveFocus())

    skip.focus()
    fireEvent.keyDown(skip, { key: 'Tab' })
    expect(firstAction).toHaveFocus()

    fireEvent.keyDown(firstAction, { key: 'Tab', shiftKey: true })
    expect(skip).toHaveFocus()
  })

  it('shows exactly the four blank-vault starter actions', () => {
    renderPanel()

    expect(screen.getByRole('button', { name: 'Create first note' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Capture raw thought' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create project' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Load sample vault' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Readwise/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pick a theme/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Open Constellation/ })).not.toBeInTheDocument()
  })
})
