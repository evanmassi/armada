import { create } from 'zustand';

export type ActivityState = 'working' | 'waiting' | 'approval' | 'idle';

export interface ActivityEntry {
  sessionId: string | undefined;
  state: ActivityState;
}

interface SessionActivityState {
  byTileId: Record<string, ActivityEntry>;
  setActivity(tileId: string, sessionId: string | undefined, state: ActivityState): void;
  clearActivity(tileId: string): void;
}

export const useSessionActivityStore = create<SessionActivityState>((set) => ({
  byTileId: {},
  setActivity: (tileId, sessionId, state) =>
    set((current) =>
      current.byTileId[tileId]?.state === state && current.byTileId[tileId].sessionId === sessionId ? current : { byTileId: { ...current.byTileId, [tileId]: { sessionId, state } } },
    ),
  clearActivity: (tileId) =>
    set((current) => ({ byTileId: Object.fromEntries(Object.entries(current.byTileId).filter(([id]) => id !== tileId)) })),
}));

export const selectActivityBySession = (byTileId: Record<string, ActivityEntry>): Map<string, ActivityState> =>
  new Map(
    Object.values(byTileId)
      .filter((entry): entry is ActivityEntry & { sessionId: string } => entry.sessionId !== undefined)
      .map((entry) => [entry.sessionId, entry.state]),
  );
