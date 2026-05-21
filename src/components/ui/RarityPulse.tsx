// ─────────────────────────────────────────────
// src/components/ui/RarityPulse.tsx
// Phase 7 — Animated rarity glow / particle effects.
// Phase 9 — Migrated from React Native Animated API to
//            react-native-reanimated worklets.
//
// All animation loops run on the UI thread — zero JS-thread
// cost during simulation ticks.
//
// Wraps children with tiered visual effects:
//   common    → no animation
//   uncommon  → subtle border pulse
//   rare      → rotating glow ring + scale pulse
//   legendary → golden particle burst + strong glow
// ─────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, RADIUS, DURATION } from '../../constants/theme';
import type { SeedRarity } from '../../types';

// ─── Types ────────────────────────────────────

type RarityPulseProps = {
  rarity:    SeedRarity;
  children:  React.ReactNode;
  size?:     number;    // container square size (default 88)
  compact?:  boolean;   // smaller effect for list items
};

// ─── Hook: Pulse (0→1→0 loop) ────────────────

function usePulse(durationMs: number) {
  const value = useSharedValue(0);
  React.useEffect(() => {
    value.value = withRepeat(
      withSequence(
        withTiming(1, { duration: durationMs * 0.45, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: durationMs * 0.55, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

// ─── Hook: Continuous rotation (0→1 = 0°→360°) ──

function useRotate(durationMs: number) {
  const value = useSharedValue(0);
  React.useEffect(() => {
    value.value = withRepeat(
      withTiming(1, { duration: durationMs, easing: Easing.linear }),
      -1,
      false,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

// ─── Particle Beam ────────────────────────────
// Single legendary particle — extracted to its own component so
// useAnimatedStyle is called at component level (not inside .map).

type ParticleBeamProps = {
  angle:          number;
  particleRadius: number;
  spread:         number;
  size:           number;
  durationMs:     number;
  xSign:          1 | -1;
  delayMs:        number;
};

const ParticleBeam = React.memo(
  ({ angle, particleRadius, spread, size, durationMs, xSign, delayMs }: ParticleBeamProps) => {
    const tx      = useSharedValue(0);
    const ty      = useSharedValue(0);
    const opacity = useSharedValue(0);

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    React.useEffect(() => {
      const d = delayMs;
      opacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: d }),
          withTiming(1, { duration: durationMs * 0.2 }),
          withTiming(0, { duration: durationMs * 0.4 }),
          withTiming(0, { duration: durationMs * 0.4 }),
        ),
        -1, false,
      );
      tx.value = withRepeat(
        withSequence(
          withTiming(0,          { duration: d }),
          withTiming(xSign,      { duration: durationMs * 0.6, easing: Easing.out(Easing.quad) }),
          withTiming(xSign * 2,  { duration: durationMs * 0.4, easing: Easing.in(Easing.quad) }),
          withTiming(0,          { duration: 0 }),
        ),
        -1, false,
      );
      ty.value = withRepeat(
        withSequence(
          withTiming(0,    { duration: d }),
          withTiming(-1,   { duration: durationMs * 0.6, easing: Easing.out(Easing.quad) }),
          withTiming(-1.5, { duration: durationMs * 0.4, easing: Easing.in(Easing.quad) }),
          withTiming(0,    { duration: 0 }),
        ),
        -1, false,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const particleStyle = useAnimatedStyle(() => ({
      opacity:   opacity.value,
      transform: [
        { translateX: cosA * particleRadius + tx.value * spread },
        { translateY: sinA * particleRadius + ty.value * spread },
        { rotate:     `${angle}rad` },
      ],
    }));

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position:        'absolute',
            width:           spread,
            height:          3,
            borderRadius:    RADIUS.full,
            backgroundColor: COLORS.glow_legendary,
            top:             size / 2,
            left:            size / 2 - spread / 2,
          },
          particleStyle,
        ]}
      />
    );
  },
);
ParticleBeam.displayName = 'ParticleBeam';

// ─── Rarity Wrappers ──────────────────────────

function CommonWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ── Uncommon ─────────────────────────────────

const UncommonPulse = React.memo(
  ({ children, size }: { children: React.ReactNode; size: number }) => {
    const pulse = usePulse(DURATION.slow);

    const borderStyle = useAnimatedStyle(() => ({
      opacity: 0.15 + pulse.value * 0.40,
    }));

    return (
      <View style={{ width: size, height: size, borderRadius: RADIUS.lg }}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.border,
            { borderColor: COLORS.glow_uncommon, borderWidth: 2 },
            borderStyle,
          ]}
        />
        {children}
      </View>
    );
  },
);
UncommonPulse.displayName = 'UncommonPulse';

// ── Rare ─────────────────────────────────────

const RarePulse = React.memo(
  ({ children, size }: { children: React.ReactNode; size: number }) => {
    const pulse  = usePulse(DURATION.xslow);
    const rotate = useRotate(4000);

    const scaleStyle = useAnimatedStyle(() => ({
      transform: [{ scale: 1 + pulse.value * 0.04 }],
    }));

    const ringStyle = useAnimatedStyle(() => ({
      opacity:   0.2 + pulse.value * 0.4,
      transform: [{ rotate: `${rotate.value * 360}deg` }],
    }));

    const innerRingStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotate.value * 360}deg` }],
    }));

    return (
      <Animated.View
        style={[{ width: size, height: size, borderRadius: RADIUS.lg }, scaleStyle]}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.border, { borderColor: COLORS.glow_rare, borderWidth: 2 }, ringStyle]}
        />
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.border, { borderColor: COLORS.rarity_rare, borderWidth: 1, opacity: 0.3, margin: 3 }, innerRingStyle]}
        />
        {children}
      </Animated.View>
    );
  },
);
RarePulse.displayName = 'RarePulse';

// ── Legendary ────────────────────────────────

const PARTICLE_COUNT = 6;
const PARTICLE_DURATION_MS = 2000;

// Pre-compute stable angles and xSigns outside the component so they're
// never re-created on re-renders.
const PARTICLE_ANGLES = Array.from(
  { length: PARTICLE_COUNT },
  (_, i) => (i / PARTICLE_COUNT) * Math.PI * 2,
);
const PARTICLE_XSIGNS: Array<1 | -1> = [1, -1, 1, -1, 1, -1];
const PARTICLE_DELAYS  = Array.from(
  { length: PARTICLE_COUNT },
  (_, i) => (i * (400 / PARTICLE_COUNT)),
);

const LegendaryPulse = React.memo(
  ({ children, size }: { children: React.ReactNode; size: number }) => {
    const pulse  = usePulse(600);
    const rotate = useRotate(3000);

    const particleRadius = size * 0.6;
    const spread         = size * 0.25;

    const scaleStyle = useAnimatedStyle(() => ({
      transform: [{ scale: 1 + pulse.value * 0.06 }],
    }));

    const glowRingStyle = useAnimatedStyle(() => ({
      opacity:   0.3 + pulse.value * 0.5,
      transform: [{ rotate: `${rotate.value * 360}deg` }],
    }));

    const innerGlowStyle = useAnimatedStyle(() => ({
      opacity: 0.3 + pulse.value * 0.5,
    }));

    const bgGlowStyle = useAnimatedStyle(() => ({
      opacity: 0.02 + pulse.value * 0.06,
    }));

    return (
      <View style={{ width: size, height: size }}>
        {/* Particles — each one is its own memoised component */}
        {PARTICLE_ANGLES.map((angle, i) => (
          <ParticleBeam
            key={i}
            angle={angle}
            particleRadius={particleRadius}
            spread={spread}
            size={size}
            durationMs={PARTICLE_DURATION_MS}
            xSign={PARTICLE_XSIGNS[i]}
            delayMs={PARTICLE_DELAYS[i]}
          />
        ))}

        {/* Glow ring */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.border, { borderColor: COLORS.glow_legendary, borderWidth: 2 }, glowRingStyle]}
        />
        {/* Inner glow */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.border, { borderColor: COLORS.rarity_legendary, borderWidth: 1, margin: 2 }, innerGlowStyle]}
        />
        {/* Background glow */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.border, { backgroundColor: COLORS.glow_legendary }, bgGlowStyle]}
        />

        <Animated.View
          style={[{ width: size, height: size, borderRadius: RADIUS.lg }, scaleStyle]}
        >
          {children}
        </Animated.View>
      </View>
    );
  },
);
LegendaryPulse.displayName = 'LegendaryPulse';

// ─── Main Export ─────────────────────────────

export function RarityPulse({
  rarity,
  children,
  size = 88,
  compact = false,
}: RarityPulseProps): React.ReactElement {
  const s = compact ? Math.min(size, 64) : size;

  if (rarity === 'legendary') return <LegendaryPulse size={s}>{children}</LegendaryPulse>;
  if (rarity === 'rare')      return <RarePulse      size={s}>{children}</RarePulse>;
  if (rarity === 'uncommon')  return <UncommonPulse  size={s}>{children}</UncommonPulse>;
  return <CommonWrapper>{children}</CommonWrapper>;
}

// ─── Shared styles ────────────────────────────

const styles = StyleSheet.create({
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.lg,
  },
});
