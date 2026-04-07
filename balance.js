const fs = require('fs');
const path = require('path');
const { START_BALANCE, USER_DATA_FILE } = require('./config');

let state = { users: {} };

function ensureDataFolder() {
  const dir = path.dirname(USER_DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadState() {
  ensureDataFolder();
  if (!fs.existsSync(USER_DATA_FILE)) {
    state = { users: {} };
    saveState();
    return;
  }
  try {
    const raw = fs.readFileSync(USER_DATA_FILE, 'utf-8');
    state = JSON.parse(raw);
    if (!state.users) state.users = {};
  } catch (e) {
    console.error('Failed to load user data', e);
    state = { users: {} };
  }
}

function saveState() {
  ensureDataFolder();
  fs.writeFileSync(USER_DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function getUserIdKey(userId) {
  return String(userId);
}

function ensureUser(user, chatId) {
  const id = getUserIdKey(user.id);
  if (!state.users[id]) {
    state.users[id] = {
      id: user.id,
      username: user.username || null,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      balance: START_BALANCE,
      groups: [],
      last_active: Date.now()
    };
  }
  const u = state.users[id];
  u.username = user.username || u.username;
  u.first_name = user.first_name || u.first_name;
  u.last_name = user.last_name || u.last_name;
  u.last_active = Date.now();
  if (chatId && chatId !== user.id && !u.groups.includes(chatId)) {
    u.groups.push(chatId);
  }
  saveState();
  return u;
}

function getBalance(userId) {
  const id = getUserIdKey(userId);
  if (!state.users[id]) return 0;
  return state.users[id].balance;
}

function setBalance(userId, amount) {
  const id = getUserIdKey(userId);
  if (!state.users[id]) return false;
  state.users[id].balance = Math.max(0, Math.floor(amount));
  saveState();
  return true;
}

function changeBalance(userId, delta) {
  const id = getUserIdKey(userId);
  if (!state.users[id]) return null;
  state.users[id].balance = Math.max(0, state.users[id].balance + Math.floor(delta));
  saveState();
  return state.users[id].balance;
}

function transfer(fromUserId, toUserId, amount) {
  amount = Math.floor(amount);
  if (amount <= 0) throw new Error('Amount must be positive');
  const from = state.users[getUserIdKey(fromUserId)];
  const to = state.users[getUserIdKey(toUserId)];
  if (!from || !to) throw new Error('User not found');
  if (from.balance < amount) throw new Error('Insufficient funds');
  from.balance -= amount;
  to.balance += amount;
  saveState();
  return { from: from.balance, to: to.balance };
}

function getAllUsers() {
  return Object.values(state.users);
}

loadState();

module.exports = {
  ensureUser,
  getBalance,
  setBalance,
  changeBalance,
  transfer,
  getAllUsers
};
