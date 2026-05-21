// ─────────────────────────────────────────────
// src/components/ui/StageTransitionFlash.tsx
// Phase 9 — Reanimated micro-animation for growth transitions.
//
// Shows a brief green flash when a plant advances to a new
// growth stage. Runs entirely on the UI thread via Reanimated
// worklets — zero JS-thread cost during the animation.
//
// Usage:
//   <StageTransitionFlash stage={plant.growthStage} />
//
// The component watches the `stage` prop for changes and
// triggers the flash animation automatically.
// ─────────────────────────────────────────────

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import type { GrowthStage } from '../../types';
import { COLORS } from '../../constants/theme';

// ─── Props ────────────────────────────────────

interface StageTransitionFlashProps {
  /** Current growth stage of the plant being watched */
  stage: GrowthStage;
  /** Optional: override flash colour (defaults to green_bright) */
  color?: string;
}

// ─── Stage colour map ──────────────────────────
// Different stages get subtly different flash colours
// to give visual feedback about the transition type.

const STAGE_FLASH_COLOR: Partial<Record<GrowthStage, string>> = {
  sprout:        COLORS.green_bright,
  vegetative:    COLORS.green_primary,
  flowering:     COLORS.terra_pale,
  mature:        COLORS.green_pale,
  harvest_ready: COLORS.text_accent,
  decaying:      COLORS.soil_light,
  dead:          COLORS.text_muted,
};

// ─── Component ────────────────────────────────

export const StageTransitionFlash = React.memo<StageTransitionFlashProps>(
  ({ stage, color }) => {
    const opacity = useSharedValue(0);

    // Flash on every stage change — including mount (first render is
    // suppressed by the useEffect dependency array's initial-skip pattern)
    const prevStageRef = React.useRef<GrowthStage | null>(null);

    useEffect(() => {
      // Skip the very first render (prevStageRef is null)
      if (prevStageRef.current === null) {
        prevStageRef.current = stage;
        return;
      }

      // Skip no-op updates
      if (prevStageRef.current === stage) return;
      prevStageRef.current = stage;

      // Trigger the flash animation:
      // 1. Instantly appear at full opacity
      // 2. Fade out over 600ms with ease-out
      opacity.value = withSequence(
        withTiming(1, { duration: 80,  easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 620, easing: Easing.out(Easing.cubic) }),
      );
    }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

    const flashColor = color ?? STAGE_FLASH_COLOR[stage] ?? COLORS.green_bright;

    // Only opacity is animated — keep it in useAnimatedStyle so it runs
    // on the UI thread. backgroundColor is a plain value so it belongs
    // in the regular style prop (avoids stale-closure issues in worklets).
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    return (
      <Animated.View
        // pointerEvents must be a prop (not a style) in React Native 0.71+
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.overlay,
          { backgroundColor: flashColor },
          animatedStyle,
        ]}
      />
    );
  },
);

StageTransitionFlash.displayName = 'StageTransitionFlash';

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    borderRadius: 8,
  },
});
