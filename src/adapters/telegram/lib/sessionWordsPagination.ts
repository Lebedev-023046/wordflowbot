import { Markup } from 'telegraf';
import type {
  CompletedSessionWordItem,
  FailedSessionWordItem,
} from '../../../application/use-cases/GetSessionWordsUseCase';
import type { EntryUsage } from '../../../entities/entry/model/entry.types';

const WORDS_PAGE_SIZE = 10;
const SESSION_WORDS_CALLBACK_PREFIX = 'session_words';
const SHOW_ALL_VIEW = 'all';

export const SESSION_WORDS_NOOP_CALLBACK = 'session_words:noop';

export type SessionWordsView = EntryUsage | typeof SHOW_ALL_VIEW;

type ReadyPageKey = 'aPage' | 'bPage' | 'cPage';
type PaginationKey = ReadyPageKey | 'failedPage';

const USAGE_ORDER: EntryUsage[] = ['A', 'B', 'C'];

const VIEW_LABELS: Record<SessionWordsView, string> = {
  A: '🔥 Most useful',
  B: '👌 Good to know',
  C: '🪶 Rarely used',
  all: '📚 Show all words',
};

interface PageSlice<T> {
  items: T[];
  page: number;
  totalPages: number;
}

interface ReadySection {
  items: CompletedSessionWordItem[];
  key: ReadyPageKey;
  label: string;
  page: PageSlice<CompletedSessionWordItem>;
  usage: EntryUsage;
}

export interface SessionWordsPageState {
  aPage: number;
  bPage: number;
  cPage: number;
  failedPage: number;
  view: SessionWordsView;
}

export function createSessionWordsCallbackData(
  state: SessionWordsPageState,
): string {
  return [
    SESSION_WORDS_CALLBACK_PREFIX,
    state.view,
    state.aPage,
    state.bPage,
    state.cPage,
    state.failedPage,
  ].join(':');
}

export function isSessionWordsCallbackData(value: string): boolean {
  return new RegExp(
    `^${SESSION_WORDS_CALLBACK_PREFIX}:(all|A|B|C):\\d+:\\d+:\\d+:\\d+$`,
  ).test(value);
}

export function parseSessionWordsCallbackData(
  value: string,
): SessionWordsPageState | null {
  if (!isSessionWordsCallbackData(value)) {
    return null;
  }

  const [, view, aPage, bPage, cPage, failedPage] = value.split(':');

  return {
    aPage: Number(aPage),
    bPage: Number(bPage),
    cPage: Number(cPage),
    failedPage: Number(failedPage),
    view: view as SessionWordsView,
  };
}

export function buildSessionWordsReply(
  completedItems: CompletedSessionWordItem[],
  failedItems: FailedSessionWordItem[],
  state: SessionWordsPageState,
): string {
  const lines = ['Words in your session:'];
  const readySections = getReadySections(completedItems, state);

  for (const section of readySections) {
    lines.push('', buildSectionTitle(section));
    lines.push(...buildReadySectionLines(section));
  }

  if (failedItems.length > 0) {
    lines.push(...buildFailedSectionLines(failedItems, state.failedPage));
  }

  return lines.join('\n');
}

export function buildSessionWordsInlineKeyboard(
  completedItems: CompletedSessionWordItem[],
  failedItems: FailedSessionWordItem[],
  state: SessionWordsPageState,
) {
  const readySections = getReadySections(completedItems, state);
  const rows = buildViewSelectorRows(state);

  for (const section of readySections) {
    if (section.page.totalPages > 1) {
      rows.push(
        buildNavigationRow(section.label, state, section.page, section.key),
      );
    }
  }

  const failedPage = getPageSlice(failedItems, state.failedPage);

  if (failedPage.totalPages > 1) {
    rows.push(buildNavigationRow('Failed', state, failedPage, 'failedPage'));
  }

  return Markup.inlineKeyboard(rows);
}

function buildViewSelectorRows(state: SessionWordsPageState) {
  return [
    ...USAGE_ORDER.map((usage) => [createViewButton(usage, state)]),
    [createViewButton(SHOW_ALL_VIEW, state)],
  ];
}

function createViewButton(
  view: SessionWordsView,
  state: SessionWordsPageState,
) {
  return Markup.button.callback(
    state.view === view ? `✓ ${VIEW_LABELS[view]}` : VIEW_LABELS[view],
    state.view === view
      ? SESSION_WORDS_NOOP_CALLBACK
      : createSessionWordsCallbackData({
          ...state,
          view,
        }),
  );
}

function getReadySections(
  completedItems: CompletedSessionWordItem[],
  state: SessionWordsPageState,
): ReadySection[] {
  const visibleUsages = getVisibleUsages(state.view);

  return visibleUsages.map((usage) => {
    const key = getReadyPageKey(usage);

    return {
      items: completedItems.filter((item) => item.usage === usage),
      key,
      label: VIEW_LABELS[usage],
      page: getPageSlice(
        completedItems.filter((item) => item.usage === usage),
        state[key],
      ),
      usage,
    };
  });
}

function getVisibleUsages(view: SessionWordsView): EntryUsage[] {
  return view === SHOW_ALL_VIEW ? USAGE_ORDER : [view];
}

function buildSectionTitle(section: ReadySection): string {
  return `${section.label}${formatPageSuffix(section.page)}:`;
}

function buildReadySectionLines(section: ReadySection): string[] {
  if (section.page.items.length === 0) {
    return ['No ready words yet.'];
  }

  return section.page.items.map((item, index) =>
    formatWordLine(item.text, item.translation, section.page.page, index),
  );
}

function buildFailedSectionLines(
  failedItems: FailedSessionWordItem[],
  requestedPage: number,
): string[] {
  const failedPage = getPageSlice(failedItems, requestedPage);

  return [
    '',
    `Failed${formatPageSuffix(failedPage)}:`,
    ...(failedPage.items.length > 0
      ? failedPage.items.map((item, index) =>
          formatFailedLine(item.text, failedPage.page, index),
        )
      : ['None.']),
  ];
}

function buildNavigationRow(
  label: string,
  state: SessionWordsPageState,
  page: PageSlice<CompletedSessionWordItem | FailedSessionWordItem>,
  key: PaginationKey,
) {
  return [
    Markup.button.callback(
      '◀',
      createSessionWordsCallbackData({
        ...state,
        [key]: page.page - 1,
      }),
      page.page === 0,
    ),
    Markup.button.callback(
      `${label} ${page.page + 1}/${page.totalPages}`,
      SESSION_WORDS_NOOP_CALLBACK,
    ),
    Markup.button.callback(
      '▶',
      createSessionWordsCallbackData({
        ...state,
        [key]: page.page + 1,
      }),
      page.page >= page.totalPages - 1,
    ),
  ];
}

function getReadyPageKey(usage: EntryUsage): ReadyPageKey {
  switch (usage) {
    case 'A':
      return 'aPage';
    case 'B':
      return 'bPage';
    case 'C':
      return 'cPage';
  }
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

function formatPageSuffix(page: PageSlice<unknown>): string {
  return page.totalPages > 1 ? ` (${page.page + 1}/${page.totalPages})` : '';
}

function formatWordLine(
  text: string,
  translation: string,
  page: number,
  index: number,
): string {
  return `${page * WORDS_PAGE_SIZE + index + 1}. ${text} - ${translation}`;
}

function formatFailedLine(text: string, page: number, index: number): string {
  return `${page * WORDS_PAGE_SIZE + index + 1}. ${text}`;
}
