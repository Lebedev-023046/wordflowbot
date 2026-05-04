import { Markup } from 'telegraf';
import type { SessionHistoryItem } from '../../../application/library/queries/GetLibraryHistoryUseCase';

const HISTORY_PAGE_SIZE = 5;
const HISTORY_CALLBACK_PREFIX = 'library_history';
const HISTORY_VIEW_WORDS_CALLBACK_PREFIX = 'library_history_words';
const HISTORY_RENAME_CALLBACK_PREFIX = 'library_history_rename';

export const LIBRARY_HISTORY_NOOP_CALLBACK = 'library_history:noop';

interface PageSlice<T> {
  items: T[];
  page: number;
  totalPages: number;
}

export function parseLibraryHistoryCallbackData(value: string): number | null {
  if (!new RegExp(`^${HISTORY_CALLBACK_PREFIX}:\\d+$`).test(value)) {
    return null;
  }

  const [, page] = value.split(':');
  return Number(page);
}

export function buildLibraryHistoryReply(
  items: SessionHistoryItem[],
  requestedPage: number,
): string {
  const page = getPageSlice(items, requestedPage);
  return page.totalPages > 1
    ? `📖 Session history\nTap a session below to open it.\nPage ${page.page + 1}/${page.totalPages}`
    : '📖 Session history\nTap a session below to open it.';
}

export function buildLibraryHistoryInlineKeyboard(
  items: SessionHistoryItem[],
  requestedPage: number,
) {
  const page = getPageSlice(items, requestedPage);
  const rows = page.items.map((item, index) => [
    Markup.button.callback(
      `${page.page * HISTORY_PAGE_SIZE + index + 1}. ${item.title}`,
      createLibraryHistoryViewWordsCallbackData(item.id, page.page),
    ),
  ]);

  if (page.totalPages > 1) {
    rows.push([
      Markup.button.callback(
        '◀',
        `${HISTORY_CALLBACK_PREFIX}:${page.page - 1}`,
        page.page === 0,
      ),
      Markup.button.callback(
        `History ${page.page + 1}/${page.totalPages}`,
        LIBRARY_HISTORY_NOOP_CALLBACK,
      ),
      Markup.button.callback(
        '▶',
        `${HISTORY_CALLBACK_PREFIX}:${page.page + 1}`,
        page.page >= page.totalPages - 1,
      ),
    ]);
  }

  return Markup.inlineKeyboard(rows);
}

export function createLibraryHistoryRenameCallbackData(
  sessionId: string,
  page: number,
) {
  return `${HISTORY_RENAME_CALLBACK_PREFIX}:${sessionId}:${page}`;
}

export function createLibraryHistoryViewWordsCallbackData(
  sessionId: string,
  page: number,
) {
  return `${HISTORY_VIEW_WORDS_CALLBACK_PREFIX}:${sessionId}:${page}`;
}

function getPageSlice<T>(items: T[], requestedPage: number): PageSlice<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / HISTORY_PAGE_SIZE));
  const page = clampPage(requestedPage, totalPages);
  const start = page * HISTORY_PAGE_SIZE;

  return {
    items: items.slice(start, start + HISTORY_PAGE_SIZE),
    page,
    totalPages,
  };
}

function clampPage(requestedPage: number, totalPages: number): number {
  if (!Number.isFinite(requestedPage) || requestedPage < 0) {
    return 0;
  }

  if (requestedPage >= totalPages) {
    return totalPages - 1;
  }

  return requestedPage;
}
