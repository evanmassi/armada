import type { Stats } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { shell } from 'electron';
import type { OpenLinkRequest } from '@shared/links/linkSchemas';
import type { FolderOpener } from '@main/infrastructure/folders/FolderOpener';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { getHomeDir } from '@main/infrastructure/paths';
import { isBinaryFile } from './binaryFileCheck';
import { parseLinkTarget } from './linkTargets';

const WEB_PAGE_EXTENSIONS = new Set(['.html', '.htm']);

interface LinkOpenerDeps {
  folderOpener: FolderOpener;
  logger: FileLogger;
}

export class LinkOpener {
  constructor(private deps: LinkOpenerDeps) {}

  async open({ target, baseFolders }: OpenLinkRequest): Promise<void> {
    const link = parseLinkTarget(target, { baseFolders, homeDir: getHomeDir() });
    this.deps.logger.info('link.opened', { target, link });
    if (link.kind === 'web') {
      await shell.openExternal(link.url);
      return;
    }
    const found = await firstExisting(link.candidatePaths);
    if (!found) throw new Error(`Path not found: ${link.candidatePaths[0]}`);
    const { path, stats } = found;
    // PITFALL: shell.openPath on a file runs it, so a file is only ever shown selected in the file manager, opened in the editor, or, as a web page, handed to the browser.
    if (stats.isDirectory()) await this.deps.folderOpener.revealInFileManager(path);
    else if (link.position === undefined && WEB_PAGE_EXTENSIONS.has(extname(path).toLowerCase())) await shell.openExternal(pathToFileURL(path).href);
    else if ((await isBinaryFile(path)) || !this.deps.folderOpener.isEditorInstalled()) shell.showItemInFolder(path);
    else this.deps.folderOpener.openInEditor(path, link.position);
  }
}

async function firstExisting(paths: string[]): Promise<{ path: string; stats: Stats } | undefined> {
  for (const path of paths) {
    const stats = await stat(path).catch(() => undefined);
    if (stats) return { path, stats };
  }
  return undefined;
}
