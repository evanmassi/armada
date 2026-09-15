import type { Conversation } from '@shared/conversations/conversationTypes';

interface ConversationRowProps {
  conversation: Conversation;
  onOpen(conversation: Conversation): void;
}

const formatLastActive = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function ConversationRow({ conversation, onOpen }: ConversationRowProps) {
  return (
    <button
      type="button"
      className="flex w-full flex-col items-start gap-0.5 rounded px-2 py-1 text-left hover:bg-edge focus:bg-edge focus:outline-none"
      onClick={() => onOpen(conversation)}
    >
      <span className="w-full truncate">{conversation.title}</span>
      <span className="text-[11px] text-muted">{formatLastActive(conversation.lastActiveAt)}</span>
    </button>
  );
}
