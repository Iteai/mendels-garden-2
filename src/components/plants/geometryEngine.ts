// ─────────────────────────────────────────────
// src/components/plants/geometryEngine.ts
//
// Pure, deterministic geometry computation.
// Same Phenotype + GrowthStage → same geometry every time.
//
// Canvas: viewBox "0 0 120 160"
//   Centre X:  60
//   Base Y:   154  (stem root)
//   Usable height: ~140px
//
// "Pseudo-random" variation is seeded by phenotype values
// — no Math.random() — so the same genotype always renders
// the same shape.
// ─────────────────────────────────────────────

import type { Phenotype, GrowthStage, SpeciesDefinition } from '../../types';
import {
  PlantGeometry, Vec2,
  StemGeometry, BranchGeometry, LeafGeometry,
  FlowerGeometry, FruitGeometry,
} from './types';
import { computeColorPalette } from './colorMapper';
import { SVG_LIMITS } from '../../constants/performance';

// ─── Canvas constants ─────────────────────────

const VB_W   = 120;
const VB_H   = 160;
const CX     = 60;
const BASE_Y = 154;

// ─── Deterministic micro-variation ────────────
// Derives small offsets from phenotype values so plants
// of different genotypes look visually distinct even at
// the same trait level.

function pseudoJitter(seed: number, amplitude: number): number {
  // Simple hash: multiply by irrational, take fractional part, centre at 0
  const frac = ((seed * 1.6180339887) % 1 + 1) % 1;
  return (frac - 0.5) * 2 * amplitude;
}

// ─── Trig helpers ─────────────────────────────

const DEG = Math.PI / 180;

function cos(deg: number) { return Math.cos(deg * DEG); }
function sin(deg: number) { return Math.sin(deg * DEG); }

/** Lerp between two points */
function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Point on main stem at fraction t (0=base, 1=apex) along the bezier */
function stemPoint(base: Vec2, apex: Vec2, ctrl: Vec2, t: number): Vec2 {
  const mt = 1 - t;
  return {
    x: mt * mt * base.x + 2 * mt * t * ctrl.x + t * t * apex.x,
    y: mt * mt * base.y + 2 * mt * t * ctrl.y + t * t * apex.y,
  };
}

// ─── Stage helpers ────────────────────────────

function stageIndex(stage: GrowthStage): number {
  const order: GrowthStage[] = [
    'seed', 'sprout', 'vegetative', 'flowering',
    'mature', 'harvest_ready', 'decaying', 'dead',
  ];
  return order.indexOf(stage);
}

function atLeast(stage: GrowthStage, target: GrowthStage): boolean {
  return stageIndex(stage) >= stageIndex(target);
}

// ─── Leaf path helpers ────────────────────────

/** Build a LeafGeometry from a position, SVG rotation, and size factor */
function makeLeaf(
  base: Vec2,
  rotation: number,
  sizeFactor: number, // 0–1
  leafSize: number,   // phenotype.leafSize
  opacity = 1.0,
): LeafGeometry {
  const L = 8  + leafSize * 14 * sizeFactor;
  const W = 4  + leafSize * 7  * sizeFactor;
  return { base, rotation, length: L, width: W, opacity };
}

// ─── Main geometry builder ────────────────────

export function buildPlantGeometry(
  phenotype: Phenotype,
  stage: GrowthStage,
  species: SpeciesDefinition,
  healthValue = 1.0,
): PlantGeometry {

  const palette = computeColorPalette(phenotype, species, healthValue);

  const opacity =
    stage === 'dead'     ? 0.35 :
    stage === 'decaying' ? 0.65 :
    1.0;

  // ── SEED stage ────────────────────────────────

  if (stage === 'seed') {
    return {
      viewBoxW: VB_W, viewBoxH: VB_H, cx: CX, baseY: BASE_Y,
      stage, opacity,
      seedEllipse: {
        cx: CX + pseudoJitter(phenotype.heightFactor, 3),
        cy: BASE_Y - 6,
        rx: 5 + phenotype.fruitSize * 3,
        ry: 4 + phenotype.fruitSize * 2,
        rotation: -20 + pseudoJitter(phenotype.leafSize, 15),
      },
      branches: [], leaves: [], flowers: [], fruits: [],
      palette,
    };
  }

  // ── SPROUT stage ──────────────────────────────

  if (stage === 'sprout') {
    const sproutH = 22 + phenotype.growthRate * 10;
    const apexY   = BASE_Y - sproutH;
    const stem: StemGeometry = {
      base:    { x: CX, y: BASE_Y },
      apex:    { x: CX, y: apexY },
      control: { x: CX, y: BASE_Y - sproutH * 0.5 },
      width: 1.5,
    };
    const cotyledons: LeafGeometry[] = [
      makeLeaf({ x: CX, y: apexY + 4 }, -120, 0.7, phenotype.leafSize),
      makeLeaf({ x: CX, y: apexY + 4 },  -60, 0.7, phenotype.leafSize),
    ];
    return {
      viewBoxW: VB_W, viewBoxH: VB_H, cx: CX, baseY: BASE_Y,
      stage, opacity,
      stem, cotyledons,
      branches: [], leaves: [], flowers: [], fruits: [],
      palette,
    };
  }

  // ── VEGETATIVE and above ───────────────────────

  // Stem height: 45–115px driven by heightFactor
  const stemH  = 45 + phenotype.heightFactor * 70;
  const apexY  = BASE_Y - stemH;

  // Slight organic lean seeded from stemThickness
  const lean   = pseudoJitter(phenotype.stemThickness * 3.7, 5);
  const apexX  = CX + lean;

  const stemCtrlX = CX + pseudoJitter(phenotype.growthRate * 2.1, 4);
  const stemCtrlY = BASE_Y - stemH * 0.52;

  const stem: StemGeometry = {
    base:    { x: CX,    y: BASE_Y },
    apex:    { x: apexX, y: apexY  },
    control: { x: stemCtrlX, y: stemCtrlY },
    width:   1.8 + phenotype.stemThickness * 2.4,
  };

  // ── Branches ────────────────────────────────

  // Number of branch nodes: 1–4 pairs, driven by branchDensity
  // Capped by performance tier
  const branchNodeCount = Math.min(
    1 + Math.round(phenotype.branchDensity * 3),
    SVG_LIMITS.maxBranches,
  );

  // Branch angle from vertical: low density = steep (closer to stem),
  // high density = wide spread
  const branchAngle = 40 + phenotype.branchDensity * 28; // 40–68° from stem

  // Branch length as fraction of stem height
  const branchLenFrac = 0.14 + phenotype.leafCount * 0.12; // 0.14–0.26
  const branchLen     = stemH * branchLenFrac;

  const branches: BranchGeometry[] = [];

  // Distribute nodes from 20% to 78% up the stem
  for (let i = 0; i < branchNodeCount; i++) {
    const t = 0.20 + (i / Math.max(branchNodeCount - 1, 1)) * 0.58;
    const node = stemPoint(
      { x: CX, y: BASE_Y },
      { x: apexX, y: apexY },
      { x: stemCtrlX, y: stemCtrlY },
      t,
    );

    for (const side of ['left', 'right'] as const) {
      const sign = side === 'left' ? -1 : 1;
      // Branch goes outward and slightly upward
      const endX = node.x + sign * branchLen * cos(branchAngle);
      const endY = node.y - branchLen * sin(branchAngle);
      const end: Vec2 = { x: endX, y: endY };

      // Control point: midpoint pushed outward for curve
      const mid  = lerp(node, end, 0.5);
      const ctrl: Vec2 = {
        x: mid.x + sign * branchLen * 0.08,
        y: mid.y - branchLen * 0.05,
      };

      // Leaf rotation at branch end:
      // right branch end: leaves point upper-right  → SVG rotate = -branchAngle
      // left  branch end: leaves point upper-left   → SVG rotate = -(180 - branchAngle)
      const leafAngle = side === 'right'
        ? -(branchAngle)
        : -(180 - branchAngle);

      branches.push({
        node, end,
        control: ctrl,
        width: stem.width * 0.55,
        side,
        leafAngle,
      });
    }
  }

  // ── Leaves ──────────────────────────────────

  const leaves: LeafGeometry[] = [];

  // Leaves at each branch tip: 1–3 per tip
  const leavesPerBranch = 1 + Math.round(phenotype.leafCount * 2);

  branches.forEach((br, bi) => {
    for (let li = 0; li < leavesPerBranch; li++) {
      // Spread leaves around the branch tip angle
      const spread = (li - (leavesPerBranch - 1) / 2) * 22;
      const rot    = br.leafAngle + spread;

      // Jitter position slightly along branch for multi-leaf clusters
      const t       = 0.75 + li * 0.08;
      const leafBase = lerp(br.node, br.end, Math.min(t, 1.0));

      // Outer leaves slightly smaller
      const sizeFactor = li === 0 ? 1.0 : 0.72;

      leaves.push(makeLeaf(
        leafBase, rot, sizeFactor,
        phenotype.leafSize,
        stage === 'decaying' ? 0.6 : 1.0,
      ));
    }
  });

  // A pair of leaves at the apex
  const apexPt = { x: apexX, y: apexY };
  leaves.push(makeLeaf(apexPt, -115, 0.85, phenotype.leafSize));
  leaves.push(makeLeaf(apexPt,  -65, 0.85, phenotype.leafSize));

  // ── Flowers ─────────────────────────────────

  const flowers: FlowerGeometry[] = [];

  if (atLeast(stage, 'flowering')) {
    const flowerCount = 1 + Math.round(phenotype.flowerSize * 3); // 1–4
    const petalR      = 3 + phenotype.flowerSize * 4;             // 3–7px

    // Place flowers at branch tips and apex
    const flowerSites: Vec2[] = [
      apexPt,
      ...branches.slice(0, flowerCount - 1).map((b) => b.end),
    ];

    flowerSites.slice(0, flowerCount).forEach((site) => {
      flowers.push({
        center:     { x: site.x, y: site.y - petalR * 0.5 },
        petalR,
        petalCount: 5,
      });
    });
  }

  // ── Fruits ──────────────────────────────────

  const fruits: FruitGeometry[] = [];

  if (atLeast(stage, 'mature')) {
    const fruitCount  = 2 + Math.round(phenotype.fruitCount * 5); // 2–7
    const fruitRadius = 7 + phenotype.fruitSize * 11;             // 7–18px

    // Hang fruits below branch ends, slightly inward
    const fruitSites = branches.map((br) => ({
      x: br.end.x + pseudoJitter(br.node.y * 0.03 + br.side.length, 4),
      y: br.end.y + fruitRadius * 1.1,
    }));

    // Also below apex for single apical fruit
    fruitSites.unshift({
      x: apexX + pseudoJitter(phenotype.fruitSize * 5, 3),
      y: apexY + fruitRadius * 0.8,
    });

    // Take as many sites as fruitCount, wrapping if needed
    for (let i = 0; i < fruitCount; i++) {
      const site = fruitSites[i % fruitSites.length];
      // Offset repeated fruits to avoid exact overlap
      const offsetX = i >= fruitSites.length
        ? pseudoJitter(i * 1.414, fruitRadius * 0.8)
        : 0;
      fruits.push({
        center: { x: site.x + offsetX, y: site.y },
        radius: fruitRadius * (0.85 + pseudoJitter(i * 0.7, 0.15)),
      });
    }
  }

  return {
    viewBoxW: VB_W, viewBoxH: VB_H, cx: CX, baseY: BASE_Y,
    stage, opacity,
    stem, branches, leaves, flowers, fruits,
    palette,
  };
}
