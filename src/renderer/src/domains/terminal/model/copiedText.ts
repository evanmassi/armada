const BOX_DRAWING_ONLY = /^[\s─-╿▀-▟]*$/;

export function cleanCopiedText(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/, ''))
    .filter((line) => !BOX_DRAWING_ONLY.test(line) || line.length === 0);
  while (lines.length > 0 && lines[0] === '') lines.shift();
  while (lines.length > 0 && lines.at(-1) === '') lines.pop();
  return lines.join('\n');
}
