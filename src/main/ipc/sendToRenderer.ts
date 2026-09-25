import type { WebContents } from 'electron';

export function sendToRenderer(renderer: WebContents, channel: string, payload: unknown): void {
  if (!renderer.isDestroyed()) renderer.send(channel, payload);
}
