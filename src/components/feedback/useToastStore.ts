// ─────────────────────────────────────────────
// src/components/feedback/useToastStore.ts
// Lightweight toast notification store
// Phase 7: UI Improvements
// ─────────────────────────────────────────────

import { create } from 'zustand';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export type ToastMessage = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastStore = {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
};

let toastCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = `toast_${Date.now()}_${toastCounter++}`;
    const toast: ToastMessage = { id, type, message };
    set((state) => ({ toasts: [...state.toasts, toast] }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

/**
 * Convenience helpers for common toast types.
 */
export function showToast(type: ToastType, message: string) {
  useToastStore.getState().addToast(type, message);
}

export function showSuccess(message: string) { showToast('success', message); }
export function showInfo(message: string) { showToast('info', message); }
export function showWarning(message: string) { showToast('warning', message); }
export function showError(message: string) { showToast('error', message); }