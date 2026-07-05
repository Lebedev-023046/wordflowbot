const MAX_VISIBLE_READY_ITEMS = 10;
const MAX_VISIBLE_FAILED_ITEMS = 10;

function formatItems(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

function formatNeedsAnotherTry(count: number): string {
  return `${formatItems(count)} ${count === 1 ? 'needs' : 'need'} another try`;
}

function formatHiddenItems(count: number): string {
  return `...and ${formatItems(count)} more.`;
}

function formatLimitedLines<T>(
  items: T[],
  maxVisibleItems: number,
  renderItem: (item: T, index: number) => string,
): string[] {
  const visibleItems = items.slice(0, maxVisibleItems);
  const hiddenCount = items.length - visibleItems.length;
  const lines = visibleItems.map((item, index) => renderItem(item, index));

  if (hiddenCount > 0) {
    lines.push(formatHiddenItems(hiddenCount));
  }

  return lines;
}

export const messages = {
  library: {
    historyEmpty: 'No finished sessions yet.',
    sessionWordsEmpty: 'No saved words in this session yet.',
    renamePrompt: (currentTitle: string) =>
      [
        'Send a new session name.',
        '',
        'Examples:',
        'Podcast',
        'Lesson 8',
        'Article about health',
        '',
        `Current name: ${currentTitle}`,
      ].join('\n'),
    renamed: (title: string) => `Session renamed.\n\n${title}`,
    sessionMissing: 'That finished session is no longer available.',
  },
  session: {
    active:
      'Your session is open.\n\nKeep adding words, open Current session, or export what is ready.',
    alreadyActive:
      'Your session is already open.\n\nKeep adding words, open Current session, or export what is ready.',
    clearCancelled: 'Your words stay in the current session.',
    cleared: (clearedEntries: number) =>
      `🧹 Cleared ${formatItems(clearedEntries)}. The session stays active.`,
    clearConfirm:
      'Clear all words from this session? The session stays active.',
    exportChoose: 'Export this session with examples:',
    emptyExport: '📭 Nothing is ready to export yet.',
    emptyExportForFilter: (label: string) =>
      `📭 No ready words in ${label} yet.`,
    idle: 'Start a session first, then send words or phrases.',
    noActive: 'ℹ️ You do not have an active session right now.',
    noWordsYet: 'You have not added any words yet.',
    promptStart: [
      'Send English words from any article, video, book, or lesson.',
      '',
      'I will:',
      '• save them as one session',
      '• add translations',
      '• prepare examples for export',
      '',
      'Examples are in the export file.',
      'Translations are visible here in Telegram.',
    ].join('\n'),
    returningStart: (sessionsCompleted: number, wordsCollected: number) =>
      [
        'Ready to collect more words?',
        '',
        'You can start a new session or reopen a past one.',
        ...(wordsCollected > 0
          ? [
              '',
              `📊 ${formatItems(wordsCollected)} collected across ${sessionsCompleted} ${sessionsCompleted === 1 ? 'session' : 'sessions'}.`,
            ]
          : []),
      ].join('\n'),
    started: [
      'Session started.',
      '',
      'Send:',
      '• one word per line',
      '• a pasted list',
      '• or words separated by semicolons',
    ].join('\n'),
    stopCancelled: 'Your session stays active.',
    stopConfirm:
      'Finish this session?\nYou can reopen it anytime in Past sessions.',
    stopRenameOffer: 'Name this session now, or do it later in Past sessions.',
    stopped: [
      'Session finished.',
      '',
      'Find it anytime in Past sessions.',
      'You can open it, rename it, or export it later.',
    ].join('\n'),
  },
  status: {
    active: ({
      completedEntries,
      completedEntrySummaries,
      failedEntries,
      failedEntriesCount,
      pendingEntries,
      totalEntries,
    }: {
      completedEntries: number;
      completedEntrySummaries: Array<{
        text: string;
        translation: string;
      }>;
      failedEntries: Array<{
        errorMessage: string;
        text: string;
      }>;
      failedEntriesCount: number;
      pendingEntries: number;
      totalEntries: number;
    }) =>
      [
        `Saved: ${formatItems(totalEntries)}`,
        `Processing: ${formatItems(pendingEntries)}`,
        `Ready: ${formatItems(completedEntries)}`,
        failedEntriesCount > 0
          ? `Retry: ${formatItems(failedEntriesCount)}`
          : null,
        completedEntrySummaries.length > 0 ? '' : null,
        completedEntrySummaries.length > 0 ? 'Ready:' : null,
        ...formatLimitedLines(
          completedEntrySummaries,
          MAX_VISIBLE_READY_ITEMS,
          (entry) => `${entry.text} - ${entry.translation}`,
        ),
        failedEntries.length > 0 ? '' : null,
        failedEntries.length > 0 ? 'Need retry:' : null,
        ...formatLimitedLines(
          failedEntries,
          MAX_VISIBLE_FAILED_ITEMS,
          (entry, index) =>
            `${index + 1}. ${entry.text} - ${entry.errorMessage}`,
        ),
        failedEntries.length > 0 ? '' : null,
        failedEntries.length > 0
          ? 'Tap Retry failed or use /retry_failed.'
          : null,
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),
  },
  entries: {
    duplicatesOnly: 'These words are already in your current session.',
    empty: 'Please send at least one word or phrase.',
    insufficientQuota:
      'I could not finish those items right now. They stay saved, and you can try Retry failed.',
    processedWithFailures: (failedCount: number) =>
      `I could not finish ${formatItems(failedCount)} this time. They stay saved, and you can try Retry failed.`,
    processing: (count: number) =>
      `Saved ${formatItems(count)}. Processing now.`,
    processingCompleted: (succeededCount: number) =>
      [
        `${formatItems(succeededCount)} ready.`,
        '',
        'Send more words, or open Current session.',
        'Examples will be in the export file.',
      ].join('\n'),
    processingFinished: (succeededCount: number, failedCount: number) =>
      [
        `${formatItems(succeededCount)} ready. ${formatNeedsAnotherTry(failedCount)}.`,
        '',
        'Send more words, or open Current session.',
        'Examples will be in the export file.',
      ].join('\n'),
    processingNoCompleted: (failedCount: number) =>
      `No items finished this time. ${formatNeedsAnotherTry(failedCount)}.`,
    retrying: (count: number) => `🔄 Trying ${formatItems(count)} again...`,
    retryNothingFailed: 'There is nothing to retry right now.',
    saved: (count: number) => `Saved ${formatItems(count)}.`,
  },
  rename: {
    empty: 'Please send a non-empty session title.',
  },
  help: {
    text: [
      'How WordFlowBot works:',
      '',
      '1. Start a session.',
      '2. Send English words or phrases, one per line, semicolon-separated, or pasted as a block.',
      '3. The bot saves them and adds a Russian translation in the background.',
      '4. Finish the session and export a CSV with examples for ReWord.',
      '',
      'Usage levels on saved words:',
      '🔥 Useful - learn first',
      '👌 Common - good to know',
      '🪶 Rare - can skip',
      '',
      'Commands:',
      '/start - open the home screen',
      '/words - show the current session',
      '/status - show progress and errors',
      '/retry_failed - retry words that failed enrichment',
      '/settings - change what you are studying',
      '/help - show this message',
    ].join('\n'),
  },
  onboarding: {
    chooseLanguage:
      'Welcome to WordFlowBot!\n\nWhich language do you want to learn?',
    chooseLevel: (languageLabel: string) =>
      `Great choice: ${languageLabel}.\n\nWhat is your current level?`,
    completed: (languageLabel: string, level: string) =>
      `All set. You are studying ${languageLabel} at ${level} level.\n\nYou can change this anytime with /settings.`,
  },
  settings: {
    overview: (languageLabel: string, level: string) =>
      ['Settings', '', `Studying: ${languageLabel}`, `Level: ${level}`].join(
        '\n',
      ),
    chooseLanguage: 'Which language do you want to study?',
    chooseLevel: (languageLabel: string) =>
      `What is your ${languageLabel} level?`,
    languageChanged: (languageLabel: string, level: string) =>
      `Now studying ${languageLabel} at ${level} level.`,
    levelChanged: (languageLabel: string, level: string) =>
      `${languageLabel} level set to ${level}.`,
  },
} as const;
