'use strict';

async function getMe() {
  const res = await fetch('/Account/Me');
  if (res.status === 401) {
    window.location.href = '/Login.html';
    return;
  }
  if (!res.ok) throw new Error(`GET /Account/Me failed: ${res.status}`);
  const user = await res.json();

  const nameEl    = document.getElementById('sidebarNameInput');
  const ageEl     = document.getElementById('sidebarAgeInput');
  const countryEl = document.getElementById('sidebarCountryInput');
  const stampEl   = document.getElementById('profileStampContainer');

  if (nameEl)    nameEl.value    = user.name    || '';
  if (ageEl)     ageEl.value     = user.age     || '';
  if (countryEl) countryEl.value = user.country || '';
  if (stampEl && user.avatarSticker) {
    stampEl.innerHTML = `<img src="Stickers/${user.avatarSticker}" alt="Avatar">`;
    const hidden = document.getElementById('selectedAvatarInput');
    if (hidden) hidden.value = `Stickers/${user.avatarSticker}`;
  }

  return user;
}

async function listMatches() {
  const [matchRes, inboxRes] = await Promise.all([
    fetch('/Match/List'),
    fetch('/Letter/Inbox'),
  ]);

  if (matchRes.status === 401 || inboxRes.status === 401) {
    window.location.href = '/Login.html';
    return;
  }
  if (!matchRes.ok) throw new Error(`GET /Match/List failed: ${matchRes.status}`);

  const [matches, inbox] = await Promise.all([matchRes.json(), inboxRes.json()]);
  const inboxLetters = Array.isArray(inbox) ? inbox : [];

  const container = document.getElementById('penpals-container');
  if (container) {
    container.innerHTML = matches.map(m => {
      // inbox is newest-first; find the most recent letter FROM this penpal
      const latest = inboxLetters.find(l => String(l.senderId) === String(m.penpal.id));
      const readHref = latest ? `Read.html?id=${latest.id}` : '#';
      const hasUnread = latest && !latest.read;

      return `
        <div class="col-auto">
          <div class="penpal-card">
            <div class="mini-stamp">
              ${m.penpal.avatarSticker
                ? `<img src="Stickers/${m.penpal.avatarSticker}" style="width:100%;height:100%;object-fit:contain;">`
                : '<i class="bi bi-image" style="opacity:0.3;"></i>'}
            </div>
            <div class="card-info">
              <p><strong>Name:</strong> ${m.penpal.name}</p>
              <p><strong>Country:</strong> ${m.penpal.country || 'Unknown'}</p>
              ${hasUnread ? '<p style="color:#833b3b;margin:0;">&#128140; New letter!</p>' : ''}
            </div>
            <div class="card-buttons">
              <a href="${readHref}" class="btn-action">read</a>
              <a href="Write.html?to=${m.penpal.id}" class="btn-action">write</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  return matches;
}

async function getInbox() {
  const res = await fetch('/Letter/Inbox');
  if (res.status === 401) {
    window.location.href = '/Login.html';
    return;
  }
  if (!res.ok) throw new Error(`GET /Letter/Inbox failed: ${res.status}`);
  return res.json();
}

async function getLetter(id) {
  const res = await fetch(`/Letter/${encodeURIComponent(id)}`);
  if (res.status === 401) {
    window.location.href = '/Login.html';
    return;
  }
  if (!res.ok) throw new Error(`GET /Letter/${id} failed: ${res.status}`);
  return res.json();
}
