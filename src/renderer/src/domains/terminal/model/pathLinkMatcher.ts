interface PathLinkMatch {
  text: string;
  startIndex: number;
}

const SEGMENT = String.raw`[^\s\\/:*?"'\x60<>|(){}\[\],;]+`;
const ROOT = String.raw`(?:[A-Za-z]:|~|\.{1,2})`;
const ROOTED_PATH = String.raw`${ROOT}(?:[\\/]${SEGMENT})+[\\/]?`;
const RELATIVE_PATH = String.raw`${SEGMENT}(?:[\\/]${SEGMENT})+`;
const POSITION = String.raw`(?::\d+(?::\d+)?)?`;
const PATH_PATTERN = new RegExp(String.raw`(?<=^|[\s"'\x60(\[{<])(?:${ROOTED_PATH}|(${RELATIVE_PATH}))${POSITION}`, 'g');
const SENTENCE_END = /\.+$/;
const FILE_EXTENSION = /\.[A-Za-z][A-Za-z0-9]*$/;
const ENDS_IN_PATH_FRAGMENT = /[\\/]\S*$/;
const STARTS_WITH_PATH_CHARACTER = /^\s*[^\s"'\x60<>|(){}[\],;]/;

// PITFALL: Claude Code breaks a long path itself, filling the row and indenting the next, so xterm never marks the row as wrapped.
export const continuesOnNextRow = (rowText: string, nextRowText: string): boolean =>
  ENDS_IN_PATH_FRAGMENT.test(rowText) && STARTS_WITH_PATH_CHARACTER.test(nextRowText);

// PITFALL: an unrooted run like and/or or 09/17 also has separators, so it only counts as a path when it ends in a file extension.
const isPlausibleRelativePath = (path: string): boolean => FILE_EXTENSION.test(path.replace(SENTENCE_END, ''));

export function findPathLinks(lineText: string): PathLinkMatch[] {
  const matches: PathLinkMatch[] = [];
  for (const match of lineText.matchAll(PATH_PATTERN)) {
    const relativePath = match[1];
    if (relativePath !== undefined && !isPlausibleRelativePath(relativePath)) continue;
    matches.push({ text: match[0].replace(SENTENCE_END, ''), startIndex: match.index });
  }
  return matches;
}
