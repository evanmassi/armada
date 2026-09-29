import { open } from 'node:fs/promises';

const SNIFF_BYTES = 8000;

export async function isBinaryFile(path: string): Promise<boolean> {
  const file = await open(path, 'r');
  try {
    const { buffer, bytesRead } = await file.read({ buffer: Buffer.alloc(SNIFF_BYTES), position: 0 });
    return buffer.subarray(0, bytesRead).includes(0);
  } finally {
    await file.close();
  }
}
