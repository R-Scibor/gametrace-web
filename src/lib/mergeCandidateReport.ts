import type { ReportContext } from '../types/api';

export type MergeCandidateGameRef = { id: number; name: string };

/** Backend limit for POST /reports `message`. */
export const REPORT_MESSAGE_MAX = 4000;
export const MERGE_NOTE_MAX = 1000;

function normalizeName(name: string): string {
  return name.replace(/\s+/g, ' ').trim() || '—';
}

/**
 * Port of the mobile composeMergeCandidateMessage: a human-readable header plus
 * a machine-readable footer (`kind: merge_candidate`), so reports from web and
 * mobile look identical in the admin panel.
 */
export function composeMergeCandidateMessage(args: {
  source: MergeCandidateGameRef;
  target: MergeCandidateGameRef;
  note?: string;
}): string {
  const sourceName = normalizeName(args.source.name);
  const targetName = normalizeName(args.target.name);
  const footer = [
    '---',
    `source_id: ${args.source.id}`,
    `target_id: ${args.target.id}`,
    `source_name: ${sourceName}`,
    `target_name: ${targetName}`,
    'kind: merge_candidate',
  ].join('\n');
  const header = ['Zgłoszenie duplikatu gry', '', `Źródło: ${sourceName}`, `Kandydat: ${targetName}`].join('\n');

  const note = (args.note ?? '').trim();
  let body = note ? `${header}\n\n${note}\n\n${footer}` : `${header}\n\n${footer}`;
  if (body.length > REPORT_MESSAGE_MAX) {
    const overhead = body.length - note.length;
    const truncated = note.slice(0, Math.max(0, REPORT_MESSAGE_MAX - overhead));
    body = truncated ? `${header}\n\n${truncated}\n\n${footer}` : `${header}\n\n${footer}`;
    if (body.length > REPORT_MESSAGE_MAX) body = body.slice(0, REPORT_MESSAGE_MAX);
  }
  return body;
}

export function buildWebReportContext(screen: string): ReportContext {
  return {
    screen,
    platform: 'web',
    osVersion: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : 'unknown',
    appVersion: import.meta.env.VITE_APP_VERSION ?? 'web',
  };
}
