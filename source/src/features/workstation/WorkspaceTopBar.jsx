import { useEffect, useMemo, useRef, useState } from 'react';

const barStyle = {
  height: 60,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '0 24px',
  borderBottom: '1px solid var(--br)',
  background: 'rgba(9,14,20,.98)',
};

const iconButtonStyle = {
  width: 32,
  height: 32,
  border: 'none',
  borderRadius: 8,
  background: 'transparent',
  color: 'var(--t2)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontFamily: 'var(--fn)',
  fontSize: 20,
  lineHeight: 1,
};

function navButtonStyle(enabled) {
  return {
    ...iconButtonStyle,
    opacity: enabled ? 1 : .35,
    cursor: enabled ? 'pointer' : 'default',
  };
}

const utilityButtonStyle = {
  minHeight: 34,
  border: '1px solid var(--br)',
  borderRadius: 8,
  background: 'rgba(255,255,255,.035)',
  color: 'var(--tx)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
  fontFamily: 'var(--fn)',
  fontSize: 13,
  fontWeight: 650,
  padding: '0 14px',
};

function UtilityIcon({ label, children, onClick }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} style={iconButtonStyle}>
      {children}
    </button>
  );
}

function TopSearchPopover({ id, query, results, activeIndex, onActiveIndex, onOpen, onOpenFullSearch }) {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return null;

  return (
    <div
      id={id}
      role="listbox"
      aria-label="Top search results"
      style={{
        position: 'absolute',
        zIndex: 80,
        top: 42,
        left: 0,
        right: 0,
        border: '1px solid rgba(118,137,160,.28)',
        borderRadius: 8,
        background: '#0d131b',
        boxShadow: '0 18px 50px rgba(0,0,0,.44)',
        overflow: 'hidden',
      }}>
      {results.length === 0 ? (
        <div style={{ padding: '14px 14px', color: 'var(--t3)', fontSize: 12 }}>
          No matches for "{cleanQuery}".
        </div>
      ) : results.map((result, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={result.id}
            id={`${id}-option-${index}`}
            type="button"
            role="option"
            aria-selected={active}
            onMouseEnter={() => onActiveIndex(index)}
            onMouseDown={event => event.preventDefault()}
            onClick={() => onOpen(result)}
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: '26px 1fr auto',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              border: 'none',
              borderTop: index === 0 ? 'none' : '1px solid rgba(118,137,160,.12)',
              background: active ? 'rgba(77,141,255,.16)' : 'transparent',
              color: 'var(--tx)',
              fontFamily: 'var(--fn)',
              textAlign: 'left',
              cursor: 'pointer',
            }}>
            <span aria-hidden="true" style={{ color: result.color || 'var(--t3)', fontSize: 15 }}>{result.icon || '▣'}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.title}</span>
              <span style={{ display: 'block', marginTop: 3, color: 'var(--t3)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.subtitle}</span>
            </span>
            <span style={{ color: 'var(--t2)', fontSize: 11, fontWeight: 700 }}>{result.typeLabel}</span>
          </button>
        );
      })}
      <button
        type="button"
        onMouseDown={event => event.preventDefault()}
        onClick={onOpenFullSearch}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: 'none',
          borderTop: '1px solid rgba(118,137,160,.18)',
          background: 'rgba(255,255,255,.035)',
          color: 'var(--t2)',
          fontFamily: 'var(--fn)',
          fontSize: 12,
          fontWeight: 750,
          cursor: 'pointer',
        }}>
        Open full Search
      </button>
    </div>
  );
}

export function WorkspaceTopBar({
  query,
  setQuery,
  searchResults = [],
  onOpenSearchResult,
  onCapture,
  onQuickSwitcher,
  onCommandPalette,
  onSearchActivate,
  onSettings,
  onBack,
  onForward,
  canGoBack = false,
  canGoForward = false,
  userName = 'Gavin',
}) {
  const searchWrapRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const cleanQuery = String(query || '').trim();
  const hasResults = searchResults.length > 0;
  const listboxId = 'workspace-top-search-results';
  const visibleResults = useMemo(() => searchResults.slice(0, 8), [searchResults]);

  useEffect(() => {
    setActiveIndex(0);
  }, [cleanQuery, visibleResults.length]);

  const closeSearch = () => setSearchOpen(false);
  const openFullSearch = () => {
    closeSearch();
    onSearchActivate?.();
  };
  const openResult = result => {
    closeSearch();
    onOpenSearchResult?.(result);
  };

  const initials = String(userName || 'Gavin')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'G';
  return (
    <header className="mgn-topbar" style={barStyle}>
      <div className="mgn-topbar-window-controls" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 99, background: '#ff5f57', boxShadow: '0 0 0 1px rgba(0,0,0,.24)' }} />
        <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 99, background: '#ffbd2e', boxShadow: '0 0 0 1px rgba(0,0,0,.24)' }} />
        <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 99, background: '#28c840', boxShadow: '0 0 0 1px rgba(0,0,0,.24)' }} />
      </div>

      <div className="mgn-topbar-brand" style={{ fontSize: 17, fontWeight: 800, color: 'var(--tx)', minWidth: 120 }}>JotFolio</div>

      <div className="mgn-topbar-nav" style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <button type="button" aria-label="Back" title="Back" onClick={onBack} disabled={!canGoBack} style={navButtonStyle(canGoBack)}>‹</button>
        <button type="button" aria-label="Forward" title="Forward" onClick={onForward} disabled={!canGoForward} style={navButtonStyle(canGoForward)}>›</button>
      </div>

      <div
        ref={searchWrapRef}
        onBlur={event => {
          if (!searchWrapRef.current?.contains(event.relatedTarget)) closeSearch();
        }}
        className="mgn-topbar-search"
        style={{ position: 'relative', width: 'min(460px,42vw)', minWidth: 300 }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', fontSize: 16 }}>⌕</span>
        <input
          aria-label="Search notes, projects, people, tags"
          role="combobox"
          aria-expanded={searchOpen && Boolean(cleanQuery)}
          aria-controls={listboxId}
          aria-activedescendant={searchOpen && hasResults ? `${listboxId}-option-${activeIndex}` : undefined}
          value={query}
          onFocus={() => setSearchOpen(true)}
          onChange={event => {
            setQuery?.(event.target.value);
            setSearchOpen(true);
          }}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              if (searchOpen) {
                event.preventDefault();
                closeSearch();
                return;
              }
              setQuery?.('');
            }
            if (event.key === 'ArrowDown' && cleanQuery) {
              event.preventDefault();
              setSearchOpen(true);
              setActiveIndex(index => Math.min(index + 1, Math.max(visibleResults.length - 1, 0)));
            }
            if (event.key === 'ArrowUp' && cleanQuery) {
              event.preventDefault();
              setSearchOpen(true);
              setActiveIndex(index => Math.max(index - 1, 0));
            }
            if (event.key === 'Enter' && cleanQuery) {
              event.preventDefault();
              if (visibleResults[activeIndex]) openResult(visibleResults[activeIndex]);
              else openFullSearch();
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
              event.preventDefault();
              event.stopPropagation();
              openFullSearch();
            }
          }}
          placeholder="Search notes, projects, people, tags..."
          style={{
            width: '100%',
            height: 36,
            boxSizing: 'border-box',
            padding: '0 54px 0 40px',
            border: '1px solid var(--br)',
            borderRadius: 8,
            background: 'rgba(255,255,255,.035)',
            color: 'var(--tx)',
            outline: 'none',
            fontFamily: 'var(--fn)',
            fontSize: 13,
          }}
        />
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', fontSize: 12 }}>⌘K</span>
        {searchOpen && (
          <TopSearchPopover
            id={listboxId}
            query={query}
            results={visibleResults}
            activeIndex={activeIndex}
            onActiveIndex={setActiveIndex}
            onOpen={openResult}
            onOpenFullSearch={openFullSearch}/>
        )}
      </div>

      <div className="mgn-topbar-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="mgn-topbar-capture" type="button" onClick={onCapture} aria-label="Capture" style={{ ...utilityButtonStyle, minHeight: 36 }}>
          <span aria-hidden="true" style={{ fontSize: 17 }}>⊕</span> Capture
        </button>
        <UtilityIcon label="Quick Actions" onClick={onQuickSwitcher}>⚡</UtilityIcon>
        <button type="button" aria-label="User profile" title="User profile" onClick={onSettings} style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          border: '1px solid var(--br)',
          background: 'linear-gradient(135deg,#d7a17b,#93c5fd)',
          display: 'grid',
          placeItems: 'center',
          color: '#10141b',
          fontWeight: 850,
          fontSize: 13,
          flexShrink: 0,
          cursor: 'pointer',
        }}>
          {initials}
        </button>
      </div>
    </header>
  );
}
