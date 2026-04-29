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
  session: {
    active:
      'You have an active session.\n\nSend one word or phrase per line.\nYou can also send a bullet list, a numbered list, or one line with items separated by semicolons.',
    alreadyActive:
      'You already have an active session.\n\nSend one word or phrase per line.\nYou can also send a bullet list, a numbered list, or one line with items separated by semicolons.',
    clearCancelled: 'Your words stay in the current session.',
    cleared: (clearedEntries: number) =>
      `🧹 Cleared ${formatItems(clearedEntries)} from the current session. The session is still active.`,
    clearConfirm:
      'Clear all words from this session? The session will stay active.',
    exportChoose: 'Choose which ready words to export:',
    emptyExport: '📭 Nothing is ready to export yet.',
    emptyExportForFilter: (label: string) =>
      `📭 No ready words in ${label} yet.`,
    idle: 'Start a session first, then send words or phrases.',
    noActive: 'ℹ️ You do not have an active session right now.',
    noWordsYet: 'You have not added any words yet.',
    promptStart:
      'Tap Start session to begin.\n\nThis bot turns English words or phrases into ready learning pairs with translations and examples.',
    started:
      '🚀 Your session is ready.\n\nSend one word or phrase per line.\nYou can also send a bullet list, a numbered list, or one line with items separated by semicolons.',
    stopCancelled: 'Your session stays active.',
    stopConfirm:
      'Finish this session? Your saved words will stay intact, but you will need to start a new session to continue.',
    stopped:
      '✅ Session finished. Your saved words stay intact. Start a new session when you want to continue.',
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
        `Still processing: ${formatItems(pendingEntries)}`,
        `Ready: ${formatItems(completedEntries)}`,
        `Need retry: ${formatItems(failedEntriesCount)}`,
        completedEntrySummaries.length > 0 ? '' : null,
        completedEntrySummaries.length > 0 ? 'Ready pairs:' : null,
        ...formatLimitedLines(
          completedEntrySummaries,
          MAX_VISIBLE_READY_ITEMS,
          (entry) => `${entry.text} - ${entry.translation}`,
        ),
        failedEntries.length > 0 ? '' : null,
        failedEntries.length > 0 ? 'Failed items:' : null,
        ...formatLimitedLines(
          failedEntries,
          MAX_VISIBLE_FAILED_ITEMS,
          (entry, index) =>
            `${index + 1}. ${entry.text} - ${entry.errorMessage}`,
        ),
        failedEntries.length > 0 ? '' : null,
        failedEntries.length > 0
          ? 'Tap Retry failed or use /retry_failed to try those items again.'
          : null,
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),
  },
  entries: {
    duplicatesOnly: 'These words are already in your current session.',
    empty: 'Please send at least one word or phrase.',
    insufficientQuota:
      'I could not finish those items right now. Your saved items are still here, and you can try again with Retry failed.',
    processedWithFailures: (failedCount: number) =>
      `I could not finish ${formatItems(failedCount)} this time. Your saved items are still here, and you can try again with Retry failed.`,
    processing: (count: number) =>
      `⏳ Saved ${formatItems(count)}. I am working on them now and will send the results soon.`,
    processingCompleted: (succeededCount: number) =>
      `✅ Done. ${formatItems(succeededCount)} ready.`,
    processingFinished: (succeededCount: number, failedCount: number) =>
      `⚠️ Finished. ${formatItems(succeededCount)} ready, ${formatNeedsAnotherTry(failedCount)}.`,
    processingNoCompleted: (failedCount: number) =>
      `I could not finish any items this time. ${formatNeedsAnotherTry(failedCount)}.`,
    retrying: (count: number) => `🔄 Trying ${formatItems(count)} again...`,
    retryNothingFailed: 'There is nothing to retry right now.',
    saved: (count: number) => `Saved ${formatItems(count)}.`,
  },
} as const;
