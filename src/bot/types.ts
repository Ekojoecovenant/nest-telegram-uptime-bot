import { Conversation } from '@grammyjs/conversations';
import { Context } from 'grammy';

export type MyConversation = Conversation<MyContext>;

export interface MyContext extends Context {
  // session, conversation flavor
}
