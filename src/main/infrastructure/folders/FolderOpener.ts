import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { shell } from 'electron';
import { resolveOnPath } from '@main/infrastructure/launchChecks';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';

const EDITOR_SHIM = process.platform === 'win32' ? 'code.cmd' : 'code';
const WINDOWS_EDITOR_EXECUTABLE = join('..', 'Code.exe');

// PITFALL: code.cmd only runs through a shell; the real Code.exe sits one folder above the shim and takes argv directly.
const resolveEditorExecutable = (): string | undefined => {
  const shim = resolveOnPath(EDITOR_SHIM);
  if (!shim) return undefined;
  if (process.platform !== 'win32') return shim;
  const executable = join(dirname(shim), WINDOWS_EDITOR_EXECUTABLE);
  return existsSync(executable) ? executable : undefined;
};

interface FolderOpenerDeps {
  logger: FileLogger;
}

export class FolderOpener {
  constructor(private deps: FolderOpenerDeps) {}

  async revealInFileManager(cwd: string): Promise<void> {
    const failure = await shell.openPath(cwd);
    if (failure) throw new Error(`Could not open folder: ${failure}`);
  }

  openInEditor(path: string, position?: string): void {
    if (!existsSync(path)) throw new Error(`Path no longer exists: ${path}`);
    const executable = resolveEditorExecutable();
    if (!executable) throw new Error('VS Code was not found on PATH');
    const args = position ? ['--goto', `${path}:${position}`] : [path];
    this.deps.logger.info('editor.opened', { executable, args });
    spawn(executable, args, { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  }
}
