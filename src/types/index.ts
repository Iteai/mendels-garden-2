// ─────────────────────────────────────────────
// src/types/index.ts — Core domain types
// Phase 7: 20 plant varieties across 4 families,
// cross-family breeding support
// ─────────────────────────────────────────────

// ─── Species & Family ─────────────────────────

export type SpeciesFamily = 'tomato' | 'chili' | 'basil' | 'radish';

export type SpeciesId =
  // Tomato family
  | 'tomato_cherry'
  | 'tomato_beefsteak'
  | 'tomato_roma'
  | 'tomato_heirloom'
  | 'tomato_yellow_pear'
  // Chili family
  | 'chili_cayenne'
  | 'chili_jalapeno'
  | 'chili_habanero'
  | 'chili_bell'
  | 'chili_serrano'
  // Basil family
  | 'basil_sweet'
  | 'basil_thai'
  | 'basil_purple'
  | 'basil_lemon'
  | 'basil_holy'
  // Radish family
  | 'radish_cherry'
  | 'radish_daikon'
  | 'radish_watermelon'
  | 'radish_black'
  | 'radish_french';

// ─── Genetics ─────────────────────────────────

export type AlleleValue = 'D' | 'R';
export type GenePair   = [AlleleValue, AlleleValue];
export type Genotype   = Record<string, GenePair>;

export type Phenotype = {
  heightFactor:        number;
  stemThickness:       number;
  leafSize:            number;
  leafCount:           number;
  branchDensity:       number;
  flowerSize:          number;
  fruitSize:           number;
  fruitCount:          number;
  primaryColorShift:   number;
  secondaryColorShift: number;
  saturationBoost:     number;
  growthRate:          number;
  waterEfficiency:     number;
  lightEfficiency:     number;
  hardiness:           number;
  yieldMultiplier:     number;
  seedViability:       number;
  rarityScore:         number;
};

export type GeneDefinition = {
  name:           string;
  description:    string;
  dominantEffect: Partial<Phenotype>;
  recessiveEffect:Partial<Phenotype>;
  mutationRate:   number;
};

// ─── Species Definition ───────────────────────

export type SpeciesDefinition = {
  id:          SpeciesId;
  family:      SpeciesFamily;
  variety:     string;          // short e.g. "Cherry"
  displayName: string;          // full e.g. "Cherry Tomato"
  description: string;

  basePhenotype:     Phenotype;
  geneKeys:          string[];
  alleleFrequencies: Record<string, number>;

  growthTicks: {
    seedToSprout:           number;
    sproutToVegetative:     number;
    vegetativeToFlowering:  number;
    floweringToMature:      number;
    matureToDecay:          number;
  };

  resourceNeeds: {
    water:     number;
    sunlight:  number;
    nutrients: number;
  };

  baseHue: {
    stem:   number;
    leaf:   number;
    flower: number;
    fruit:  number;
  };

  // Optional colour overrides for unusual varieties
  // (e.g. near-white daikon, near-black radish)
  fruitSaturationBase?: number;  // replaces default 52% base saturation
  fruitLightnessBase?:  number;  // replaces default 44% base lightness
};

// ─── Plant Instance ───────────────────────────

export type GrowthStage =
  | 'seed' | 'sprout' | 'vegetative' | 'flowering'
  | 'mature' | 'harvest_ready' | 'decaying' | 'dead';

export type PlantHealth = 'thriving' | 'healthy' | 'stressed' | 'wilting' | 'dying';

export type PlantInstance = {
  id:             string;
  speciesId:      SpeciesId;
  genotype:       Genotype;
  phenotype:      Phenotype;
  growthStage:    GrowthStage;
  growthProgress: number;
  age:            number;
  health:         PlantHealth;
  healthValue:    number;
  waterLevel:     number;
  lightLevel:     number;
  nutrientLevel:  number;
  plotId:         string;
  plantedAt:      number;
  lastUpdatedAt:  number;
  parentIds:      [string | null, string | null];
  generation:     number;
};

// ─── Garden ───────────────────────────────────

export type PlotState = 'empty' | 'occupied' | 'locked';

export type GardenPlot = {
  id:          string;
  state:       PlotState;
  plantId:     string | null;
  soilQuality: number;
  position:    { row: number; col: number };
};

// ─── Inventory ────────────────────────────────

export type SeedRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type SeedItem = {
  id:               string;
  speciesId:        SpeciesId;
  genotype:         Genotype;
  phenotype:        Phenotype;
  rarity:           SeedRarity;
  quantity:         number;
  parentIds:        [string | null, string | null];
  generation:       number;
  obtainedAt:       number;
  // Cross-family hybrid metadata
  isHybrid?:        boolean;
  hybridFamilyA?:   SpeciesFamily;
  hybridFamilyB?:   SpeciesFamily;
};

export type HarvestItem = {
  id:          string;
  speciesId:   SpeciesId;
  plantId:     string;
  quantity:    number;
  quality:     number;
  harvestedAt: number;
};

// ─── Store Slices ─────────────────────────────

export type GardenState = {
  plots:           Record<string, GardenPlot>;
  plants:          Record<string, PlantInstance>;
  lastSimulatedAt: number;
};

export type InventoryState = {
  seeds:    Record<string, SeedItem>;
  harvests: Record<string, HarvestItem>;
  currency: number;
};

export type SettingsState = {
  simulationSpeed:       number;
  notificationsEnabled:  boolean;
  soundEnabled:          boolean;
  tutorialComplete:      boolean;
};

export type RootState = {
  garden:    GardenState;
  inventory: InventoryState;
  settings:  SettingsState;
};
