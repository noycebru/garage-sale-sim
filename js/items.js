// ================================
// items.js — Item definitions
// All items for Garage Sale Sim
// ================================

const RARITY = {
  common:    { label: 'Common',    color: '#aaa',    weight: 55 },
  uncommon:  { label: 'Uncommon',  color: '#4caf50', weight: 27 },
  rare:      { label: 'Rare',      color: '#2196f3', weight: 12 },
  epic:      { label: 'Epic',      color: '#9c27b0', weight: 5  },
  legendary: { label: 'Legendary', color: '#f4c430', weight: 1  },
};

// Items available in House Level 1 (Starter House)
// Each item: { id, name, icon, baseValue, rarity, room }
const ITEMS_BY_HOUSE = {

  1: [
    // COMMON
    { id: 'old_mug',       name: 'Old Mug',         icon: '☕', baseValue: 1.50,  rarity: 'common'    },
    { id: 'paperback',     name: 'Paperback Book',   icon: '📖', baseValue: 1.00,  rarity: 'common'    },
    { id: 'candle',        name: 'Scented Candle',   icon: '🕯️', baseValue: 2.00,  rarity: 'common'    },
    { id: 'old_shoe',      name: 'Old Sneaker',      icon: '👟', baseValue: 3.00,  rarity: 'common'    },
    { id: 'picture_frame', name: 'Picture Frame',    icon: '🖼️', baseValue: 2.50,  rarity: 'common'    },
    { id: 'jigsaw',        name: 'Jigsaw Puzzle',    icon: '🧩', baseValue: 2.00,  rarity: 'common'    },
    { id: 'kitchen_timer', name: 'Kitchen Timer',    icon: '⏱️', baseValue: 1.50,  rarity: 'common'    },
    { id: 'stuffed_bear',  name: 'Stuffed Bear',     icon: '🐻', baseValue: 3.00,  rarity: 'common'    },
    { id: 'old_hat',       name: 'Baseball Cap',     icon: '🧢', baseValue: 2.00,  rarity: 'common'    },
    { id: 'vhs_tape',      name: 'VHS Tape',         icon: '📼', baseValue: 1.00,  rarity: 'common'    },
    // UNCOMMON
    { id: 'blender',       name: 'Old Blender',      icon: '🫙', baseValue: 8.00,  rarity: 'uncommon'  },
    { id: 'toaster',       name: 'Toaster',          icon: '🍞', baseValue: 6.00,  rarity: 'uncommon'  },
    { id: 'board_game',    name: 'Board Game',       icon: '🎲', baseValue: 7.00,  rarity: 'uncommon'  },
    { id: 'lamp',          name: 'Table Lamp',       icon: '💡', baseValue: 9.00,  rarity: 'uncommon'  },
    { id: 'backpack',      name: 'Old Backpack',     icon: '🎒', baseValue: 8.00,  rarity: 'uncommon'  },
    { id: 'cd_player',     name: 'CD Player',        icon: '💿', baseValue: 10.00, rarity: 'uncommon'  },
    // RARE
    { id: 'record_player', name: 'Record Player',    icon: '🎵', baseValue: 28.00, rarity: 'rare'      },
    { id: 'polaroid',      name: 'Polaroid Camera',  icon: '📷', baseValue: 22.00, rarity: 'rare'      },
    { id: 'typewriter',    name: 'Typewriter',       icon: '⌨️', baseValue: 35.00, rarity: 'rare'      },
    { id: 'cast_iron',     name: 'Cast Iron Pan',    icon: '🍳', baseValue: 18.00, rarity: 'rare'      },
    // EPIC
    { id: 'vintage_radio', name: 'Vintage Radio',    icon: '📻', baseValue: 65.00, rarity: 'epic'      },
    { id: 'coin_jar',      name: 'Coin Collection',  icon: '🪙', baseValue: 80.00, rarity: 'epic'      },
    // LEGENDARY
    { id: 'grandpa_watch', name: "Grandpa's Watch",  icon: '⌚', baseValue: 200.00, rarity: 'legendary' },
  ],

  // House level 2 items will be added later
  2: [],
};

// Room definitions per house level
const ROOMS_BY_HOUSE = {
  1: [
    { id: 'living_room',  name: 'Living Room',  icon: '🛋️',  desc: 'The main hangout spot — lots of old stuff here.', searchTime: 15 },
    { id: 'kitchen',      name: 'Kitchen',      icon: '🍽️',  desc: 'Old appliances, forgotten gadgets.', searchTime: 15 },
    { id: 'bedroom',      name: 'Bedroom',      icon: '🛏️',  desc: 'Clothes, books, dusty keepsakes.', searchTime: 20 },
    { id: 'garage',       name: 'Garage',       icon: '🔧',  desc: 'Tools and forgotten treasures.', searchTime: 25 },
    { id: 'attic',        name: 'Attic',        icon: '📦',  desc: 'Rare finds if you look hard enough.', searchTime: 30 },
    { id: 'basement',     name: 'Basement',     icon: '🕯️', desc: 'Old and forgotten... and possibly valuable.', searchTime: 30 },
  ],
};

// Room rarity bonuses — some rooms lean toward better items
const ROOM_RARITY_BONUS = {
  living_room: { common: 10 },
  kitchen:     { common: 10 },
  bedroom:     { uncommon: 5 },
  garage:      { uncommon: 5, rare: 3 },
  attic:       { rare: 5, epic: 2 },
  basement:    { rare: 3, epic: 3, legendary: 1 },
};

// ----------------------------------------
// pickRandomItem(houseLevel, roomId)
// Returns a random item based on rarity
// weights + room bonus, or null (nothing)
// ----------------------------------------
function pickRandomItem(houseLevel, roomId) {
  // 30% chance of finding nothing
  if (Math.random() < 0.30) return null;

  const pool = ITEMS_BY_HOUSE[houseLevel] || ITEMS_BY_HOUSE[1];
  const bonus = ROOM_RARITY_BONUS[roomId] || {};

  // Build weighted rarity table
  const rarityWeights = {};
  for (const [key, val] of Object.entries(RARITY)) {
    rarityWeights[key] = val.weight + (bonus[key] || 0);
  }

  // Pick rarity
  const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let chosenRarity = 'common';
  for (const [key, w] of Object.entries(rarityWeights)) {
    roll -= w;
    if (roll <= 0) { chosenRarity = key; break; }
  }

  // Filter items of that rarity
  const eligible = pool.filter(i => i.rarity === chosenRarity);
  if (!eligible.length) return null;

  // Pick random item from eligible pool
  const item = eligible[Math.floor(Math.random() * eligible.length)];

  // Add slight value variance ±10%
  const variance = 0.9 + Math.random() * 0.2;
  return {
    ...item,
    instanceId: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    value: parseFloat((item.baseValue * variance).toFixed(2)),
  };
}
