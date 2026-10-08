import { create } from 'zustand';

interface ConfirmationRequest {
  title: string;
  message: string;
  actionLabel: string;
}

interface PendingConfirmation extends ConfirmationRequest {
  resolve(isConfirmed: boolean): void;
}

interface ConfirmationState {
  pending: PendingConfirmation | undefined;
  settle(isConfirmed: boolean): void;
}

export const useConfirmationStore = create<ConfirmationState>((set, get) => ({
  pending: undefined,
  settle: (isConfirmed) => {
    get().pending?.resolve(isConfirmed);
    set({ pending: undefined });
  },
}));

export const confirmDestructiveAction = (request: ConfirmationRequest): Promise<boolean> =>
  new Promise((resolve) => {
    useConfirmationStore.getState().pending?.resolve(false);
    useConfirmationStore.setState({ pending: { ...request, resolve } });
  });
