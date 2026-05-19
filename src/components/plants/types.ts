// ─────────────────────────────────────────────
// src/components/plants/types.ts
// Geometry and color primitives for SVG rendering
// Phase: Visual Overhaul — extended palette with gradient stops
// ─────────────────────────────────────────────

export type Vec2 = { x: number; y: number };

// ─── Color Palette ────────────────────────────
// Each channel now exposes 3 lightness stops for gradient rendering

export type PlantColorPalette = {
  // Stem
  stem:        string;  // mid
  stemDark:    string;  // shadow edge
  stemLight:   string;  // highlight edge

  // Leaf
  leaf:        string;  // mid-blade
  leafDark:    string;  // margin / shadow
  leafLight:   string;  // central highlight
  leafVein:    string;  // midrib + secondary veins
  leafBack:    string;  // underside / abaxial surface

  // Flower
  flower:         string; // petal base colour
  flowerLight:    string; // petal tip highlight
  flowerDark:     string; // petal base / throat
  flowerCenter:   string; // stamen / pistil
  flowerCenterLight: string; // anther highlight

  // Fruit
  fruit:           string; // main body
  fruitDark:       string; // shadow side + shadow circle
  fruitLight:      string; // lit side
  fruitHighlight:  string; // specular dot
  fruitStem:       string; // peduncle

  // Seed
  seed:      string;
  seedLight: string;

  // Environment
  soilTop:  string;
  soilMid:  string;
};

// ─── Geometry Primitives ──────────────────────

export type StemGeometry = {
  base:    Vec2;
  apex:    Vec2;
  control: Vec2;   // single quadratic bezier control point
  width:   number; // stroke width in SVG units
};

export type BranchGeometry = {
  node:    Vec2;   // attachment point on main stem
  end:     Vec2;   // branch tip
  control: Vec2;   // bezier control point
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
  /** 0–1 asymmetry factor — upper lobe slightly wider than lower */
  asymmetry?: number;
};

export type FlowerGeometry = {
  center:     Vec2;
  petalR:     number;   // petal radius
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
  cx:       number;
  baseY:    number;

  stage:    string;
  opacity:  number;

  seedEllipse?: { cx: number; cy: number; rx: number; ry: number; rotation: number };
  cotyledons?: LeafGeometry[];

  stem?:     StemGeometry;
  branches:  BranchGeometry[];
  leaves:    LeafGeometry[];
  flowers:   FlowerGeometry[];
  fruits:    FruitGeometry[];

  palette: PlantColorPalette;
};
