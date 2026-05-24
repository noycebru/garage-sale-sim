// ================================
// ui.js — HUD & UI helpers
// ================================

const UI = (() => {

  const RARITY_DOT_COLORS = {
    common:    '#aaaaaa',
    uncommon:  '#4caf50',
    rare:      '#2196f3',
    epic:      '#9c27b0',
    legendary: '#f4c430',
  };

  // ----------------------------------------
  // updateHUD
  // ----------------------------------------
  function updateHUD() {
    document.getElementById('cash-display').textContent = `$${GameState.cash.toFixed(2)}`;
    document.getElementById('inv-display').textContent  = `${GameState.inventory.length}/20`;
  }

  // ----------------------------------------
  // renderInventoryBar — bottom slot strip
  // ----------------------------------------
  function renderInventoryBar() {
    const slots = document.getElementById('inv-slots');
    const MAX_SHOW = 8; // show up to 8 slots in bar
    slots.innerHTML = '';

    for (let i = 0; i < Math.min(GameState.inventory.length, MAX_SHOW); i++) {
      const item = GameState.inventory[i];
      const slot = document.createElement('div');
      slot.className = 'inv-slot filled';
      slot.innerHTML = `
        <span style="font-size:20px">${item.icon}</span>
        <div class="slot-rarity-dot" style="background:${RARITY_DOT_COLORS[item.rarity] || '#aaa'}"></div>
      `;
      slot.title = `${item.name} — $${item.value.toFixed(2)}`;
      slots.appendChild(slot);
    }

    if (GameState.inventory.length > MAX_SHOW) {
      const more = document.createElement('div');
      more.className = 'inv-slot filled';
      more.style.fontSize = '11px';
      more.style.color = '#fff';
      more.textContent = `+${GameState.inventory.length - MAX_SHOW}`;
      slots.appendChild(more);
    }
  }

  // ----------------------------------------
  // showNotif(msg, type)
  // ----------------------------------------
  function showNotif(msg, type = '') {
    let area = document.getElementById('notif-area');
    if (!area) {
      area = document.createElement('div');
      area.id = 'notif-area';
      document.body.appendChild(area);
    }
    const el = document.createElement('div');
    el.className = `notif ${type}`;
    el.textContent = msg;
    area.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  return { updateHUD, renderInventoryBar, showNotif };

})();
