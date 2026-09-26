import { useNotificationStore } from '@renderer/app/stores/notificationStore';

export function NotificationBar() {
  const notices = useNotificationStore((state) => state.notices);
  const dismiss = useNotificationStore((state) => state.dismiss);
  if (notices.length === 0) return null;
  return (
    <div className="fixed right-4 bottom-4 flex flex-col gap-2">
      {notices.map((notice) => (
        <div key={notice.id} className="flex items-center gap-3 border border-alert/60 bg-panel/90 px-3 py-2 text-fg backdrop-blur">
          <span>{notice.message}</span>
          <button type="button" className="hud-glyph text-muted" data-glyph="×" onClick={() => dismiss(notice.id)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
