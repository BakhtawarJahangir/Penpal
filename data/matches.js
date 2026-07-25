// data/matches.js
// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY STUB — Integration contract for the MSSQL teammate.
//
// A Match row means userAId and userBId are penpals.  The relationship is
// symmetric — one row covers both directions.
//
// MSSQL table hint:
//   CREATE TABLE Matches (
//     id         INT IDENTITY PRIMARY KEY,
//     userAId    INT NOT NULL REFERENCES Users(id),
//     userBId    INT NOT NULL REFERENCES Users(id),
//     createdAt  DATETIME DEFAULT GETDATE()
//   );
// ─────────────────────────────────────────────────────────────────────────────

// matches.js needs the full user list to pick a random unmatched candidate.
const usersData = require('./users');

let nextId = 1;
const matches = [];

// ── Exported functions (the contract) ─────────────────────────────────────────

// Returns the id of a random user that `userId` is NOT yet matched with,
// or null if no candidates exist.
//
// MSSQL: find a random Users row where the user's id does NOT appear in any
// Matches row alongside @userId:
//   SELECT TOP 1 id FROM Users
//   WHERE id <> @userId
//     AND id NOT IN (
//       SELECT CASE WHEN userAId = @userId THEN userBId ELSE userAId END
//       FROM Matches WHERE userAId = @userId OR userBId = @userId
//     )
//   ORDER BY NEWID()
async function findRandomUnmatched(userId) {
  const allUsers = await usersData.findAll();

  // Gather everyone this user is already matched with
  const matchedIds = matches
    .filter(m => m.userAId === userId || m.userBId === userId)
    .map(m => (m.userAId === userId ? m.userBId : m.userAId));

  const candidates = allUsers.filter(
    u => u.id !== userId && !matchedIds.includes(u.id)
  );

  if (candidates.length === 0) return null;

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return chosen.id;
}

// Inserts a new match record and returns it.
// MSSQL: INSERT INTO Matches (userAId, userBId) VALUES (@userAId, @userBId);
//        return the inserted row.
async function create(userAId, userBId) {
  const match = {
    id: String(nextId++),
    userAId,
    userBId,
    createdAt: new Date(),
  };
  matches.push(match);
  return match;
}

// Returns every match record that involves the given userId.
// MSSQL: SELECT * FROM Matches WHERE userAId = @userId OR userBId = @userId
//        ORDER BY createdAt DESC
async function listForUser(userId) {
  return matches.filter(m => m.userAId === userId || m.userBId === userId);
}

module.exports = { findRandomUnmatched, create, listForUser };
