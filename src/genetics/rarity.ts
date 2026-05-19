// ─────────────────────────────────────────────
// src/genetics/rarity.ts
//
// Pure rarity computation — extracted from inventoryStore
// to break the circular dependency between genetics and store.
// ─────────────────────────────────────────────

import { GAME } from '../constants/theme';

export type RarityLabel = 'common' | 'uncommon' | 'rare' | 'legendary';

/**
 * Convert a numeric rarity score (0–1) to a label.
 * Based on thresholds in GAME constants.
 */
export function computeRarityLabel(rarityScore: number): RarityLabel {
  if (rarityScore >= GAME.RARITY_LEGENDARY) return 'legendary';
  if (rarityScore >= GAME.RARITY_RARE)      return 'rare';
  if (rarityScore >= GAME.RARITY_UNCOMMON)  return 'uncommon';
  return 'common';
}