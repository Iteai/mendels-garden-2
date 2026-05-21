// ─────────────────────────────────────────────
// src/components/ui/RarityPulse.tsx
// Phase 7 — Animated rarity glow / particle effects.
//
// Wraps children with tiered visual effects:
//   common    → no animation
//   uncommon  → subtle border pulse
//   rare      → rotating glow ring + scale pulse
//   legendary → golden particle burst + strong glow
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';
import { COLORS, RADIUS, DURATION } from '../../constants/theme';
import type { SeedRarity } from '../../types';

type RarityPulseProps = {
  rarity: SeedRarity;
  children: React.ReactNode;
  size?: number;       // size of the container square (default 88)
  compact?: boolean;   // smaller effect for list items
};

// ─── Animation configs ────────────────────────

function usePulseAnimation(duration: number, delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: duration * 0.45,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: duration * 0.55,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { delay },
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration, delay]);

  return anim;
}

function useRotateAnimation(duration: number) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration]);

  return anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
}

function useParticleAnimation(duration: number) {
  const particles = useRef(
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    const loops = particles.map((p) =>
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(p.x, {
              toValue: Math.random() > 0.5 ? 1 : -1,
              duration: duration * 0.6,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(p.y, {
              toValue: -1,
              duration: duration * 0.6,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(p.opacity, {
              toValue: 1,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(p.x, {
              toValue: Math.random() > 0.5 ? 2 : -2,
              duration: duration * 0.4,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(p.y, {
              toValue: -1.5,
              duration: duration * 0.4,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: duration * 0.4,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(Math.random() * 300),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [particles, duration]);

  return particles;
}

// ─── Renderers per rarity tier ────────────────

function CommonWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function UncommonPulse({ children, size }: { children: React.ReactNode; size: number }) {
  const pulseAnim = usePulseAnimation(DURATION.slow);

  const borderOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.55],
  });

  return (
    <View style={{ width: size, height: size, borderRadius: RADIUS.lg }}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: RADIUS.lg,
            borderWidth: 2,
            borderColor: COLORS.glow_uncommon,
            opacity: borderOpacity,
          },
        ]}
      />
      {children}
    </View>
  );
}

function RarePulse({ children, size }: { children: React.ReactNode; size: number }) {
  const pulseAnim = usePulseAnimation(DURATION.xslow);
  const rotateAnim = useRotateAnimation(4000);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });
  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: RADIUS.lg,
        transform: [{ scale }],
      }}
    >
      {/* Rotating glow ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: RADIUS.lg,
            borderWidth: 2,
            borderColor: COLORS.glow_rare,
            opacity: glowOpacity,
            transform: [{ rotate: rotateAnim }],
          },
        ]}
      />
      {/* Second ring counter-rotating */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: COLORS.rarity_rare,
            opacity: 0.3,
            transform: [{ rotate: rotateAnim }],
            margin: 3,
          },
        ]}
      />
      {children}
    </Animated.View>
  );
}

function LegendaryPulse({ children, size }: { children: React.ReactNode; size: number }) {
  const pulseAnim = usePulseAnimation(600);
  const rotateAnim = useRotateAnimation(3000);
  const particles = useParticleAnimation(2000);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const PARTICLE_RADIUS = size * 0.6;
  const SPREAD = size * 0.25;

  return (
    <View style={{ width: size, height: size }}>
      {/* Particles */}
      {particles.map((p, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const tx = p.x.interpolate({
          inputRange: [-2, 0, 2],
          outputRange: [
            Math.cos(angle) * PARTICLE_RADIUS,
            0,
            Math.cos(angle) * PARTICLE_RADIUS,
          ],
        });
        const ty = p.y.interpolate({
          inputRange: [-2, 0, 2],
          outputRange: [
            Math.sin(angle) * PARTICLE_RADIUS,
            0,
            Math.sin(angle) * PARTICLE_RADIUS,
          ],
        });

        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                width: SPREAD,
                height: 3,
                borderRadius: RADIUS.full,
                backgroundColor: COLORS.glow_legendary,
                top: size / 2,
                left: size / 2 - SPREAD / 2,
                opacity: p.opacity,
                transform: [
                  { translateX: tx },
                  { translateY: ty },
                  { rotate: `${angle}rad` },
                ],
              },
            ]}
          />
        );
      })}

      {/* Glow ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: RADIUS.lg,
            borderWidth: 2,
            borderColor: COLORS.glow_legendary,
            opacity: glowOpacity,
            transform: [{ rotate: rotateAnim }],
          },
        ]}
      />
      {/* Inner glow */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: COLORS.rarity_legendary,
            opacity: glowOpacity,
            margin: 2,
          },
        ]}
      />
      {/* Background glow */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: RADIUS.lg,
            backgroundColor: COLORS.glow_legendary,
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.02, 0.08],
            }),
          },
        ]}
      />

      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: RADIUS.lg,
          transform: [{ scale }],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// ─── Main Component ──────────────────────────

export function RarityPulse({ rarity, children, size = 88, compact = false }: RarityPulseProps) {
  const s = compact ? Math.min(size, 64) : size;

  if (rarity === 'legendary') {
    return <LegendaryPulse size={s}>{children}</LegendaryPulse>;
  }
  if (rarity === 'rare') {
    return <RarePulse size={s}>{children}</RarePulse>;
  }
  if (rarity === 'uncommon') {
    return <UncommonPulse size={s}>{children}</UncommonPulse>;
  }
  return <CommonWrapper>{children}</CommonWrapper>;
}