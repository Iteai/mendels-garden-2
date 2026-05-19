// ─────────────────────────────────────────────
// src/store/settingsStore.ts
// Settings state: simulation speed, preferences
// ─────────────────────────────────────────────

import { StateCreator } from 'zustand';
import type { SettingsState } from '../types';

/** Runtime-only settings not in the shared domain type */
export type SettingsSliceExtra = {
  inventoryInitialised: boolean;
};

export type SettingsActions = {
  setSimulationSpeed: (speed: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  completeTutorial: () => void;
  markInventoryInitialised: () => void;
};

const initialSettingsState: SettingsState & SettingsSliceExtra = {
  simulationSpeed: 1,
  notificationsEnabled: true,
  soundEnabled: true,
  tutorialComplete: false,
  inventoryInitialised: false,
};

export type SettingsSlice = SettingsState & SettingsSliceExtra & SettingsActions;

export const createSettingsSlice: StateCreator<
  SettingsSlice,
  [],
  [],
  SettingsSlice
> = (set) => ({
  ...initialSettingsState,

  setSimulationSpeed: (speed: number) => {
    set({ simulationSpeed: Math.max(0.5, Math.min(10, speed)) });
  },

  setNotificationsEnabled: (enabled: boolean) => {
    set({ notificationsEnabled: enabled });
  },

  setSoundEnabled: (enabled: boolean) => {
    set({ soundEnabled: enabled });
  },

  completeTutorial: () => {
    set({ tutorialComplete: true });
  },

  markInventoryInitialised: () => {
    set({ inventoryInitialised: true });
  },
});
