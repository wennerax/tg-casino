const путь = require('path');
const { ТОКЕН_БОТА } = require('./token');

module.exports = {
  ТОКЕН: ТОКЕН_БОТА,
  МИНИМАЛЬНАЯ_СТАВКА: 100,
  МАКСИМАЛЬНАЯ_СТАВКА: 999999,
  НАЧАЛЬНЫЙ_БАЛАНС: 1000,
  ФАЙЛ_ДАННЫХ_ПОЛЬЗОВАТЕЛЯ: путь.resolve(__dirname, 'data', 'users.json')
};
