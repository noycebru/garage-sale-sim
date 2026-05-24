// ================================
// ui.js — UI helpers & rendering
// ================================

// ----------------------------------------
// renderInventory()
// ----------------------------------------
function renderInventory() {
  const grid = document.getElementById('inventory-grid');
  const label = document.getElementById('inv-label');
  const invCount = document.getElementById('inv-count');
  const inv = GameState.inventory;

  label.textContent = `(${inv.length} item${inv.length !== 1 ? 's' : ''})`;
  invCount.textContent = `${inv.length} / ${MAX_INVENTORY}`;

  if (!inv.length) {
    grid.innerHTML = `<div class="inv-empty">Search rooms to find items!</div>`;
    return;
  }

  grid.innerHTML = inv.map(item => `
    <div class="inv-item rarity-${item.rarity}" title="${item.name} — $${item.value.toFixed(2)}">
      <div class="rarity-dot"></div>
      <span class="item-icon">${item.icon}</span>
      <div class="item-name">${item.name}</div>
      <div class="item-value">$${item.value.toFixed(2)}</div>
    </div>
  `).join('');
}

// ----------------------------------------
// updateCashDisplay()
// ----------------------------------------
function updateCashDisplay() {
  document.getElementById('cash-amount').textContent = `$${GameState.cash.toFixed(2)}`;
}

// ----------------------------------------
// updateGoToSaleBtn()
// ----------------------------------------
function updateGoToSaleBtn() {
  const btn = document.getElementById('go-to-sale-btn');
  const hasItems = GameState.inventory.length > 0;
  btn.disabled = !hasItems;
  btn.textContent = hasItems
    ? `🪑 Set Up Garage Sale (${GameState.inventory.length} items)`
    : '🪑 Set Up Garage Sale';
}

// ----------------------------------------
// showNotif(msg, type)
// type: '' | 'good' | 'great'
// ----------------------------------------
function showNotif(msg, type = '') {
  let area = document.getElementById('notification-area');
  if (!area) {
    area = document.createElement('div');
    area.id = 'notification-area';
    document.body.appendChild(area);
  }
  const notif = document.createElement('div');
  notif.className = `notif ${type}`;
  notif.textContent = msg;
  area.appendChild(notif);
  setTimeout(() => notif.remove(), 2400);
}

// ----------------------------------------
// switchView(viewId)
// ----------------------------------------
function switchView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const view = document.getElementById(viewId);
  if (view) view.classList.add('active');
  const btn = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
  if (btn) btn.classList.add('active');
}
