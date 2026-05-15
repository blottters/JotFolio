import { Suspense, lazy } from 'react';
import { ProgressPill, FirstSaveBanner, Day2ReturnCard } from '../../onboarding/nudges.jsx';
import { Toolbar } from '../toolbar/Toolbar.jsx';
import { EmptyState } from '../emptystate/EmptyState.jsx';
import { Card } from '../card/Card.jsx';
import { Row } from '../card/Row.jsx';
import { NotesWorkspaceView } from '../notes/NotesWorkspaceView.jsx';
import { TrashView } from '../trash/TrashView.jsx';
import { createEmptyBase } from '../../lib/base/baseTypes.js';
import {
  CalendarView,
  CommandCenterView,
  GlobalSearchView,
  InboxView,
  ProjectsView,
  SpacesView,
  TagManagerView,
  TasksView,
} from '../workstation/WorkstationViews.jsx';

const BaseExplorer = lazy(() => import('../bases/BaseExplorer.jsx').then(mod => ({ default: mod.BaseExplorer })));
const CanvasExplorer = lazy(() => import('../canvas/CanvasExplorer.jsx').then(mod => ({ default: mod.CanvasExplorer })));
const ConstellationView = lazy(() => import('../constellation/ConstellationView.jsx').then(mod => ({ default: mod.ConstellationView })));
const TemplatesPanel = lazy(() => import('../templates/TemplatesPanel.jsx').then(mod => ({ default: mod.TemplatesPanel })));

function projectBaseId(project = {}) {
  const source = String(project.id || project.title || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42) || 'project';
  return `project-${source}`;
}

function projectBaseRefs(project = {}) {
  return [project.id, project.title, project._path, project.path].filter(Boolean).map(String);
}

function baseMatchesProject(base, project) {
  const refs = new Set(projectBaseRefs(project));
  return (base?.filters || []).some(filter => {
    if (filter.key !== 'project') return false;
    const values = Array.isArray(filter.value)
      ? filter.value.map(String)
      : String(filter.value || '').split(',').map(value => value.trim()).filter(Boolean);
    return values.some(value => refs.has(value));
  });
}

function buildProjectSmartBase(project = {}) {
  const title = project.title || 'Project';
  return {
    ...createEmptyBase({ id: projectBaseId(project), name: `${title} Smart View` }),
    filters: [{ key: 'project', op: 'in', value: projectBaseRefs(project) }],
    sorts: [{ key: 'date', dir: 'desc' }],
    columns: ['title', 'type', 'status', 'tags', 'project'],
    activeViewId: 'table',
  };
}

function RouteLoading({ label = 'Loading workspace...' }) {
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--t3)', fontSize: 13 }}>
      {label}
    </div>
  );
}

function AIAssistantView({ onOpenAIKeys, onSearch }) {
  return (
    <section
      role="region"
      aria-label="AI Assistant"
      style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 28, background: 'var(--bg)' }}>
      <div style={{ maxWidth: 760 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 850, color: 'var(--tx)' }}>AI Assistant</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--t2)', fontSize: 14, lineHeight: 1.6 }}>
          Source-grounded AI is not enabled as an assistant route yet. JotFolio will only ship chat-style answers here once responses cite the exact vault material they used.
        </p>
        <div
          role="status"
          style={{ marginTop: 18, padding: 14, border: '1px solid var(--br)', borderRadius: 'var(--rd)', background: 'var(--b2)', color: 'var(--t2)', fontSize: 13, lineHeight: 1.55 }}>
          Current safe surface: configure bring-your-own-key provider settings in AI Keys, then use normal Search when you need to find notes, projects, tags, and memory without sending vault content to a model.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
          <button
            type="button"
            onClick={onOpenAIKeys}
            style={{ padding: '8px 13px', fontSize: 12, border: '1px solid var(--br)', borderRadius: 'var(--rd)', background: 'var(--ac)', color: 'var(--act)', cursor: 'pointer', fontFamily: 'var(--fn)', fontWeight: 800 }}>
            Open AI Keys
          </button>
          <button
            type="button"
            onClick={onSearch}
            style={{ padding: '8px 13px', fontSize: 12, border: '1px solid var(--br)', borderRadius: 'var(--rd)', background: 'transparent', color: 'var(--t2)', cursor: 'pointer', fontFamily: 'var(--fn)', fontWeight: 750 }}>
            Search vault instead
          </button>
        </div>
      </div>
    </section>
  );
}

export function AppRouteContent({
  section,
  currentCanvasId,
  currentBaseId,
  currentBase,
  templates,
  handleCreateTemplate,
  handleInsertTemplate,
  handleSaveTemplate,
  detailId,
  entries,
  selectedTemplateId,
  setSelectedTemplateId,
  setDetailId,
  trashItems,
  trashBusy,
  trashError,
  loadTrashItems,
  restoreTrashItem,
  permanentlyDeleteTrashItem,
  emptyTrash,
  workstationModel,
  userName,
  focusMode,
  onFocusModeChange,
  handleWorkstationNavigate,
  openAdd,
  onQuickCapture,
  query,
  setQuery,
  searchResults,
  onQuickSwitcher,
  onCommandPalette,
  onRevealEntry,
  onOpenInConstellation,
  projectRows,
  taskRows,
  calendarDays,
  spaces,
  setSection,
  openSettingsTab,
  setFilterTag,
  tagRows,
  renderSettingsPanel,
  canvases,
  visibleEntries,
  persistCanvas,
  persistBase,
  bases,
  onNewCanvas,
  confirmDeleteEntry,
  prefs,
  setPrefs,
  createFromMissing,
  constellationFocusId,
  filterStatus,
  setFilterStatus,
  sort,
  setSort,
  view,
  setView,
  hasFilters,
  clearFilters,
  sectionTitle,
  filtered,
  storageError,
  vaultError,
  loaded,
  activation,
  selectedIds,
  setSelectedIds,
  toggleSelected,
  updateEntry,
  handleCompileRaw,
  bulkTrashSelected,
  clearSelection,
  semantic,
}){
  const lazy = (children, label) => (
    <Suspense fallback={<RouteLoading label={label} />}>
      {children}
    </Suspense>
  );
  const openProjectSmartView = async project => {
    if (!project) return null;
    const existing = (bases || []).find(base => base.id === projectBaseId(project) || baseMatchesProject(base, project));
    if (existing) {
      setSection(`base:${existing.id}`);
      return existing;
    }
    const created = buildProjectSmartBase(project);
    await persistBase(created);
    setSection(`base:${created.id}`);
    return created;
  };
  if(section==='templates')return(
    lazy(<div style={{flex:1,overflow:'hidden'}}>
      <TemplatesPanel
        templates={templates}
        onCreate={handleCreateTemplate}
        onApplyToActive={handleInsertTemplate}
        onSave={handleSaveTemplate}
        activeEntryId={detailId}
        entries={entries}
        selectedTemplateId={selectedTemplateId}
        onSelectedTemplateChange={setSelectedTemplateId}
        onOpenEntry={setDetailId}/>
    </div>, 'Loading templates...')
  );
  if(section==='trash')return(
    <TrashView
      items={trashItems}
      busy={trashBusy}
      error={trashError}
      onRefresh={loadTrashItems}
      onRestore={restoreTrashItem}
      onPermanentDelete={permanentlyDeleteTrashItem}
      onEmptyTrash={emptyTrash}/>
  );
  if(section==='command')return(
    <CommandCenterView
      model={workstationModel}
      userName={userName}
      focusMode={focusMode}
      onFocusModeChange={onFocusModeChange}
      onOpenEntry={setDetailId}
      onNavigate={handleWorkstationNavigate}
      onAdd={openAdd}
      onQuickCapture={onQuickCapture}/>
  );
  if(section==='search')return(
    <GlobalSearchView
      query={query}
      setQuery={setQuery}
      results={searchResults}
      entries={visibleEntries}
      onOpenEntry={setDetailId}
      onQuickSwitcher={onQuickSwitcher}
      onCommandPalette={onCommandPalette}
      onRevealEntry={onRevealEntry}
      onNavigate={handleWorkstationNavigate}
      onOpenInConstellation={onOpenInConstellation}/>
  );
  if(section==='raw')return(
    <InboxView
      entries={visibleEntries}
      onOpenEntry={setDetailId}
      onUpdateEntry={updateEntry}
      onCompileRaw={handleCompileRaw}
      onBulkTrash={bulkTrashSelected}
      onAdd={openAdd}/>
  );
  if(section==='projects')return (
    <ProjectsView
      rows={projectRows}
      canvases={canvases}
      onOpenEntry={setDetailId}
      onAdd={openAdd}
      onNavigate={handleWorkstationNavigate}
      onNewCanvas={onNewCanvas}
      onCreateSmartView={openProjectSmartView}
      onRevealEntry={onRevealEntry}
      onUpdateEntry={updateEntry}/>
  );
  if(section==='note')return(
    <NotesWorkspaceView
      entries={visibleEntries}
      selectedEntryId={detailId}
      onOpenEntry={setDetailId}
      onAdd={openAdd}
      onRevealEntry={onRevealEntry}
      onOpenInConstellation={onOpenInConstellation}
      onCreateFromMissing={createFromMissing}
      onUpdateEntry={updateEntry}/>
  );
  if(section==='tasks')return <TasksView rows={taskRows} onOpenEntry={setDetailId} onAdd={openAdd} onUpdateEntry={updateEntry}/>;
  if(section==='calendar')return <CalendarView days={calendarDays} entries={visibleEntries} onOpenEntry={setDetailId} onNavigate={handleWorkstationNavigate} onAdd={openAdd}/>;
  if(section==='spaces')return <SpacesView spaces={spaces} onSelectSpace={id=>setSection(`space:${id}`)}/>;
  if(section==='tags')return <TagManagerView tags={tagRows} onSelectTag={tag=>{setFilterTag(tag);setSection('all')}}/>;
  if(section==='settings')return(
    <div style={{flex:1,minHeight:0,overflow:'hidden'}}>
      {renderSettingsPanel(true)}
    </div>
  );
  if(section==='ai')return(
    <AIAssistantView
      onOpenAIKeys={() => openSettingsTab ? openSettingsTab('ai') : setSection('settings')}
      onSearch={() => setSection('search')}/>
  );
  if(currentCanvasId)return lazy(
    <CanvasExplorer
      canvases={canvases}
      canvasId={currentCanvasId}
      entries={visibleEntries}
      onSelect={id=>setSection(`canvas:${id}`)}
      onCreate={persistCanvas}
      onCanvasChange={persistCanvas}
      onOpenEntry={setDetailId}
      onClose={()=>setSection('all')}/>,
    'Loading canvas...'
  );
  if(currentBaseId)return lazy(
    <BaseExplorer
      entries={visibleEntries}
      base={currentBase}
      onBaseChange={persistBase}
      onCreateBase={persistBase}
      onOpenEntry={setDetailId}
      onDeleteEntry={confirmDeleteEntry}/>,
    'Loading base...'
  );
  if(section==='graph')return lazy(
    <ConstellationView entries={visibleEntries} onOpen={setDetailId} onBack={()=>setSection('all')} onAdd={openAdd}
      layoutMode={prefs.defaultLayoutMode||'messy'}
      onLayoutModeChange={mode=>setPrefs(p=>({...p,defaultLayoutMode:mode}))}
      onCreateFromMissing={createFromMissing}
      focusEntryId={constellationFocusId}
      flags={prefs.featureFlags}
      style={prefs.constellationStyle||'star'}
      saturation={prefs.typeSaturation||'signal'}
      bg={prefs.constellationBg||'atlas'}
      getSimilar={semantic?.getSimilar}
      semanticReady={!!semantic?.ready}
      semanticVersion={semantic?.snapshot?.version||0}/>,
    'Loading knowledge graph...'
  );
  return(
    <>
      <Toolbar query={query} setQuery={setQuery} section={section}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        sort={sort} setSort={setSort} view={view} setView={setView}
        hasFilters={hasFilters} onClear={clearFilters}
        onOpenSettings={()=>{setSection('settings')}}/>
      <div style={{padding:'10px 14px 0',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
          <h2 style={{margin:0,fontSize:17,fontWeight:700}}>{sectionTitle}</h2>
          <span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} item{filtered.length!==1?'s':''}</span>
          {section==='all'&&<ProgressPill count={visibleEntries.length}/>}
        </div>
      </div>
      {section==='all'&&visibleEntries.length<3&&activation.showDay2&&(
        <Day2ReturnCard count={visibleEntries.length} onAdd={openAdd} lastEntryTitle={visibleEntries[0]?.title}/>
      )}
      {section==='all'&&visibleEntries.length===1&&!activation.showDay2&&(
        <FirstSaveBanner count={visibleEntries.length} onAdd={openAdd}/>
      )}
      <div style={{flex:1,overflowY:'auto',padding:14}}>
        {storageError?(<div role="alert" style={{margin:14,padding:14,border:'1px solid #ef4444',borderRadius:'var(--rd)',background:'rgba(239,68,68,0.08)',color:'#ef4444',fontSize:13,lineHeight:1.5}}>
          <div style={{fontWeight:700,marginBottom:4}}>Storage recovery needed</div>
          <div>JotFolio found corrupt browser storage at <code>{storageError.key}</code>. A quarantine copy was written to <code>{storageError.quarantineKey||'a quarantine key'}</code>, and writes are blocked until that data is recovered or cleared.</div>
        </div>)
        :vaultError?(<div role="alert" style={{margin:14,padding:14,border:'1px solid #ef4444',borderRadius:'var(--rd)',background:'rgba(239,68,68,0.08)',color:'#ef4444',fontSize:13}}>Vault error: {vaultError.message}</div>)
        :!loaded?(<div style={{textAlign:'center',padding:'80px 20px',color:'var(--t3)'}}>Loading...</div>)
        :filtered.length===0?(<EmptyState section={section} onAdd={openAdd} hasFilters={hasFilters} onClear={clearFilters} query={query} flags={prefs.featureFlags}/>)
        :(<>
          {selectedIds.size>0&&(
            <div style={{position:'sticky',top:0,zIndex:2,marginBottom:10,padding:10,background:'var(--b2)',border:'1px solid var(--br)',borderRadius:'var(--rd)',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:12,fontWeight:700,color:'var(--tx)',flex:1}}>{selectedIds.size} selected</span>
              <button type="button" onClick={()=>setSelectedIds(new Set(filtered.map(entry=>entry.id)))} style={{padding:'5px 10px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>Select view</button>
              <button type="button" onClick={bulkTrashSelected} style={{padding:'5px 10px',fontSize:11,border:'1px solid #b91c1c',borderRadius:'var(--rd)',background:'transparent',color:'#b91c1c',cursor:'pointer',fontFamily:'var(--fn)',fontWeight:700}}>Move to trash</button>
              <button type="button" onClick={clearSelection} style={{padding:'5px 10px',fontSize:11,border:'1px solid var(--br)',borderRadius:'var(--rd)',background:'transparent',color:'var(--t2)',cursor:'pointer',fontFamily:'var(--fn)'}}>Clear</button>
            </div>
          )}
          {view==='grid'?(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:12}}>
              {filtered.map(entry=><Card key={entry.id} entry={entry} prefs={prefs} selected={selectedIds.has(entry.id)} onSelectChange={on=>toggleSelected(entry.id,on)} onStar={()=>updateEntry(entry.id,{starred:!entry.starred})} onOpen={()=>setDetailId(entry.id)} onDelete={()=>confirmDeleteEntry(entry.id)}/>)}
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {filtered.map(entry=><Row key={entry.id} entry={entry} prefs={prefs} selected={selectedIds.has(entry.id)} onSelectChange={on=>toggleSelected(entry.id,on)} onStar={()=>updateEntry(entry.id,{starred:!entry.starred})} onOpen={()=>setDetailId(entry.id)} onDelete={()=>confirmDeleteEntry(entry.id)}/>)}
            </div>
          )}
        </>)}
      </div>
    </>
  );
}
