import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isBinaryFile } from './binaryFileCheck';

describe('isBinaryFile', () => {
  let folder: string;

  beforeAll(async () => {
    folder = await mkdtemp(join(tmpdir(), 'armada-binary-check-'));
  });

  afterAll(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  const fileWith = async (name: string, content: string | Uint8Array): Promise<string> => {
    const path = join(folder, name);
    await writeFile(path, content);
    return path;
  };

  it('finds a zero byte in images and programs', async () => {
    const pngHeader = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d);
    expect(await isBinaryFile(await fileWith('bear_run.png', pngHeader))).toBe(true);
    expect(await isBinaryFile(await fileWith('launcher.exe', Uint8Array.of(0x4d, 0x5a, 0x90, 0x00)))).toBe(true);
  });

  it('treats text of any extension, and an empty file, as text', async () => {
    expect(await isBinaryFile(await fileWith('player.gd', 'extends Node2D\n'))).toBe(false);
    expect(await isBinaryFile(await fileWith('build.bat', '@echo off\n'))).toBe(false);
    expect(await isBinaryFile(await fileWith('Makefile', 'all:\n\techo ok\n'))).toBe(false);
    expect(await isBinaryFile(await fileWith('empty.txt', ''))).toBe(false);
  });
});
