import { entryToFile, MANUAL_LINKS_FIELD } from '../frontmatter.js';

const LOCAL_VAULT_KEY = 'jf-vault-local';
const DEMO_STATUS_KEY = 'jf-demo-seed-status';

function localDay(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayTime(offset, hour) {
  return `${localDay(offset)}T${String(hour).padStart(2, '0')}:00:00.000Z`;
}

function demoEntry(entry) {
  return {
    ...entry,
    id: `demo-full-${entry.id}`,
    links: (entry.links || []).map(id => `demo-full-${id}`),
    [MANUAL_LINKS_FIELD]: true,
  };
}

function projectRef(id) {
  return `demo-full-${id}`;
}

function templateFile(title, body) {
  return [
    '---',
    `title: ${title}`,
    'tags: [template, demo]',
    '---',
    body.trim(),
    '',
  ].join('\n');
}

function buildEntries() {
  return [
    demoEntry({
      id: 'project-command-center',
      type: 'project',
      title: 'JotFolio Command Center',
      tags: ['product', 'workspace', 'phase-2'],
      status: 'active',
      starred: true,
      space: 'Work',
      due: localDay(14),
      date: dayTime(-2, 9),
      notes: 'Main workspace buildout: capture, search, tasks, memory, safety, and Constellation should feel connected from the home screen.',
      links: ['note-shell-direction', 'task-dashboard-cards', 'task-inbox-rules', 'memory-screenshot-direction'],
    }),
    demoEntry({
      id: 'project-knowledge-ops',
      type: 'project',
      title: 'Knowledge Ops System',
      tags: ['research', 'memory', 'ai'],
      status: 'planning',
      starred: true,
      space: 'Research',
      due: localDay(21),
      date: dayTime(-5, 10),
      notes: 'Make saved knowledge useful without making anything feel fake. Memory needs sources, review dates, and clear links back to the vault.',
      links: ['memory-local-first', 'memory-ai-grounding', 'article-local-first'],
    }),
    demoEntry({
      id: 'project-client-launch',
      type: 'project',
      title: 'Client Launch Kit',
      tags: ['client', 'delivery', 'planning'],
      status: 'blocked',
      space: 'Work',
      due: localDay(7),
      date: dayTime(-7, 11),
      notes: 'Reusable launch checklist, task board, and capture flow for client projects.',
      links: ['task-recovery-copy', 'note-export-plan'],
    }),
    demoEntry({
      id: 'note-shell-direction',
      type: 'note',
      title: 'Shell Direction From Screenshots',
      tags: ['design', 'workspace', 'screenshots'],
      status: 'active',
      starred: true,
      project: projectRef('project-command-center'),
      space: 'Work',
      entry_date: localDay(-1),
      date: dayTime(-1, 15),
      notes: 'Home should act like the control room. Keep the dark workstation feel, but the blue desktop background from the screenshot should stay outside the app. Related: [[JotFolio Command Center]] and [[Screenshot Direction Decision]].',
      links: ['project-command-center', 'memory-screenshot-direction'],
    }),
    demoEntry({
      id: 'note-capture-flow',
      type: 'note',
      title: 'Capture Flow Sketch',
      tags: ['capture', 'inbox', 'ux'],
      status: 'draft',
      project: projectRef('project-command-center'),
      space: 'Work',
      entry_date: localDay(-1),
      date: dayTime(-1, 13),
      notes: 'Capture should suggest type, tags, target folder, project, backlinks, and a template. Raw items land in Inbox until processed.',
      links: ['raw-homepage-feedback', 'task-inbox-rules'],
    }),
    demoEntry({
      id: 'note-search-ranking',
      type: 'note',
      title: 'Search Ranking Notes',
      tags: ['search', 'tags', 'memory'],
      status: 'active',
      project: projectRef('project-knowledge-ops'),
      space: 'Research',
      entry_date: localDay(-3),
      date: dayTime(-3, 16),
      notes: 'Search should include titles, body text, tags, spaces, projects, tasks, memory, canvases, and smart views. Exact title matches should rise first.',
      links: ['project-knowledge-ops', 'memory-ai-grounding'],
    }),
    demoEntry({
      id: 'note-export-plan',
      type: 'note',
      title: 'Vault Export Plan',
      tags: ['safety', 'export', 'recovery'],
      status: 'active',
      project: projectRef('project-client-launch'),
      space: 'Work',
      entry_date: localDay(-4),
      date: dayTime(-4, 14),
      notes: 'Export should make it obvious what is included: entries, templates, canvases, bases, attachments, and recovery files.',
      links: ['project-client-launch', 'task-recovery-copy'],
    }),
    demoEntry({
      id: 'task-dashboard-cards',
      type: 'task',
      title: 'Tune Command Center Cards',
      tags: ['design', 'dashboard'],
      status: 'open',
      project: projectRef('project-command-center'),
      source_entry: projectRef('note-shell-direction'),
      space: 'Work',
      due: localDay(0),
      priority: 'high',
      completed: false,
      date: dayTime(0, 8),
      notes: 'Make sure pinned work, recent notes, and active projects all show useful sample states.',
      links: ['project-command-center', 'note-shell-direction'],
    }),
    demoEntry({
      id: 'task-inbox-rules',
      type: 'task',
      title: 'Review Inbox Triage Rules',
      tags: ['capture', 'inbox'],
      status: 'open',
      project: projectRef('project-command-center'),
      source_entry: projectRef('note-capture-flow'),
      space: 'Work',
      due: localDay(0),
      priority: 'urgent',
      completed: false,
      date: dayTime(0, 9),
      notes: 'Decide which raw captures become notes, tasks, links, or project material.',
      links: ['note-capture-flow', 'raw-homepage-feedback'],
    }),
    demoEntry({
      id: 'task-command-shortcuts',
      type: 'task',
      title: 'Connect Command Palette Shortcuts',
      tags: ['shortcuts', 'power-user'],
      status: 'open',
      project: projectRef('project-command-center'),
      space: 'Work',
      due: localDay(1),
      priority: 'medium',
      completed: false,
      date: dayTime(0, 10),
      notes: 'Every common action should be reachable from the keyboard.',
      links: ['project-command-center'],
    }),
    demoEntry({
      id: 'task-recovery-copy',
      type: 'task',
      title: 'Rewrite Recovery Copy',
      tags: ['safety', 'settings'],
      status: 'blocked',
      project: projectRef('project-client-launch'),
      space: 'Work',
      due: localDay(-1),
      priority: 'high',
      completed: false,
      date: dayTime(-2, 11),
      notes: 'Make trash, restore, export, and snapshots clear enough that a non-technical user trusts them.',
      links: ['note-export-plan', 'project-client-launch'],
    }),
    demoEntry({
      id: 'task-tag-manager',
      type: 'task',
      title: 'Map Tag Manager Actions',
      tags: ['tags', 'metadata'],
      status: 'open',
      project: projectRef('project-knowledge-ops'),
      space: 'Research',
      due: localDay(2),
      priority: 'medium',
      completed: false,
      date: dayTime(-1, 12),
      notes: 'Add rename, merge, alias, description, and color choices for real tag metadata.',
      links: ['note-search-ranking'],
    }),
    demoEntry({
      id: 'task-shell-shipped',
      type: 'task',
      title: 'Ship Local Shell Snapshot',
      tags: ['phase-2', 'done'],
      status: 'done',
      project: projectRef('project-command-center'),
      space: 'Work',
      due: localDay(-1),
      priority: 'low',
      completed: true,
      completed_at: dayTime(-1, 17),
      date: dayTime(-2, 9),
      notes: 'Baseline local shell is verified on port 5174.',
      links: ['project-command-center'],
    }),
    demoEntry({
      id: 'raw-homepage-feedback',
      type: 'raw',
      title: 'Screenshot feedback: homepage',
      tags: ['capture', 'screenshots'],
      status: 'captured',
      space: 'Inbox',
      date: dayTime(0, 11),
      notes: 'Homepage should match the screenshot flow: main page first, then navigate to everything else. Do not make the desktop backdrop part of the app.',
      links: ['note-shell-direction'],
    }),
    demoEntry({
      id: 'raw-constellation-style',
      type: 'raw',
      title: 'Voice note: constellation look',
      tags: ['capture', 'constellation'],
      status: 'captured',
      space: 'Inbox',
      date: dayTime(0, 12),
      notes: 'Keep the relationship map idea. Change the style so it feels like JotFolio, not the reference screenshot.',
      links: ['memory-screenshot-direction'],
    }),
    demoEntry({
      id: 'raw-import-export',
      type: 'raw',
      title: 'Clipboard capture: import/export idea',
      tags: ['capture', 'safety'],
      status: 'captured',
      space: 'Inbox',
      date: dayTime(-1, 18),
      notes: 'Need a clear path for JSON, Markdown, and full vault zip exports.',
      links: ['note-export-plan'],
    }),
    demoEntry({
      id: 'memory-local-first',
      type: 'wiki',
      title: 'Local-first Vault Principle',
      tags: ['memory', 'local-first', 'safety'],
      status: 'reviewed',
      project: projectRef('project-knowledge-ops'),
      space: 'Research',
      review_after: localDay(0),
      freshness: 'current',
      confidence: 0.94,
      source_type: 'vault',
      provenance: [projectRef('note-export-plan'), projectRef('article-local-first')],
      date: dayTime(-6, 9),
      notes: 'JotFolio should treat Markdown files as the durable source of truth. UI state can help, but vault files should remain portable.',
      links: ['note-export-plan', 'article-local-first', 'project-knowledge-ops'],
    }),
    demoEntry({
      id: 'memory-ai-grounding',
      type: 'wiki',
      title: 'Source-grounded AI Rule',
      tags: ['memory', 'ai', 'sources'],
      status: 'reviewed',
      project: projectRef('project-knowledge-ops'),
      space: 'Research',
      review_after: localDay(0),
      freshness: 'watch',
      confidence: 0.88,
      source_type: 'decision',
      provenance: [projectRef('note-search-ranking')],
      date: dayTime(-4, 10),
      notes: 'Assistant features only count when they cite the entries they used. No vague answer box, no hidden source mixing.',
      links: ['note-search-ranking', 'project-knowledge-ops'],
    }),
    demoEntry({
      id: 'memory-screenshot-direction',
      type: 'review',
      title: 'Screenshot Direction Decision',
      tags: ['memory', 'design', 'screenshots'],
      status: 'needs-review',
      project: projectRef('project-command-center'),
      space: 'Work',
      review_after: localDay(5),
      freshness: 'current',
      confidence: 0.82,
      source_type: 'feedback',
      provenance: [projectRef('note-shell-direction'), projectRef('raw-constellation-style')],
      date: dayTime(-1, 20),
      notes: 'Reference screenshots define layout and behavior. Constellation keeps the concept, but gets its own visual language.',
      links: ['note-shell-direction', 'raw-constellation-style'],
    }),
    demoEntry({
      id: 'article-local-first',
      type: 'article',
      title: 'Local-first Apps That Last',
      tags: ['reading', 'local-first', 'architecture'],
      status: 'read later',
      project: projectRef('project-knowledge-ops'),
      space: 'Research',
      url: 'https://example.com/local-first-apps',
      date: dayTime(-8, 15),
      notes: 'Useful reference for keeping personal knowledge tools portable, recoverable, and inspectable.',
      links: ['memory-local-first'],
    }),
    demoEntry({
      id: 'video-command-palette',
      type: 'video',
      title: 'Command Palette UX Teardown',
      tags: ['video', 'shortcuts', 'ux'],
      status: 'watching',
      project: projectRef('project-command-center'),
      space: 'Research',
      url: 'https://example.com/command-palette-ux',
      channel: 'Interface Notes',
      duration: '18m',
      date: dayTime(-2, 19),
      notes: 'Good examples of discoverable keyboard actions and compact action previews.',
      links: ['task-command-shortcuts'],
    }),
    demoEntry({
      id: 'podcast-deep-work',
      type: 'podcast',
      title: 'Deep Work Broadcast',
      tags: ['podcast', 'focus', 'systems'],
      status: 'saved',
      space: 'Personal',
      url: 'https://example.com/deep-work-broadcast',
      guest: 'Mara Quinn',
      episode: '118',
      highlight: 'Build quiet systems before adding more surface area.',
      date: dayTime(-10, 8),
      notes: 'Pairs well with the Command Center direction: fewer loud panels, more useful defaults.',
      links: ['note-shell-direction'],
    }),
    demoEntry({
      id: 'link-obsidian-bases',
      type: 'link',
      title: 'Obsidian Bases Reference',
      tags: ['link', 'smart-views', 'bases'],
      status: 'saved',
      space: 'Research',
      url: 'https://example.com/obsidian-bases',
      date: dayTime(-6, 13),
      notes: 'Reference point for smart views that stay file-backed instead of becoming hidden database state.',
      links: ['memory-local-first'],
    }),
    demoEntry({
      id: 'journal-today-review',
      type: 'journal',
      title: 'Daily JotFolio Review',
      tags: ['journal', 'reflection'],
      status: 'complete',
      space: 'Personal',
      entry_date: localDay(0),
      date: dayTime(0, 7),
      notes: 'Today: check the home page with realistic data, verify the right rail, then visit projects, tasks, search, spaces, tags, settings, and Constellation.',
      links: ['project-command-center', 'task-dashboard-cards'],
    }),
  ];
}

function buildFiles() {
  const files = {};
  const mtimes = {};
  const now = Date.now();
  const entries = buildEntries();

  for (const entry of entries) {
    const { path, content } = entryToFile(entry, candidate => candidate in files);
    files[path] = content;
    mtimes[path] = now;
  }

  files['bases/focus-queue.base.json'] = JSON.stringify({
    id: 'focus-queue',
    version: 1,
    name: 'Focus Queue',
    filters: [
      { key: 'status', op: 'in', value: ['open', 'active', 'blocked', 'planning'] },
      { key: 'due', op: 'exists' },
    ],
    sorts: [
      { key: 'due', dir: 'asc' },
      { key: 'priority', dir: 'asc' },
    ],
    columns: ['title', 'type', 'status', 'priority', 'due', 'project', 'tags'],
    activeViewId: 'table',
    views: [
      { id: 'table', type: 'table', name: 'Table' },
      { id: 'cards', type: 'cards', name: 'Cards' },
      { id: 'list', type: 'list', name: 'List' },
    ],
  }, null, 2);
  mtimes['bases/focus-queue.base.json'] = now;

  files['canvases/workspace-map.canvas.json'] = JSON.stringify({
    version: 1,
    id: 'workspace-map',
    name: 'Workspace Map',
    nodes: [
      { id: 'n1', type: 'file', file: 'demo-full-project-command-center', x: 80, y: 70, width: 240, height: 120 },
      { id: 'n2', type: 'file', file: 'demo-full-note-capture-flow', x: 420, y: 60, width: 240, height: 120 },
      { id: 'n3', type: 'file', file: 'demo-full-memory-local-first', x: 250, y: 260, width: 250, height: 120 },
      { id: 'n4', type: 'text', text: 'Demo map: projects, capture, memory, and safety all connect through the vault.', x: 620, y: 210, width: 280, height: 140 },
    ],
    edges: [
      { id: 'e1', fromNode: 'n1', toNode: 'n2', label: 'drives' },
      { id: 'e2', fromNode: 'n2', toNode: 'n3', label: 'feeds' },
      { id: 'e3', fromNode: 'n1', toNode: 'n3', label: 'protects' },
    ],
  }, null, 2);
  mtimes['canvases/workspace-map.canvas.json'] = now;

  files['templates/Daily Note.md'] = templateFile('Daily Note', [
    '# {{title}}',
    '',
    'Date: {{date}}',
    '',
    '## Focus',
    '- ',
    '',
    '## Captures',
    '- ',
    '',
    '## Follow-up',
    '- ',
  ].join('\n'));
  mtimes['templates/Daily Note.md'] = now;

  files['templates/Project Brief.md'] = templateFile('Project Brief', [
    '# {{title}}',
    '',
    '## Outcome',
    '',
    '## Current state',
    '',
    '## Next actions',
    '- [ ] ',
  ].join('\n'));
  mtimes['templates/Project Brief.md'] = now;

  return { files, mtimes };
}

export function buildFullDemoVaultStore() {
  const { files, mtimes } = buildFiles();
  const folders = {};
  const now = Date.now();
  [
    'projects',
    'notes',
    'tasks',
    'inbox',
    'wiki',
    'review',
    'articles',
    'videos',
    'podcasts',
    'links',
    'journals',
    'bases',
    'canvases',
    'templates',
  ].forEach(folder => { folders[folder] = now; });
  return { files, mtimes, folders };
}

function shouldSeedDemo(params) {
  return params.get('demo') === 'full' || params.get('mock') === 'full' || params.get('seed') === 'full';
}

function setFullDemoPreferences() {
  let existing = {};
  try {
    const raw = window.localStorage.getItem('mgn-p');
    existing = raw ? JSON.parse(raw) : {};
  } catch {
    existing = {};
  }

  window.localStorage.setItem('mgn-p', JSON.stringify({
    ...existing,
    theme: 'workstation',
    darkMode: 'dark',
    prefs: {
      ...(existing.prefs || {}),
      typeSaturation: 'signal',
      constellationBg: 'atlas',
      constellationSignalDefaultAlpha26: true,
    },
  }));
}

export function maybeSeedFullDemoVaultFromUrl() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (window.electron?.vault) return;

  const params = new URLSearchParams(window.location.search);
  if (!shouldSeedDemo(params)) return;

  const reset = params.get('reset') === '1' || params.get('resetDemo') === '1';
  const existingRaw = window.localStorage.getItem(LOCAL_VAULT_KEY);
  let existingFileCount = 0;
  try {
    const existing = existingRaw ? JSON.parse(existingRaw) : null;
    existingFileCount = existing && typeof existing.files === 'object'
      ? Object.keys(existing.files).length
      : 0;
  } catch {
    existingFileCount = 0;
  }

  if (existingFileCount > 0 && !reset) {
    window.localStorage.setItem(DEMO_STATUS_KEY, JSON.stringify({
      status: 'skipped',
      reason: 'existing-vault',
      existingFileCount,
      seededAt: new Date().toISOString(),
    }));
    return;
  }

  const store = buildFullDemoVaultStore();
  window.localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(store));
  window.localStorage.setItem('mgn-onboarded', JSON.stringify(true));
  setFullDemoPreferences();
  window.localStorage.setItem(DEMO_STATUS_KEY, JSON.stringify({
    status: 'seeded',
    fileCount: Object.keys(store.files).length,
    seededAt: new Date().toISOString(),
  }));
}
