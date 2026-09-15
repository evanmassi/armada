export interface Conversation {
  sessionId: string;
  cwd: string;
  title: string;
  lastActiveAt: string;
}

export interface Project {
  cwd: string;
  conversations: Conversation[];
}
