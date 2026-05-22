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
| 6b    | 20 Varieties + Cross-Family Breeding | ✅ Complete |
| 7     | UI Improvement        | ✅ Complete  |
| 8     | Persistence           | ✅ Complete  |
| 9     | Optimisation          | ✅ Complete  |

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
│       ├── lab.tsx              Breeding workbench (trait preview, breed action)
│       └── settings.tsx         Speed control, sim info, preferences
│
├── src/
│   ├── types/
│   │   └── index.ts             All domain types — Genotype, Phenotype, PlantInstance…
│   │
│   ├── constants/
│   │   └── theme.ts             Design tokens (colours, spacing, typography, GAME constants)
│   │
│   ├── genetics/                Pure genetics module (no React, no store)
│   │   ├── genes.ts             10-gene pool with dominant/recessive deltas
│   │   ├── species.ts           Tomato, Chili, Basil, Radish definitions
│   │   ├── genotype.ts          Allele resolution, phenotype computation, mutation
│   │   ├── hybridiser.ts        2-parent Mendelian cross, seed generation, breed preview
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
│       │   ├── TouchableOpacityRow.tsx Touchable list row
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

**Phenotype computation:** base phenotype + sum of gene deltas, all clamped
to valid per-trait ranges. `rarityScore` = rare expressions / total genes.

**Rarity thresholds:** Common < 0.30 · Uncommon 0.30–0.60 · Rare 0.60–0.85 · Legendary ≥ 0.85

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
  └─ initStartingInventory() on first launch (3 tomato seeds)

Garden tab
  └─ Empty plot → SeedPickerModal → plantFromInventory(seedId, plotId)
       → decrements seed quantity, creates PlantInstance

Simulation (every 5s foreground / catch-up on reopen)
  └─ simulatePlants(plants, ticks)
       → resource decay, health, stage transitions
       → emits SimulationEvents (harvest_ready, water_critical…)

Plant tap → PlantActionSheet
  └─ Water (+0.40) / Feed (+0.35)
  └─ Harvest → calculateHarvest() → yield + seeds + spores
  └─ Compost → small spore reward, free the plot

Seeds tab
  └─ Tap seed → genetics detail modal
       → rare traits, genotype string, all phenotype bars

Lab tab
  └─ Select Parent A + B (same species)
  └─ Preview trait ranges (20 simulated crosses)
  └─ Breed (costs 10 ✦) → 3 offspring seeds added to inventory
```

---

## Plant Varieties (20 total)

| Family | Variety         | Key Traits                              |
|--------|-----------------|-----------------------------------------|
| Tomato | Cherry          | Tiny prolific fruits, fast growth        |
| Tomato | Beefsteak       | Huge fruits, slow, impressive            |
| Tomato | Roma            | Dense clusters, drought-tolerant         |
| Tomato | Heirloom        | Wild colour variation, collector special |
| Tomato | Yellow Pear     | Yellow, pear-shaped, high seed viability |
| Chili  | Cayenne         | Long slender red peppers, high heat      |
| Chili  | Jalapeño        | Medium, green→red, compact              |
| Chili  | Habanero        | Tiny wrinkled orange, extreme heat       |
| Chili  | Bell Pepper     | Large blocky, mild, colour variable      |
| Chili  | Serrano         | Small bullet, bright red, prolific       |
| Basil  | Sweet           | Classic large leaves, fast growth        |
| Basil  | Thai            | Purple stems, anise aroma               |
| Basil  | Purple          | Deep burgundy foliage, collector rare    |
| Basil  | Lemon           | Pale yellow-green, citrus scent          |
| Basil  | Holy (Tulsi)    | Dark aromatic, high hardiness            |
| Radish | Cherry Belle    | Fastest plant in the game                |
| Radish | Daikon          | Enormous white root, very slow           |
| Radish | Watermelon      | Green outside, vivid pink inside         |
| Radish | Black           | Dark exterior, near-black root           |
| Radish | French Breakfast| Elongated red/white, mild                |

## Cross-Family Breeding

Any two seeds can be crossed regardless of species family.
A **Cayenne × Daikon** hybrid is valid — and interesting.

- Offspring randomly inherit one parent's species ID (50/50)
- `isHybrid: true` is tagged on the seed with both family IDs stored
- **+18% rarity bonus** from heterosis (hybrid vigour)
- All 10 gene keys are shared across all species — the same genetics
  engine handles every cross without special cases
- Dramatically unexpected colour combinations emerge when the foreign
  parent's `primaryColorShift` alleles express in the host species palette

## CI/CD — Codemagic

Two workflows defined in `codemagic.yaml`:

| Workflow | Trigger | Output | Signing |
|---|---|---|---|
| `android-debug` | push to `develop` / `main` | APK | unsigned |
| `android-release` | tag `v*` (e.g. `v1.0.0`) | AAB | keystore |

**Setup steps (smartphone-friendly):**
1. Push repo to GitHub via GitHub mobile or web editor
2. Connect repo at [codemagic.io](https://codemagic.io)
3. Add environment variable group `expo_credentials` containing `EXPO_TOKEN`
   — get your token at `expo.dev/accounts/[you]/settings/access-tokens`
4. Add `DEVELOPER_EMAIL` for build notifications
5. For signed releases add group `android_signing` with `ANDROID_KEYSTORE`
   (base64-encoded `.jks`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
   `ANDROID_KEY_PASSWORD`

## Planned (Phases 7–9)

**Phase 7 — UI Improvement**
Rarity animations, seed comparison view, plant journal, polished layout system.

**Phase 8 — Persistence**
AsyncStorage autosave, restore on startup, state validation, push notifications
for harvest-ready plants wired to SimulationEvents.

**Phase 9 — Optimisation**
Batched simulation updates, React.memo audit, memory-aware plant cap (~300),
Reanimated micro-animations for growth transitions.
