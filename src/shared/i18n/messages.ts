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
    active: (totalEntries: number) => `Total entries: ${totalEntries}`,
  },
  entries: {
    duplicatesOnly: 'All entries already exist in this session.',
    empty: 'Send at least one word or phrase.',
    processedWithFailures: (failedCount: number) =>
      `${failedCount} item(s) could not be processed.`,
    processing: (count: number) => `Saved: ${count} item(s). Processing...`,
    saved: (count: number) => `Saved: ${count} item(s).`,
  },
} as const;
