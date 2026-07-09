import type { Session, SessionStatus } from '../types/api';

export const SESSION_STATUS_LABEL: Record<SessionStatus, string | null> = {
  COMPLETED: null,
  ONGOING: 'TRWA',
  ERROR: 'BŁĄD',
};

export const SESSION_SOURCE_LABEL: Record<Session['source'], string> = {
  BOT: '⬡ BOT',
  MANUAL: '✎ RĘCZNA',
};