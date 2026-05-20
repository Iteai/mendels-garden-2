// ─────────────────────────────────────────────
// src/store/journalStore.ts
//
// Variety Journal — tracks which of the 20 varieties
// the player has discovered, and logs new discoveries.
//
// This slice integrates with inventoryStore and gameActions
// to automatically record discoveries when seeds are added.
// ─────────────────────────────────────────────

import { StateCreator } from 'zustand';
import type { JournalState, JournalEntry, VarietyId, SpeciesId } from '../types';
import { getVariety } from '../genetics/varieties';

// ─── Initial State ────────────────────────────

const initialJournalState: JournalState = {
  entries: {},
  newDiscoveries: [],
};

// ─── Actions ──────────────────────────────────

export type JournalActions = {
  /**
   * Record that a variety was obtained.
   * Returns a DiscoveryEvent if it's a new discovery, null otherwise.
   */
  recordDiscovery: (params: {
    varietyId: VarietyId;
    speciesId: SpeciesId;
    rarityScore: number;
    quantity: number;
  }) => { type: 'new_variety'; varietyId: VarietyId; speciesId: SpeciesId; rarityScore: number; timestamp: number } | null;

  /** Get total number of unique varieties discovered */
  getDiscoveredCount: () => number;

  /** Clear new discovery flags (after showing toast) */
  clearNewDiscoveries: () => void;

  /** Reset journal (for dev/testing) */
  resetJournal: () => void;
};

export type JournalSlice = JournalState & JournalActions;

export const createJournalSlice: StateCreator<
  JournalSlice,
  [],
  [],
  JournalSlice
> = (set, get) => ({
  ...initialJournalState,

  recordDiscovery: ({ varietyId, speciesId, rarityScore, quantity }) => {
    const state = get();
    const existing = state.entries[varietyId];
    const now = Date.now();

    const isNew = !existing;

    const entry: JournalEntry = {
      varietyId,
      speciesId,
      discoveredAt: existing?.discoveredAt ?? now,
      discoveredCount: (existing?.discoveredCount ?? 0) + quantity,
      bestRarityScore: Math.max(existing?.bestRarityScore ?? 0, rarityScore),
      totalHarvested: existing?.totalHarvested ?? 0,
    };

    set((s) => ({
      entries: { ...s.entries, [varietyId]: entry },
      newDiscoveries: isNew
        ? [...s.newDiscoveries, varietyId]
        : s.newDiscoveries,
    }));

    if (isNew) {
      return { type: 'new_variety' as const, varietyId, speciesId, rarityScore, timestamp: now };
    }

    return null;
  },

  /** Record a harvest event for journal tracking */
  recordHarvest: (varietyId: VarietyId) => {
    set((s) => {
      const existing = s.entries[varietyId];
      if (!existing) return s;
      return {
        entries: {
          ...s.entries,
          [varietyId]: {
            ...existing,
            totalHarvested: existing.totalHarvested + 1,
          },
        },
      };
    });
  },

  getDiscoveredCount: () => {
    return Object.keys(get().entries).length;
  },

  clearNewDiscoveries: () => {
    set({ newDiscoveries: [] });
  },

  resetJournal: () => {
    set(initialJournalState);
  },
});