import { create } from 'zustand';
import type { Tone } from '@renderer/shared/ui/components/ToneIcon';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';

export const NOTICE_LIFETIME_MS = 6000;
export const NOTICE_EXIT_MS = 220;

interface Notice {
  id: string;
  message: string;
  tone: Tone;
  isLeaving: boolean;
}

interface NotificationState {
  notices: Notice[];
  notify(message: string, tone: Tone): void;
  dismiss(id: string): void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notices: [],
  notify: (message, tone) => {
    const id = crypto.randomUUID();
    set((state) => ({ notices: [...state.notices, { id, message, tone, isLeaving: false }] }));
    setTimeout(() => get().dismiss(id), NOTICE_LIFETIME_MS);
  },
  dismiss: (id) => {
    if (!get().notices.some((notice) => notice.id === id && !notice.isLeaving)) return;
    set((state) => ({ notices: state.notices.map((notice) => (notice.id === id ? { ...notice, isLeaving: true } : notice)) }));
    setTimeout(() => set((state) => ({ notices: state.notices.filter((notice) => notice.id !== id) })), NOTICE_EXIT_MS);
  },
}));

export const notifyError = (error: unknown): void => useNotificationStore.getState().notify(getErrorMessage(error), 'danger');
