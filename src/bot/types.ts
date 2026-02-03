import { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { Context } from 'grammy';
import { MenuFlavor } from '@grammyjs/menu';

export type MyConversation = Conversation<MyContext>;

// export interface MyContext extends Context, ConversationFlavor<MyContext>, MenuFlavor {
//   // session data
// }

export type MyContext = Context & ConversationFlavor<Context> & MenuFlavor;
