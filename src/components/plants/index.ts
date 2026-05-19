// ─────────────────────────────────────────────
// src/components/plants/index.ts
// Public API for the plants rendering module
// ─────────────────────────────────────────────

export { PlantRenderer }       from './PlantRenderer';
export { TomatoPlant }         from './TomatoPlant';
export { buildPlantGeometry }  from './geometryEngine';
export { computeColorPalette } from './colorMapper';

export type { PlantGeometry, PlantColorPalette, Vec2 } from './types';
