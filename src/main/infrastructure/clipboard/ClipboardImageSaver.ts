import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { clipboard } from 'electron';
import type { FileLogger } from '@main/infrastructure/logging/FileLogger';

const PNG_TYPE = 'image/png';

const imageFileName = (): string => `clipboard-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;

interface ClipboardImageSaverDeps {
  imagesDir: string;
  logger: FileLogger;
}

export class ClipboardImageSaver {
  constructor(private deps: ClipboardImageSaverDeps) {}

  async save(): Promise<string | undefined> {
    const item = (await clipboard.read()).find((candidate) => candidate.types.includes(PNG_TYPE));
    if (!item) return undefined;
    const image = await item.getType(PNG_TYPE);
    if (!(image instanceof Blob)) return undefined;
    const filePath = join(this.deps.imagesDir, imageFileName());
    try {
      await mkdir(this.deps.imagesDir, { recursive: true });
      await writeFile(filePath, Buffer.from(await image.arrayBuffer()));
    } catch (error) {
      this.deps.logger.error('clipboardImage.saveFailed', { filePath, error });
      throw new Error(`Could not save the clipboard image to ${this.deps.imagesDir}`);
    }
    return filePath;
  }
}
