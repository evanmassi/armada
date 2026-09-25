import { z } from 'zod';
import { parseJsonOrUndefined } from '@main/infrastructure/safeJson';

const MAX_TITLE_LENGTH = 80;
const UNTITLED = 'Untitled';

const contentBlockSchema = z.object({ type: z.string(), text: z.string().optional() });

const recordSchema = z.object({
  type: z.string(),
  cwd: z.string().optional(),
  aiTitle: z.string().optional(),
  message: z
    .object({
      role: z.string().optional(),
      content: z.union([z.string(), z.array(contentBlockSchema)]).optional(),
    })
    .optional(),
});

interface ConversationSummary {
  cwd: string;
  title: string;
}

const extractPromptText = (content: string | Array<z.infer<typeof contentBlockSchema>>): string => {
  if (typeof content === 'string') return content;
  return content.find((block) => block.type === 'text')?.text ?? '';
};

const isHumanPrompt = (text: string): boolean => text.length > 0 && !text.startsWith('<');

const truncate = (text: string): string =>
  text.length > MAX_TITLE_LENGTH ? `${text.slice(0, MAX_TITLE_LENGTH - 1)}…` : text;

export async function summarizeConversationLines(lines: AsyncIterable<string>): Promise<ConversationSummary | undefined> {
  let cwd: string | undefined;
  let aiTitle: string | undefined;
  let firstPrompt: string | undefined;

  for await (const line of lines) {
    if (line.length === 0) continue;
    // PITFALL: a live session appends while we read, so a partial trailing line is normal and must not fail the file.
    const parsed = recordSchema.safeParse(parseJsonOrUndefined(line));
    if (!parsed.success) continue;
    const record = parsed.data;
    cwd ??= record.cwd;
    if (record.type === 'ai-title' && record.aiTitle) aiTitle = record.aiTitle;
    if (!firstPrompt && record.type === 'user' && record.message?.role === 'user' && record.message.content) {
      const text = extractPromptText(record.message.content).trim();
      if (isHumanPrompt(text)) firstPrompt = text;
    }
  }

  if (!cwd) return undefined;
  return { cwd, title: aiTitle ?? truncate(firstPrompt ?? UNTITLED) };
}
