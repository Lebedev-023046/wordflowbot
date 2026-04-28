import { Markup } from 'telegraf';
import type {
  CompletedSessionWordItem,
  FailedSessionWordItem,
} from '../../../application/use-cases/GetSessionWordsUseCase';

const WORDS_PAGE_SIZE = 10;
const SESSION_WORDS_CALLBACK_PREFIX = 'session_words';
export const SESSION_WORDS_NOOP_CALLBACK = 'session_words:noop';

interface PageSlice<T> {
  items: T[];
  page: number;
  totalPages: number;
}

export interface SessionWordsPageState {
  completedPage: number;
  failedPage: number;
}

export function createSessionWordsCallbackData(
  state: SessionWordsPageState,
): string {
  return `${SESSION_WORDS_CALLBACK_PREFIX}:${state.completedPage}:${state.failedPage}`;
}

export function isSessionWordsCallbackData(value: string): boolean {
  return new RegExp(`^${SESSION_WORDS_CALLBACK_PREFIX}:\\d+:\\d+$`).test(value);
}

export function parseSessionWordsCallbackData(
  value: string,
): SessionWordsPageState | null {
  if (!isSessionWordsCallbackData(value)) {
    return null;
  }

  const [, completedPage, failedPage] = value.split(':');

  return {
    completedPage: Number(completedPage),
    failedPage: Number(failedPage),
  };
}

export function buildSessionWordsReply(
  completedItems: CompletedSessionWordItem[],
  failedItems: FailedSessionWordItem[],
  state: SessionWordsPageState,
): string {
  const completedSlice = getPageSlice(completedItems, state.completedPage);
  const failedSlice = getPageSlice(failedItems, state.failedPage);

  const lines = [
    'Words in your session:',
    '',
    `Ready pairs${completedSlice.totalPages > 1 ? ` (${completedSlice.page + 1}/${completedSlice.totalPages})` : ''}:`,
    ...(completedSlice.items.length > 0
      ? completedSlice.items.map(
          (item, index) =>
            `${completedSlice.page * WORDS_PAGE_SIZE + index + 1}. ${item.text} - ${item.translation}`,
        )
      : ['None yet.']),
  ];

  if (failedItems.length > 0) {
    lines.push(
      '',
      `Failed${failedSlice.totalPages > 1 ? ` (${failedSlice.page + 1}/${failedSlice.totalPages})` : ''}:`,
      ...(failedSlice.items.length > 0
        ? failedSlice.items.map(
            (item, index) =>
              `${failedSlice.page * WORDS_PAGE_SIZE + index + 1}. ${item.text}`,
          )
        : ['None.']),
    );
  }

  return lines.join('\n');
}

export function buildSessionWordsInlineKeyboard(
  completedItems: CompletedSessionWordItem[],
  failedItems: FailedSessionWordItem[],
  state: SessionWordsPageState,
) {
  const rows = [];
  const completedSlice = getPageSlice(completedItems, state.completedPage);
  const failedSlice = getPageSlice(failedItems, state.failedPage);

  if (completedSlice.totalPages > 1) {
    rows.push(
      buildNavigationRow('Ready', state, completedSlice, 'completedPage'),
    );
  }

  if (failedSlice.totalPages > 1) {
    rows.push(buildNavigationRow('Failed', state, failedSlice, 'failedPage'));
  }

  return rows.length > 0 ? Markup.inlineKeyboard(rows) : undefined;
}

function buildNavigationRow(
  label: string,
  state: SessionWordsPageState,
  slice: PageSlice<CompletedSessionWordItem | FailedSessionWordItem>,
  key: 'completedPage' | 'failedPage',
) {
  const previousState = {
    ...state,
    [key]: slice.page - 1,
  };
  const nextState = {
    ...state,
    [key]: slice.page + 1,
  };

  return [
    Markup.button.callback(
      '◀',
      createSessionWordsCallbackData(previousState),
      slice.page === 0,
    ),
    Markup.button.callback(
      `${label} ${slice.page + 1}/${slice.totalPages}`,
      SESSION_WORDS_NOOP_CALLBACK,
    ),
    Markup.button.callback(
      '▶',
      createSessionWordsCallbackData(nextState),
      slice.page >= slice.totalPages - 1,
    ),
  ];
}

function getPageSlice<T>(items: T[], requestedPage: number): PageSlice<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / WORDS_PAGE_SIZE));
  const page = clampPage(requestedPage, totalPages);
  const start = page * WORDS_PAGE_SIZE;

  return {
    items: items.slice(start, start + WORDS_PAGE_SIZE),
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
