import { FilterProcessor } from './types';
import { applyFisheyeEffect} from './fisheye';
import { applyGlitchEffect} from './glitch';
import { applyCrosshatchEffect} from './crosshatch';

// Export all filter types and implementations
export type { FilterProcessor } from './types';
export { applyFisheyeEffect } from './fisheye';
export {  applyGlitchEffect} from './glitch';
export { applyCrosshatchEffect } from './crosshatch';

// Filter registry - maps filter keys to their processing functions
export const filterRegistry: Record<string, FilterProcessor> = {
  fisheye: applyFisheyeEffect,
  glitch: applyGlitchEffect,
  crosshatch: applyCrosshatchEffect
}; 