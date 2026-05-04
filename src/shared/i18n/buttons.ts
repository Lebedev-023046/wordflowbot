export const buttons = {
  back: '⬅ Back',
  cancelClearSession: 'Keep words',
  cancelStopSession: 'Keep editing',
  clearSession: '🧹 Clear session',
  confirmClearSession: 'Clear words',
  confirmStopSession: 'Finish',
  exportCsv: '📤 Export',
  exportCsvAllWords: 'All',
  exportCsvMostUseful: 'Useful',
  exportCsvGoodToKnow: 'Common',
  exportCsvRarelyUsed: 'Rare',
  myLibrary: '🕘 Past sessions',
  openLastSession: '📖 Open last session',
  nameSessionSource: '✏️ Name session',
  retryFailed: '🔄 Retry failed',
  skipRename: 'Skip',
  showWords: '📚 Current session',
  startSession: '🚀 Start session',
  stopSession: '🏁 Finish session',
} as const;

export type ButtonText = (typeof buttons)[keyof typeof buttons];
