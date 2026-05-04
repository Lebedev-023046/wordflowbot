import { Markup } from 'telegraf';
import type {
  CompletedFinishedSessionWordItem,
  FailedFinishedSessionWordItem,
  PendingFinishedSessionWordItem,
} from '../../../application/library/queries/GetFinishedSessionWordsUseCase';
import type { EntryUsage } from '../../../entities/entry/model/entry.types';

const WORDS_PAGE_SIZE = 10;
const FINISHED_SESSION_WORDS_CALLBACK_PREFIX = 'fsw';
const FINISHED_SESSION_WORDS_NOOP_CALLBACK = 'fsw:noop';
const FINISHED_SESSION_RENAME_CALLBACK_PREFIX = 'fsr';
const FINISHED_SESSION_BACK_CALLBACK_PREFIX = 'fsb';
const SHOW_ALL_VIEW = 'all';

export {
  FINISHED_SESSION_BACK_CALLBACK_PREFIX,
  FINISHED_SESSION_RENAME_CALLBACK_PREFIX,
  FINISHED_SESSION_WORDS_NOOP_CALLBACK,
};

export type FinishedSessionWordsView = EntryUsage | typeof SHOW_ALL_VIEW;

type ReadyPageKey = 'aPage' | 'bPage' | 'cPage';
type PaginationKey = ReadyPageKey | 'failedPage' | 'pendingPage';

const USAGE_ORDER: EntryUsage[] = ['A', 'B', 'C'];

const VIEW_LABELS: Record<FinishedSessionWordsView, string> = {
  A: 'Useful',
  B: 'Common',
  C: 'Rare',
  all: 'All',
};

interface PageSlice<T> {
  items: T[];
  page: number;
  totalPages: number;
}

interface ReadySection {
  items: CompletedFinishedSessionWordItem[];
  key: ReadyPageKey;
  label: string;
  page: PageSlice<CompletedFinishedSessionWordItem>;
}

export interface FinishedSessionWordsPageState {
  aPage: number;
  bPage: number;
  cPage: number;
  failedPage: number;
  pendingPage: number;
  view: FinishedSessionWordsView;
}

export function createFinishedSessionWordsCallbackData(
  sessionId: string,
  historyPage: number,
  state: FinishedSessionWordsPageState,
): string {
  return `${FINISHED_SESSION_WORDS_CALLBACK_PREFIX}:${sessionId}:${historyPage}:${state.view}:${state.aPage}${state.bPage}${state.cPage}${state.pendingPage}${state.failedPage}`;
}

export function parseFinishedSessionWordsCallbackData(value: string): {
  historyPage: number;
  pageState: FinishedSessionWordsPageState;
  sessionId: string;
} | null {
  const match = new RegExp(
    `^${FINISHED_SESSION_WORDS_CALLBACK_PREFIX}:(.+):(\\d+):(all|A|B|C):(\\d)(\\d)(\\d)(\\d)(\\d)$`,
  ).exec(value);

  if (!match) {
    return null;
  }

  const [
    ,
    sessionId,
    historyPage,
    view,
    aPage,
    bPage,
    cPage,
    pendingPage,
    failedPage,
  ] = match;

  return {
    historyPage: Number(historyPage),
    pageState: {
      aPage: Number(aPage),
      bPage: Number(bPage),
      cPage: Number(cPage),
      failedPage: Number(failedPage),
      pendingPage: Number(pendingPage),
      view: view as FinishedSessionWordsView,
    },
    sessionId,
  };
}

export function buildFinishedSessionWordsReply(
  title: string,
  completedItems: CompletedFinishedSessionWordItem[],
  pendingItems: PendingFinishedSessionWordItem[],
  failedItems: FailedFinishedSessionWordItem[],
  state: FinishedSessionWordsPageState,
): string {
  const lines = [title];
  const readySections = getReadySections(completedItems, state);

  for (const section of readySections) {
    lines.push('', buildSectionTitle(section));
    lines.push(...buildReadySectionLines(section));
  }

  if (pendingItems.length > 0) {
    lines.push(...buildPendingSectionLines(pendingItems, state.pendingPage));
  }

  if (failedItems.length > 0) {
    lines.push(...buildFailedSectionLines(failedItems, state.failedPage));
  }

  return lines.join('\n');
}

export function buildFinishedSessionWordsInlineKeyboard(
  sessionId: string,
  historyPage: number,
  completedItems: CompletedFinishedSessionWordItem[],
  pendingItems: PendingFinishedSessionWordItem[],
  failedItems: FailedFinishedSessionWordItem[],
  state: FinishedSessionWordsPageState,
) {
  const readySections = getReadySections(completedItems, state);
  const rows = [
    [
      createViewButton(sessionId, historyPage, 'A', state),
      createViewButton(sessionId, historyPage, 'B', state),
    ],
    [
      createViewButton(sessionId, historyPage, 'C', state),
      createViewButton(sessionId, historyPage, SHOW_ALL_VIEW, state),
    ],
  ];

  for (const section of readySections) {
    if (section.page.totalPages > 1) {
      rows.push(
        buildNavigationRow(
          sessionId,
          historyPage,
          section.label,
          state,
          section.page,
          section.key,
        ),
      );
    }
  }

  const pendingPage = getPageSlice(pendingItems, state.pendingPage);

  if (pendingPage.totalPages > 1) {
    rows.push(
      buildNavigationRow(
        sessionId,
        historyPage,
        'Processing',
        state,
        pendingPage,
        'pendingPage',
      ),
    );
  }

  const failedPage = getPageSlice(failedItems, state.failedPage);

  if (failedPage.totalPages > 1) {
    rows.push(
      buildNavigationRow(
        sessionId,
        historyPage,
        'Failed',
        state,
        failedPage,
        'failedPage',
      ),
    );
  }

  rows.push([
    Markup.button.callback(
      '✏️ Rename',
      `${FINISHED_SESSION_RENAME_CALLBACK_PREFIX}:${sessionId}:${historyPage}`,
    ),
    Markup.button.callback(
      '⬅ Back',
      `${FINISHED_SESSION_BACK_CALLBACK_PREFIX}:${historyPage}`,
    ),
  ]);

  return Markup.inlineKeyboard(rows);
}

function createViewButton(
  sessionId: string,
  historyPage: number,
  view: FinishedSessionWordsView,
  state: FinishedSessionWordsPageState,
) {
  return Markup.button.callback(
    state.view === view ? `✓ ${VIEW_LABELS[view]}` : VIEW_LABELS[view],
    state.view === view
      ? FINISHED_SESSION_WORDS_NOOP_CALLBACK
      : createFinishedSessionWordsCallbackData(sessionId, historyPage, {
          ...state,
          view,
        }),
  );
}

function getReadySections(
  completedItems: CompletedFinishedSessionWordItem[],
  state: FinishedSessionWordsPageState,
): ReadySection[] {
  const visibleUsages =
    state.view === SHOW_ALL_VIEW ? USAGE_ORDER : [state.view];

  return visibleUsages.map((usage) => {
    const sectionItems = completedItems.filter((item) => item.usage === usage);
    const key = getReadyPageKey(usage);

    return {
      items: sectionItems,
      key,
      label: VIEW_LABELS[usage],
      page: getPageSlice(sectionItems, state[key]),
    };
  });
}

function buildSectionTitle(section: ReadySection): string {
  return `${section.label}${formatPageSuffix(section.page)}`;
}

function buildReadySectionLines(section: ReadySection): string[] {
  if (section.page.items.length === 0) {
    return ['No ready words here yet.'];
  }

  return section.page.items.map((item, index) =>
    formatWordLine(item.text, item.translation, section.page.page, index),
  );
}

function buildPendingSectionLines(
  pendingItems: PendingFinishedSessionWordItem[],
  requestedPage: number,
): string[] {
  const pendingPage = getPageSlice(pendingItems, requestedPage);

  return [
    '',
    `Processing${formatPageSuffix(pendingPage)}:`,
    ...pendingPage.items.map((item, index) =>
      formatTextLine(item.text, pendingPage.page, index),
    ),
  ];
}

function buildFailedSectionLines(
  failedItems: FailedFinishedSessionWordItem[],
  requestedPage: number,
): string[] {
  const failedPage = getPageSlice(failedItems, requestedPage);

  return [
    '',
    `Failed${formatPageSuffix(failedPage)}:`,
    ...failedPage.items.map((item, index) =>
      formatTextLine(item.text, failedPage.page, index),
    ),
  ];
}

function buildNavigationRow(
  sessionId: string,
  historyPage: number,
  label: string,
  state: FinishedSessionWordsPageState,
  page: PageSlice<
    | CompletedFinishedSessionWordItem
    | PendingFinishedSessionWordItem
    | FailedFinishedSessionWordItem
  >,
  key: PaginationKey,
) {
  return [
    Markup.button.callback(
      '◀',
      createFinishedSessionWordsCallbackData(sessionId, historyPage, {
        ...state,
        [key]: page.page - 1,
      }),
      page.page === 0,
    ),
    Markup.button.callback(
      `${label} ${page.page + 1}/${page.totalPages}`,
      FINISHED_SESSION_WORDS_NOOP_CALLBACK,
    ),
    Markup.button.callback(
      '▶',
      createFinishedSessionWordsCallbackData(sessionId, historyPage, {
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

function formatTextLine(text: string, page: number, index: number): string {
  return `${page * WORDS_PAGE_SIZE + index + 1}. ${text}`;
}
