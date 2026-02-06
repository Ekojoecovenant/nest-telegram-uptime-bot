import { ConversationFlavor } from '@grammyjs/conversations';
import { Context } from 'grammy';
import { MenuFlavor } from '@grammyjs/menu';

export type MyContext = Context & ConversationFlavor<Context> & MenuFlavor;
