import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { diagramInstructions, EXPLANATION_PALETTE } from './diagramInstructions';

const HEX_COLOR = /#[0-9a-f]{6}\b/gi;
const DESIGN_TOKEN_COLOR = /--color-[\w-]+:\s*(#[0-9a-f]{6})\b/gi;

describe('diagramInstructions', () => {
  it('names the tile folder', () => {
    expect(diagramInstructions('C:\\data\\diagrams\\tile')).toContain('C:\\data\\diagrams\\tile');
  });

  it('asks for design token colors outside the suggested explanation palette', () => {
    const tokens = readFileSync(new URL('../../../renderer/src/app/styles/index.css', import.meta.url), 'utf8');
    const tokenColors = new Set([...tokens.matchAll(DESIGN_TOKEN_COLOR)].map(([, color]) => color!.toLowerCase()));
    const askedColors = diagramInstructions('folder').match(HEX_COLOR)!.map((color) => color.toLowerCase());
    const appColors = askedColors.filter((color) => !EXPLANATION_PALETTE.includes(color));
    expect(appColors.length).toBeGreaterThan(0);
    expect(appColors.filter((color) => !tokenColors.has(color))).toEqual([]);
  });
});
