import type { Session } from '../../entities/session/api/sessionRepository';

export function resolveSessionTitle(
  session: Pick<Session, 'createdAt' | 'endedAt' | 'title'>,
) {
  if (session.title && session.title.trim().length > 0) {
    return session.title;
  }

  return buildDefaultSessionTitle(getSessionDefaultTimestamp(session));
}

export function buildDefaultSessionTitle(endedAt: Date): string {
  return `session-${formatSessionTimestamp(endedAt)}`;
}

export function formatSessionEndDate(endedAt: Date): string {
  const parts = getDateParts(endedAt);

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hours}:${parts.minutes}`;
}

function formatSessionTimestamp(value: Date): string {
  const parts = getDateParts(value);

  return `${parts.year}-${parts.month}-${parts.day}-${parts.hours}-${parts.minutes}`;
}

function getSessionDefaultTimestamp(
  session: Pick<Session, 'createdAt' | 'endedAt'>,
) {
  return session.endedAt ?? session.createdAt;
}

function getDateParts(value: Date) {
  return {
    day: String(value.getDate()).padStart(2, '0'),
    hours: String(value.getHours()).padStart(2, '0'),
    minutes: String(value.getMinutes()).padStart(2, '0'),
    month: String(value.getMonth() + 1).padStart(2, '0'),
    year: String(value.getFullYear()),
  };
}
