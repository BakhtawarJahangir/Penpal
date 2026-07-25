const express = require('express');
const session = require('express-session');
const bcrypt  = require('bcrypt');
const path    = require('path');

const users   = require('./data/users');
const matches = require('./data/matches');
const letters = require('./data/letters');

const app  = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // lets HTML forms POST here too

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'penpal-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,     // not accessible from JS (XSS protection)
      secure: false,      // set to true in production behind HTTPS
      maxAge: 1000 * 60 * 60 * 24,  // 24 hours
    },
  })
);

app.use(express.static(path.join(__dirname)));

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function requireAuthOrRedirect(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/Login.html');
  }
  next();
}

function publicUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function toTagArray(val) {
  if (val === undefined) return undefined;
  if (Array.isArray(val)) return val.filter(Boolean);
  return String(val).split(',').map(s => s.trim()).filter(Boolean);
}

app.post('/Account/Register', async (req, res) => {
  try {
    const { name, email, password, age, country, avatarSticker } = req.body;

    if (!name || !email || !password) {
      return res.redirect('/Login.html?error=email_taken');
    }

    const existing = await users.findByEmail(email);
    if (existing) {
      return res.redirect('/Login.html?error=email_taken');
    }

    const user = await users.create({ name, email, password, age, country, avatarSticker });
    req.session.userId = user.id;

    return res.redirect('/Info.html');
  } catch (err) {
    console.error('[Register]', err);
    return res.redirect('/Login.html?error=email_taken');
  }
});

app.post('/Account/Login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.redirect('/Login.html?error=invalid_credentials');
    }

    const user = await users.findByEmail(email);
    if (!user) {
      return res.redirect('/Login.html?error=invalid_credentials');
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.redirect('/Login.html?error=invalid_credentials');
    }

    req.session.userId = user.id;
    return res.redirect('/Dashboard.html');
  } catch (err) {
    console.error('[Login]', err);
    return res.redirect('/Login.html?error=invalid_credentials');
  }
});

app.post('/Account/Logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Could not log out' });
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out' });
  });
});

// POST /Account/UpdateProfile  [protected — redirects if not logged in]
// Body: { name?, age?, country?, avatarSticker?, likes?, dislikes? }
// Partial update — any field omitted is left unchanged.
app.post('/Account/UpdateProfile', requireAuthOrRedirect, async (req, res) => {
  try {
    const { name, age, country, avatarSticker } = req.body;

    const updated = await users.updateProfile(req.session.userId, {
      name,
      age,
      country,
      avatarSticker,
      likes:    toTagArray(req.body.likes),
      dislikes: toTagArray(req.body.dislikes),
    });

    if (!updated) {
      return res.redirect('/Info.html?error=update_failed');
    }

    return res.redirect('/Dashboard.html');
  } catch (err) {
    console.error('[UpdateProfile]', err);
    return res.redirect('/Info.html?error=update_failed');
  }
});

app.post('/Letter/Send', requireAuthOrRedirect, async (req, res) => {
  try {
    const { 
      recipientId,body,musicTitle,musicPath } = req.body;
    const senderId = req.session.userId;

    if (!recipientId || !body || !String(body).trim()) {
      return res.redirect('/Write.html?error=send_failed');
    }

    const userMatches = await matches.listForUser(senderId);
    const isMatched   = userMatches.some(m => {
      const otherId = m.userAId === senderId ? m.userBId : m.userAId;
      return otherId === recipientId;
    });

    if (!isMatched) {
      return res.redirect('/Write.html?error=send_failed');
    }

    await letters.create({
      senderId,
      recipientId,
      body: String(body).trim(),
       musicTitle,
    musicPath
    });

    return res.redirect('/Dashboard.html');
  } catch (err) {
    console.error('[Letter/Send]', err);
    return res.redirect('/Write.html?error=send_failed');
  }
});

// ── POST /Match/Find — JSON exception ─────────────────────────────────────────
//
// This route mutates state (creates a Match row) but MUST return JSON, not a
// redirect.  Match.html drives a setTimeout-chained animation sequence:
//   lever pull → shuffle text → name reveal → enable "DONE" button
// The animation depends on receiving the matched penpal's profile as JSON
// before any navigation happens.  The page's own script navigates to
// Dashboard.html only after the user clicks "DONE", once the animation has
// finished.  Changing this to a redirect would break the animation entirely.
app.post('/Match/Find', requireAuth, async (req, res) => {
  try {
    const penpalId = await matches.findRandomUnmatched(req.session.userId);

    if (!penpalId) {
      return res.status(404).json({ error: 'No available penpals to match with right now' });
    }

    const newMatch = await matches.create(req.session.userId, penpalId);
    const penpal   = await users.findById(penpalId);

    return res.status(201).json({ match: newMatch, penpal: publicUser(penpal) });
  } catch (err) {
    console.error('[Match/Find]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Stage 2: read-only JSON routes (consumed via fetch() from api.js) ─────────

// GET /Account/Me  [protected]
// Returns the logged-in user's profile (no password field).
app.get('/Account/Me', requireAuth, async (req, res) => {
  try {
    const user = await users.findById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(publicUser(user));
  } catch (err) {
    console.error('[Me]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /Match/List  [protected]
// Returns all matches for the current user, each enriched with the penpal's
// public profile so the dashboard can render cards without extra requests.
app.get('/Match/List', requireAuth, async (req, res) => {
  try {
    const userMatches = await matches.listForUser(req.session.userId);

    const enriched = await Promise.all(
      userMatches.map(async m => {
        const penpalId = m.userAId === req.session.userId ? m.userBId : m.userAId;
        const penpal   = await users.findById(penpalId);
        return { matchId: m.id, createdAt: m.createdAt, penpal: publicUser(penpal) };
      })
    );

    return res.status(200).json(enriched);
  } catch (err) {
    console.error('[Match/List]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /Letter/Inbox  [protected]
// Returns all letters received by the current user, newest first.
// Declared BEFORE /Letter/:id so Express doesn't treat "Inbox" as an id param.
app.get('/Letter/Inbox', requireAuth, async (req, res) => {
  try {
    const inbox = await letters.listInboxForUser(req.session.userId);
    return res.status(200).json(inbox);
  } catch (err) {
    console.error('[Letter/Inbox]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /Letter/:id  [protected]
// Returns a single letter. If the current user is the recipient and the letter
// is unread, it is marked read before responding.
app.get('/Letter/:id', requireAuth, async (req, res) => {
  try {
    let letter = await letters.findById(req.params.id);
    if (!letter) return res.status(404).json({ error: 'Letter not found' });

    const userId = req.session.userId;

    // Only the sender or recipient may view a letter
    if (letter.senderId !== userId && letter.recipientId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark as read the moment the recipient opens it
    if (letter.recipientId === userId && !letter.read) {
      letter = await letters.markRead(letter.id);
    }

    return res.status(200).json(letter);
  } catch (err) {
    console.error('[Letter/:id]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`PenPal Connect running on http://localhost:${PORT}`);
  console.log('Seed users ready after ~1 second (bcrypt startup hashing)');
  console.log('  alice@test.com / password123');
  console.log('  bob@test.com   / password123');
});
