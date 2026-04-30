import { Markup } from 'telegraf';
import type { SessionHistoryItem } from '../../../application/use-cases/GetSessionHistoryUseCase';

const HISTORY_PAGE_SIZE = 5;
const HISTORY_CALLBACK_PREFIX = 'library_history';

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
  const title = page.totalPages > 1 ? `Your history (${page.page + 1}/${page.totalPages})` : 'Your history';

  return [
    title,
    '',
    ...page.items.flatMap((item, index) => [
      `${page.page * HISTORY_PAGE_SIZE + index + 1}. ${item.title}`,
      `Ended: ${item.endedAtLabel}`,
      `Completed words: ${item.completedWords}`,
      '',
    ]),
  ]
    .slice(0, -1)
    .join('\n');
}

export function buildLibraryHistoryInlineKeyboard(
  items: SessionHistoryItem[],
  requestedPage: number,
) {
  const page = getPageSlice(items, requestedPage);

  if (page.totalPages <= 1) {
    return Markup.inlineKeyboard([]);
  }

  return Markup.inlineKeyboard([
    [
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
    ],
  ]);
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
