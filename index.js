import TelegramBot from 'node-telegram-bot-api';
import { QUERY, STATE, TEXT } from './constants.js';
import { readData, addSubscriber, sendPreview, sendLetter, sendDeliveryResult } from './helpers.js';

let letter = '';
let letterEntities = [];
let recipientList = [];
let state = STATE.initial;

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const ADMIN_USERNAMES = process.env.ADMIN_USERNAMES.split(',');

// Keyboard buttons reactions
bot.on('callback_query', async (query) => {
  // "Edit Message" button reaction
  if (query.data === QUERY.editLetter) {
    state = STATE.editingLetter;
    bot.sendMessage(query.message.chat.id, TEXT.requestEditLetter);
  }

  // "View Subscribers" button reaction
  if (query.data === QUERY.viewSubscribersList) {
    const { subscribers } = readData();

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
    addSubscriber({
      username: message.chat.username,
      chatId: message.chat.id,
      firstName: message.chat.first_name,
      lastName: message.chat.last_name,
    });

    const { publishers } = readData();
    const isPublisherOrAdmin = ADMIN_USERNAMES.includes(message.chat.username) || Object.keys(publishers).includes(message.chat.username);

    if (isPublisherOrAdmin) {
      await bot.sendMessage(message.chat.id, TEXT.welcomePublisher);
      sendPreview({ bot, chatId: message.chat.id, letter, letterEntities, recipientList });
      return;
    }

    bot.sendMessage(message.chat.id, TEXT.welcomeSubscriber);
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

  if (message.text === '/getme') {
    console.log('### bot: ', await bot.getMe());
  }
});

// Stop on process termination
process.once('SIGINT', () => bot.stopPolling());
process.once('SIGTERM', () => bot.stopPolling());
