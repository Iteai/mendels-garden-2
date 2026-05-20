// ─────────────────────────────────────────────
// src/components/plants/geometryEngine.ts
//
// Species-aware geometry engine.
// buildPlantGeometry() routes to per-species
// builders that each produce a PlantGeometry
// tuned to the biology of that plant.
//
// Shared utilities live at the top.
// Species functions follow in alphabetical order.
// ─────────────────────────────────────────────

import type { Phenotype, GrowthStage } from '../../types';
import type { SpeciesDefinition } from '../../genetics/species';
import type {
  PlantGeometry, Vec2,
  StemGeometry, BranchGeometry, LeafGeometry,
  FlowerGeometry, FruitGeometry,
} from './types';
import { computeColorPalette } from './colorMapper';

// ─── Canvas ───────────────────────────────────
const VB_W = 120; const VB_H = 160; const CX = 60; const BASE_Y = 154;

// ─── Shared math ──────────────────────────────
const DEG = Math.PI / 180;
const cos  = (d: number) => Math.cos(d * DEG);
const sin  = (d: number) => Math.sin(d * DEG);

function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function stemPoint(base: Vec2, apex: Vec2, ctrl: Vec2, t: number): Vec2 {
  const mt = 1 - t;
  return {
    x: mt*mt*base.x + 2*mt*t*ctrl.x + t*t*apex.x,
    y: mt*mt*base.y + 2*mt*t*ctrl.y + t*t*apex.y,
  };
}

// Deterministic jitter seeded from phenotype — no Math.random()
function jitter(seed: number, amp: number): number {
  const frac = ((seed * 1.6180339887) % 1 + 1) % 1;
  return (frac - 0.5) * 2 * amp;
}

function stageIndex(stage: GrowthStage): number {
  return ['seed','sprout','vegetative','flowering','mature','harvest_ready','decaying','dead'].indexOf(stage);
}
function atLeast(stage: GrowthStage, target: GrowthStage): boolean {
  return stageIndex(stage) >= stageIndex(target);
}

function makeLeaf(
  base: Vec2, rotation: number, sizeFactor: number,
  leafSize: number, opacity = 1.0, widthRatio = 0.55,
): LeafGeometry {
  return {
    base, rotation, opacity,
    length: 8  + leafSize * 14 * sizeFactor,
    width:  (8 + leafSize * 14 * sizeFactor) * widthRatio,
  };
}

function stageOpacity(stage: GrowthStage): number {
  return stage === 'dead' ? 0.35 : stage === 'decaying' ? 0.65 : 1.0;
}

// ─── Seed / Sprout (shared across all species) ─

function seedGeom(ph: Phenotype): PlantGeometry['seedEllipse'] {
  return {
    cx: CX + jitter(ph.heightFactor, 3),
    cy: BASE_Y - 6,
    rx: 5 + ph.fruitSize * 3,
    ry: 4 + ph.fruitSize * 2,
    rotation: -20 + jitter(ph.leafSize, 15),
  };
}

function sproutStem(ph: Phenotype): StemGeometry {
  const h = 22 + ph.growthRate * 10;
  return {
    base:    { x: CX, y: BASE_Y },
    apex:    { x: CX, y: BASE_Y - h },
    control: { x: CX, y: BASE_Y - h * 0.5 },
    width:   1.5,
  };
}

function cotyledons(ph: Phenotype, widthRatio: number): LeafGeometry[] {
  const apexY = BASE_Y - 22 - ph.growthRate * 10;
  return [
    makeLeaf({ x: CX, y: apexY + 4 }, -120, 0.72, ph.leafSize, 1, widthRatio),
    makeLeaf({ x: CX, y: apexY + 4 },  -60, 0.72, ph.leafSize, 1, widthRatio),
  ];
}

// ─── TOMATO geometry ──────────────────────────

function buildTomatoGeometry(
  ph: Phenotype, stage: GrowthStage,
  species: SpeciesDefinition, healthValue: number,
): PlantGeometry {
  const palette = computeColorPalette(ph, species, healthValue);
  const opacity = stageOpacity(stage);

  if (stage === 'seed') return { viewBoxW:VB_W, viewBoxH:VB_H, cx:CX, baseY:BASE_Y, stage, opacity, seedEllipse:seedGeom(ph), branches:[], leaves:[], flowers:[], fruits:[], palette };
  if (stage === 'sprout') {
    const stem = sproutStem(ph);
    return { viewBoxW:VB_W, viewBoxH:VB_H, cx:CX, baseY:BASE_Y, stage, opacity, stem, cotyledons:cotyledons(ph, 0.55), branches:[], leaves:[], flowers:[], fruits:[], palette };
  }

  const stemH  = 45 + ph.heightFactor * 70;
  const apexY  = BASE_Y - stemH;
  const lean   = jitter(ph.stemThickness * 3.7, 5);
  const apexX  = CX + lean;
  const ctrlX  = CX + jitter(ph.growthRate * 2.1, 4);
  const ctrlY  = BASE_Y - stemH * 0.52;

  const stem: StemGeometry = { base:{x:CX,y:BASE_Y}, apex:{x:apexX,y:apexY}, control:{x:ctrlX,y:ctrlY}, width:1.8+ph.stemThickness*2.4 };

  const nodeCount  = 1 + Math.round(ph.branchDensity * 3);
  const branchAng  = 40 + ph.branchDensity * 28;
  const branchLen  = stemH * (0.14 + ph.leafCount * 0.12);
  const branches: BranchGeometry[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const t = 0.20 + (i / Math.max(nodeCount-1,1)) * 0.58;
    const node = stemPoint({x:CX,y:BASE_Y},{x:apexX,y:apexY},{x:ctrlX,y:ctrlY},t);
    for (const side of ['left','right'] as const) {
      const s = side==='left'?-1:1;
      const end = { x:node.x+s*branchLen*cos(branchAng), y:node.y-branchLen*sin(branchAng) };
      const mid = lerp(node,end,0.5);
      branches.push({ node, end, ctrl:{x:mid.x+s*branchLen*0.08,y:mid.y-branchLen*0.05},
        width:stem.width*0.55, side, leafAngle:side==='right'?-branchAng:-(180-branchAng) });
    }
  }

  const leaves: LeafGeometry[] = [];
  const lpb = 1 + Math.round(ph.leafCount * 2);
  branches.forEach((br) => {
    for (let li=0;li<lpb;li++) {
      const spread=(li-(lpb-1)/2)*22;
      leaves.push(makeLeaf(lerp(br.node,br.end,0.75+li*0.08), br.leafAngle+spread, li===0?1:0.72, ph.leafSize, stage==='decaying'?0.6:1));
    }
  });
  leaves.push(makeLeaf({x:apexX,y:apexY},-115,0.85,ph.leafSize));
  leaves.push(makeLeaf({x:apexX,y:apexY}, -65,0.85,ph.leafSize));

  const flowers: FlowerGeometry[] = [];
  if (atLeast(stage,'flowering')) {
    const fc   = 1+Math.round(ph.flowerSize*3);
    const pr   = 3+ph.flowerSize*4;
    const sites: Vec2[] = [{x:apexX,y:apexY},...branches.slice(0,fc-1).map(b=>b.end)];
    sites.slice(0,fc).forEach(s=>flowers.push({center:{x:s.x,y:s.y-pr*0.5},petalR:pr,petalCount:5}));
  }

  const fruits: FruitGeometry[] = [];
  if (atLeast(stage,'mature')) {
    const fc = 2+Math.round(ph.fruitCount*5);
    const fr = 7+ph.fruitSize*11;
    const sites=[{x:apexX+jitter(ph.fruitSize*5,3),y:apexY+fr*0.8},...branches.map(br=>({x:br.end.x+jitter(br.node.y*0.03+br.side.length,4),y:br.end.y+fr*1.1}))];
    for (let i=0;i<fc;i++) {
      const site=sites[i%sites.length];
      fruits.push({center:{x:site.x+(i>=sites.length?jitter(i*1.414,fr*0.8):0),y:site.y},radius:fr*(0.85+jitter(i*0.7,0.15))});
    }
  }

  return { viewBoxW:VB_W, viewBoxH:VB_H, cx:CX, baseY:BASE_Y, stage, opacity, stem, branches, leaves, flowers, fruits, palette };
}

// ─── CHILI geometry ───────────────────────────
// Upright compact vine. Steeper branches, narrow
// leaves, elongated downward-pointing fruit.

function buildChiliGeometry(
  ph: Phenotype, stage: GrowthStage,
  species: SpeciesDefinition, healthValue: number,
): PlantGeometry {
  const palette = computeColorPalette(ph, species, healthValue);
  const opacity = stageOpacity(stage);

  if (stage === 'seed') return { viewBoxW:VB_W, viewBoxH:VB_H, cx:CX, baseY:BASE_Y, stage, opacity, seedEllipse:seedGeom(ph), branches:[], leaves:[], flowers:[], fruits:[], palette };
  if (stage === 'sprout') {
    const stem = sproutStem(ph);
    return { viewBoxW:VB_W, viewBoxH:VB_H, cx:CX, baseY:BASE_Y, stage, opacity, stem, cotyledons:cotyledons(ph,0.30), branches:[], leaves:[], flowers:[], fruits:[], palette };
  }

  // Chili: shorter, more upright
  const stemH = 35 + ph.heightFactor * 55;
  const apexY = BASE_Y - stemH;
  const apexX = CX + jitter(ph.stemThickness * 1.8, 3); // minimal lean
  const ctrlY = BASE_Y - stemH * 0.5;

  const stem: StemGeometry = { base:{x:CX,y:BASE_Y}, apex:{x:apexX,y:apexY}, control:{x:CX,y:ctrlY}, width:1.4+ph.stemThickness*1.8 };

  // Steeper branch angle → more upright
  const nodeCount = 1 + Math.round(ph.branchDensity * 3);
  const branchAng = 60 + ph.branchDensity * 20;   // 60–80° (more upright than tomato)
  const branchLen = stemH * (0.12 + ph.leafCount * 0.09);
  const branches: BranchGeometry[] = [];

  for (let i=0;i<nodeCount;i++) {
    const t = 0.22 + (i/Math.max(nodeCount-1,1)) * 0.60;
    const node = stemPoint({x:CX,y:BASE_Y},{x:apexX,y:apexY},{x:CX,y:ctrlY},t);
    for (const side of ['left','right'] as const) {
      const s=side==='left'?-1:1;
      const end={x:node.x+s*branchLen*cos(branchAng),y:node.y-branchLen*sin(branchAng)};
      const mid=lerp(node,end,0.5);
      branches.push({node,end,ctrl:{x:mid.x+s*branchLen*0.05,y:mid.y-branchLen*0.04},
        width:stem.width*0.52,side,leafAngle:side==='right'?-branchAng:-(180-branchAng)});
    }
  }

  // Narrow leaves (widthRatio 0.28)
  const leaves: LeafGeometry[] = [];
  branches.forEach((br) => {
    const lpb = 1 + Math.round(ph.leafCount * 1.5);
    for (let li=0;li<lpb;li++) {
      leaves.push(makeLeaf(lerp(br.node,br.end,0.70+li*0.10), br.leafAngle+(li-(lpb-1)/2)*18, li===0?1:0.70, ph.leafSize, 1, 0.28));
    }
  });
  leaves.push(makeLeaf({x:apexX,y:apexY},-108,0.80,ph.leafSize,1,0.28));
  leaves.push(makeLeaf({x:apexX,y:apexY}, -72,0.80,ph.leafSize,1,0.28));

  // Small white flowers
  const flowers: FlowerGeometry[] = [];
  if (atLeast(stage,'flowering')) {
    const fc=1+Math.round(ph.flowerSize*2);
    const sites: Vec2[]=[{x:apexX,y:apexY},...branches.slice(0,fc-1).map(b=>b.end)];
    sites.slice(0,fc).forEach(s=>flowers.push({center:{x:s.x,y:s.y-2},petalR:2+ph.flowerSize*2,petalCount:5}));
  }

  // Fruits stored as FruitGeometry but rendered as elongated peppers by ChiliPlant
  const fruits: FruitGeometry[] = [];
  if (atLeast(stage,'mature')) {
    const fc=2+Math.round(ph.fruitCount*4);
    const pepperLen=10+ph.fruitSize*12; // used as radius to encode pepper length
    for (let i=0;i<fc;i++) {
      const br=branches[i%branches.length];
      fruits.push({center:{x:br.end.x+jitter(i*1.3,4),y:br.end.y+pepperLen*0.6},radius:pepperLen});
    }
  }

  return { viewBoxW:VB_W, viewBoxH:VB_H, cx:CX, baseY:BASE_Y, stage, opacity, stem, branches, leaves, flowers, fruits, palette };
}

// ─── BASIL geometry ───────────────────────────
// Short bushy herb. Wide spreading branches,
// broad leaves, flower spike at apex.

function buildBasilGeometry(
  ph: Phenotype, stage: GrowthStage,
  species: SpeciesDefinition, healthValue: number,
): PlantGeometry {
  const palette = computeColorPalette(ph, species, healthValue);
  const opacity = stageOpacity(stage);

  if (stage === 'seed') return { viewBoxW:VB_W, viewBoxH:VB_H, cx:CX, baseY:BASE_Y, stage, opacity, seedEllipse:seedGeom(ph), branches:[], leaves:[], flowers:[], fruits:[], palette };
  if (stage === 'sprout') {
    const stem=sproutStem(ph);
    return { viewBoxW:VB_W, viewBoxH:VB_H, cx:CX, baseY:BASE_Y, stage, opacity, stem, cotyledons:cotyledons(ph,0.72), branches:[], leaves:[], flowers:[], fruits:[], palette };
  }

  // Very short stem — bushy, low-growing
  const stemH = 18 + ph.heightFactor * 30;
  const apexY = BASE_Y - stemH;

  const stem: StemGeometry = { base:{x:CX,y:BASE_Y}, apex:{x:CX,y:apexY}, control:{x:CX,y:BASE_Y-stemH*0.5}, width:1.2+ph.stemThickness*1.4 };

  // Wide-spreading branches at low angles
  const nodeCount = 1 + Math.round(ph.branchDensity * 3);
  const branchAng = 20 + ph.branchDensity * 18;   // 20–38° → nearly horizontal
  const branchLen = stemH * (0.22 + ph.leafCount * 0.16);
  const branches: BranchGeometry[] = [];

  for (let i=0;i<nodeCount;i++) {
    const t=0.15+(i/Math.max(nodeCount-1,1))*0.72;
    const node=stemPoint({x:CX,y:BASE_Y},{x:CX,y:apexY},{x:CX,y:BASE_Y-stemH*0.5},t);
    for (const side of ['left','right'] as const) {
      const s=side==='left'?-1:1;
      const end={x:node.x+s*branchLen*cos(branchAng),y:node.y-branchLen*sin(branchAng)};
      const mid=lerp(node,end,0.5);
      branches.push({node,end,ctrl:{x:mid.x+s*branchLen*0.1,y:mid.y+branchLen*0.02},
        width:stem.width*0.65,side,leafAngle:side==='right'?-branchAng:-(180-branchAng)});
    }
  }

  // Broad leaves (widthRatio 0.72), multiple per branch
  const leaves: LeafGeometry[] = [];
  branches.forEach((br)=>{
    const lpb=2+Math.round(ph.leafCount*1.5);
    for (let li=0;li<lpb;li++) {
      leaves.push(makeLeaf(lerp(br.node,br.end,0.55+li*0.18),br.leafAngle+(li-(lpb-1)/2)*25,li===0?1:0.78,ph.leafSize,1,0.72));
    }
  });
  // Large leaf pair at apex
  leaves.push(makeLeaf({x:CX,y:apexY},-110,0.92,ph.leafSize,1,0.72));
  leaves.push(makeLeaf({x:CX,y:apexY}, -70,0.92,ph.leafSize,1,0.72));

  // Flower spike at apex (represented as multiple tiny flowers stacked)
  const flowers: FlowerGeometry[] = [];
  if (atLeast(stage,'flowering')) {
    const spikeCount=3+Math.round(ph.flowerSize*3);
    for (let i=0;i<spikeCount;i++) {
      flowers.push({center:{x:CX+jitter(i*2.1,3),y:apexY-i*5-4},petalR:1.5+ph.flowerSize,petalCount:4});
    }
  }

  return { viewBoxW:VB_W, viewBoxH:VB_H, cx:CX, baseY:BASE_Y, stage, opacity, stem, branches, leaves, flowers, fruits:[], palette };
}

// ─── RADISH geometry ──────────────────────────
// Rosette herb with prominent underground root.
// Almost no visible stem — leaves radiate from base.
// Root ellipse rendered below soil line.

function buildRadishGeometry(
  ph: Phenotype, stage: GrowthStage,
  species: SpeciesDefinition, healthValue: number,
): PlantGeometry {
  const palette = computeColorPalette(ph, species, healthValue);
  const opacity = stageOpacity(stage);

  if (stage === 'seed') return { viewBoxW:VB_W, viewBoxH:VB_H, cx:CX, baseY:BASE_Y, stage, opacity, seedEllipse:seedGeom(ph), branches:[], leaves:[], flowers:[], fruits:[], palette };
  if (stage === 'sprout') {
    const stem=sproutStem(ph);
    return { viewBoxW:VB_W, viewBoxH:VB_H, cx:CX, baseY:BASE_Y, stage, opacity, stem, cotyledons:cotyledons(ph,0.50), branches:[], leaves:[], flowers:[], fruits:[], palette };
  }

  // Very short above-ground stem — radish grows mostly underground
  const stemH = 12 + ph.heightFactor * 18;
  const apexY = BASE_Y - stemH;

  const stem: StemGeometry = { base:{x:CX,y:BASE_Y}, apex:{x:CX,y:apexY}, control:{x:CX,y:BASE_Y-stemH*0.5}, width:1.0+ph.stemThickness*1.2 };

  // Leaves radiate directly from low nodes — near-horizontal spread
  const leafCount = 3 + Math.round(ph.leafCount * 5);  // 3–8 leaves
  const leaves: LeafGeometry[] = [];

  // Distribute leaves radially around the rosette
  for (let i=0;i<leafCount;i++) {
    // Angle in degrees, spread left and right
    const fraction = i/(leafCount-1);           // 0..1
    const spread   = -150 + fraction * 120;     // -150° to -30° (left to right, pointing outward)
    const nodeT    = 0.05 + fraction * 0.25;    // near base of stem
    const base     = stemPoint({x:CX,y:BASE_Y},{x:CX,y:apexY},{x:CX,y:BASE_Y-stemH*0.5}, nodeT);
    // Strap leaves, moderate aspect ratio
    leaves.push(makeLeaf({x:base.x+jitter(i*2.3,3),y:base.y}, spread, 0.9+jitter(i*1.7,0.15), ph.leafSize, 1, 0.38));
  }

  // Root: stored as a fruit with large radius — RadishPlant renders it specially
  // radius encodes root size; center is below BASE_Y
  const rootR = 10 + ph.fruitSize * 14;
  const fruits: FruitGeometry[] = [{ center:{x:CX+jitter(ph.fruitSize*3,3),y:BASE_Y+rootR*0.7}, radius:rootR }];

  // Bolting flowers at harvest_ready
  const flowers: FlowerGeometry[] = [];
  if (atLeast(stage,'harvest_ready')) {
    flowers.push({center:{x:CX,y:apexY-8},petalR:3,petalCount:4});
  }

  return { viewBoxW:VB_W, viewBoxH:VB_H, cx:CX, baseY:BASE_Y, stage, opacity, stem, branches:[], leaves, flowers, fruits, palette };
}

// ─── Public router ────────────────────────────

export function buildPlantGeometry(
  phenotype:   Phenotype,
  stage:       GrowthStage,
  species:     SpeciesDefinition,
  healthValue  = 1.0,
): PlantGeometry {
  switch (species.id) {
    case 'chili':  return buildChiliGeometry (phenotype, stage, species, healthValue);
    case 'basil':  return buildBasilGeometry (phenotype, stage, species, healthValue);
    case 'radish': return buildRadishGeometry(phenotype, stage, species, healthValue);
    default:       return buildTomatoGeometry(phenotype, stage, species, healthValue);
  }
}
