import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DIAGRAM_PAGE_SCROLLBAR_STYLE } from './diagramPageScrollbarStyle';

const designToken = (name: string): string => {
  const tokens = readFileSync(new URL('../../../renderer/src/app/styles/index.css', import.meta.url), 'utf8');
  return tokens.match(new RegExp(`--color-${name}:\\s*([^;]+);`))![1]!;
};

describe('DIAGRAM_PAGE_SCROLLBAR_STYLE', () => {
  it.each(['edge-strong', 'accent'])('draws the thumb in the app scrollbar token %s', (name) => {
    expect(DIAGRAM_PAGE_SCROLLBAR_STYLE).toContain(designToken(name));
  });
});
