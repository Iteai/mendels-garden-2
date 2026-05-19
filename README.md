# 🌿 Plant Genetics — Expo React Native

A plant breeding simulation game built with Expo, React Native, and Zustand.

## Phase Status

| Phase | Name               | Status      |
|-------|--------------------|-------------|
| 1     | Foundation         | ✅ Complete  |
| 2     | Genetics Core      | ✅ Complete  |
| 3     | SVG Plant Rendering| ✅ Complete  |
| 4     | Growth Simulation  | ✅ Complete  |
| 5     | Game Loop          | 🔲 Next      |
| 6     | Content Expansion  | 🔲 Planned   |
| 7     | UI Improvement     | 🔲 Planned   |
| 8     | Persistence        | 🔲 Planned   |
| 9     | Optimisation       | 🔲 Planned   |

---

## Project Structure

```
plant-genetics/
├── app/
│   ├── _layout.tsx          # Root layout (SafeArea, StatusBar, AppInit)
│   └── (tabs)/
│       ├── _layout.tsx      # Tab navigator + SimulationLoop
│       ├── garden.tsx       # Plot grid + plant status
│       ├── inventory.tsx    # Seed & harvest inventory
│       ├── lab.tsx          # Breeding workbench
│       └── settings.tsx     # Preferences & debug
│
├── src/
│   ├── types/
│   │   └── index.ts         # All domain types (Genotype, Phenotype, Plant…)
│   │
│   ├── constants/
│   │   └── theme.ts         # Colors, typography, spacing, game constants
│   │
│   ├── store/
│   │   ├── index.ts         # Root Zustand store + typed selectors
│   │   ├── gardenStore.ts   # Garden slice (plots, plants, simulation)
│   │   ├── inventoryStore.ts# Inventory slice (seeds, harvests, currency)
│   │   └── settingsStore.ts # Settings slice
│   │
│   └── components/
│       └── ui/
│           ├── index.ts         # Re-exports
│           ├── AppText.tsx      # Typography primitive
│           ├── Card.tsx         # Surface card
│           ├── Badge.tsx        # Rarity / status badge
│           ├── PressableRow.tsx # Touchable list item
│           ├── ScreenShell.tsx  # Safe-area screen wrapper
│           ├── StatBar.tsx      # Resource bar (water, nutrients…)
│           └── TabBar.tsx       # Custom bottom tab bar
│
├── app.json
├── babel.config.js
├── expo-env.d.ts
├── package.json
└── tsconfig.json
```

---

## Architecture

### State (Zustand)
Three slices combined into one store:
- **GardenSlice** — plots, plants, simulation ticks
- **InventorySlice** — seeds, harvests, currency (spores)
- **SettingsSlice** — speed, sound, notifications

All selectors are typed and granular to avoid unnecessary re-renders.

### Simulation Loop
- **Foreground**: `setInterval` in `(tabs)/_layout.tsx`, ticks every 5s
- **Offline catch-up**: calculated on app open in `app/_layout.tsx`
- Cap: `OFFLINE_CATCH_UP_CAP_TICKS = 720` (1 hour max)

### Design System
- **Palette**: deep forest greens + warm parchment + terracotta
- **Aesthetic**: botanical field journal — scientific, organic, earthy
- **Typography**: system fonts with careful weight/tracking/size scale

---

## Running

```bash
# Install dependencies
npm install

# Start Expo
npx expo start

# Or open in Expo Snack — paste files individually
```

## Build (Codemagic)
Configure with `eas.json` in a future phase. The managed workflow requires no native setup.

---
