import { Context } from 'grammy';
import { type ConversationFlavor } from '@grammyjs/conversations';
import { type MenuFlavor } from '@grammyjs/menu'; // if using MenuFlavor explicitly

// Combine all flavors you use (order usually doesn't matter)
export type MyContext = ConversationFlavor<Context> & MenuFlavor;
