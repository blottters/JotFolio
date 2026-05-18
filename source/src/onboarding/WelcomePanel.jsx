import { useEffect, useRef } from 'react'
import { setOnboarded, logEvent } from './activation.js'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusableElements(root) {
  if (!root) return []
  return [...root.querySelectorAll(FOCUSABLE_SELECTOR)]
    .filter(el => el.getAttribute('aria-hidden') !== 'true')
}

function containTabFocus(event, root) {
  if (event.key !== 'Tab') return
  const focusable = getFocusableElements(root)
  if (!focusable.length) {
    event.preventDefault()
    return
  }
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement
  if (event.shiftKey) {
    if (!root.contains(active) || active === first) {
      event.preventDefault()
      last.focus()
    }
    return
  }
  if (!root.contains(active) || active === last) {
    event.preventDefault()
    first.focus()
  }
}

export function WelcomePanel({ onOpenAdd, onLoadSample, onClose }) {
  const dialogRef = useRef(null)

  const getFocusRoot = () => dialogRef.current

  const skip = () => {
    logEvent('onboard.skip')
    setOnboarded(true)
    onClose()
  }

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') skip() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      getFocusableElements(getFocusRoot())[0]?.focus()
    }, 0)
    return () => clearTimeout(t)
  }, [])

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="welcome-title"
      ref={dialogRef}
      onKeyDown={e => containTabFocus(e, getFocusRoot())}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', padding: '32px 28px', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 8 }}>Welcome to JotFolio</div>
        <h2 id="welcome-title" style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--tx)' }}>Your local-first synthesis vault</h2>
        <p style={{ margin: '6px 0 12px', color: 'var(--t2)', fontSize: 13, lineHeight: 1.55 }}>
          JotFolio turns working material into durable markdown: notes, articles, journals, links, projects, tasks, and canvases all become <strong>entries</strong> in a vault folder you control.
        </p>
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 10 }}>Start here</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
            <QuickAction icon="▤" label="Create first note" onClick={() => { logEvent('onboard.fresh.note'); setOnboarded(true); onOpenAdd?.({ type: 'note' }) }} />
            <QuickAction icon="▱" label="Capture raw thought" onClick={() => { logEvent('onboard.fresh.raw'); setOnboarded(true); onOpenAdd?.({ type: 'raw' }) }} />
            <QuickAction icon="▭" label="Create project" onClick={() => { logEvent('onboard.fresh.project'); setOnboarded(true); onOpenAdd?.({ type: 'project' }) }} />
            <QuickAction icon="◇" label="Load sample vault" onClick={() => { logEvent('onboard.sample'); setOnboarded(true); onLoadSample?.() }} />
          </div>
        </div>
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <button onClick={skip} style={{ padding: '6px 12px', fontSize: 11, background: 'transparent', border: 'none', color: 'var(--t3)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--fn)' }}>
            Skip — show empty workspace
          </button>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--cd)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', color: 'var(--tx)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 13, textAlign: 'left' }}>
      <span style={{ fontSize: 16 }} aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  )
}
