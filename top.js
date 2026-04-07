const { getAllUsers } = require('./balance');

function formatUser(u) {
  const name = u.username ? `@${u.username}` : `${u.first_name || 'Пользователь'} ${u.last_name || ''}`.trim();
  return `${name} — ${u.balance.toLocaleString()} монет`;
}
function getTopAll(limit = 10) {
  return getAllUsers()
    .slice()
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit)
    .map(formatUser);
}

function getTopGroup(chatId, limit = 10) {
  const users = getAllUsers().filter(u => u.groups && u.groups.includes(chatId));
  return users
    .slice()
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit)
    .map(formatUser);
}

module.exports = {
  getTopAll,
  getTopGroup
};
