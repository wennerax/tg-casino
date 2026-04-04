const fs = require('fs');
const path = require('path');
const { START_BALANCE, USER_DATA_FILE } = require('./config');

let state = { пользователи: {} };

function обеспечитьПапкуДанных() {
  const папка = path.dirname(USER_DATA_FILE);
  if (!fs.existsSync(папка)) fs.mkdirSync(папка, { recursive: true });
}

function загрузитьСостояние() {
  обеспечитьПапкуДанных();
  if (!fs.existsSync(USER_DATA_FILE)) {
    state = { пользователи: {} };
    сохранитьСостояние();
    return;
  }
  try {
    const raw = fs.readFileSync(USER_DATA_FILE, 'utf-8');
    state = JSON.parse(raw);
    if (!state.пользователи) state.пользователи = {};
  } catch (e) {
    console.error('Не удалось загрузить данные пользователей', e);
    state = { пользователи: {} };
  }
}

function сохранитьСостояние() {
  обеспечитьПапкуДанных();
  fs.writeFileSync(USER_DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function получитьКлючПользователя(userId) {
  return String(userId);
}

function обеспечитьПользователя(user, chatId) {
  const id = получитьКлючПользователя(user.id);
  if (!state.пользователи[id]) {
    state.пользователи[id] = {
      id: user.id,
      username: user.username || null,
      имя: user.first_name || '',
      фамилия: user.last_name || '',
      баланс: START_BALANCE,
      группы: [],
      последнее_активность: Date.now()
    };
  }
  const пользователь = state.пользователи[id];
  пользователь.username = user.username || пользователь.username;
  пользователь.имя = user.first_name || пользователь.имя;
  пользователь.фамилия = user.last_name || пользователь.фамилия;
  пользователь.последнее_активность = Date.now();
  if (chatId && chatId !== user.id && !пользователь.группы.includes(chatId)) {
    пользователь.группы.push(chatId);
  }
  сохранитьСостояние();
  return пользователь;
}

function получитьБаланс(userId) {
  const id = получитьКлючПользователя(userId);
  if (!state.пользователи[id]) return 0;
  return state.пользователи[id].баланс;
}

function установитьБаланс(userId, сумма) {
  const id = получитьКлючПользователя(userId);
  if (!state.пользователи[id]) return false;
  state.пользователи[id].баланс = Math.max(0, Math.floor(сумма));
  сохранитьСостояние();
  return true;
}

function изменитьБаланс(userId, дельта) {
  const id = получитьКлючПользователя(userId);
  if (!state.пользователи[id]) return null;
  state.пользователи[id].баланс = Math.max(0, state.пользователи[id].баланс + Math.floor(дельта));
  сохранитьСостояние();
  return state.пользователи[id].баланс;
}

function перевод(fromUserId, toUserId, сумма) {
  сумма = Math.floor(сумма);
  if (сумма <= 0) throw new Error('Сумма должна быть положительной');
  const from = state.пользователи[getКлючПользователя(fromUserId)];
  const to = state.пользователи[getКлючПользователя(toUserId)];
  if (!from || !to) throw new Error('Пользователь не найден');
  if (from.баланс < сумма) throw new Error('Недостаточно средств');
  from.баланс -= сумма;
  to.баланс += сумма;
  сохранитьСостояние();
  return { от: from.баланс, к: to.баланс };
}

function получитьВсехПользователей() {
  return Object.values(state.пользователи);
}

загрузитьСостояние();

module.exports = {
  обеспечитьПользователя,
  получитьБаланс,
  установитьБаланс,
  изменитьБаланс,
  перевод,
  получитьВсехПользователей
};
