// data/users.js
// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY STUB — Integration contract for the MSSQL teammate.
//
// Every exported function is async so the swap to real DB queries is a
// drop-in replacement: just return the result of your mssql/tedious query
// instead of manipulating the `users` array.
//
// PASSWORD NOTE: bcrypt hashing is intentionally done *here* in create(),
// not in the route, so the DB layer stays responsible for how credentials are
// stored.  When switching to MSSQL, keep the hash call here and INSERT the
// hashed value — never store plaintext passwords.
// ─────────────────────────────────────────────────────────────────────────────

const bcrypt = require('bcrypt');

let nextId = 1;
const users = [];

// ── Seed data ─────────────────────────────────────────────────────────────────
// Two hard-coded test users so you can hit endpoints immediately after
// `npm start` without registering first.
// Both passwords are "password123".
// REMOVE THIS BLOCK when connecting to MSSQL — the DB will have its own data.
(async () => {
  const [h1, h2] = await Promise.all([
    bcrypt.hash('password123', 10),
    bcrypt.hash('password123', 10),
  ]);
  users.push(
    {
      id: String(nextId++),           // "1"
      name: 'Alice',
      email: 'alice@test.com',
      password: h1,
      age: 25,
      country: 'UK',
      avatarSticker: 'image25.png',
      likes: ['books', 'music'],
      dislikes: ['noise'],
      createdAt: new Date(),
    },
    {
      id: String(nextId++),           // "2"
      name: 'Bob',
      email: 'bob@test.com',
      password: h2,
      age: 27,
      country: 'US',
      avatarSticker: 'image26.png',
      likes: ['travel', 'art'],
      dislikes: [],
      createdAt: new Date(),
    }
  );
})();
// ── End seed data ─────────────────────────────────────────────────────────────

// ── Exported functions (the contract) ─────────────────────────────────────────

// Creates a new user.  Hashes the plain-text password before storing.
// MSSQL: INSERT INTO Users (...) VALUES (...); return the new row.
async function create({ name, email, password, age, country, avatarSticker }) {
  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: String(nextId++),
    name,
    email: email.toLowerCase().trim(),
    password: hashed,
    age: age ? Number(age) : null,
    country: country || null,
    avatarSticker: avatarSticker || null,
    likes: [],
    dislikes: [],
    createdAt: new Date(),
  };
  users.push(user);
  return user;
}

// Looks up a user by email (case-insensitive).
// MSSQL: SELECT * FROM Users WHERE LOWER(email) = LOWER(@email)
async function findByEmail(email) {
  return users.find(u => u.email === email.toLowerCase().trim()) || null;
}

// Looks up a user by their primary key.
// MSSQL: SELECT * FROM Users WHERE id = @id
async function findById(id) {
  return users.find(u => u.id === id) || null;
}

// Returns all users — used internally by matches.js to find candidates.
// MSSQL: SELECT * FROM Users
async function findAll() {
  return users;
}

// Updates editable profile fields for the given user id.
// Only fields that are explicitly passed are changed (undefined = leave as-is).
// MSSQL: UPDATE Users SET ... WHERE id = @id; return the updated row.
async function updateProfile(id, { name, age, country, avatarSticker, likes, dislikes }) {
  const user = users.find(u => u.id === id);
  if (!user) return null;

  if (name          !== undefined) user.name          = name;
  if (age           !== undefined) user.age           = Number(age);
  if (country       !== undefined) user.country       = country;
  if (avatarSticker !== undefined) user.avatarSticker = avatarSticker;
  if (likes         !== undefined) user.likes         = likes;
  if (dislikes      !== undefined) user.dislikes      = dislikes;

  return user;
}

module.exports = { create, findByEmail, findById, findAll, updateProfile };
