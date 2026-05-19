// ─────────────────────────────────────────────
// src/components/feedback/Toast.tsx
// Simple non-blocking toast notifications
// Phase 7: UI Improvements — action feedback
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useToastStore, type ToastMessage } from './useToastStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_DURATION = 2500;

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
      ]).start(() => onRemove(toast.id));
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    success: 'checkmark-circle',
    info: 'information-circle',
    warning: 'warning',
    error: 'alert-circle',
  };

  const colorMap: Record<string, string> = {
    success: COLORS.status_thriving,
    info: COLORS.rarity_rare,
    warning: COLORS.status_stressed,
    error: COLORS.status_dying,
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
          transform: [{ translateY }],
          borderLeftColor: colorMap[toast.type] ?? colorMap.info,
        },
      ]}
    >
      <Ionicons
        name={iconMap[toast.type] ?? iconMap.info}
        size={18}
        color={colorMap[toast.type] ?? colorMap.info}
      />
      <Text style={styles.toastText} numberOfLines={2}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: SPACING['4'],
    right: SPACING['4'],
    zIndex: 9999,
    gap: SPACING['2'],
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2'],
    backgroundColor: COLORS.bg_surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border_normal,
    borderLeftWidth: 3,
    paddingVertical: SPACING['3'],
    paddingHorizontal: SPACING['4'],
    maxWidth: SCREEN_WIDTH - SPACING['8'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  toastText: {
    flex: 1,
    color: COLORS.text_primary,
    fontSize: TYPOGRAPHY.size.sm,
    lineHeight: TYPOGRAPHY.size.sm * 1.4,
  },
});