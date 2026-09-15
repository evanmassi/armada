import { createReadStream } from 'node:fs';
import { access, readdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { createInterface } from 'node:readline';
import type { Conversation } from '@shared/conversations/conversationTypes';
import type { ConversationRepository } from '@main/domain/repositories/ConversationRepository';
import { summarizeConversationLines } from './conversationJsonlParser';

const CONVERSATION_FILE_EXTENSION = '.jsonl';

interface CachedConversation {
  mtimeMs: number;
  conversation: Conversation | undefined;
}

const isMissingPath = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 'ENOENT';

async function listSubdirectories(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => join(dir, entry.name));
  } catch (error) {
    if (isMissingPath(error)) return [];
    throw error;
  }
}

async function listConversationFiles(projectDir: string): Promise<string[]> {
  const entries = await readdir(projectDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(CONVERSATION_FILE_EXTENSION))
    .map((entry) => join(projectDir, entry.name));
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export class ClaudeProjectsReader implements ConversationRepository {
  private cache = new Map<string, CachedConversation>();

  constructor(private projectsDir: string) {}

  async listConversations(): Promise<Conversation[]> {
    const projectDirs = await listSubdirectories(this.projectsDir);
    const files = (await Promise.all(projectDirs.map(listConversationFiles))).flat();
    const conversations = await Promise.all(files.map((file) => this.readConversation(file)));
    return conversations.filter((conversation): conversation is Conversation => conversation !== undefined);
  }

  async hasConversation(sessionId: string): Promise<boolean> {
    const projectDirs = await listSubdirectories(this.projectsDir);
    const candidates = projectDirs.map((dir) => join(dir, `${sessionId}${CONVERSATION_FILE_EXTENSION}`));
    const existence = await Promise.all(candidates.map(pathExists));
    return existence.includes(true);
  }

  private async readConversation(file: string): Promise<Conversation | undefined> {
    const { mtimeMs, mtime } = await stat(file);
    const cached = this.cache.get(file);
    if (cached?.mtimeMs === mtimeMs) return cached.conversation;

    const summary = await summarizeConversationLines(createInterface({ input: createReadStream(file) }));
    const conversation = summary && {
      sessionId: basename(file, CONVERSATION_FILE_EXTENSION),
      cwd: summary.cwd,
      title: summary.title,
      lastActiveAt: mtime.toISOString(),
    };
    this.cache.set(file, { mtimeMs, conversation });
    return conversation;
  }
}
