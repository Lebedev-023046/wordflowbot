export const messages = {
  session: {
    active: 'Session is active. Send words or phrases.',
    alreadyActive: 'Session already active.',
    idle: 'Press Start session first.',
    noActive: 'No active session.',
    promptStart: 'Press Start session to begin.',
    started: 'Session started. Send words or phrases.',
    stopped: 'Session stopped.',
  },
  status: {
    active: ({
      completedEntries,
      failedEntries,
      failedEntriesCount,
      pendingEntries,
      totalEntries,
    }: {
      completedEntries: number;
      failedEntries: Array<{
        errorMessage: string;
        text: string;
      }>;
      failedEntriesCount: number;
      pendingEntries: number;
      totalEntries: number;
    }) =>
      [
        `Total entries: ${totalEntries}`,
        `Pending: ${pendingEntries}`,
        `Completed: ${completedEntries}`,
        `Failed: ${failedEntriesCount}`,
        failedEntries.length > 0 ? '' : null,
        ...failedEntries.map(
          (entry, index) => `Failure ${index + 1}: ${entry.text} -> ${entry.errorMessage}`,
        ),
      ]
        .filter((line): line is string => line !== null)
        .join('\n'),
  },
  entries: {
    duplicatesOnly: 'All entries already exist in this session.',
    empty: 'Send at least one word or phrase.',
    insufficientQuota:
      'OpenAI quota is exhausted right now. Check billing or usage limits, then try again.',
    processedWithFailures: (failedCount: number) =>
      `${failedCount} item(s) could not be processed.`,
    processing: (count: number) => `Saved: ${count} item(s). Processing...`,
    saved: (count: number) => `Saved: ${count} item(s).`,
  },
} as const;
