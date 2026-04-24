import { useEffect, useState } from 'react'
import { readActivation, dismissNudge } from './activation.js'

export function ProgressPill({ count }) {
  if (count >= 3) return null
  return (
    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'var(--ac)', color: 'var(--act)', fontWeight: 700, marginLeft: 6 }} aria-label={`${count} of 3 to activate`}>
      {count}/3
    </span>
  )
}

export function FirstSaveBanner({ count, onAdd }) {
  const a = readActivation()
  const [dismissed, setDismissed] = useState(a.bannersDismissed.includes('post-first-banner'))
  if (dismissed || count !== 1 || count >= 3) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--b2)', border: '1px solid var(--ac)', borderRadius: 'var(--rd)', margin: '0 20px 14px', fontSize: 13, color: 'var(--tx)' }}>
      <span style={{ flex: 1 }}>First save logged. Add 2 more to unlock your graph.</span>
      <button onClick={onAdd} style={{ padding: '5px 12px', fontSize: 12, background: 'var(--ac)', color: 'var(--act)', border: 'none', borderRadius: 'var(--rd)', cursor: 'pointer', fontWeight: 700 }}>+ Add another</button>
      <button aria-label="Dismiss" onClick={() => { dismissNudge('post-first-banner'); setDismissed(true) }} style={{ padding: '2px 8px', fontSize: 14, background: 'transparent', border: 'none', color: 'var(--t3)', cursor: 'pointer' }}>×</button>
    </div>
  )
}

export function Day2ReturnCard({ count, onAdd, lastEntryTitle }) {
  const a = readActivation()
  const [dismissed, setDismissed] = useState(a.bannersDismissed.includes('day2-return'))
  if (dismissed) return null
  return (
    <div style={{ maxWidth: 420, margin: '60px auto 0', textAlign: 'center', padding: '24px 20px', background: 'var(--b2)', border: '1px solid var(--br)', borderRadius: 'var(--rd)' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>Welcome back.</div>
      <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 14 }}>
        Yesterday you saved <em>"{lastEntryTitle || 'your first entry'}"</em>. {3 - count} more and your graph comes alive.
      </div>
      <button onClick={onAdd} style={{ padding: '8px 16px', fontSize: 13, background: 'var(--ac)', color: 'var(--act)', border: 'none', borderRadius: 'var(--rd)', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--fn)', marginRight: 8 }}>+ Add another</button>
      <button onClick={() => { dismissNudge('day2-return'); setDismissed(true) }} style={{ padding: '8px 12px', fontSize: 12, background: 'transparent', border: '1px solid var(--br)', borderRadius: 'var(--rd)', color: 'var(--t2)', cursor: 'pointer', fontFamily: 'var(--fn)' }}>Not now</button>
    </div>
  )
}

export function ActivationToast({ visible, onDone }) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [visible, onDone])
  if (!visible) return null
  return (
    <div role="status" style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 500, padding: '14px 22px', background: 'var(--ac)', color: 'var(--act)', borderRadius: 'var(--rd)', fontWeight: 700, fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
      ✦ Your graph is live. Three saves, one thread.
    </div>
  )
}

export function GraphLockOverlay({ count, onAdd }) {
  if (count >= 3) return null
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 48 }} aria-hidden="true">✦</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)' }}>Graph unlocks at 3 entries.</div>
      <div style={{ fontSize: 13, color: 'var(--t2)' }}>You have {count}.</div>
      <button onClick={onAdd} style={{ padding: '8px 16px', fontSize: 13, background: 'var(--ac)', color: 'var(--act)', border: 'none', borderRadius: 'var(--rd)', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--fn)', marginTop: 6 }}>+ Add another</button>
    </div>
  )
}
