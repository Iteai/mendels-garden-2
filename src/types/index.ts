// ─────────────────────────────────────────────
// src/types/index.ts
// Core domain types for the entire application
// ─────────────────────────────────────────────

// ─── Genetics ────────────────────────────────

/** A single allele value — dominant (uppercase) or recessive (lowercase) */
export type AlleleValue = 'D' | 'R'; // Dominant / Recessive

/** A gene pair inherited from two parents */
export type GenePair = [AlleleValue, AlleleValue];

/**
 * Genotype: the full genetic makeup of a plant.
 * Keys are gene names (e.g. 'height', 'color_primary').
 * Values are GenePairs.
 */
export type Genotype = Record<string, GenePair>;

/**
 * Phenotype: the expressed traits computed from the genotype.
 * Numeric traits are 0–1 normalised unless documented otherwise.
 */
export type Phenotype = {
  // Visual traits
  heightFactor: number;       // 0–1: overall plant scale
  stemThickness: number;      // 0–1
  leafSize: number;           // 0–1
  leafCount: number;          // 0–1 → maps to actual count range per species
  branchDensity: number;      // 0–1
  flowerSize: number;         // 0–1
  fruitSize: number;          // 0–1
  fruitCount: number;         // 0–1

  // Color traits (hue offset -1..1 applied on top of species base hue)
  primaryColorShift: number;  // -1..1
  secondaryColorShift: number;// -1..1
  saturationBoost: number;    // 0–1

  // Growth traits
  growthRate: number;         // 0–1: affects simulation tick speed
  waterEfficiency: number;    // 0–1: resistance to under-watering
  lightEfficiency: number;    // 0–1: resistance to under-lighting
  hardiness: number;          // 0–1: overall disease/stress resistance

  // Yield traits
  yieldMultiplier: number;    // 0–2: harvest quantity modifier
  seedViability: number;      // 0–1: probability seeds are viable after harvest

  // Rarity hint — computed from how many rare traits expressed
  rarityScore: number;        // 0–1
};

/** A gene definition used to define species trait ranges */
export type GeneDefinition = {
  name: string;
  description: string;
  dominantEffect: Partial<Phenotype>;
  recessiveEffect: Partial<Phenotype>;
  mutationRate: number; // 0–1 probability per generation
};

// ─── Species ─────────────────────────────────

export type SpeciesId = 'tomato' | 'chili' | 'basil' | 'radish';

/** Static definition of a plant species */
export type SpeciesDefinition = {
  id: SpeciesId;
  displayName: string;
  description: string;

  // Base phenotype values before gene modifiers
  basePhenotype: Phenotype;

  // Which genes this species carries (subset of the global gene pool)
  geneKeys: string[];

  // Per-gene dominant allele frequency probability (0–1)
  // Used when generating wild-type seeds
  alleleFrequencies: Record<string, number>;

  // Growth lifecycle (in simulation ticks)
  growthTicks: {
    seedToSprout: number;
    sproutToVegetative: number;
    vegetativeToFlowering: number;
    floweringToMature: number;
    matureToDecay: number;
  };

  // Resource requirements (per tick)
  resourceNeeds: {
    water: number;    // 0–1
    sunlight: number; // 0–1
    nutrients: number;// 0–1
  };

  // Base hue for SVG rendering (HSL hue, 0–360)
  baseHue: {
    stem: number;
    leaf: number;
    flower: number;
    fruit: number;
  };
};

// ─── Plant Instance ───────────────────────────

export type GrowthStage =
  | 'seed'
  | 'sprout'
  | 'vegetative'
  | 'flowering'
  | 'mature'
  | 'harvest_ready'
  | 'decaying'
  | 'dead';

export type PlantHealth = 'thriving' | 'healthy' | 'stressed' | 'wilting' | 'dying';

/** A living plant in the garden */
export type PlantInstance = {
  id: string;
  speciesId: SpeciesId;
  genotype: Genotype;
  phenotype: Phenotype;

  growthStage: GrowthStage;
  growthProgress: number;  // 0–1 within current stage
  age: number;             // total simulation ticks elapsed

  health: PlantHealth;
  healthValue: number;     // 0–1

  // Current resource levels (0–1)
  waterLevel: number;
  lightLevel: number;
  nutrientLevel: number;

  // Garden position
  plotId: string;

  // Timestamps (Unix ms)
  plantedAt: number;
  lastUpdatedAt: number;

  // Lineage (for tracking hybrids)
  parentIds: [string | null, string | null];
  generation: number;
};

// ─── Garden ──────────────────────────────────

export type PlotState = 'empty' | 'occupied' | 'locked';

export type GardenPlot = {
  id: string;
  state: PlotState;
  plantId: string | null;
  soilQuality: number; // 0–1, affects growth
  position: { row: number; col: number };
};

// ─── Inventory ───────────────────────────────

export type SeedRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/** A seed packet in the player's inventory */
export type SeedItem = {
  id: string;
  speciesId: SpeciesId;
  genotype: Genotype;
  phenotype: Phenotype; // predicted expressed traits
  rarity: SeedRarity;
  quantity: number;

  // Lineage
  parentIds: [string | null, string | null];
  generation: number;

  // When this seed was obtained
  obtainedAt: number;
};

export type HarvestItem = {
  id: string;
  speciesId: SpeciesId;
  plantId: string;
  quantity: number;
  quality: number; // 0–1
  harvestedAt: number;
};

// ─── Store Slices ─────────────────────────────

export type GardenState = {
  plots: Record<string, GardenPlot>;
  plants: Record<string, PlantInstance>;
  lastSimulatedAt: number;
};

export type InventoryState = {
  seeds: Record<string, SeedItem>;
  harvests: Record<string, HarvestItem>;
  currency: number; // soft currency, "spores"
};

export type SettingsState = {
  simulationSpeed: number; // multiplier, 1 = realtime, >1 = faster
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  tutorialComplete: boolean;
};

export type RootState = {
  garden: GardenState;
  inventory: InventoryState;
  settings: SettingsState;
};
