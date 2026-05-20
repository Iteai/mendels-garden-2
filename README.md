# 🌿 Plant Genetics — Expo React Native

A plant breeding simulation game for Android built with Expo managed workflow,
React Native SVG, and Zustand. Blend biological simulation, genetics, and
collection mechanics into a deep but approachable mobile experience.

---

## Phase Status

| Phase | Name                  | Status       |
|-------|-----------------------|--------------|
| 1     | Foundation            | ✅ Complete  |
| 2     | Genetics Core         | ✅ Complete  |
| 3     | SVG Plant Rendering   | ✅ Complete  |
| 4     | Growth Simulation     | ✅ Complete  |
| 5     | Game Loop             | ✅ Complete  |
| 6     | Content Expansion     | ✅ Complete  |
| 7     | UI Improvement        | ✅ Complete  |
| 8     | Persistence           | ✅ Complete  |
| 9     | Optimisation          | 🔲 Planned   |

### Phase 8 Highlights — Persistence & Notifications ✅

- **AsyncStorage Autosave** — Full state is automatically saved to device storage with 1s debounce after every change. No manual save button needed.
- **State Restoration on Startup** — On app launch, saved state is loaded from AsyncStorage and merged into the Zustand store before simulation catch-up runs.
- **State Validation** — Loaded data is validated for structural integrity. Corrupted saves are silently discarded with a warning log.
- **Local Push Notifications** — Simulation events are routed to push notifications when enabled:
  - 🌱 **Harvest Ready** — Alert when a plant reaches `harvest_ready` stage
  - 💧 **Water Critical** — Alert when a plant drops below 30% water
  - 🥀 **Plant Died** — Alert when a plant transitions to `dead` stage
- **Notification Permissions** — Permissions requested at app startup, with platform-specific channel configuration for Android.
- **Notification Cancellation** — All pending notifications for a harvested/composted plant are automatically cancelled.
- **Notification Toggle** — The existing Settings switch controls whether notifications are sent.
- **New dependencies:** `expo-notifications` for local push notification scheduling.

### Previous: Phase 7 Highlights — UI Improvement ✅

- **Seed Comparison Modal** — Side-by-side comparison of any two seeds with highlighted trait differences (>8% threshold), quick stats, genotype comparison, and visual indicators for which seed has the advantage
- **Variety Collection Journal** — Track discovery of all 20 varieties across 4 species with progress bar, discovered/undiscovered grid, per-variety stats (times obtained, best rarity, star indicator for rare+)
- **New Discovery Toast** — Animated slide-in notification when first obtaining a new variety, with emoji, variety name, and rarity badge
- **Growth Progress Rings** — Visual growth indicator on garden plot cells showing current stage progress
- **Compare Button in Lab** — New "Compare Parents" button visible when both parents are selected, launching the seed comparison
- **Automatic Journal Tracking** — New discoveries are automatically recorded whenever seeds enter inventory
- **Collection Stats in Settings** — Integration-ready hooks for tracking collection progress
- **Green accent styling** — Journal link, compare button, and toast all use consistent botanical-green accent borders

### Previous: Phase 6 Highlights — Content Expansion ✅

- **20 unique plant varieties** (5 per species):
  - **Tomato:** Beefsteak (massive fruit), Cherry (prolific), Roma (paste), Brandywine (pink heirloom), San Marzano (plum)
  - **Chili:** Cayenne (fiery), Bell (sweet blocky), Jalapeño (medium heat), Habanero (fruity extreme), Poblano (mild dark)
  - **Basil:** Genovese (classic pesto), Thai (anise-purple), Lemon (citrus), Purple Opal (deep purple), Cinnamon (spicy)
  - **Radish:** Daikon (giant white), Cherry Belle (classic red), French Breakfast (oblong), Watermelon (pink flesh), Black Spanish (rare black)
- **Cross-species breeding** — breed any two seeds regardless of species (e.g. Cayenne × Daikon)
  - Offspring species determined by VIGOR dominance (weighted random)
  - Phenotype blends both parent species' base traits
  - +10% rarity boost for cross-species hybrids
- **Diverse starter inventory** — 6 seeds across all 4 species

---

## Project Structure

```
plant-genetics/
│
├── app/
│   ├── _layout.tsx              Root layout (SafeArea, AppInit, offline catch-up)
│   └── (tabs)/
│       ├── _layout.tsx          Tab nav + SimulationLoop (foreground ticks)
│       ├── garden.tsx           Plot grid, planting, action sheet, harvest result
│       ├── inventory.tsx        Seed library with genetics detail modal
│       ├── lab.tsx              Breeding workbench (cross-species enabled!)
│       └── settings.tsx         Speed control, sim info, preferences
│
├── src/
│   ├── types/
│   │   └── index.ts             All domain types — Genotype, Phenotype, PlantInstance,
│   │                              SpeciesDefinition, VarietyDefinition, SeedItem…
│   │
│   ├── constants/
│   │   └── theme.ts             Design tokens (colours, spacing, typography, GAME constants)
│   │
│   ├── genetics/                Pure genetics module (no React, no store)
│   │   ├── genes.ts             10-gene pool with dominant/recessive deltas
│   │   ├── species.ts           Tomato, Chili, Basil, Radish definitions + varietyIds
│   │   ├── varieties.ts         20 cultivar definitions with offsets & allele overrides
│   │   ├── genotype.ts          Allele resolution, phenotype computation, mutation,
│   │   │                         cross-species phenotype blending
│   │   ├── hybridiser.ts        Mendelian cross, cross-species breeding, seed generation,
│   │   │                         breed preview, 6-seed starter pack
│   │   └── index.ts             Public API
│   │
│   ├── simulation/              Pure lifecycle engine (no React, no store)
│   │   ├── simulationCore.ts    Per-tick resource decay, health, stage transitions
│   │   └── index.ts             Public API
│   │
│   ├── game/                    Compound game-loop actions
│   │   ├── gameLoop.ts          Pure: yield calc, seed extraction, currency rewards
│   │   ├── gameActions.ts       Atomic store operations: plant, harvest, compost, breed
│   │   └── index.ts             Public API
│   │
│   ├── store/                   Zustand global state
│   │   ├── gardenStore.ts       Plots, plants, tickSimulation → simulatePlants()
│   │   ├── inventoryStore.ts    Seeds, harvests, currency, addSeedBatch
│   │   ├── settingsStore.ts     Speed, sound, notifications, inventoryInitialised
│   │   ├── useGenetics.ts       React hooks wrapping genetics computations
│   │   └── index.ts             Root store + all typed selectors and action hooks
│   │
│   └── components/
│       ├── ui/                  Design system primitives
│       │   ├── AppText.tsx      Typography with variant + colour props
│       │   ├── Card.tsx         Surface card (default/raised/inset/highlight)
│       │   ├── Badge.tsx        Rarity, health, and growth-stage pills
│       │   ├── StatBar.tsx      Horizontal resource bar
│       │   ├── PressableRow.tsx Touchable list row
│       │   ├── ScreenShell.tsx  Safe-area screen wrapper with header
│       │   ├── GrowthTimer.tsx  Stage progress bar + lifecycle strip + time remaining
│       │   ├── TabBar.tsx       Custom bottom tab bar
│       │   └── index.ts
│       │
│       └── plants/              SVG plant rendering module
│           ├── types.ts         PlantGeometry, PlantColorPalette, all primitives
│           ├── colorMapper.ts   Phenotype + baseHue → full HSL colour palette
│           ├── geometryEngine.ts Species-routed geometry builder (all 4 species)
│           ├── PlantRenderer.tsx Top-level memoised component
│           ├── TomatoPlant.tsx   Tomato SVG assembly
│           ├── ChiliPlant.tsx    Chili SVG assembly
│           ├── BasilPlant.tsx    Basil SVG assembly
│           ├── RadishPlant.tsx   Radish SVG assembly
│           ├── index.ts
│           └── parts/
│               ├── Stem.tsx       Bezier stem + branches
│               ├── Leaf.tsx       Pointed bezier oval + midrib
│               ├── Flower.tsx     5-petal radial flower
│               ├── Fruit.tsx      Layered tomato fruit
│               ├── ChiliFruit.tsx Elongated pepper shape
│               ├── RadishRoot.tsx Underground bulb with soil occlusion
│               └── BasilTop.tsx   Vertical flower spike
│
├── app.json
├── babel.config.js
├── expo-env.d.ts
├── package.json
└── tsconfig.json
```

---

## Architecture

### Genetics System

10 genes define the full phenotype space. Each gene has a dominant delta, a
recessive delta, a per-allele mutation rate, and a `rareExpression` flag.

**Expression model:**
- `DD` → dominant delta × 1.0
- `DR` → dominant delta × 0.65 (partial dominance)
- `RR` → recessive delta × 1.0

**Phenotype computation:** species base phenotype + variety offsets + sum of gene deltas,
all clamped to valid per-trait ranges. `rarityScore` = rare expressions / total genes.

**Rarity thresholds:** Common < 0.30 · Uncommon 0.30–0.60 · Rare 0.60–0.85 · Legendary ≥ 0.85

### Varieties (Cultivars)

Each species has 5 named varieties with:
- **Base phenotype offsets** (e.g. Cherry tomato: -0.20 fruitSize, +0.35 fruitCount)
- **Allele frequency overrides** (e.g. Beefsteak: FRUIT_SIZE at 80% dominant)
- **Optional baseHue overrides** for visually distinct rendering (Purple Opal basil = purple leaf hue)

### Cross-Species Breeding

Any two seeds can be bred together, regardless of species:

1. **Offspring species** is determined by **VIGOR dominance** — the parent with more dominant VIGOR alleles is more likely to dominate the hybrid
2. **Phenotype blending** — base traits are averaged equally between both parent species
3. **Rarity boost** — cross-species hybrids earn +10% bonus to rarityScore

### Simulation Engine

Purely functional — `simulatePlants(plants, ticks) → {plants, events}`. No
React, no store access inside the engine.

**Performance:** Single `{...plant}` clone per plant per batch, then in-place
mutation. 300 plants × 720 offline ticks ≈ 216,000 iterations in < 80ms.

**Lifecycle:** `seed → sprout → vegetative → flowering → mature → harvest_ready → decaying → dead`

At each tick: water decay → nutrient decay → light recovery → health recompute
→ growthProgress advance → stage transition check.

### SVG Rendering

All plants use a fixed `viewBox="0 0 120 160"`, base at (60, 154).
Geometry is **deterministic** — same Phenotype + GrowthStage always produces
the same shape. Variation between plants is seeded from phenotype values using
an irrational-multiply hash (no `Math.random()`).

**Species visual DNA:**

| Species | Stem     | Leaf shape   | Fruit shape   | Branching         |
|---------|----------|--------------|---------------|-------------------|
| Tomato  | Tall vine | Pointed oval | Round layered | 40–68° spread      |
| Chili   | Upright   | Narrow strap | Hanging pepper| 60–80° (tight)     |
| Basil   | Short bush| Broad round  | Flower spike  | 20–38° (wide)      |
| Radish  | Rosette   | Strap radial | Underground root | None (rosette)  |

`PlantRenderer` is memoised — re-renders only on stage transitions or health
tier crossings (health bucketed to 5 levels).

### State Management

Three Zustand slices combined into one store:
- **GardenSlice** — plots, plants, simulation clock
- **InventorySlice** — seeds (with `addSeedBatch` for atomic multi-seed writes), harvests, currency
- **SettingsSlice** — speed multiplier, preferences, first-launch flag

All selectors are granular. Action hooks return stable function references.

### Game Loop

`src/game/` provides two layers:
1. **Pure calculations** (`gameLoop.ts`) — yield, seed extraction, rewards, validation
2. **Atomic actions** (`gameActions.ts`) — `plantFromInventory`, `harvestPlant`, `compostPlant`, `breedFromInventory`

Each compound action reads state via `useAppStore.getState()` and performs all
mutations in a single logical transaction.

**Currency (Spores ✦):**
- Earned on harvest: `quantity × (1 + rarityScore × 3.5) × qualityBonus × 6`
- Spent on breeding: 10 ✦ per breed session
- Earned on compost: small consolation (3–5 ✦)

### Design System

Botanical field journal aesthetic. All tokens in `src/constants/theme.ts`.

| Palette role   | Value       | Use                          |
|----------------|-------------|------------------------------|
| `bg_primary`   | `#141A0E`   | Screen backgrounds           |
| `bg_surface`   | `#1C2414`   | Cards, cells                 |
| `text_primary` | `#E8E4D4`   | Body text (warm parchment)   |
| `text_accent`  | `#C4D97A`   | Highlights, ready states     |
| `green_bright` | `#7DC42A`   | Active/healthy indicators    |
| `terra_primary`| `#C4621A`   | Terracotta accents           |

---

## Running

```bash
npm install
npx expo start
```

Scan QR with the Expo Go app on Android. No Xcode or Android Studio required.

## Codemagic Build

Works out of the box with Expo managed workflow. Configure `eas.json` in
Phase 8 for production builds.

---

## Game Loop Summary

```
Open app
  └─ initGarden() + offline catch-up ticks
  └─ initStartingInventory() on first launch
       → 6 seeds: Cherry Tomato ×2, Beefsteak Tomato ×2,
         Genovese Basil ×1, Cayenne Chili ×1, Cherry Belle Radish ×1
         + 1 mutated Cherry Tomato variant

Garden tab
  └─ Empty plot → SeedPickerModal → plantFromInventory(seedId, plotId)
       → decrements seed quantity, creates PlantInstance with varietyId

Simulation (every 5s foreground / catch-up on reopen)
  └─ simulatePlants(plants, ticks)
       → resource decay, health, stage transitions
       → emits SimulationEvents (harvest_ready, water_critical…)

Plant tap → PlantActionSheet
  └─ Water (+0.40) / Feed (+0.35)
  └─ Harvest → calculateHarvest() → yield + seeds + spores
  └─ Compost → small spore reward, free the plot

Seeds tab
  └─ Tap seed → genetics detail modal (shows variety name e.g. "Cherry Tomato")
       → rare traits, genotype string, all phenotype bars

Lab tab
  └─ Select Parent A + B (any species — cross-breeding enabled!)
  └─ Cross-species indicator shown when parents differ
  └─ Cross-Species Guide explains hybrid mechanics
  └─ Preview trait ranges (20 simulated crosses)
  └─ Breed (costs 10 ✦) → 3 offspring seeds added to inventory
       → Offspring species determined by VIGOR dominance
       → +10% rarity boost for cross-species hybrids
```

---

## Planned (Phase 9)

**Phase 9 — Optimisation**
Batched simulation updates, React.memo audit, memory-aware plant cap (~300),
Reanimated micro-animations for growth transitions.