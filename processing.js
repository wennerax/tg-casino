const { changeBalance, getBalance, ensureUser } = require('./balance');
const { MIN_BET, MAX_BET } = require('./config');

function validateBet(userId, amount) {
  amount = Number(amount);
  if (!Number.isFinite(amount) || amount < MIN_BET || amount > MAX_BET) {
    throw new Error(`Сумма ставки должна быть от ${MIN_BET} до ${MAX_BET}`);
  }
  const balance = getBalance(userId);
  if (balance < amount) throw new Error('Недостаточно средств.');
  return Math.floor(amount);
}

function roulette(userId, amount, choice) {
  amount = validateBet(userId, amount);
  const spin = Math.floor(Math.random() * 37); // 0..36
  const redNumbers = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  const color = spin === 0 ? 'зеленый' : redNumbers.has(spin) ? 'красный' : 'черный';

  const c = choice.toLowerCase();
  const validChoices = ['зеленый', 'красный', 'черный', 'нечет', 'чет'];
  if (!validChoices.includes(c)) {
    throw new Error('Недопустимый выбор. Используйте: зеленый, красный, черный, нечет, чет.');
  }

  let profit = -amount;
  let resultMessage = `🎰 Результат рулетки: ${spin} (${color}).\n`;

  if (c === 'зеленый' && spin === 0) {
    profit = amount * 35;
  } else if ((c === 'красный' || c === 'черный') && color === c) {
    profit = amount;
  } else if (c === 'нечет' && spin !== 0 && spin % 2 === 1) {
    profit = amount;
  } else if (c === 'чет' && spin !== 0 && spin % 2 === 0) {
    profit = amount;
  }

  changeBalance(userId, profit);
  const balance = getBalance(userId);

  resultMessage += profit >= 0
    ? `✅ Вы выиграли ${profit} монет!\n` 
    : `❌ Вы проиграли ${amount} монет.\n`;
  resultMessage += `💰 Новый баланс: ${balance} монет.`;

  return resultMessage;
}

function bet(userId, amount, betType) {
  amount = validateBet(userId, amount);
  const spin = Math.floor(Math.random() * 100) + 1;
  let win = false;

  switch (betType.toLowerCase()) {
    case 'больше':
      win = spin > 50;
      break;
    case 'меньше':
      win = spin <= 50;
      break;
    case 'нечет':
      win = spin % 2 === 1;
      break;
    case 'чет':
      win = spin % 2 === 0;
      break;
    default:
      throw new Error('Недопустимый тип ставки. Используйте: больше, меньше, нечет, чет.');
  }

  const profit = win ? amount : -amount;
  changeBalance(userId, profit);
  const balance = getBalance(userId);

  return `🎲 Результат ставки: ${spin} (${betType.toUpperCase()})\n` +
    `${win ? `✅ Вы выиграли ${amount} монет!` : `❌ Вы проиграли ${amount} монет.`}\n` +
    `💰 Новый баланс: ${balance} монет.`;
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
  const winText = multiplier > 0 ? `✅ ${a}${b}${c} — Вы выиграли ${amount * multiplier} монет!` : `❌ ${a}${b}${c} — Вы проиграли ${amount} монет.`;

  return `🎰 Результат слот-машины: ${a} | ${b} | ${c}\n${winText}\n💰 Новый баланс: ${balance} монет.`;
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
