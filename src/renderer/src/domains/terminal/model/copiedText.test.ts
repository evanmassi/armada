import { describe, expect, it } from 'vitest';
import { cleanCopiedText } from './copiedText';

describe('cleanCopiedText', () => {
  it('drops rule-only lines, trims padding, and strips blank edges', () => {
    const copied = ['', '────────────', '● Done, tests pass.   ', '  - one thing', '─────', '', ''].join('\n');
    expect(cleanCopiedText(copied)).toBe('● Done, tests pass.\n  - one thing');
  });

  it('keeps blank lines between paragraphs and lines that mix rules with text', () => {
    expect(cleanCopiedText('a\n\nb\n│ boxed │')).toBe('a\n\nb\n│ boxed │');
  });
});
