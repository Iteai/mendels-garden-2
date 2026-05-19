// ─────────────────────────────────────────────
// src/store/useGenetics.ts
//
// React hooks that expose genetics computations
// without coupling UI components to the genetics
// module directly.
// ─────────────────────────────────────────────

import { useMemo } from 'react';
import type { SeedItem, SpeciesId, Genotype } from '../types';
import {
  computePhenotype,
  getRarityBreakdown,
  describeGenotype,
  createWildSeed,
  getSpecies,
  type RarityBreakdown,
} from '../genetics';
import { computeRarity } from './inventoryStore';

// ─── Seed Info Hook ───────────────────────────

export type SeedGeneticsInfo = {
  rarityBreakdown: RarityBreakdown;
  genotypeString: string;
  rarityLabel: SeedItem['rarity'];
};

/**
 * Compute detailed genetics info for a seed item.
 * Memoised — only recomputes when the seed id changes.
 */
export function useSeedGeneticsInfo(seed: SeedItem | null): SeedGeneticsInfo | null {
  return useMemo(() => {
    if (!seed) return null;
    return {
      rarityBreakdown: getRarityBreakdown(seed.genotype),
      genotypeString:  describeGenotype(seed.genotype),
      rarityLabel:     computeRarity(seed.phenotype.rarityScore),
    };
  }, [seed?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── Wild Seed Preview Hook ───────────────────

/**
 * Preview what a new wild-type seed of a species looks like.
 * Re-runs on each call (intentional — shows variation).
 */
export function useWildSeedPreview(speciesId: SpeciesId) {
  return useMemo(() => createWildSeed(speciesId, 1), [speciesId]);
}

// ─── Trait Description ────────────────────────

/**
 * Human-readable description of a phenotype value.
 * Used in plant/seed inspection UI.
 */
export function describeTrait(trait: string, value: number): string {
  const isColorShift = trait.includes('ColorShift');

  if (isColorShift) {
    if (value > 0.5)  return 'Warm shift';
    if (value < -0.5) return 'Cool shift';
    return 'Neutral tone';
  }

  const pct = trait === 'yieldMultiplier' ? (value / 2) : value;

  if (pct >= 0.85) return 'Exceptional';
  if (pct >= 0.68) return 'Strong';
  if (pct >= 0.48) return 'Average';
  if (pct >= 0.28) return 'Weak';
  return 'Very low';
}

// ─── Key Traits for Display ───────────────────

/** Traits worth displaying in compact UI cards (ordered by interest) */
export const DISPLAY_TRAITS: Array<{ key: string; label: string; icon: string }> = [
  { key: 'growthRate',          label: 'Growth',      icon: 'trending-up' },
  { key: 'heightFactor',        label: 'Height',      icon: 'resize' },
  { key: 'fruitSize',           label: 'Fruit Size',  icon: 'ellipse' },
  { key: 'fruitCount',          label: 'Fruit Qty',   icon: 'apps' },
  { key: 'yieldMultiplier',     label: 'Yield',       icon: 'basket' },
  { key: 'waterEfficiency',     label: 'Drought',     icon: 'water' },
  { key: 'lightEfficiency',     label: 'Shade',       icon: 'sunny' },
  { key: 'hardiness',           label: 'Hardiness',   icon: 'shield' },
  { key: 'seedViability',       label: 'Seed Set',    icon: 'leaf' },
  { key: 'primaryColorShift',   label: 'Colour',      icon: 'color-palette' },
];
