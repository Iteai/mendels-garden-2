// ─────────────────────────────────────────────
// src/components/plants/types.ts
// Geometry and color primitives for SVG rendering
// ─────────────────────────────────────────────

export type Vec2 = { x: number; y: number };

// ─── Color Palette ────────────────────────────

export type PlantColorPalette = {
  stem:            string;
  stemDark:        string;
  leaf:            string;
  leafDark:        string;
  leafVein:        string;
  flower:          string;
  flowerCenter:    string;
  fruit:           string;
  fruitDark:       string;
  fruitHighlight:  string;
  fruitStem:       string;
  seed:            string;
};

// ─── Geometry Primitives ──────────────────────

export type StemGeometry = {
  base:    Vec2;
  apex:    Vec2;
  control: Vec2;   // single quadratic bezier control point
  width:   number; // stroke width in SVG units
};

export type BranchGeometry = {
  node:    Vec2;   // attachment point on main stem (0–1 along stem)
  end:     Vec2;   // branch tip
  control: Vec2;   // bezier control
  width:   number;
  side:    'left' | 'right';
  leafAngle: number; // SVG rotate() degrees for leaves at this branch
};

export type LeafGeometry = {
  base:     Vec2;
  rotation: number; // SVG rotate() degrees — 0 = tip points right
  length:   number;
  width:    number;
  opacity:  number;
};

export type FlowerGeometry = {
  center:     Vec2;
  petalR:     number;   // petal ellipse radius (major)
  petalCount: number;
};

export type FruitGeometry = {
  center: Vec2;
  radius: number;
};

// ─── Full Plant Geometry ──────────────────────

export type PlantGeometry = {
  viewBoxW: number;
  viewBoxH: number;
  cx:       number;  // horizontal centre
  baseY:    number;  // stem base Y

  stage:    string;
  opacity:  number;  // overall: 1 healthy, lower for decay/dead

  // Stage: 'seed' only
  seedEllipse?: { cx: number; cy: number; rx: number; ry: number; rotation: number };

  // Stage: 'sprout' only
  cotyledons?: LeafGeometry[];

  // Stage: vegetative+
  stem?:     StemGeometry;
  branches:  BranchGeometry[];
  leaves:    LeafGeometry[];

  // Stage: flowering+
  flowers: FlowerGeometry[];

  // Stage: mature+
  fruits: FruitGeometry[];

  palette: PlantColorPalette;
};
