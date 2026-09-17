import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type LinkTarget = { kind: 'web'; url: string } | { kind: 'path'; path: string; position: string | undefined };

interface LinkContext {
  cwd: string;
  homeDir: string;
}

// PITFALL: a Windows drive letter parses as a one-letter URL scheme, so a scheme needs at least two characters.
const URL_SCHEME = /^[a-z][a-z0-9+.-]+:/i;
const POSITION_SUFFIX = /:(\d+(?::\d+)?)$/;
const HOME_PREFIX = /^~(?=[\\/]|$)/;

function parseUrlTarget(target: string): LinkTarget {
  const url = URL.canParse(target) ? new URL(target) : undefined;
  if (url?.protocol === 'http:' || url?.protocol === 'https:') return { kind: 'web', url: url.href };
  if (url?.protocol === 'file:') return { kind: 'path', path: fileURLToPath(url), position: undefined };
  throw new Error(`Unsupported link: ${target}`);
}

export function parseLinkTarget(target: string, { cwd, homeDir }: LinkContext): LinkTarget {
  if (URL_SCHEME.test(target)) return parseUrlTarget(target);
  const positionMatch = POSITION_SUFFIX.exec(target);
  const rawPath = positionMatch ? target.slice(0, positionMatch.index) : target;
  return {
    kind: 'path',
    path: resolve(cwd, rawPath.replace(HOME_PREFIX, () => homeDir)),
    position: positionMatch?.[1],
  };
}
