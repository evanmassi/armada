import type { Conversation } from '@shared/conversations/conversationTypes';
import type { ActivityState } from '@renderer/app/stores/sessionActivityStore';
import { ActivityDot } from '@renderer/shared/ui/components/ActivityDot';

interface ConversationRowProps {
  conversation: Conversation;
  activity: ActivityState | undefined;
  isPinned: boolean;
  isArchived: boolean;
  onOpen(conversation: Conversation): void;
  onTogglePin(sessionId: string): void;
  onSetArchived(sessionId: string, isArchived: boolean): void;
}

const formatLastActive = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

const HOVER_ACTION_CLASS = 'px-1 text-[11px] text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-fg';

export function ConversationRow({ conversation, activity, isPinned, isArchived, onOpen, onTogglePin, onSetArchived }: ConversationRowProps) {
  return (
    <div className={`group flex items-center gap-1 py-1 pr-1 pl-4 hover:bg-edge/60 focus-within:bg-edge/60 ${isArchived ? 'opacity-60' : ''}`}>
      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left focus:outline-none" onClick={() => onOpen(conversation)}>
        <span className="w-2 shrink-0">{activity && <ActivityDot state={activity} />}</span>
        <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
        <span className="readout shrink-0 text-[10px] tracking-[0.08em] text-muted tabular-nums">{formatLastActive(conversation.lastActiveAt)}</span>
      </button>
      <button
        type="button"
        className={HOVER_ACTION_CLASS}
        onClick={() => onSetArchived(conversation.sessionId, !isArchived)}
        aria-label={isArchived ? 'Restore conversation' : 'Archive conversation'}
        title={isArchived ? 'Restore' : 'Archive'}
      >
        {isArchived ? '↩' : '⌫'}
      </button>
      <button
        type="button"
        className={isPinned ? 'px-1 text-[11px] text-alert' : HOVER_ACTION_CLASS}
        onClick={() => onTogglePin(conversation.sessionId)}
        aria-label={isPinned ? 'Unpin' : 'Pin'}
        aria-pressed={isPinned}
      >
        {isPinned ? '★' : '☆'}
      </button>
    </div>
  );
}
