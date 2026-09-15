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
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const HOVER_ACTION_CLASS = 'px-1 text-[11px] text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-fg';

export function ConversationRow({ conversation, activity, isPinned, isArchived, onOpen, onTogglePin, onSetArchived }: ConversationRowProps) {
  return (
    <div className={`group flex items-center gap-1 rounded py-1 pr-1 pl-4 hover:bg-edge focus-within:bg-edge ${isArchived ? 'opacity-60' : ''}`}>
      <button type="button" className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left focus:outline-none" onClick={() => onOpen(conversation)}>
        <span className="flex w-full items-center gap-1.5">
          {activity && <ActivityDot state={activity} />}
          <span className="truncate">{conversation.title}</span>
        </span>
        <span className="text-[11px] text-muted">{formatLastActive(conversation.lastActiveAt)}</span>
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
        className={isPinned ? 'px-1 text-[11px] text-amber-300' : HOVER_ACTION_CLASS}
        onClick={() => onTogglePin(conversation.sessionId)}
        aria-label={isPinned ? 'Unpin' : 'Pin'}
        aria-pressed={isPinned}
      >
        {isPinned ? '★' : '☆'}
      </button>
    </div>
  );
}
