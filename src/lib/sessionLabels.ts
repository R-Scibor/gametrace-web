import i18n from '../i18n';
import type { Session, SessionStatus } from '../types/api';

export function sessionStatusLabel(status: SessionStatus): string | null {
  if (status === 'COMPLETED') return null;
  return i18n.t(`common:session.status.${status}`);
}

export function sessionSourceLabel(source: Session['source']): string {
  return i18n.t(`common:session.source.${source}`);
}

/** Runtime map so existing `SESSION_STATUS_LABEL[status]` call sites re-resolve after language change. */
export const SESSION_STATUS_LABEL: Record<SessionStatus, string | null> = {
  get COMPLETED() {
    return null;
  },
  get ONGOING() {
    return sessionStatusLabel('ONGOING');
  },
  get ERROR() {
    return sessionStatusLabel('ERROR');
  },
};

/** Runtime map so existing `SESSION_SOURCE_LABEL[source]` call sites re-resolve after language change. */
export const SESSION_SOURCE_LABEL: Record<Session['source'], string> = {
  get BOT() {
    return sessionSourceLabel('BOT');
  },
  get MANUAL() {
    return sessionSourceLabel('MANUAL');
  },
};
