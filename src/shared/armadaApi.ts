import type { Project } from './conversations/conversationTypes';
import type { FolderRequest } from './projects/projectSchemas';
import type {
  ClaudeHookEvent,
  OpenSessionRequest,
  TerminalExitEvent,
  TerminalOutputEvent,
  TerminalRef,
  TerminalResizeRequest,
  TerminalWriteRequest,
} from './sessions/sessionSchemas';
import type { Workspace } from './workspace/workspaceSchemas';

export type Unsubscribe = () => void;

export interface ArmadaApi {
  conversations: {
    listProjects(): Promise<Project[]>;
  };
  projects: {
    pickFolder(): Promise<string | undefined>;
    reveal(request: FolderRequest): Promise<void>;
    openInEditor(request: FolderRequest): Promise<void>;
  };
  workspace: {
    load(): Promise<Workspace>;
    save(workspace: Workspace): Promise<void>;
  };
  sessions: {
    open(request: OpenSessionRequest): Promise<TerminalRef>;
    write(request: TerminalWriteRequest): void;
    resize(request: TerminalResizeRequest): void;
    close(request: TerminalRef): void;
    onOutput(listener: (event: TerminalOutputEvent) => void): Unsubscribe;
    onExit(listener: (event: TerminalExitEvent) => void): Unsubscribe;
    onClaudeHookEvent(listener: (event: ClaudeHookEvent) => void): Unsubscribe;
  };
}
