const { получитьВсехПользователей } = require('./balance');

function форматироватьПользователя(u) {
  const имя = u.username ? `@${u.username}` : `${u.first_name || 'Пользователь'} ${u.last_name || ''}`.trim();
  return `${имя} — ${u.balance.toLocaleString()} монет`;
}

function получитьТОПВСех(limit = 10) {
  return получитьВсехПользователей()
    .slice()
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit)
    .map(форматироватьПользователя);
}


function получитьТОПГруппы(chatId, limit = 10) {
  const пользователи = получитьВсехПользователей().filter(u => u.groups && u.groups.includes(chatId));
  return пользователи
    .slice()
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit)
    .map(форматироватьПользователя);
}

module.exports = {
  получитьТОПВСех,
  получитьТОПГруппы
};
