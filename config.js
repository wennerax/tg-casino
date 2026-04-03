const path = require('path');
const { BOT_TOKEN } = require('./token');

module.exports = {
  TOKEN: BOT_TOKEN,
  MIN_BET: 100,
  MAX_BET: 999999,
  START_BALANCE: 1000,
  USER_DATA_FILE: path.resolve(__dirname, 'data', 'users.json')
};
