import { create } from 'zustand';
import type { SessionStatus } from '@shared/sessions/sessionSchemas';
import { withoutKey } from '@renderer/shared/utils/withoutKey';

interface SessionStatusState {
  byTileId: Record<string, SessionStatus>;
  setStatus(tileId: string, status: SessionStatus): void;
  clearStatus(tileId: string): void;
}

export const useSessionStatusStore = create<SessionStatusState>((set) => ({
  byTileId: {},
  setStatus: (tileId, status) => set((current) => ({ byTileId: { ...current.byTileId, [tileId]: status } })),
  clearStatus: (tileId) =>
    set((current) => (tileId in current.byTileId ? { byTileId: withoutKey(current.byTileId, tileId) } : current)),
}));
