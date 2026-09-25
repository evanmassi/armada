import { create } from 'zustand';
import { getErrorMessage } from '@renderer/shared/utils/getErrorMessage';

const NOTICE_LIFETIME_MS = 6000;

interface Notice {
  id: string;
  message: string;
}

interface NotificationState {
  notices: Notice[];
  notify(message: string): void;
  dismiss(id: string): void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notices: [],
  notify: (message) => {
    const id = crypto.randomUUID();
    set((state) => ({ notices: [...state.notices, { id, message }] }));
    setTimeout(() => get().dismiss(id), NOTICE_LIFETIME_MS);
  },
  dismiss: (id) => set((state) => ({ notices: state.notices.filter((notice) => notice.id !== id) })),
}));

export const notifyError = (error: unknown): void => useNotificationStore.getState().notify(getErrorMessage(error));
