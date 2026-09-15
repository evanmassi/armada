import { useNotificationStore } from '@renderer/app/stores/notificationStore';

export function NotificationBar() {
  const notices = useNotificationStore((state) => state.notices);
  const dismiss = useNotificationStore((state) => state.dismiss);
  if (notices.length === 0) return null;
  return (
    <div className="fixed right-4 bottom-4 flex flex-col gap-2">
      {notices.map((notice) => (
        <div key={notice.id} className="flex items-center gap-3 rounded border border-red-500/60 bg-panel px-3 py-2 text-fg">
          <span>{notice.message}</span>
          <button type="button" className="text-muted hover:text-fg" onClick={() => dismiss(notice.id)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
