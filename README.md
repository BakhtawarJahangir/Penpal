# PenPal Connect

A web app for writing letters to penpals. Users register, get matched with a random penpal, then send and receive letters with stickers and music playlists attached.

---  

## Quick start

```bash
npm install
npm start
# → http://localhost:3000
```

Two test accounts are seeded automatically (bcrypt hashing takes ~1 second on startup):

| Name  | Email          | Password    |
|-------|----------------|-------------|
| Alice | alice@test.com | password123 |
| Bob   | bob@test.com   | password123 |

---

## Project structure

```
server.js          ← the only backend entry point (Express + all routes)
api.js             ← client-side fetch() stubs — integration teammate fills in DOM wiring
data/
  users.js         ← in-memory stub — integration teammate replaces internals with MSSQL queries
  matches.js       ← in-memory stub — integration teammate replaces internals with MSSQL queries
  letters.js       ← in-memory stub — integration teammate replaces internals with MSSQL queries
Penpal .html       ← landing page
Login.html         ← sign in / sign up
Info.html          ← onboarding: name, age, country, avatar, tags
Match.html         ← "pull the lever" matching animation
Dashboard.html     ← penpal cards + profile sidebar
Read.html          ← read an incoming letter
Write.html         ← compose a letter
bootstrap-5.3.8-dist/  ← local Bootstrap (no CDN needed for CSS)
Stickers/          ← image1–32.png; image25–32 are the avatar options
```

---

## How the routing works

There are two kinds of server routes. **Do not mix them.**

### Stage 1 — HTML form POSTs → browser redirect

Submitted by `<form method="post">` elements. The server always responds with an HTTP 302 redirect — no JSON, no fetch(). On failure the redirect URL includes `?error=<code>` so the target page can show a message.

| Route | Triggered by | Success → | Failure → |
|---|---|---|---|
| `POST /Account/Register` | Sign-up form on Login.html | `/Info.html` | `/Login.html?error=email_taken` |
| `POST /Account/Login` | Sign-in form on Login.html | `/Dashboard.html` | `/Login.html?error=invalid_credentials` |
| `POST /Account/UpdateProfile` | Form on Info.html | `/Dashboard.html` | `/Info.html?error=update_failed` |
| `POST /Letter/Send` | Send button on Write.html | `/Dashboard.html` | `/Write.html?error=send_failed` |

### Stage 2 — read-only GETs → JSON (consumed by api.js via fetch)

These are called client-side with `fetch()` from `api.js`. They return JSON used to populate page content after load.

| Route | Returns |
|---|---|
| `GET /Account/Me` | Logged-in user's profile |
| `GET /Match/List` | All matches, each with the penpal's profile |
| `GET /Letter/Inbox` | Received letters, newest first |
| `GET /Letter/:id` | One letter; marks it read if you're the recipient |

### Special case — POST /Match/Find

Creates a match record but **returns JSON, not a redirect**. Match.html plays a slot-machine animation that needs the matched penpal's profile as JSON before any navigation. The page navigates itself to Dashboard.html after the user clicks "DONE". Do not change this to a redirect.

---

---

## For the DB teammate

**Your job:** create the database and write the SQL. You do not need to touch any JavaScript — the integration teammate will write the Node.js query code that talks to your tables.

### What the integration teammate needs from you

- A running MSSQL database they can connect to
- The three tables below created in that database
- A connection string / credentials they can put in `.env`

### Table schemas

```sql
CREATE TABLE Users (
  id            INT IDENTITY PRIMARY KEY,
  name          NVARCHAR(100)  NOT NULL,
  email         NVARCHAR(255)  NOT NULL UNIQUE,
  password      NVARCHAR(255)  NOT NULL,  -- always a bcrypt hash, never plaintext
  age           INT            NULL,
  country       NVARCHAR(100)  NULL,
  avatarSticker NVARCHAR(50)   NULL,      -- filename only, e.g. "image25.png"
  likes         NVARCHAR(MAX)  NULL,      -- store as JSON string: '["books","music"]'
  dislikes      NVARCHAR(MAX)  NULL,
  createdAt     DATETIME       DEFAULT GETDATE()
);

CREATE TABLE Matches (
  id        INT IDENTITY PRIMARY KEY,
  userAId   INT NOT NULL REFERENCES Users(id),
  userBId   INT NOT NULL REFERENCES Users(id),
  createdAt DATETIME DEFAULT GETDATE()
);
-- One row covers the relationship in both directions.

CREATE TABLE Letters (
  id          INT IDENTITY PRIMARY KEY,
  senderId    INT           NOT NULL REFERENCES Users(id),
  recipientId INT           NOT NULL REFERENCES Users(id),
  body        NVARCHAR(MAX) NOT NULL,
  read        BIT           NOT NULL DEFAULT 0,
  createdAt   DATETIME      DEFAULT GETDATE()
);
```

### Environment variables to hand to the integration teammate

Once the database is running, give these values to the integration teammate so they can populate `.env`:

```env
DB_SERVER=your-server.database.windows.net
DB_NAME=penpaldb
DB_USER=youruser
DB_PASSWORD=yourpassword
```

---

---

## For the frontend teammate

**Your job:** build the HTML structure and CSS styling for the visual elements that are still missing. You do not need to write any JavaScript logic — that is handled by the integration teammate. Your job is to add the elements so the integration teammate has something to target.

### 1. Add error alert elements (Login.html, Info.html, Write.html)

Each of these pages already has a script that computes an error message string when the server redirects back with `?error=...`. What's missing is an HTML element for that message to go into.

Add a `<div>` with a clear, targetable ID to each page. It should start hidden and be shown/populated by the integration teammate's script. Keep it inside the main container, above the form, so it's visible without scrolling.

Suggested markup (adapt to match each page's existing styling):

```html
<div id="error-alert" class="alert alert-danger" role="alert" style="display:none;"></div>
```

Style it consistently with the rest of the page:
- Font: `DynaPuff` to match the form headings
- Colours: Penpal Brown `#4a2c2a` text, or use Bootstrap's `.alert-danger` with a custom border colour of `#833b3b`
- Rounded corners to match the `.auth-container` / `.info-container` border-radius

The error codes each page can receive, in case you want to mock them visually:

| Page | Error codes |
|---|---|
| Login.html | `invalid_credentials`, `email_taken` |
| Info.html | `update_failed` |
| Write.html | `send_failed` |

### 2. Add hidden inputs to Info.html for likes/dislikes

The tag toggle buttons (Likes and Dislikes sections) currently only toggle a CSS class. The integration teammate will add a presubmit handler that serialises the active tags, but it needs two hidden inputs in the form to write the values into.

Add these two hidden inputs inside the `<form>` in Info.html, before the submit button:

```html
<input type="hidden" name="likes" id="likesInput" value="">
<input type="hidden" name="dislikes" id="dislikesInput" value="">
```

Also give the two tag containers unique IDs so the integration teammate can target them with `querySelectorAll`. The Likes container already holds the "travelling", "food", "books"... buttons and the Dislikes container holds "chaos", "noise"... Add `id="likes-container"` and `id="dislikes-container"` to those two `<div class="tag-container">` elements.

### 3. Design system reference

Keep new elements consistent with the rest of the app:

| Token | Value | Used for |
|---|---|---|
| Penpal Pink | `#fcd0df` | Page backgrounds |
| Soft Pink | `#f8e6ec` | Card / container backgrounds |
| Penpal Brown | `#4a2c2a` | Text, borders, buttons |
| Deep Red | `#833b3b` | Hover states, accent borders |
| Heading font | `DynaPuff` (Google Fonts CDN) | All headings and UI labels |
| Body font | `sans-serif` | Letter content, small labels |

The stamp border on profile pictures is a `radial-gradient` CSS pattern. Copy the `.profile-stamp` CSS block from an existing page — don't recreate it from scratch.

---

---

## For the integration teammate

**Your job:** write all the code that connects the layers. This covers three areas:

1. **`data/*.js`** — replace the in-memory array operations with real MSSQL queries
2. **`api.js`** — fill in the DOM wiring after each fetch function
3. **HTML scripts** — finish the error display and form wiring in Login.html, Info.html, and Write.html

The DB teammate handles the SQL schema and database setup. The frontend teammate handles the HTML structure and CSS. You write the JavaScript and queries that make everything talk to each other.

---

### Part 1 — Replace data stubs with MSSQL queries

The three files in `data/` use in-memory arrays right now. Replace the function bodies with real `mssql` queries. **Keep every function signature and return shape identical** — `server.js` calls these functions and expects exactly these shapes. Do not change the exports or the parameter names.

#### Setup

```bash
npm install mssql connect-mssql-v2
```

Get the DB credentials from the DB teammate and create `.env` at the project root:

```env
PORT=3000
SESSION_SECRET=change-this-to-something-long-and-random
DB_SERVER=...   ← from DB teammate
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
```

Replace the in-memory session store in `server.js` with `connect-mssql-v2` — otherwise sessions vanish every time the server restarts.

#### data/users.js

Each function must stay `async` and return the shapes below. The existing file has a comment on each function with a suggested MSSQL query.

| Function | Parameters | Must return |
|---|---|---|
| `create(...)` | `{ name, email, password, age, country, avatarSticker }` | The new user row as a JS object. **Hash the password with bcrypt inside this function before the INSERT.** `server.js` calls `bcrypt.compare(plain, user.password)` at login — the hash must live in `user.password`. Never store plaintext. |
| `findByEmail(email)` | string | Single user object, or `null` |
| `findById(id)` | string/int | Single user object, or `null` |
| `findAll()` | — | Array of all user objects (used by `matches.js` to find candidates) |
| `updateProfile(id, fields)` | `{ name, age, country, avatarSticker, likes, dislikes }` | Updated user object, or `null` if not found. Only update fields that are not `undefined`. |

User object shape:

```js
{
  id:            "1",
  name:          "Alice",
  email:         "alice@test.com",
  password:      "$2b$10$...",   // bcrypt hash — server.js strips this before sending to client
  age:           25,
  country:       "UK",
  avatarSticker: "image25.png",
  likes:         ["books", "music"],  // parse from JSON string on read, serialise on write
  dislikes:      ["noise"],
  createdAt:     new Date()
}
```

`likes` and `dislikes` are stored in the DB as JSON strings (`'["books","music"]'`). Parse them back to arrays when reading rows, and `JSON.stringify()` before inserting/updating.

#### data/matches.js

| Function | Parameters | Must return |
|---|---|---|
| `findRandomUnmatched(userId)` | string/int | The **id** of a random user not yet matched with `userId`, or `null`. The existing file has the full MSSQL subquery hint in the comment — use it. |
| `create(userAId, userBId)` | two ids | The new match row: `{ id, userAId, userBId, createdAt }` |
| `listForUser(userId)` | string/int | Array of match rows where `userAId = userId OR userBId = userId` |

#### data/letters.js

| Function | Parameters | Must return |
|---|---|---|
| `create(...)` | `{ senderId, recipientId, body }` | New letter row with `read: false` |
| `listInboxForUser(userId)` | string/int | Letters where `recipientId = userId`, ordered `createdAt DESC` |
| `findById(id)` | string/int | Single letter row, or `null` |
| `markRead(id)` | string/int | Updated letter row with `read: true`, or `null` if not found |

Letter row shape:

```js
{
  id:          "1",
  senderId:    "1",
  recipientId: "2",
  body:        "Dear Alice...",
  read:        false,
  createdAt:   new Date()
}
```

#### Verify data layer with curl

```bash
# Login (should redirect to /Dashboard.html — check Location header)
curl -i -c cookies.txt -X POST http://localhost:3000/Account/Login \
  -d "email=alice@test.com&password=password123"

# Current user (should return JSON)
curl -s -b cookies.txt http://localhost:3000/Account/Me

# Find a match (should return JSON with match + penpal — no Location header)
curl -s -b cookies.txt -X POST http://localhost:3000/Match/Find

# Send a letter (replace 2 with the penpal id from the step above)
curl -i -b cookies.txt -X POST http://localhost:3000/Letter/Send \
  -d "recipientId=2&body=Hello!"

# Check inbox as Bob
curl -i -c bob.txt -X POST http://localhost:3000/Account/Login \
  -d "email=bob@test.com&password=password123"
curl -s -b bob.txt http://localhost:3000/Letter/Inbox
```

---

### Part 2 — Wire api.js fetch results into the DOM

`api.js` has four functions. Each one already makes the `fetch()` call and parses the JSON response. What's missing is the code that takes that data and writes it into the page. Each function has a `// TODO(frontend):` comment block describing what the data looks like and which page elements it maps to — fill those in.

Include `api.js` on any page that needs server data:

```html
<script src="api.js"></script>
```

#### getMe() → user profile

Returns: `{ id, name, email, age, country, avatarSticker, likes, dislikes, createdAt }`

Useful on Dashboard.html (offcanvas sidebar) and any page that shows the logged-in user. The `avatarSticker` value is a filename like `"image25.png"` — prepend `"Stickers/"` to get the image path.

#### listMatches() → penpal cards

Returns: `Array<{ matchId, createdAt, penpal: { id, name, avatarSticker, country, ... } }>`

Useful on Dashboard.html to render the penpal card grid. When the user clicks a "Write a Letter" button on a card, store `penpal.id` somewhere (URL param, `sessionStorage`) so Write.html can read it as the `recipientId`.

#### getInbox() → letter list

Returns: `Array<{ id, senderId, recipientId, body, read, createdAt }>`

Useful on Dashboard.html (unread count badge) and Read.html (list of letters). Letters with `read === false` should be visually distinguished.

#### getLetter(id) → single letter

Returns: `{ id, senderId, recipientId, body, read, createdAt }`

Useful on Read.html. The `body` field is the HTML that came out of Write.html's contenteditable editor — use `innerHTML` when inserting it.

To read the letter id from the URL on Read.html:
```js
const letterId = new URLSearchParams(location.search).get('id');
const letter = await getLetter(letterId);
```

If the user isn't logged in, all four functions automatically redirect to `/Login.html` — you don't need to handle 401 yourself.

---

### Part 3 — Finish the error display scripts

Login.html, Info.html, and Write.html each have an inline `<script>` that already reads `?error=` from the URL and computes a `message` string. The only missing line is inserting `message` into the alert element that the frontend teammate added.

Find the `// TODO(frontend):` comment in each script and replace it with the DOM insertion. The frontend teammate will have given the alert element an ID (e.g. `error-alert`). Example:

```js
// Replace the TODO line with:
const alertEl = document.getElementById('error-alert');
alertEl.textContent = message;
alertEl.style.display = 'block';
```

Do this in all three pages. The message strings and error code mappings are already written — you are only adding the final display step.

---

### Part 4 — Wire the Write.html SEND button

The SEND button has a `TODO` comment explaining what it needs. In short:

1. Read the **recipientId** from wherever the frontend/integration flow puts it (URL param or `sessionStorage` — coordinate with whoever builds Dashboard.html's "Write a Letter" link).
2. Grab the **letter body** from the contenteditable `#editor` div (`innerHTML` to keep formatting).
3. Create a hidden form and submit it to `POST /Letter/Send`.

```js
document.querySelector('.send-btn').addEventListener('click', () => {
  const body = document.getElementById('editor').innerHTML;
  const recipientId = new URLSearchParams(location.search).get('to')
                   ?? sessionStorage.getItem('recipientId');

  if (!body.trim() || !recipientId) return; // guard against empty sends

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/Letter/Send';

  [['body', body], ['recipientId', recipientId]].forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
});
```

On success the server redirects to `/Dashboard.html`. On failure it redirects back to `/Write.html?error=send_failed` — the error display script (Part 3) handles that.

---

### Part 5 — Wire the Info.html likes/dislikes into the form

The tag toggle buttons add/remove a `.active` CSS class but their values don't get sent in the form POST. A presubmit handler needs to collect the active selections and write them into the hidden inputs that the frontend teammate added (`#likesInput`, `#dislikesInput`).

```js
document.querySelector('form').addEventListener('submit', () => {
  const collect = (containerId) =>
    [...document.querySelectorAll(`#${containerId} .tag-btn.active`)]
      .map(btn => btn.textContent.replace(/^\+\s*/, '').trim())
      .join(',');

  document.getElementById('likesInput').value    = collect('likes-container');
  document.getElementById('dislikesInput').value = collect('dislikes-container');
});
```

The server accepts comma-separated strings, so `.join(',')` is the right format. `toTagArray()` in `server.js` handles the parsing on the other end.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `SESSION_SECRET` | `penpal-dev-secret-...` | Signs session cookies — **change in production** |
| `DB_SERVER` | — | MSSQL server hostname |
| `DB_NAME` | — | Database name |
| `DB_USER` | — | DB login |
| `DB_PASSWORD` | — | DB password |
