const TelegramBot = require('node-telegram-bot-api');
const { TOKEN, MIN_BET, MAX_BET, START_BALANCE } = require('./config');
const balance = require('./balance');
const top = require('./top');
const processGame = require('./processing');

if (!TOKEN || TOKEN === '<YOUR_TELEGRAM_BOT_TOKEN>') {
  console.error('Error: Telegram token is not set. Put it in config.js or set TELEGRAM_BOT_TOKEN env var.');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

function sendHelp(chatId) {
  bot.sendMessage(chatId,
    `🎰 Casino Bot Commands:\n` +
    `/start - register and get coins (start with ${START_BALANCE})\n` +
    `/balance - your balance\n` +
    `/top - top in this chat\n` +
    `/top all - top global\n` +
    `/roulette <amount> <red|black|green|odd|even>\n` +
    `/bet <amount> <high|low|odd|even>\n` +
    `/slots <amount>\n` +
    `/pay <@username|user_id> <amount> - transfer coins\n` +
    `/help - show this message`);
}

bot.onText(/\/start/, (msg) => {
  const user = processGame.safeEnsureUser(msg.from, msg.chat.id);
  bot.sendMessage(msg.chat.id,
    `Welcome, ${msg.from.first_name || msg.from.username || 'Player'}!\n` +
    `Your balance is ${user.balance} coins. You can start playing roulette, bet, slots and transfer to others.`);
});

bot.onText(/\/(balance|bal)/, (msg) => {
  const user = balance.ensureUser(msg.from, msg.chat.id);
  const amount = balance.getBalance(msg.from.id);
  bot.sendMessage(msg.chat.id, `💰 ${msg.from.first_name || msg.from.username} your balance: ${amount} coins.`);
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
    bot.sendMessage(msg.chat.id, 'No leaderboard data yet. Play some games first.');
    return;
  }
  bot.sendMessage(msg.chat.id, `🏆 Top players (${arg === 'all' ? 'global' : 'this chat'}):\n` + lines.map((l, i) => `${i + 1}. ${l}`).join('\n'));
});

bot.onText(/\/roulette\s+(\d+)\s+(\w+)/, (msg, match) => {
  try {
    const amount = Number(match[1]);
    const choice = match[2];
    processGame.safeEnsureUser(msg.from, msg.chat.id);
    const result = processGame.roulette(msg.from.id, amount, choice);
    bot.sendMessage(msg.chat.id, result);
  } catch (e) {
    bot.sendMessage(msg.chat.id, `Error: ${e.message}`);
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
    bot.sendMessage(msg.chat.id, `Error: ${e.message}`);
  }
});

bot.onText(/\/slots\s+(\d+)/, (msg, match) => {
  try {
    const amount = Number(match[1]);
    processGame.safeEnsureUser(msg.from, msg.chat.id);
    const result = processGame.slots(msg.from.id, amount);
    bot.sendMessage(msg.chat.id, result);
  } catch (e) {
    bot.sendMessage(msg.chat.id, `Error: ${e.message}`);
  }
});

bot.onText(/\/pay\s+(\S+)\s+(\d+)/, (msg, match) => {
  try {
    const target = match[1];
    const amount = Number(match[2]);
    const sender = balance.ensureUser(msg.from, msg.chat.id);

    if (amount < MIN_BET || amount > MAX_BET) throw new Error(`Transfer amount must be between ${MIN_BET} and ${MAX_BET}`);
    if (sender.balance < amount) throw new Error('Not enough funds to pay.');

    let targetId = null;
    if (target.startsWith('@')) {
      const user = Object.values(balance.getAllUsers()).find(u => u.username && `@${u.username}` === target);
      if (!user) throw new Error('Target user not found by username.');
      targetId = user.id;
    } else {
      targetId = Number(target);
      if (!Number.isInteger(targetId)) throw new Error('Invalid target user id.');
    }

    if (targetId === msg.from.id) throw new Error('You cannot pay yourself.');

    const recip = balance.getAllUsers().find(u => u.id === targetId);
    if (!recip) throw new Error('Recipient not found. Recipient needs to start bot first.');

    const { from, to } = balance.transfer(msg.from.id, targetId, amount);
    bot.sendMessage(msg.chat.id,
      `✅ Transfer complete: ${amount} coins from ${msg.from.first_name || msg.from.username} to ${recip.username ? '@' + recip.username : recip.first_name}.\n` +
      `Your balance: ${from} coins. Recipient balance: ${to} coins.`);
  } catch (e) {
    bot.sendMessage(msg.chat.id, `Error: ${e.message}`);
  }
});

bot.onText(/\/help/, (msg) => sendHelp(msg.chat.id));

bot.on('message', (msg) => {
  // ensure user is registered each interaction, including groups
  if (msg.from) {
    balance.ensureUser(msg.from, msg.chat.id);
  }
});

console.log('Casino bot started');
