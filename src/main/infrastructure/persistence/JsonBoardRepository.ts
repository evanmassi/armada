import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { boardsDocumentSchema, type BoardsDocument } from '@shared/boards/boardSchemas';
import type { BoardRepository } from '@main/domain/repositories/BoardRepository';

const EMPTY_DOCUMENT: BoardsDocument = { boards: [] };

const isMissingFile = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 'ENOENT';

export class JsonBoardRepository implements BoardRepository {
  constructor(private filePath: string) {}

  async load(): Promise<BoardsDocument> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, 'utf8');
    } catch (error) {
      if (isMissingFile(error)) return EMPTY_DOCUMENT;
      throw error;
    }
    const parsed = boardsDocumentSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      throw new Error(`Board layout file is invalid and was left untouched: ${this.filePath}`);
    }
    return parsed.data;
  }

  async save(document: BoardsDocument): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const stagingPath = `${this.filePath}.tmp`;
    await writeFile(stagingPath, JSON.stringify(document, null, 2), 'utf8');
    await rename(stagingPath, this.filePath);
  }
}
