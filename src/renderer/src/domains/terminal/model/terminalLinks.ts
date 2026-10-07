import type { IBufferCellPosition, ILink, ILinkProvider, Terminal } from '@xterm/xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { isCommandKeyHeld } from '@renderer/shared/utils/commandKey';
import { continuesOnNextRow, findPathLinks } from './pathLinkMatcher';

type LinkCallbacks = Pick<ILink, 'activate' | 'hover' | 'leave'>;

interface RowCells {
  text: string;
  cells: IBufferCellPosition[];
}

// PITFALL: a wide character fills two cells, so a string index is not a column; cells[i] is the cell that holds text[i].
function readRowCells(terminal: Terminal, rowIndex: number): RowCells | undefined {
  const line = terminal.buffer.active.getLine(rowIndex);
  if (!line) return undefined;
  let text = '';
  const cells: IBufferCellPosition[] = [];
  for (let column = 0; column < line.length; column++) {
    const cell = line.getCell(column);
    if (!cell || cell.getWidth() === 0) continue;
    const chars = cell.getChars() || ' ';
    text += chars;
    for (let index = 0; index < chars.length; index++) cells.push({ x: column + 1, y: rowIndex + 1 });
  }
  return { text, cells };
}

const appendContinuation = (row: RowCells, continuation: RowCells): RowCells => {
  const indent = continuation.text.length - continuation.text.trimStart().length;
  return { text: row.text + continuation.text.slice(indent), cells: [...row.cells, ...continuation.cells.slice(indent)] };
};

function readJoinedRows(terminal: Terminal, rowIndex: number): RowCells | undefined {
  const row = readRowCells(terminal, rowIndex);
  if (!row) return undefined;
  let joined = row;
  let top = row;
  for (let index = rowIndex - 1; index >= 0; index--) {
    const previous = readRowCells(terminal, index);
    if (!previous || !continuesOnNextRow(previous.text, top.text)) break;
    joined = appendContinuation(previous, joined);
    top = previous;
  }
  let bottom = row;
  for (let index = rowIndex + 1; ; index++) {
    const next = readRowCells(terminal, index);
    if (!next || !continuesOnNextRow(bottom.text, next.text)) break;
    joined = appendContinuation(joined, next);
    bottom = next;
  }
  return joined;
}

const createPathLinkProvider = (terminal: Terminal, callbacks: LinkCallbacks): ILinkProvider => ({
  provideLinks(bufferLineNumber, callback) {
    const joined = readJoinedRows(terminal, bufferLineNumber - 1);
    if (!joined) return callback(undefined);
    const links: ILink[] = findPathLinks(joined.text)
      .map((match) => ({
        text: match.text,
        range: { start: joined.cells[match.startIndex]!, end: joined.cells[match.startIndex + match.text.length - 1]! },
        ...callbacks,
      }))
      .filter(({ range }) => range.start.y <= bufferLineNumber && range.end.y >= bufferLineNumber);
    callback(links.length > 0 ? links : undefined);
  },
});

// PITFALL: call after terminal.open(); the screen element does not exist before that.
export function enableTerminalLinks(terminal: Terminal, openTarget: (target: string) => void): void {
  let isLinkHovered = false;
  const callbacks: LinkCallbacks = {
    // PITFALL: a plain click is how a tile gets focus, so a link only opens on Ctrl+click, Cmd+click on a Mac.
    activate: (event, target) => {
      if (isCommandKeyHeld(event)) openTarget(target);
    },
    hover: () => {
      isLinkHovered = true;
    },
    leave: () => {
      isLinkHovered = false;
    },
  };
  terminal.options.linkHandler = { ...callbacks, allowNonHttpProtocols: true };
  terminal.loadAddon(new WebLinksAddon(callbacks.activate, callbacks));
  terminal.registerLinkProvider(createPathLinkProvider(terminal, callbacks));
  // PITFALL: fullscreen Claude Code opens a Ctrl+clicked link itself; xterm reports the mouse from the parent element, so stopping the press on the screen element hides it from the pty.
  terminal.element?.querySelector<HTMLElement>('.xterm-screen')?.addEventListener('mousedown', (event) => {
    if (!isCommandKeyHeld(event) || !isLinkHovered) return;
    event.preventDefault();
    event.stopPropagation();
    terminal.focus();
  });
}
