import fs from 'fs';

import { DATA_FILE_PATH, TEXT, KEYBOARD_MESSAGE_OPTIONS } from './constants.js';

export const readSubscriberData = () => {
  const data = fs.readFileSync(DATA_FILE_PATH);
  const { subscribers } = JSON.parse(data);

  return subscribers;
};

export const subscribeUser = ({ username, chatId, firstName, lastName }) => {
  const subscribers = readSubscriberData();

  const newData = JSON.stringify({
    subscribers: {
      ...subscribers,
      [username]: {
        ...subscribers[username],
        chatId,
        firstName,
        lastName,
      }
    }
  }, null, '  ');

  fs.writeFileSync(DATA_FILE_PATH, newData);
};

export const sendDeliveryResult = async ({ bot, chatId, deliveryResultData }) => {
  const { successUserList, excludedUserList, errors } = deliveryResultData;
  const errorKeys = Object.keys(errors);
  let sendResultText = `${TEXT.resultPrefix}${successUserList.length}${TEXT.resultSuccessAfter}`;

  if (excludedUserList.length !== 0) {
    sendResultText += `${TEXT.resultExcludedBefore}${excludedUserList.join(', ')}`;
  }

  if (errorKeys.length !== 0) {
    const errorsText = errorKeys.reduce((acc, code) => {
      const { description, usernameList } = errors[code];

      return `${acc}${usernameList.join(', ')}: ${description}\n`;
    }, '');

    sendResultText += `${TEXT.resultErrorBefore}${errorsText}`;
  }

  const entities = [{
    offset: 0,
    length: TEXT.resultPrefix.length,
    type: 'bold',
  }];

  bot.sendMessage(chatId, sendResultText, { entities: JSON.stringify(entities) });
};

export const sendPreview = async ({ bot, chatId, letter, letterEntities, recipientList, options } ) => {
  const letterPrefixText = TEXT.previewBeforeLetter;
  const letterText = letter || TEXT.placeholderLetter;
  const recipientListPrefixText = TEXT.previewBeforeRecipientList;
  const recipientListText = recipientList.join(', ') || TEXT.placeholderRecipientList;
  const text = `${letterPrefixText}${letterText}${recipientListPrefixText}${recipientListText}`;

  const letterPrefixEntity = {
    offset: 0,
    length: letterPrefixText.length,
    type: 'bold',
  };
  const shiftedLetterEntities = letterEntities.map(entity => {
    return {
      ...entity,
      offset: entity.offset + TEXT.previewBeforeLetter.length,
    };
  });
  const recipientListPrefixEntity = {
    offset: letterPrefixText.length + letterText.length,
    length: recipientListPrefixText.length,
    type: 'bold',
  };
  const entities = [
    letterPrefixEntity,
    ...shiftedLetterEntities,
    recipientListPrefixEntity,
  ];

  try {
    await bot.sendMessage(chatId, text, { entities: JSON.stringify(entities), ...KEYBOARD_MESSAGE_OPTIONS });
  } catch (error) {
    const { error_code: code, description } = error.response.body;
    const parsingInputText = `${TEXT.errorParsingInput}${TEXT.errorCode}${code}${TEXT.errorDescription}${description}`;
    await bot.sendMessage(chatId, parsingInputText, options);
  }
};

export const sendLetter = async ({ bot, letter, letterEntities, recipientList }) => {
  const subscribers = readSubscriberData();
  const deliveryResultData = {
    successUserList: [],
    excludedUserList: [],
    errors: {},
  };
  const recipients = recipientList || Object.keys(subscribers);

  for (const username of recipients) {
    if (subscribers[username]) {
      const { chatId } = subscribers[username];

      try {
        await bot.sendMessage(chatId, letter, { entities: letterEntities });

        deliveryResultData.successUserList.push(username);
      } catch (error) {
        const { error_code: code, description } = error.response.body;

        if (!deliveryResultData.errors[code]) {
          deliveryResultData.errors[code] = {
            description,
            usernameList: [],
          };
        }

        deliveryResultData.errors[code].usernameList = [...deliveryResultData.errors[code].usernameList, username];
      }
    } else {
      deliveryResultData.excludedUserList.push(username);
    }
  }

  return deliveryResultData;
};
