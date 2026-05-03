import { useEffect, useState } from 'react'
import { SOURCES } from '../parsers/index.js'
import { setOnboarded, logEvent } from './activation.js'
import { ImportModal } from './ImportModal.jsx'

export function WelcomePanel({ onImport, onPickTheme, onOpenAdd, onOpenGraph, onClose }) {
  const [activeSource, setActiveSource] = useState(null)

  const skip = () => {
    logEvent('onboard.skip')
    setOnboarded(true)
    onClose()
  }

  useEffect(() => {
    const h = e => { if (e.key === 'Escape' && !activeSource) skip() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [activeSource])

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="welcome-title"
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', padding: '32px 28px', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 8 }}>Welcome to JotFolio</div>
        <h2 id="welcome-title" style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--tx)' }}>Your local-first synthesis vault</h2>
        <p style={{ margin: '6px 0 12px', color: 'var(--t2)', fontSize: 13, lineHeight: 1.55 }}>
          JotFolio turns mixed media into durable markdown: notes, videos, podcasts, articles, journals, and links all become <strong>entries</strong> in a vault folder you control.
        </p>
        <div style={{ display: 'grid', gap: 6, marginBottom: 18, fontSize: 12, color: 'var(--t3)', lineHeight: 1.45 }}>
          <div><strong style={{ color: 'var(--tx)' }}>Vault</strong>: your source of truth is local markdown, not a locked database.</div>
          <div><strong style={{ color: 'var(--tx)' }}>Keyword Library</strong>: user-authored rules can tag and link entries as you save.</div>
          <div><strong style={{ color: 'var(--tx)' }}>Constellation + Canvas</strong>: map relationships and arrange working sets when synthesis matters.</div>
          <div><strong style={{ color: 'var(--tx)' }}>Plugins and AI</strong>: supporting layers, not the reason your data stays useful.</div>
        </div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 10 }}>Import existing material</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SOURCES.map(src => (
            <button key={src.id} type="button" onClick={() => { logEvent('onboard.import.clicked', { source: src.id }); setActiveSource(src) }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--b2)', border: '1px solid var(--br)', borderRadius: 'var(--rd)', color: 'var(--tx)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 13, textAlign: 'left' }}>
              <span style={{ fontSize: 18 }} aria-hidden="true">{src.icon}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{src.label}</span>
              <span style={{ color: 'var(--t3)', fontSize: 14 }}>›</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--br)' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 10 }}>Or start from scratch</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <QuickAction icon="📝" label="Create your first entry" onClick={() => { logEvent('onboard.fresh.entry'); setOnboarded(true); onOpenAdd() }} />
            <QuickAction icon="🎨" label="Pick a theme" onClick={() => { logEvent('onboard.fresh.theme'); setOnboarded(true); onPickTheme() }} />
            <QuickAction icon="✦" label="Open Constellation" onClick={() => { logEvent('onboard.fresh.graph'); setOnboarded(true); onOpenGraph() }} />
          </div>
        </div>
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <button onClick={skip} style={{ padding: '6px 12px', fontSize: 11, background: 'transparent', border: 'none', color: 'var(--t3)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--fn)' }}>
            Skip — show empty library
          </button>
        </div>
      </div>
      {activeSource && (
        <ImportModal source={activeSource} onClose={() => setActiveSource(null)} onComplete={entries => {
          logEvent('onboard.import.completed', { source: activeSource.id, count: entries.length })
          setActiveSource(null)
          setOnboarded(true)
          onImport(entries)
        }} />
      )}
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
