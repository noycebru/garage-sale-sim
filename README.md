# 🏷️ Garage Sale Simulator

A first-person 3D browser game where you explore your house, find items of varying rarity, set up garage sales on your driveway, and haggle with buyers — all the way from a starter home to a mansion selling luxury goods.

## 🎮 Controls

| Platform | Move | Look | Pick Up |
|---|---|---|---|
| 📱 Mobile | Left joystick | Drag right side of screen | PICK UP button |
| 🖥️ Desktop | WASD / Arrow keys | Mouse (click to lock) | E key |

## 🏠 How to Play

1. **Explore rooms** — walk through the house and find floating items
2. **Pick up items** — get close and press E / tap PICK UP
3. **Fill your inventory** — up to 20 items at a time
4. **Head to the driveway** — set up folding tables and run a garage sale *(coming soon)*
5. **Haggle with buyers** — accept, counter, or refuse offers *(coming soon)*
6. **Buy a bigger house** — better houses spawn better items *(coming soon)*

## 🎲 Item Rarities

| Rarity | Color | Examples |
|---|---|---|
| Common | ⬜ Gray | Old mugs, books, candles |
| Uncommon | 🟩 Green | Blenders, lamps, board games |
| Rare | 🟦 Blue | Record players, cameras, typewriters |
| Epic | 🟪 Purple | Vintage radios, coin collections |
| Legendary | 🟨 Gold | Grandpa's Watch |

## 🏠 Progression *(coming soon)*

| Level | House | Items |
|---|---|---|
| 1 | Starter House | Knick-knacks, old electronics |
| 2 | Suburban Home | Furniture, sports gear |
| 3 | Nice House | Antiques, collectibles |
| 4 | Big House | Art, instruments |
| 5 | Mansion | Luxury goods, rare finds |

## 📁 File Structure

```
garage-sale-sim/
├── index.html
├── README.md
├── css/
│   └── style.css
└── js/
    ├── three.min.js    # Three.js r128 (local copy for itch.io compat)
    ├── items.js        # Item definitions & rarity system
    ├── world.js        # 3D house geometry, rooms, furniture
    ├── player.js       # First-person camera, WASD + mobile joystick
    ├── objects.js      # 3D item rendering & pickup interaction
    ├── ui.js           # HUD, inventory bar, notifications
    └── main.js         # Game state, Three.js loop, lighting
```

## 🚀 Running the Game

Open `index.html` in any modern browser — no build step needed.

**For itch.io:** zip all files keeping the folder structure, upload as an HTML game, check "This file will be played in the browser."

## 🛠️ Built With

- Three.js r128
- Vanilla HTML / CSS / JavaScript
- No frameworks or build tools
- Mobile-first design
