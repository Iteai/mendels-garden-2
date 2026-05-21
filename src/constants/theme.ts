// ─────────────────────────────────────────────
// src/constants/theme.ts
// Design tokens — Botanical Field Journal aesthetic
//
// Direction: A living research notebook.
// Earthy, scientific, organic. Deep forest greens
// and warm parchment, with terracotta accents.
// Feels like a naturalist's journal brought to life.
// ─────────────────────────────────────────────

export const COLORS = {
  // ── Base / Background ─────────────────────
  bg_deep:     '#0E1409', // near-black forest night
  bg_primary:  '#141A0E', // dark moss ground
  bg_surface:  '#1C2414', // lifted card surface
  bg_raised:   '#232C17', // elevated element
  bg_overlay:  '#2A341C', // modal / drawer

  // ── Text ──────────────────────────────────
  text_primary:   '#E8E4D4', // warm parchment
  text_secondary: '#B0AA8C', // aged paper
  text_muted:     '#6B6650', // faded ink
  text_accent:    '#C4D97A', // fresh leaf highlight

  // ── Brand Greens ──────────────────────────
  green_bright:  '#7DC42A', // young leaf
  green_primary: '#4A8C1C', // mature leaf
  green_deep:    '#2D5A10', // old growth
  green_muted:   '#3A5C20', // shadow leaf
  green_pale:    '#A8C878', // new growth

  // ── Terracotta / Warm ─────────────────────
  terra_bright:  '#E07840', // ripe fruit
  terra_primary: '#C4621A', // terracotta
  terra_deep:    '#8C3E0C', // dark clay
  terra_pale:    '#E8A878', // peach blossom

  // ── Soil / Brown ──────────────────────────
  soil_light:  '#7A5C3A',
  soil_mid:    '#5C4228',
  soil_dark:   '#3A2818',

  // ── Rarity Colors ─────────────────────────
  rarity_common:    '#8C9688', // grey-green
  rarity_uncommon:  '#4A8C1C', // green
  rarity_rare:      '#4A6EAA', // cool blue
  rarity_legendary: '#C49A1A', // golden amber

  // ── Status ────────────────────────────────
  status_thriving: '#7DC42A',
  status_healthy:  '#A8C878',
  status_stressed: '#E0B840',
  status_wilting:  '#E07840',
  status_dying:    '#C43A1A',

  // ── Utility ───────────────────────────────
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',

  // ── Border ────────────────────────────────
  border_subtle: '#2A341C',
  border_normal: '#3A4C24',
  border_strong: '#4A6030',

  // ── Phase 7: Rarity Glow Overlays ─────────
  glow_rare:      '#4A6EAA',
  glow_legendary: '#C49A1A',
  glow_uncommon:  '#4A8C1C',

  // ── Phase 7: Soil texture ─────────────────
  soil_texture:   '#1A2212',

  // ── Phase 7: Journal ──────────────────────
  journal_bg:     '#1A1E10',
  journal_border: '#2D3A1A',
} as const;

export type ColorKey = keyof typeof COLORS;

// ─── Typography ───────────────────────────────

export const TYPOGRAPHY = {
  // System font stack — reliable across Android/iOS
  // Prioritises clean monospace feel for scientific data
  fontFamily: {
    mono:   'Courier New, Courier, monospace',
    sans:   'System', // React Native default
    serif:  'Georgia, serif',
  },

  // Scale — Minor Third (1.2x)
  size: {
    xs:   10,
    sm:   12,
    base: 14,
    md:   16,
    lg:   18,
    xl:   22,
    '2xl': 26,
    '3xl': 32,
    '4xl': 40,
  },

  weight: {
    light:    '300' as const,
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    black:    '900' as const,
  },

  lineHeight: {
    tight:   1.15,
    normal:  1.4,
    relaxed: 1.65,
  },

  letterSpacing: {
    tight:   -0.5,
    normal:  0,
    wide:    0.8,
    widest:  2.0,
  },
} as const;

// ─── Spacing ──────────────────────────────────

export const SPACING = {
  px:   1,
  '0':  0,
  '1':  4,
  '2':  8,
  '3':  12,
  '4':  16,
  '5':  20,
  '6':  24,
  '8':  32,
  '10': 40,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,
} as const;

// ─── Border Radius ────────────────────────────

export const RADIUS = {
  none:  0,
  sm:    4,
  md:    8,
  lg:    12,
  xl:    16,
  '2xl': 24,
  full:  9999,
} as const;

// ─── Shadows ──────────────────────────────────

export const SHADOWS = {
  none: {},
  sm: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  glow_green: {
    shadowColor: COLORS.green_bright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

// ─── Animation Durations (ms) ─────────────────

export const DURATION = {
  instant: 0,
  fast:    150,
  normal:  250,
  slow:    400,
  xslow:   700,
} as const;

// ─── Game Constants ───────────────────────────

export const GAME = {
  // Garden grid
  GARDEN_ROWS: 4,
  GARDEN_COLS: 3,
  INITIAL_UNLOCKED_PLOTS: 6,

  // Simulation
  SIMULATION_INTERVAL_MS: 5000,    // tick every 5s
  TICKS_PER_GAME_MINUTE: 1,        // 1 tick = 1 game minute
  OFFLINE_CATCH_UP_CAP_TICKS: 720, // max 1hr of offline progress

  // Phase 9: Performance limits
  /** Hard cap on living plants — prevents unbounded memory growth */
  PLANT_CAP: 300,
  /** Chunk size for batched offline catch-up simulation */
  SIM_CHUNK_SIZE: 50,
  /**
   * Dead plants older than this many ticks are auto-pruned
   * from the store during each simulation batch to free memory.
   */
  DEAD_PLANT_PRUNE_TICKS: 5,

  // Rarity thresholds (rarityScore)
  RARITY_UNCOMMON:  0.3,
  RARITY_RARE:      0.6,
  RARITY_LEGENDARY: 0.85,

  // Resource decay per tick (if not replenished)
  WATER_DECAY_RATE:    0.02,
  NUTRIENT_DECAY_RATE: 0.005,

  // Starting inventory
  STARTING_SEEDS: 3,
  STARTING_CURRENCY: 50,
} as const;

// ─── Tab route names ──────────────────────────

export const ROUTES = {
  GARDEN:    '(tabs)/garden',
  INVENTORY: '(tabs)/inventory',
  LAB:       '(tabs)/lab',
  SETTINGS:  '(tabs)/settings',
} as const;
