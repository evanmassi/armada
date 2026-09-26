import type { Conversation } from '@shared/conversations/conversationTypes';
import { CLICK_ORIGIN_PROPS } from '@renderer/app/clickFeedback';
import type { ActivityState } from '@renderer/app/stores/sessionActivityStore';
import { ActivityDot } from '@renderer/shared/ui/components/ActivityDot';

interface ConversationRowProps {
  conversation: Conversation;
  activity: ActivityState | undefined;
  isPinned: boolean;
  isArchived: boolean;
  isOnActiveBoard: boolean;
  onOpen(conversation: Conversation, keepOnCurrentBoard: boolean): void;
  onTogglePin(sessionId: string): void;
  onSetArchived(sessionId: string, isArchived: boolean): void;
}

const formatLastActive = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

const HOVER_ACTION_CLASS = 'hud-glyph px-1 text-[11px] text-muted opacity-0 group-hover:opacity-100 focus:opacity-100';

export function ConversationRow({ conversation, activity, isPinned, isArchived, isOnActiveBoard, onOpen, onTogglePin, onSetArchived }: ConversationRowProps) {
  return (
    <div className={`hud-row group flex items-center gap-1 py-1 pr-1 pl-4 ${isArchived ? 'opacity-60' : ''}`} data-selected={isOnActiveBoard || undefined}>
      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left focus:outline-none" onClick={(event) => onOpen(conversation, event.shiftKey)}>
        <span className="w-2 shrink-0" {...CLICK_ORIGIN_PROPS}>
          {activity && <ActivityDot state={activity} />}
        </span>
        <span className="hud-row-label min-w-0 flex-1 truncate">{conversation.title}</span>
        <span className="readout shrink-0 text-[10px] tracking-[0.08em] text-muted tabular-nums">{formatLastActive(conversation.lastActiveAt)}</span>
      </button>
      <button
        type="button"
        className={HOVER_ACTION_CLASS}
        data-glyph={isArchived ? '↩' : '⌫'}
        onClick={() => onSetArchived(conversation.sessionId, !isArchived)}
        aria-label={isArchived ? 'Restore conversation' : 'Archive conversation'}
        title={isArchived ? 'Restore' : 'Archive'}
      >
        {isArchived ? '↩' : '⌫'}
      </button>
      <button
        type="button"
        className={isPinned ? 'hud-glyph px-1 text-[11px] text-alert' : HOVER_ACTION_CLASS}
        data-glyph={isPinned ? '★' : '☆'}
        data-tone={isPinned ? 'alert' : undefined}
        onClick={() => onTogglePin(conversation.sessionId)}
        aria-label={isPinned ? 'Unpin' : 'Pin'}
        aria-pressed={isPinned}
      >
        {isPinned ? '★' : '☆'}
      </button>
    </div>
  );
}
