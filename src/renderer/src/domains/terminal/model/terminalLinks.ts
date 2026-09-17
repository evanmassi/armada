import type { IBufferLine, ILink, ILinkProvider, Terminal } from '@xterm/xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { findPathLinks } from './pathLinkMatcher';

type LinkCallbacks = Pick<ILink, 'activate' | 'hover' | 'leave'>;

interface LineCells {
  text: string;
  columns: number[];
}

// PITFALL: a wide character fills two cells, so a string index is not a column; columns[i] is the cell that holds text[i].
function readLineCells(line: IBufferLine): LineCells {
  let text = '';
  const columns: number[] = [];
  for (let column = 0; column < line.length; column++) {
    const cell = line.getCell(column);
    if (!cell || cell.getWidth() === 0) continue;
    const chars = cell.getChars() || ' ';
    text += chars;
    for (let index = 0; index < chars.length; index++) columns.push(column);
  }
  return { text, columns };
}

const createPathLinkProvider = (terminal: Terminal, callbacks: LinkCallbacks): ILinkProvider => ({
  provideLinks(bufferLineNumber, callback) {
    const line = terminal.buffer.active.getLine(bufferLineNumber - 1);
    if (!line) return callback(undefined);
    const { text, columns } = readLineCells(line);
    const links: ILink[] = findPathLinks(text).map((match) => ({
      text: match.text,
      range: {
        start: { x: columns[match.startIndex]! + 1, y: bufferLineNumber },
        end: { x: columns[match.startIndex + match.text.length - 1]! + 1, y: bufferLineNumber },
      },
      ...callbacks,
    }));
    callback(links.length > 0 ? links : undefined);
  },
});

// PITFALL: call after terminal.open(); the screen element does not exist before that.
export function enableTerminalLinks(terminal: Terminal, openTarget: (target: string) => void): void {
  let isLinkHovered = false;
  const callbacks: LinkCallbacks = {
    // PITFALL: a plain click is how a tile gets focus, so a link only opens on Ctrl+click.
    activate: (event, target) => {
      if (event.ctrlKey) openTarget(target);
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
    if (!event.ctrlKey || !isLinkHovered) return;
    event.preventDefault();
    event.stopPropagation();
    terminal.focus();
  });
}
