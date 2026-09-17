import { stat } from 'node:fs/promises';
import { shell } from 'electron';
import type { OpenLinkRequest } from '@shared/links/linkSchemas';
import type { FolderOpener } from '@main/infrastructure/folders/FolderOpener';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { getHomeDir } from '@main/infrastructure/paths';
import { parseLinkTarget } from './linkTargets';

interface LinkOpenerDeps {
  folderOpener: FolderOpener;
  logger: FileLogger;
}

export class LinkOpener {
  constructor(private deps: LinkOpenerDeps) {}

  async open({ target, cwd }: OpenLinkRequest): Promise<void> {
    const link = parseLinkTarget(target, { cwd, homeDir: getHomeDir() });
    this.deps.logger.info('link.opened', { target, link });
    if (link.kind === 'web') {
      await shell.openExternal(link.url);
      return;
    }
    const stats = await stat(link.path).catch(() => undefined);
    if (!stats) throw new Error(`Path not found: ${link.path}`);
    // PITFALL: shell.openPath on a file runs it, so only folders go to the file manager and files only ever reach the editor.
    if (stats.isDirectory()) await this.deps.folderOpener.revealInFileManager(link.path);
    else this.deps.folderOpener.openInEditor(link.path, link.position);
  }
}
