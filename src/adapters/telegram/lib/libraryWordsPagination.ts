import { Markup } from 'telegraf';
import type { LibraryWordItem } from '../../../application/library/queries/GetLibraryWordsUseCase';
import type { EntryUsage } from '../../../entities/entry/model/entry.types';

const WORDS_PAGE_SIZE = 10;
const LIBRARY_WORDS_CALLBACK_PREFIX = 'library_words';
const SHOW_ALL_VIEW = 'all';

export const LIBRARY_WORDS_NOOP_CALLBACK = 'library_words:noop';

export type LibraryWordsView = EntryUsage | typeof SHOW_ALL_VIEW;

type ReadyPageKey = 'aPage' | 'bPage' | 'cPage';

const USAGE_ORDER: EntryUsage[] = ['A', 'B', 'C'];

const VIEW_LABELS: Record<LibraryWordsView, string> = {
  A: '🔥 Most useful',
  B: '👌 Good to know',
  C: '🪶 Rarely used',
  all: '📚 All words',
};

interface PageSlice<T> {
  items: T[];
  page: number;
  totalPages: number;
}

interface ReadySection {
  items: LibraryWordItem[];
  key: ReadyPageKey;
  label: string;
  page: PageSlice<LibraryWordItem>;
}

export interface LibraryWordsPageState {
  aPage: number;
  bPage: number;
  cPage: number;
  view: LibraryWordsView;
}

export function parseLibraryWordsCallbackData(
  value: string,
): LibraryWordsPageState | null {
  if (
    !new RegExp(
      `^${LIBRARY_WORDS_CALLBACK_PREFIX}:(all|A|B|C):\\d+:\\d+:\\d+$`,
    ).test(value)
  ) {
    return null;
  }

  const [, view, aPage, bPage, cPage] = value.split(':');

  return {
    aPage: Number(aPage),
    bPage: Number(bPage),
    cPage: Number(cPage),
    view: view as LibraryWordsView,
  };
}

export function buildLibraryWordsReply(
  items: LibraryWordItem[],
  state: LibraryWordsPageState,
): string {
  const lines = ['My words'];
  const sections = getReadySections(items, state);

  for (const section of sections) {
    lines.push('', buildSectionTitle(section));
    lines.push(...buildReadySectionLines(section));
  }

  return lines.join('\n');
}

export function buildLibraryWordsInlineKeyboard(
  items: LibraryWordItem[],
  state: LibraryWordsPageState,
) {
  const sections = getReadySections(items, state);
  const rows = [
    ...USAGE_ORDER.map((usage) => [createViewButton(usage, state)]),
    [createViewButton(SHOW_ALL_VIEW, state)],
  ];

  for (const section of sections) {
    if (section.page.totalPages > 1) {
      rows.push(
        buildNavigationRow(section.label, state, section.page, section.key),
      );
    }
  }

  return Markup.inlineKeyboard(rows);
}

function createLibraryWordsCallbackData(state: LibraryWordsPageState): string {
  return [
    LIBRARY_WORDS_CALLBACK_PREFIX,
    state.view,
    state.aPage,
    state.bPage,
    state.cPage,
  ].join(':');
}

function createViewButton(
  view: LibraryWordsView,
  state: LibraryWordsPageState,
) {
  return Markup.button.callback(
    state.view === view ? `✓ ${VIEW_LABELS[view]}` : VIEW_LABELS[view],
    state.view === view
      ? LIBRARY_WORDS_NOOP_CALLBACK
      : createLibraryWordsCallbackData({
          ...state,
          view,
        }),
  );
}

function getReadySections(
  items: LibraryWordItem[],
  state: LibraryWordsPageState,
): ReadySection[] {
  const visibleUsages =
    state.view === SHOW_ALL_VIEW ? USAGE_ORDER : [state.view];

  return visibleUsages.map((usage) => {
    const sectionItems = items.filter((item) => item.usage === usage);
    const key = getReadyPageKey(usage);

    return {
      items: sectionItems,
      key,
      label: VIEW_LABELS[usage],
      page: getPageSlice(sectionItems, state[key]),
    };
  });
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

function buildSectionTitle(section: ReadySection): string {
  return `${section.label}${formatPageSuffix(section.page)}:`;
}

function buildReadySectionLines(section: ReadySection): string[] {
  if (section.items.length === 0) {
    return ['No words in this filter yet.'];
  }

  return section.page.items.map(
    (item, index) =>
      `${section.page.page * WORDS_PAGE_SIZE + index + 1}. ${item.text} - ${item.translation}`,
  );
}

function buildNavigationRow(
  label: string,
  state: LibraryWordsPageState,
  page: PageSlice<LibraryWordItem>,
  key: ReadyPageKey,
) {
  return [
    Markup.button.callback(
      '◀',
      createLibraryWordsCallbackData({
        ...state,
        [key]: page.page - 1,
      }),
      page.page === 0,
    ),
    Markup.button.callback(
      `${label} ${page.page + 1}/${page.totalPages}`,
      LIBRARY_WORDS_NOOP_CALLBACK,
    ),
    Markup.button.callback(
      '▶',
      createLibraryWordsCallbackData({
        ...state,
        [key]: page.page + 1,
      }),
      page.page >= page.totalPages - 1,
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

function formatPageSuffix(page: PageSlice<unknown>): string {
  return page.totalPages > 1 ? ` (${page.page + 1}/${page.totalPages})` : '';
}
