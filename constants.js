export const DATA_FILE_PATH = './data.json';

export const TEXT = {
  welcomeSubscriber: 'Welcome!\n\nThis bot allows you to receive messages from the bot publishers. Just wait for a message!',
  welcomePublisher: 'Welcome!\n\nThis bot allows you to send messages to your subscribers. Share your bot link to get subscribers. Use the following keyboard to edit and send messages.',

  buttonViewSubscribersList: '👁 View Subscribers',
  buttonEditLetter: '✏️ Edit Message',
  buttonEditRecipientList: '📪 Edit Recipient List',
  buttonSendLetter: '✉️ Send',
  buttonSendAllLetter: '📦 Send All',

  requestEditLetter: 'Enter the message:',
  requestEditRecipientList: 'Enter recipient usernames, ex. "john_doe, mary.jane1998":',

  errorEmptyLetter: 'Unable to send the message because it is empty.',
  errorEmptyRecipientList: 'Unable to send the message because the recipient list is empty.',
  errorParsingInput: 'An error occurred during parsing the input:\n',
  errorCode: 'Code: ',
  errorDescription: '\nDescription: ',

  placeholderLetter: '*empty*',
  placeholderRecipientList: '*empty*',

  previewBeforeLetter: 'Message:\n\n',
  previewBeforeRecipientList: '\n\nRecipient list: ',

  resultPrefix: 'Results:\n',
  resultSuccessAfter: ' recipients received the message.',
  resultExcludedBefore: '\n\nThe following recipients did not receive the message because they are not subscribed: ',
  resultErrorBefore: '\n\nThe following recipients did not receive the message due to errors: ',
};

export const STATE = {
  initial: 'initial',
  editingLetter: 'editingLetter',
  editingRecipientList: 'editingRecipientList',
};

export const QUERY = {
  editLetter: 'editLetter',
  editRecipientList: 'editRecipientList',
  sendLetter: 'sendLetter',
  sendAllLetter: 'sendAllLetter',
  viewSubscribersList: 'viewSubscribersList',
};

export const KEYBOARD_MESSAGE_OPTIONS = {
  reply_markup: JSON.stringify({
    inline_keyboard: [[
      { text: TEXT.buttonEditLetter, callback_data: QUERY.editLetter },
    ], [
      { text: TEXT.buttonViewSubscribersList, callback_data: QUERY.viewSubscribersList },
      { text: TEXT.buttonEditRecipientList, callback_data: QUERY.editRecipientList },
    ], [
      { text: TEXT.buttonSendAllLetter, callback_data: QUERY.sendAllLetter },
      { text: TEXT.buttonSendLetter, callback_data: QUERY.sendLetter },
    ]],
  })
};
