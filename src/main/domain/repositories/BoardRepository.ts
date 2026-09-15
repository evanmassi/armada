import type { BoardsDocument } from '@shared/boards/boardSchemas';

export interface BoardRepository {
  load(): Promise<BoardsDocument>;
  save(document: BoardsDocument): Promise<void>;
}
