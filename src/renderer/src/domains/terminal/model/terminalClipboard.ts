import type { Terminal } from '@xterm/xterm';
import { notifyError } from '@renderer/app/stores/notificationStore';
import { armadaClient } from '@renderer/infrastructure/ipc/armadaClient';
import { IS_MAC, isCommandKeyHeld } from '@renderer/shared/utils/commandKey';
import { cleanCopiedText } from './copiedText';
import { quotePathForInput } from './terminalPathInput';

const copySelection = (terminal: Terminal): boolean => {
  if (!terminal.hasSelection()) return false;
  void navigator.clipboard.writeText(cleanCopiedText(terminal.getSelection()));
  terminal.clearSelection();
  return true;
};

const pasteFromClipboard = (terminal: Terminal): void => {
  void navigator.clipboard.readText().then((text) => {
    if (text) {
      terminal.paste(text);
      return;
    }
    armadaClient.files
      .saveClipboardImage()
      .then((imagePath) => {
        if (imagePath) terminal.paste(quotePathForInput(imagePath));
      })
      .catch(notifyError);
  });
};

// PITFALL: Ctrl+C is the interrupt everywhere but a Mac, so off a Mac it copies only with Shift or a selection.
const isCopyChord = (terminal: Terminal, event: KeyboardEvent): boolean =>
  (isCommandKeyHeld(event) && event.key.toLowerCase() === 'c' && (IS_MAC || event.shiftKey || terminal.hasSelection())) ||
  (event.ctrlKey && event.key === 'Insert');

const isPasteChord = (event: KeyboardEvent): boolean =>
  (isCommandKeyHeld(event) && event.key.toLowerCase() === 'v') || (event.shiftKey && event.key === 'Insert');

export function handleClipboardKey(terminal: Terminal, event: KeyboardEvent): boolean {
  if (event.type !== 'keydown') return false;
  if (isCopyChord(terminal, event)) {
    event.preventDefault();
    copySelection(terminal);
    return true;
  }
  if (isPasteChord(event)) {
    event.preventDefault();
    pasteFromClipboard(terminal);
    return true;
  }
  return false;
}

export function handleContextMenu(terminal: Terminal, event: MouseEvent): void {
  event.preventDefault();
  if (!copySelection(terminal)) pasteFromClipboard(terminal);
}
