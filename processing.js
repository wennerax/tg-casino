const { changeBalance, getBalance, ensureUser } = require('./balance');
const { MIN_BET, MAX_BET } = require('./config');

function validateBet(userId, amount) {
  amount = Number(amount);
  if (!Number.isFinite(amount) || amount < MIN_BET || amount > MAX_BET) {
    throw new Error(`Bet amount must be between ${MIN_BET} and ${MAX_BET}`);
  }
  const balance = getBalance(userId);
  if (balance < amount) throw new Error('Not enough balance.');
  return Math.floor(amount);
}

function roulette(userId, amount, choice) {
  amount = validateBet(userId, amount);
  const spin = Math.floor(Math.random() * 37); // 0..36
  const redNumbers = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  const color = spin === 0 ? 'green' : redNumbers.has(spin) ? 'red' : 'black';

  let profit = -amount;
  let resultMessage = `🎰 Roulette spin: ${spin} (${color}).\n`;

  const c = choice.toLowerCase();
  if (c === 'green' && spin === 0) {
    profit = amount * 35;
  } else if ((c === 'red' || c === 'black') && color === c) {
    profit = amount;
  } else if (c === 'odd' && spin !== 0 && spin % 2 === 1) {
    profit = amount;
  } else if (c === 'even' && spin !== 0 && spin % 2 === 0) {
    profit = amount;
  }

  changeBalance(userId, profit);
  const balance = getBalance(userId);

  resultMessage += profit >= 0
    ? `✅ You won ${profit} coins!\n` 
    : `❌ You lost ${amount} coins.\n`;
  resultMessage += `💰 New balance: ${balance} coins.`;

  return resultMessage;
}

function bet(userId, amount, betType) {
  amount = validateBet(userId, amount);
  const spin = Math.floor(Math.random() * 100) + 1;
  let win = false;

  switch (betType.toLowerCase()) {
    case 'high':
      win = spin > 50;
      break;
    case 'low':
      win = spin <= 50;
      break;
    case 'odd':
      win = spin % 2 === 1;
      break;
    case 'even':
      win = spin % 2 === 0;
      break;
    default:
      throw new Error('Invalid bet type. Use high, low, odd, or even.');
  }

  const profit = win ? amount : -amount;
  changeBalance(userId, profit);
  const balance = getBalance(userId);

  return `🎲 Bet result: ${spin} (${betType.toUpperCase()})\n` +
    `${win ? `✅ Won ${amount} coins!` : `❌ Lost ${amount} coins.`}\n` +
    `💰 New balance: ${balance} coins.`;
}

function slots(userId, amount) {
  amount = validateBet(userId, amount);
  const icons = ['🍒', '🍋', '🔔', '⭐', '7️⃣', '🍀'];
  const a = icons[Math.floor(Math.random() * icons.length)];
  const b = icons[Math.floor(Math.random() * icons.length)];
  const c = icons[Math.floor(Math.random() * icons.length)];

  let multiplier = 0;
  if (a === b && b === c) {
    multiplier = 10;
  } else if (a === b || a === c || b === c) {
    multiplier = 2;
  }

  const profit = multiplier > 0 ? amount * multiplier : -amount;
  changeBalance(userId, profit);

  const balance = getBalance(userId);
  const winText = multiplier > 0 ? `✅ ${a}${b}${c} — You won ${amount * multiplier} coins!` : `❌ ${a}${b}${c} — You lost ${amount} coins.`;

  return `🎰 Slots result: ${a} | ${b} | ${c}\n${winText}\n💰 New balance: ${balance} coins.`;
}

function safeEnsureUser(user, chatId) {
  return ensureUser(user, chatId);
}

module.exports = {
  roulette,
  bet,
  slots,
  safeEnsureUser,
  validateBet
};
