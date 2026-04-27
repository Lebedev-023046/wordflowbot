export type EntryStatus = 'pending' | 'completed' | 'failed';

export interface Entry {
  id: string;
  sessionId: string;
  text: string;
  status: EntryStatus;
}
