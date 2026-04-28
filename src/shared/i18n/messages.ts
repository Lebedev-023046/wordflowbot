function formatItems(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

function formatNeedsAnotherTry(count: number): string {
  return `${formatItems(count)} ${count === 1 ? 'needs' : 'need'} another try`;
}

export const messages = {
  session: {
    active: 'You have an active session. Send words or phrases any time.',
    alreadyActive: 'You already have an active session. Send words or phrases any time.',
    emptyExport: 'Nothing is ready to export yet.',
    idle: 'Start a session first, then send words or phrases.',
    noActive: 'You do not have an active session right now.',
    noWordsYet: 'You have not added any words yet.',
    promptStart: 'Tap Start session to begin.',
    started: 'Your session is ready. Send words or phrases.',
    stopped: 'Your session has been stopped.',
    words: (
      completedItems: Array<{ text: string; translation: string }>,
      failedItems: Array<{ text: string }>,
    ) => {
      const lines = [
        'Words in your session:',
        '',
        'Ready pairs:',
        ...(completedItems.length > 0
          ? completedItems.map((item, index) => `${index + 1}. ${item.text} - ${item.translation}`)
          : ['None yet.']),
      ];

      if (failedItems.length > 0) {
        lines.push(
          '',
          'Failed:',
          ...failedItems.map((item, index) => `${index + 1}. ${item.text}`),
        );
      }

      return lines.join('\n');
    },
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
        ...completedEntrySummaries.map((entry) => `${entry.text} - ${entry.translation}`),
        failedEntries.length > 0 ? '' : null,
        failedEntries.length > 0 ? 'Failed items:' : null,
        ...failedEntries.map(
          (entry, index) => `${index + 1}. ${entry.text} - ${entry.errorMessage}`,
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
      `Saved ${formatItems(count)}. I am working on them now and will send the results soon.`,
    processingCompleted: (succeededCount: number) =>
      `Done. ${formatItems(succeededCount)} ready.`,
    processingFinished: (succeededCount: number, failedCount: number) =>
      `Finished. ${formatItems(succeededCount)} ready, ${formatNeedsAnotherTry(failedCount)}.`,
    processingNoCompleted: (failedCount: number) =>
      `I could not finish any items this time. ${formatNeedsAnotherTry(failedCount)}.`,
    retrying: (count: number) => `Trying ${formatItems(count)} again...`,
    retryNothingFailed: 'There is nothing to retry right now.',
    saved: (count: number) => `Saved ${formatItems(count)}.`,
  },
} as const;
