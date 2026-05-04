import { FRONTMATTER_EXTRAS_FIELD } from '../frontmatter.js';
import { createLookupMaps } from '../index/vaultIndex.js';
import { parseWikilinks } from '../parser/wikilinks.js';

export const TEMPLATE_REFS_FIELD = 'template_refs';

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\\/g, '/');
}

function unique(values) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

export function templateReferenceKeys(template) {
  if (!template) return new Set();
  const path = String(template.path || template.id || '').replace(/\\/g, '/');
  const name = String(template.name || path.split('/').pop()?.replace(/\.md$/i, '') || '');
  const withoutExt = path.replace(/\.md$/i, '');
  return new Set([
    path,
    withoutExt,
    name,
    `${name}.md`,
    `templates/${name}`,
    `templates/${name}.md`,
  ].map(normalize).filter(Boolean));
}

export function getEntryTemplateRefs(entry) {
  const direct = entry?.[TEMPLATE_REFS_FIELD];
  const extra = entry?.[FRONTMATTER_EXTRAS_FIELD]?.[TEMPLATE_REFS_FIELD];
  const raw = Array.isArray(direct) ? direct : Array.isArray(extra) ? extra : direct || extra;
  if (Array.isArray(raw)) return unique(raw);
  if (typeof raw === 'string') {
    return unique(raw.split(',').map(part => part.trim()));
  }
  return [];
}

export function addTemplateUsageToEntry(entry, template) {
  if (!entry || !template?.path) return entry;
  const extras = entry[FRONTMATTER_EXTRAS_FIELD] && typeof entry[FRONTMATTER_EXTRAS_FIELD] === 'object'
    ? { ...entry[FRONTMATTER_EXTRAS_FIELD] }
    : {};
  const refs = unique([...getEntryTemplateRefs(entry), template.path]);
  return {
    ...entry,
    [FRONTMATTER_EXTRAS_FIELD]: {
      ...extras,
      [TEMPLATE_REFS_FIELD]: refs,
    },
  };
}

export function getTemplateIncoming(entries, template) {
  const keys = templateReferenceKeys(template);
  if (!keys.size) return [];
  return (entries || [])
    .map(entry => {
      const reasons = [];
      if (getEntryTemplateRefs(entry).some(ref => keys.has(normalize(ref)))) {
        reasons.push('applied');
      }
      const linked = parseWikilinks(entry?.notes || '')
        .some(link => keys.has(normalize(link.target)));
      if (linked) reasons.push('linked');
      return reasons.length ? { entry, reasons } : null;
    })
    .filter(Boolean)
    .sort((a, b) => String(a.entry?.title || '').localeCompare(String(b.entry?.title || '')));
}

export function getTemplateOutgoing(entries, template, bodyOverride) {
  const body = bodyOverride == null ? template?.body : bodyOverride;
  const links = parseWikilinks(body || '');
  const lookupMaps = createLookupMaps(entries || []);
  const seenResolved = new Set();
  const seenUnresolved = new Set();
  const resolved = [];
  const unresolved = [];

  links.forEach(link => {
    const key = normalize(link.target);
    const entryId = lookupMaps.lookup.get(key);
    if (entryId && lookupMaps.byId.has(entryId)) {
      if (seenResolved.has(entryId)) return;
      seenResolved.add(entryId);
      resolved.push({ ...link, entry: lookupMaps.byId.get(entryId) });
      return;
    }
    if (!key || seenUnresolved.has(key)) return;
    seenUnresolved.add(key);
    unresolved.push(link);
  });

  return { resolved, unresolved };
}
