import type { Project } from './conversations/conversationTypes';
import type { ClaudeIntegrationStatus } from './integration/integrationTypes';
import type { OpenLinkRequest } from './links/linkSchemas';
import type { FolderRequest, ProjectLineChanges } from './projects/projectSchemas';
import type {
  ClaudeHookEvent,
  OpenSessionRequest,
  SessionStatus,
  TerminalExitEvent,
  TerminalOutputEvent,
  TerminalRef,
  TerminalResizeRequest,
  TerminalWriteRequest,
} from './sessions/sessionSchemas';
import type { ClaudeUsage } from './usage/usageSchemas';
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
    countLineChanges(request: FolderRequest): Promise<ProjectLineChanges | undefined>;
  };
  links: {
    open(request: OpenLinkRequest): Promise<void>;
  };
  files: {
    getDroppedPath(file: File): string;
    saveClipboardImage(): Promise<string | undefined>;
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
    onStatus(listener: (status: SessionStatus) => void): Unsubscribe;
  };
  integration: {
    check(): Promise<ClaudeIntegrationStatus>;
    repair(): Promise<ClaudeIntegrationStatus>;
  };
  usage: {
    read(): Promise<ClaudeUsage | undefined>;
    onChanged(listener: (usage: ClaudeUsage) => void): Unsubscribe;
  };
}
