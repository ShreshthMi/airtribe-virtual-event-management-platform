const { v4: uuidv4 } = require('uuid');

const users = [];

function createUser({ name, email, password, role }) {
  const user = {
    id: uuidv4(),
    name,
    email: email.toLowerCase(),
    password,
    role: role === 'organizer' ? 'organizer' : 'attendee',
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

function findUserByEmail(email) {
  if (!email) return null;
  return users.find((u) => u.email === email.toLowerCase()) || null;
}

function findUserById(id) {
  return users.find((u) => u.id === id) || null;
}

function sanitize(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

function _reset() {
  users.length = 0;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  sanitize,
  _reset,
};
