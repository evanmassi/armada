import type { BoardsDocument } from './boards/boardSchemas';
import type { Project } from './conversations/conversationTypes';
import type {
  OpenSessionRequest,
  TerminalExitEvent,
  TerminalOutputEvent,
  TerminalRef,
  TerminalResizeRequest,
  TerminalWriteRequest,
} from './sessions/sessionSchemas';

export type Unsubscribe = () => void;

export interface ArmadaApi {
  conversations: {
    listProjects(): Promise<Project[]>;
  };
  projects: {
    pickFolder(): Promise<string | undefined>;
  };
  boards: {
    load(): Promise<BoardsDocument>;
    save(document: BoardsDocument): Promise<void>;
  };
  sessions: {
    open(request: OpenSessionRequest): Promise<TerminalRef>;
    write(request: TerminalWriteRequest): void;
    resize(request: TerminalResizeRequest): void;
    close(request: TerminalRef): void;
    onOutput(listener: (event: TerminalOutputEvent) => void): Unsubscribe;
    onExit(listener: (event: TerminalExitEvent) => void): Unsubscribe;
  };
}
