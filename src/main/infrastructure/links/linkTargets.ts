import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type LinkTarget = { kind: 'web'; url: string } | { kind: 'path'; candidatePaths: string[]; position: string | undefined };

interface LinkContext {
  baseFolders: string[];
  homeDir: string;
}

// PITFALL: a Windows drive letter parses as a one-letter URL scheme, so a scheme needs at least two characters.
const URL_SCHEME = /^[a-z][a-z0-9+.-]+:/i;
const POSITION_SUFFIX = /:(\d+(?::\d+)?)$/;
const HOME_PREFIX = /^~(?=[\\/]|$)/;

function parseUrlTarget(target: string): LinkTarget {
  const url = URL.canParse(target) ? new URL(target) : undefined;
  if (url?.protocol === 'http:' || url?.protocol === 'https:') return { kind: 'web', url: url.href };
  if (url?.protocol === 'file:') return { kind: 'path', candidatePaths: [fileURLToPath(url)], position: undefined };
  throw new Error(`Unsupported link: ${target}`);
}

export function parseLinkTarget(target: string, { baseFolders, homeDir }: LinkContext): LinkTarget {
  if (URL_SCHEME.test(target)) return parseUrlTarget(target);
  const positionMatch = POSITION_SUFFIX.exec(target);
  const rawPath = (positionMatch ? target.slice(0, positionMatch.index) : target).replace(HOME_PREFIX, () => homeDir);
  const candidatePaths = isAbsolute(rawPath) ? [resolve(rawPath)] : baseFolders.map((folder) => resolve(folder, rawPath));
  if (candidatePaths.length === 0) throw new Error(`Unsupported link: ${target}`);
  return { kind: 'path', candidatePaths: [...new Set(candidatePaths)], position: positionMatch?.[1] };
}
