import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { shell } from 'electron';
import { resolveOnPath } from '@main/infrastructure/launchChecks';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';
import { getHomeDir } from '@main/infrastructure/paths';

const EDITOR_SHIM = process.platform === 'win32' ? 'code.cmd' : 'code';
const WINDOWS_EDITOR_EXECUTABLE = join('..', 'Code.exe');

const MAC_EDITOR_CLI = join('Visual Studio Code.app', 'Contents', 'Resources', 'app', 'bin', 'code');

const macEditorCliLocations = (): string[] =>
  ['/Applications', join(getHomeDir(), 'Applications')].map((applicationsDir) => join(applicationsDir, MAC_EDITOR_CLI));

// PITFALL: code.cmd only runs through a shell; the real Code.exe sits one folder above the shim and takes argv directly.
const resolveWindowsEditorExecutable = (shim: string | undefined): string | undefined => {
  if (!shim) return undefined;
  const executable = join(dirname(shim), WINDOWS_EDITOR_EXECUTABLE);
  return existsSync(executable) ? executable : undefined;
};

// PITFALL: VS Code on a Mac puts code on PATH only after its "Install 'code' command" step, so the CLI inside the app bundle stands in.
const resolveEditorExecutable = (): string | undefined => {
  const shim = resolveOnPath(EDITOR_SHIM);
  if (process.platform === 'win32') return resolveWindowsEditorExecutable(shim);
  return shim ?? macEditorCliLocations().find((cli) => existsSync(cli));
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

  isEditorInstalled(): boolean {
    return resolveEditorExecutable() !== undefined;
  }

  openInEditor(path: string, position?: string): void {
    if (!existsSync(path)) throw new Error(`Path no longer exists: ${path}`);
    const executable = resolveEditorExecutable();
    if (!executable) throw new Error('VS Code was not found');
    const args = position ? ['--goto', `${path}:${position}`] : [path];
    this.deps.logger.info('editor.opened', { executable, args });
    // PITFALL: windowsHide tells a GUI app to start with its window hidden; VS Code obeys and then swallows every later open.
    spawn(executable, args, { detached: true, stdio: 'ignore' }).unref();
  }
}
