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
    menu: 'Library',
    noWordsYet: 'No saved words yet.',
    sessionWordsEmpty: 'No words were saved in this session yet.',
    renamePrompt: (currentTitle: string) =>
      [
        'Reply with the session name.',
        '',
        `Current title: ${currentTitle}`,
      ].join('\n'),
    renamed: (title: string) => `✏️ Session renamed to: ${title}`,
    sessionMissing: 'That finished session is no longer available.',
    statistics: ({
      activeSession,
      finishedSessions,
      totalWords,
      usageA,
      usageB,
      usageC,
    }: {
      activeSession: boolean;
      finishedSessions: number;
      totalWords: number;
      usageA: number;
      usageB: number;
      usageC: number;
    }) =>
      [
        'Library stats',
        '',
        `Saved words: ${totalWords}`,
        `Finished sessions: ${finishedSessions}`,
        `Active session: ${activeSession ? 'yes' : 'no'}`,
        '',
        'Usage split',
        `🔥 Most useful: ${usageA}`,
        `👌 Good to know: ${usageB}`,
        `🪶 Rarely used: ${usageC}`,
      ].join('\n'),
  },
  session: {
    active:
      'Session is active.\n\nSend words or phrases:\n• one per line\n• as a list\n• or separated with semicolons\n\nIn the bot you will see translations only.\nExamples are in the exported file.',
    alreadyActive:
      'You already have an active session.\n\nSend words or phrases:\n• one per line\n• as a list\n• or separated with semicolons\n\nIn the bot you will see translations only.\nExamples are in the exported file.',
    clearCancelled: 'Your words stay in the current session.',
    cleared: (clearedEntries: number) =>
      `🧹 Cleared ${formatItems(clearedEntries)}. The session stays active.`,
    clearConfirm:
      'Clear all words from this session? The session stays active.',
    exportChoose: 'Export ready words with examples:',
    emptyExport: '📭 Nothing is ready to export yet.',
    emptyExportForFilter: (label: string) =>
      `📭 No ready words in ${label} yet.`,
    idle: 'Start a session first, then send words or phrases.',
    noActive: 'ℹ️ You do not have an active session right now.',
    noWordsYet: 'You have not added any words yet.',
    promptStart:
      'Tap Start.\n\nFlow: send words → see translations in the bot → export the file for examples.',
    started:
      '🚀 Session started.\n\nSend words or phrases:\n• one per line\n• as a list\n• or separated with semicolons\n\nIn the bot you will see translations only.\nExamples are in the exported file.',
    stopCancelled: 'Your session stays active.',
    stopConfirm: 'Finish this session?',
    stopRenameOffer: 'Name this session now, or do it later in History.',
    stopped:
      '🏁 Session finished.\nFind it anytime in  🗂 Library → 🕘 History.',
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
        `Retry: ${formatItems(failedEntriesCount)}`,
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
      `⏳ Saved ${formatItems(count)}. Processing now.`,
    processingCompleted: (succeededCount: number) =>
      `✅ Done. ${formatItems(succeededCount)} ready.`,
    processingFinished: (succeededCount: number, failedCount: number) =>
      `⚠️ Done. ${formatItems(succeededCount)} ready, ${formatNeedsAnotherTry(failedCount)}.`,
    processingNoCompleted: (failedCount: number) =>
      `No items finished this time. ${formatNeedsAnotherTry(failedCount)}.`,
    retrying: (count: number) => `🔄 Trying ${formatItems(count)} again...`,
    retryNothingFailed: 'There is nothing to retry right now.',
    saved: (count: number) => `Saved ${formatItems(count)}.`,
  },
  rename: {
    empty: 'Please send a non-empty session title.',
  },
} as const;
