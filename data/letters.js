let nextId = 1;
const letters = [];
async function create({ senderId, recipientId, body ,  musicTitle,
    musicPath }) {
  const letter = {
    id: String(nextId++),
    senderId,
    recipientId,
     musicTitle,
    musicPath,
    body,
    read: false,
    createdAt: new Date(),
  };
  letters.push(letter);
  return letter;
}

async function listInboxForUser(userId) {
  return letters
    .filter(l => l.recipientId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function findById(id) {
  return letters.find(l => l.id === id) || null;
}

async function markRead(id) {
  const letter = letters.find(l => l.id === id);
  if (!letter) return null;
  letter.read = true;
  return letter;
}

module.exports = { create, listInboxForUser, findById, markRead };
