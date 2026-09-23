import type { SessionStatus } from '@shared/sessions/sessionSchemas';

const AUTO_COMPACT_BUFFER_TOKENS = 33_000;

type ContextWindow = NonNullable<SessionStatus['contextWindow']>;

export function contextLeftPercentage({ remainingPercentage, size }: ContextWindow): number {
  const bufferPercentage = Math.min(99, (AUTO_COMPACT_BUFFER_TOKENS / size) * 100);
  const left = ((remainingPercentage - bufferPercentage) / (100 - bufferPercentage)) * 100;
  return Math.round(Math.min(100, Math.max(0, left)));
}

const normalizePath = (path: string): string => path.replaceAll('\\', '/').replace(/\/+$/, '');

export function sessionFolderLabel(projectCwd: string, sessionCwd: string | undefined): string | undefined {
  if (!sessionCwd) return undefined;
  const project = normalizePath(projectCwd);
  const session = normalizePath(sessionCwd);
  if (session.toLowerCase() === project.toLowerCase()) return undefined;
  if (session.toLowerCase().startsWith(`${project.toLowerCase()}/`)) return `./${session.slice(project.length + 1)}`;
  return session;
}

export const modelLabel = ({ modelName, effortLevel }: SessionStatus): string | undefined =>
  [modelName, effortLevel].filter(Boolean).join(' · ') || undefined;
