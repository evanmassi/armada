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
  event.ctrlKey && !event.altKey && !event.metaKey && GLOBAL_SHORTCUT_KEYS.has(event.key);
