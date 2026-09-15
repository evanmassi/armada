import type { Conversation } from '@shared/conversations/conversationTypes';

export interface ConversationRepository {
  listConversations(): Promise<Conversation[]>;
  hasConversation(sessionId: string): Promise<boolean>;
}
