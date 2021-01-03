import TelegramBot from 'node-telegram-bot-api';
import { ADMIN_USERNAME_LIST, TELEGRAM_BOT_TOKEN } from './config.js';
import { QUERY, STATE, TEXT } from './constants.js';
import { readSubscriberData, subscribeUser, sendPreview, sendLetter, sendDeliveryResult } from './helpers.js';

let letter = '';
let letterEntities = [];
let recipientList = [];
let state = STATE.initial;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Keyboard buttons reactions
bot.on('callback_query', async (query) => {
  // "Edit Message" button reaction
  if (query.data === QUERY.editLetter) {
    state = STATE.editingLetter;
    bot.sendMessage(query.message.chat.id, TEXT.requestEditLetter);
  }

  // "View Subscribers" button reaction
  if (query.data === QUERY.viewSubscribersList) {
    const subscribers = readSubscriberData();

    const subscribersText = Object.keys(subscribers).reduce((acc, username) => {
      const subscriber = subscribers[username];
      const { firstName, lastName = '–' } = subscriber;

      return `${acc}${firstName} ${lastName} (${username})\n`;
    }, '');

    bot.sendMessage(query.message.chat.id, subscribersText);
  }

  // "Edit Recipient List" button reaction
  if (query.data === QUERY.editRecipientList) {
    state = STATE.editingRecipientList;
    bot.sendMessage(query.message.chat.id, TEXT.requestEditRecipientList);
  }

  // "Send" button reaction
  if (query.data === QUERY.sendLetter) {
    if (letter === '') {
      bot.sendMessage(query.message.chat.id, TEXT.errorEmptyLetter);
      return;
    }

    if (recipientList.length === 0) {
      bot.sendMessage(query.message.chat.id, TEXT.errorEmptyRecipientList);
      return;
    }

    const deliveryResultData = await sendLetter({ bot, letter, letterEntities, recipientList });

    sendDeliveryResult({ bot, chatId: query.message.chat.id, deliveryResultData });
  }

  // "Send All" button reaction
  if (query.data === QUERY.sendAllLetter) {
    if (letter === '') {
      bot.sendMessage(query.message.chat.id, TEXT.errorEmptyLetter);
      return;
    }

    const sendResultData = await sendLetter({ bot, letter, letterEntities });

    sendDeliveryResult({ bot, chatId: query.message.chat.id, sendResultData });
  }
});

// Text messages reactions
bot.on('message', async message => {
  // Initial command "/start" reaction
  if (message.text === '/start') {
    subscribeUser({
      username: message.chat.username,
      chatId: message.chat.id,
      firstName: message.chat.first_name,
      lastName: message.chat.last_name,
    });

    if (ADMIN_USERNAME_LIST.includes(message.chat.username)) {
      await bot.sendMessage(message.chat.id, TEXT.welcomeAdmin);
      sendPreview({ bot, chatId: message.chat.id, letter, letterEntities, recipientList });
      return;
    }

    bot.sendMessage(message.chat.id, TEXT.welcome);
    return;
  }

  // Editing message
  if (state === STATE.editingLetter) {
    letter = message.text;
    letterEntities = message.entities || [];

    sendPreview({ bot, chatId: message.chat.id, letter, letterEntities, recipientList });

    state = STATE.initial;
    return;
  }

  // Editing recipient list
  if (state === STATE.editingRecipientList) {
    recipientList = message.text.replace(' ', '').replace('@', '').split(',');

    sendPreview({ bot, chatId: message.chat.id, letter, letterEntities, recipientList });

    state = STATE.initial;
    return;
  }
});

// Stop on process termination
process.once('SIGINT', () => bot.stopPolling());
process.once('SIGTERM', () => bot.stopPolling());
