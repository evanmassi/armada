export const IS_MAC = navigator.userAgent.includes('Macintosh');

export const COMMAND_KEY_LABEL = IS_MAC ? 'Cmd' : 'Ctrl';

export const FILE_MANAGER_NAME = IS_MAC ? 'Finder' : 'Explorer';

export const isCommandKeyHeld = (event: KeyboardEvent | MouseEvent): boolean => (IS_MAC ? event.metaKey : event.ctrlKey);
