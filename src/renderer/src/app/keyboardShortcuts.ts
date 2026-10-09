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

type TileFocusMove = 'next' | 'previous' | 'withinTile';

type ShortcutKeys = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'>;

// PITFALL: Cmd+Tab belongs to macOS, so moving between tiles stays on Ctrl on every platform.
export const tileFocusMoveOf = (event: ShortcutKeys): TileFocusMove | undefined => {
  if (event.altKey || event.metaKey) return undefined;
  if (event.key === 'Tab' && event.ctrlKey) return event.shiftKey ? 'previous' : 'next';
  if (event.key === 'F6' && !event.ctrlKey && !event.shiftKey) return 'withinTile';
  return undefined;
};

export const isGlobalShortcut = (event: KeyboardEvent): boolean =>
  isCommandKeyHeld(event) && !event.altKey && !(event.ctrlKey && event.metaKey) && GLOBAL_SHORTCUT_KEYS.has(event.key);
