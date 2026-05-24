# 🏷️ Garage Sale Simulator

A mobile-first browser game where you search your house for items, set up garage sales, and haggle with buyers — all the way from a starter home to a mansion selling luxury goods.

## 🎮 How to Play

1. **Search rooms** in your house to find items of varying rarity
2. **Fill your inventory** (up to 20 items)
3. **Set up a garage sale** — place items on folding tables
4. **Haggle with buyers** — accept, counter, or refuse offers
5. **Save up** to buy a bigger house with better items

## 🏠 Progression

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
├── index.html          # Entry point
├── css/
│   └── style.css       # All styles (mobile-first)
├── js/
│   ├── items.js        # Item definitions & rarity system
│   ├── house.js        # Room search & cooldown logic
│   ├── sale.js         # Garage sale & table setup (coming soon)
│   ├── haggle.js       # Buyer AI & negotiation (coming soon)
│   ├── ui.js           # Rendering & notifications
│   └── main.js         # Game state & initialization
```

## 🚀 Running the Game

Just open `index.html` in any modern browser. No build step needed.

For itch.io: zip all files (keeping folder structure) and upload as an HTML game.

## 🛠️ Built With

- Vanilla HTML / CSS / JavaScript
- No frameworks, no dependencies
- Mobile-first design
