export const IS_MAC = navigator.userAgent.includes('Macintosh');

export const isCommandKeyHeld = (event: KeyboardEvent | MouseEvent): boolean => (IS_MAC ? event.metaKey : event.ctrlKey);
