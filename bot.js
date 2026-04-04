const TelegramBot = require('node-telegram-bot-api');
const { TOKEN, MIN_BET, MAX_BET, START_BALANCE } = require('./config');
const balance = require('./balance');
const top = require('./top');
const processGame = require('./processing');

if (!TOKEN || TOKEN === '') {
  console.error('Ошибка: токен Telegram не установлен. Укажите его в файле config.js или установите переменную окружения TELEGRAM_BOT_TOKEN.');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

function sendHelp(chatId) {
  bot.sendMessage(chatId,
    `🎰 Команды казино бота:\n` +
    `/start - зарегистрироваться и получить монеты (начинаете с ${START_BALANCE})\n` +
    `/balance - ваш баланс\n` +
    `/top - топ по этому чату\n` +
    `/top all - глобальный топ\n` +
    `/roulette <сумма> <красное|черное|зеленое|нечет|чет>\n` +
    `/bet <сумма> <high|low|odd|even>\n` +
    `/slots <сумма>\n` +
    `/pay <@имя_пользователя|user_id> <сумма> - перевести монеты\n` +
    `/help - показать это сообщение`);
}

bot.onText(/\/start/, (msg) => {
  const user = processGame.safeEnsureUser(msg.from, msg.chat.id);
  bot.sendMessage(msg.chat.id,
    `Добро пожаловать, ${msg.from.first_name || msg.from.username || 'Игрок'}!\n` +
    `Ваш баланс: ${user.balance} монет. Можете начать играть в рулетку, делать ставки, играть в слоты и переводить монеты другим.`);
});

bot.onText(/\/(balance|bal)/, (msg) => {
  const user = balance.ensureUser(msg.from, msg.chat.id);
  const amount = balance.getBalance(msg.from.id);
  bot.sendMessage(msg.chat.id, `💰 ${msg.from.first_name || msg.from.username}, ваш баланс: ${amount} монет.`);
});

bot.onText(/\/top(?:\s+(.+))?/, (msg, match) => {
  const arg = (match && match[1] || '').trim().toLowerCase();
  let lines;
  if (arg === 'all') {
    lines = top.getTopAll();
  } else {
    lines = top.getTopGroup(msg.chat.id);
    if (!lines.length && msg.chat.type === 'private') {
      lines = top.getTopAll();
    }
  }
  if (!lines.length) {
    bot.sendMessage(msg.chat.id, 'Еще нет данных для таблицы лидеров. Играйте в игры сначала.');
    return;
  }
  bot.sendMessage(msg.chat.id, `🏆 Топ игроков (${arg === 'all' ? 'глобальный' : 'этот чат'}):\n` + lines.map((l, i) => `${i + 1}. ${l}`).join('\n'));
});

bot.onText(/\/roulette\s+(\d+)\s+(\w+)/, (msg, match) => {
  try {
    const amount = Number(match[1]);
    const choice = match[2];
    processGame.safeEnsureUser(msg.from, msg.chat.id);
    const result = processGame.roulette(msg.from.id, amount, choice);
    bot.sendMessage(msg.chat.id, result);
  } catch (e) {
    bot.sendMessage(msg.chat.id, `Ошибка: ${e.message}`);
  }
});

bot.onText(/\/bet\s+(\d+)\s+(\w+)/, (msg, match) => {
  try {
    const amount = Number(match[1]);
    const betType = match[2];
    processGame.safeEnsureUser(msg.from, msg.chat.id);
    const result = processGame.bet(msg.from.id, amount, betType);
    bot.sendMessage(msg.chat.id, result);
  } catch (e) {
    bot.sendMessage(msg.chat.id, `Ошибка: ${e.message}`);
  }
});

bot.onText(/\/slots\s+(\d+)/, (msg, match) => {
  try {
    const amount = Number(match[1]);
    processGame.safeEnsureUser(msg.from, msg.chat.id);
    const result = processGame.slots(msg.from.id, amount);
    bot.sendMessage(msg.chat.id, result);
  } catch (e) {
    bot.sendMessage(msg.chat.id, `Ошибка: ${e.message}`);
  }
});

bot.onText(/\/pay\s+(\S+)\s+(\d+)/, (msg, match) => {
  try {
    const target = match[1];
    const amount = Number(match[2]);
    const sender = balance.ensureUser(msg.from, msg.chat.id);

    if (amount < MIN_BET || amount > MAX_BET) throw new Error(`Сумма перевода должна быть между ${MIN_BET} и ${MAX_BET}`);
    if (sender.balance < amount) throw new Error('Недостаточно средств для перевода.');

    let targetId = null;
    if (target.startsWith('@')) {
      const user = Object.values(balance.getAllUsers()).find(u => u.username && `@${u.username}` === target);
      if (!user) throw new Error('Пользователь не найден по имени.');
      targetId = user.id;
    } else {
      targetId = Number(target);
      if (!Number.isInteger(targetId)) throw new Error('Некорректный ID пользователя.');
    }

    if (targetId === msg.from.id) throw new Error('Вы не можете перевести себе.');
    
    const recip = balance.getAllUsers().find(u => u.id === targetId);
    if (!recip) throw new Error('Получатель не найден. Получатель должен сначала начать взаимодействие с ботом.');

    const { from, to } = balance.transfer(msg.from.id, targetId, amount);
    bot.sendMessage(msg.chat.id,
      `✅ Перевод выполнен: ${amount} монет от ${msg.from.first_name || msg.from.username} к ${recip.username ? '@' + recip.username : recip.first_name}.\n` +
      `Ваш баланс: ${from} монет. Баланс получателя: ${to} монет.`);
  } catch (e) {
    bot.sendMessage(msg.chat.id, `Ошибка: ${e.message}`);
  }
});

bot.onText(/\/help/, (msg) => sendHelp(msg.chat.id));

bot.on('message', (msg) => {
  if (msg.from) {
    balance.ensureUser(msg.from, msg.chat.id);
  }
});

console.log('Бот казино запущен');
