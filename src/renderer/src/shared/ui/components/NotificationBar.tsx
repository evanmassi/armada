import type { CSSProperties } from 'react';
import { NOTICE_EXIT_MS, NOTICE_LIFETIME_MS, useNotificationStore } from '@renderer/app/stores/notificationStore';
import { ToneIcon, type Tone } from './ToneIcon';

const TONE_LABELS: Record<Tone, string> = { danger: 'Error', warning: 'Warning', info: 'Notice', success: 'Done' };

export function NotificationBar() {
  const notices = useNotificationStore((state) => state.notices);
  const dismiss = useNotificationStore((state) => state.dismiss);
  if (notices.length === 0) return null;
  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2" style={{ '--notice-lifetime': `${NOTICE_LIFETIME_MS}ms`, '--notice-exit': `${NOTICE_EXIT_MS}ms` } as CSSProperties}>
      {notices.map((notice) => (
        <div
          key={notice.id}
          role={notice.tone === 'danger' ? 'alert' : 'status'}
          className="tone-plate notice-plate relative flex w-[min(360px,calc(100vw-32px))] items-start gap-2.5 py-2 pr-2 pl-3.5 text-[13px] leading-snug text-fg"
          data-tone={notice.tone}
          data-leaving={notice.isLeaving || undefined}
        >
          <ToneIcon tone={notice.tone} />
          <span className="readout tone-text pt-px">{TONE_LABELS[notice.tone]}</span>
          <span className="min-w-0 flex-1">{notice.message}</span>
          <button type="button" className="hud-glyph text-muted" data-glyph="×" data-tone="neutral" onClick={() => dismiss(notice.id)} aria-label="Dismiss">
            ×
          </button>
          <span className="notice-life" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
