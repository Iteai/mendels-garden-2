// ─────────────────────────────────────────────
// src/components/plants/index.ts
// Public API for the plant rendering module
// ─────────────────────────────────────────────

export { PlantRenderer }       from './PlantRenderer';
export { TomatoPlant }         from './TomatoPlant';
export { ChiliPlant }          from './ChiliPlant';
export { BasilPlant }          from './BasilPlant';
export { RadishPlant }         from './RadishPlant';
export { buildPlantGeometry }  from './geometryEngine';
export { computeColorPalette } from './colorMapper';
export type { PlantGeometry, PlantColorPalette, Vec2 } from './types';
