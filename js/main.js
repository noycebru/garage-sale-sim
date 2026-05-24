// ================================
// main.js — Game state & init
// ================================

const GameState = {
  cash: 0,
  houseLevel: 1,
  inventory: [],       // items found in house
  saleItems: [],       // items staged on tables
  totalItemsFound: 0,
  totalSales: 0,
  totalEarned: 0,
};

// ----------------------------------------
// init() — run on page load
// ----------------------------------------
function init() {
  renderRooms();
  renderInventory();
  updateCashDisplay();
  updateGoToSaleBtn();

  // Bottom nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      switchView(btn.dataset.view);
    });
  });

  // Go to sale button
  document.getElementById('go-to-sale-btn').addEventListener('click', () => {
    if (GameState.inventory.length === 0) return;
    showNotif('Garage sale coming soon! 🏷️', 'good');
    // sale.js will handle this once built
  });
}

window.addEventListener('DOMContentLoaded', init);
