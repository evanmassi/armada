import { isCommandKeyHeld } from '@renderer/shared/utils/commandKey';

export const GLOBAL_SHORTCUTS = {
  newSession: 'n',
  fontLarger: ['=', '+'],
  fontSmaller: '-',
  fontReset: '0',
} as const;

const GLOBAL_SHORTCUT_KEYS = new Set<string>([
  GLOBAL_SHORTCUTS.newSession,
  ...GLOBAL_SHORTCUTS.fontLarger,
  GLOBAL_SHORTCUTS.fontSmaller,
  GLOBAL_SHORTCUTS.fontReset,
]);

export const isGlobalShortcut = (event: KeyboardEvent): boolean =>
  isCommandKeyHeld(event) && !event.altKey && !(event.ctrlKey && event.metaKey) && GLOBAL_SHORTCUT_KEYS.has(event.key);
