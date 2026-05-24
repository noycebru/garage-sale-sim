// ================================
// house.js — House & room logic
// ================================

const MAX_INVENTORY = 20;

// Room cooldown state: roomId -> timestamp when it resets
const roomCooldowns = {};

// How many times each room has been searched (resets on house upgrade)
const roomSearchCounts = {};

// ----------------------------------------
// getRooms() — get rooms for current house
// ----------------------------------------
function getRooms() {
  return ROOMS_BY_HOUSE[GameState.houseLevel] || ROOMS_BY_HOUSE[1];
}

// ----------------------------------------
// isRoomOnCooldown(roomId)
// ----------------------------------------
function isRoomOnCooldown(roomId) {
  const cooldownUntil = roomCooldowns[roomId];
  if (!cooldownUntil) return false;
  return Date.now() < cooldownUntil;
}

// ----------------------------------------
// getCooldownRemaining(roomId) — seconds left
// ----------------------------------------
function getCooldownRemaining(roomId) {
  const cooldownUntil = roomCooldowns[roomId];
  if (!cooldownUntil) return 0;
  return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
}

// ----------------------------------------
// searchRoom(roomId)
// Returns { item } or { item: null }
// ----------------------------------------
function searchRoom(roomId) {
  if (isRoomOnCooldown(roomId)) return { item: null, onCooldown: true };
  if (GameState.inventory.length >= MAX_INVENTORY) return { item: null, inventoryFull: true };

  const rooms = getRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return { item: null };

  // Set cooldown
  const cooldownMs = room.searchTime * 1000;
  roomCooldowns[roomId] = Date.now() + cooldownMs;
  roomSearchCounts[roomId] = (roomSearchCounts[roomId] || 0) + 1;

  // Try to find an item
  const item = pickRandomItem(GameState.houseLevel, roomId);
  if (item) {
    GameState.inventory.push(item);
    GameState.totalItemsFound++;
  }

  return { item };
}

// ----------------------------------------
// renderRooms() — build room cards in DOM
// ----------------------------------------
function renderRooms() {
  const rooms = getRooms();
  const grid = document.getElementById('rooms-grid');
  grid.innerHTML = '';

  rooms.forEach(room => {
    const onCooldown = isRoomOnCooldown(room.id);
    const secondsLeft = getCooldownRemaining(room.id);
    const card = document.createElement('div');
    card.className = `room-card ${onCooldown ? 'cooldown' : ''}`;
    card.dataset.roomId = room.id;

    const searchCount = roomSearchCounts[room.id] || 0;

    card.innerHTML = `
      <span class="room-icon">${room.icon}</span>
      <div class="room-name">${room.name}</div>
      <div class="room-status">${onCooldown ? `⏳ ${secondsLeft}s` : '🔍 Search'}</div>
      ${searchCount > 0 ? `<div class="room-items-badge">${searchCount}</div>` : ''}
      ${onCooldown ? `<div class="cooldown-bar" id="bar-${room.id}" style="width:${(secondsLeft/room.searchTime*100).toFixed(1)}%"></div>` : ''}
    `;

    if (!onCooldown) {
      card.addEventListener('click', () => openRoomModal(room));
    }

    grid.appendChild(card);
  });
}

// ----------------------------------------
// openRoomModal(room)
// ----------------------------------------
function openRoomModal(room) {
  if (GameState.inventory.length >= MAX_INVENTORY) {
    showNotif('Inventory full! Go run a sale first.', 'good');
    return;
  }

  const modal = document.getElementById('room-modal');
  document.getElementById('modal-room-icon').textContent = room.icon;
  document.getElementById('modal-room-name').textContent = room.name;
  document.getElementById('modal-room-desc').textContent = room.desc;
  document.getElementById('modal-find-area').innerHTML = `<div style="font-size:36px;animation:spin 0.6s linear infinite">🔍</div>`;
  document.getElementById('modal-cooldown-msg').classList.add('hidden');
  document.getElementById('search-again-btn').disabled = false;

  modal.classList.remove('hidden');

  // Slight delay for drama
  setTimeout(() => {
    doSearch(room);
  }, 600);

  document.getElementById('close-modal-btn').onclick = () => {
    modal.classList.add('hidden');
    renderRooms();
    renderInventory();
    updateGoToSaleBtn();
  };

  document.getElementById('search-again-btn').onclick = () => {
    if (isRoomOnCooldown(room.id)) {
      document.getElementById('modal-cooldown-msg').classList.remove('hidden');
      document.getElementById('search-again-btn').disabled = true;
      return;
    }
    if (GameState.inventory.length >= MAX_INVENTORY) {
      showNotif('Inventory full!', 'good');
      return;
    }
    document.getElementById('modal-find-area').innerHTML = `<div style="font-size:36px;animation:spin 0.6s linear infinite">🔍</div>`;
    setTimeout(() => doSearch(room), 500);
  };
}

// ----------------------------------------
// doSearch(room) — perform the search, show result
// ----------------------------------------
function doSearch(room) {
  const result = searchRoom(room.id);
  const findArea = document.getElementById('modal-find-area');

  if (result.onCooldown) {
    findArea.innerHTML = `<div class="found-nothing">This room needs more time to reset.</div>`;
    document.getElementById('modal-cooldown-msg').classList.remove('hidden');
    document.getElementById('search-again-btn').disabled = true;
    return;
  }

  if (result.inventoryFull) {
    findArea.innerHTML = `<div class="found-nothing">📦 Your inventory is full! Go run a sale first.</div>`;
    document.getElementById('search-again-btn').disabled = true;
    return;
  }

  if (result.item) {
    const r = RARITY[result.item.rarity];
    findArea.innerHTML = `
      <div class="found-item-card rarity-${result.item.rarity}">
        <div class="rarity-dot"></div>
        <span class="found-icon">${result.item.icon}</span>
        <div class="found-name">${result.item.name}</div>
        <div class="found-rarity" style="color:${r.color}">${r.label}</div>
        <div class="found-value">~$${result.item.value.toFixed(2)}</div>
      </div>
    `;
    showNotif(`Found ${result.item.name}! ✨`, result.item.rarity === 'legendary' ? 'great' : 'good');
  } else {
    const empties = [
      "Nothing this time... keep looking!",
      "Just dust and old receipts.",
      "Nope, nothing here.",
      "Maybe try another room?",
      "Empty-handed this time.",
    ];
    findArea.innerHTML = `<div class="found-nothing">${empties[Math.floor(Math.random()*empties.length)]}</div>`;
  }

  // Disable search again if on cooldown now
  if (isRoomOnCooldown(room.id)) {
    document.getElementById('search-again-btn').disabled = true;
    document.getElementById('modal-cooldown-msg').classList.remove('hidden');
  }
}

// ----------------------------------------
// Cooldown ticker — updates room cards every second
// ----------------------------------------
setInterval(() => {
  const cards = document.querySelectorAll('.room-card.cooldown');
  if (!cards.length) return;

  const rooms = getRooms();
  let anyExpired = false;

  cards.forEach(card => {
    const roomId = card.dataset.roomId;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const secsLeft = getCooldownRemaining(roomId);
    const statusEl = card.querySelector('.room-status');
    const barEl = card.querySelector('.cooldown-bar');

    if (secsLeft <= 0) {
      anyExpired = true;
    } else {
      if (statusEl) statusEl.textContent = `⏳ ${secsLeft}s`;
      if (barEl) barEl.style.width = `${(secsLeft / room.searchTime * 100).toFixed(1)}%`;
    }
  });

  if (anyExpired) renderRooms();
}, 1000);

// Spin animation for search icon
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);
