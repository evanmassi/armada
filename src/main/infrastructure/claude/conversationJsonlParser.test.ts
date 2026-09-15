import { describe, expect, it } from 'vitest';
import { summarizeConversationLines } from './conversationJsonlParser';

async function* lines(...records: unknown[]): AsyncIterable<string> {
  for (const record of records) yield JSON.stringify(record);
}

describe('summarizeConversationLines', () => {
  it('uses the latest ai-title and the first cwd', async () => {
    const summary = await summarizeConversationLines(
      lines(
        { type: 'attachment', cwd: 'C:\\dev\\blockfall' },
        { type: 'user', cwd: 'C:\\dev\\blockfall', message: { role: 'user', content: 'first prompt' } },
        { type: 'ai-title', aiTitle: 'Old title' },
        { type: 'ai-title', aiTitle: 'Mobile app not opening' },
      ),
    );
    expect(summary).toEqual({ cwd: 'C:\\dev\\blockfall', title: 'Mobile app not opening' });
  });

  it('falls back to the first human prompt, skipping injected system text', async () => {
    const summary = await summarizeConversationLines(
      lines(
        { type: 'user', cwd: 'C:\\dev\\x', message: { role: 'user', content: '<command-name>/resume</command-name>' } },
        { type: 'user', cwd: 'C:\\dev\\x', message: { role: 'user', content: [{ type: 'text', text: 'fix the build' }] } },
      ),
    );
    expect(summary?.title).toBe('fix the build');
  });

  it('returns undefined when no record carries a cwd', async () => {
    expect(await summarizeConversationLines(lines({ type: 'mode', mode: 'normal' }))).toBeUndefined();
  });
});
