import { FilterProcessor } from './types';
import { fisheyeFilter } from './fisheye';
import { glitchFilter } from './glitch';
import { crosshatchFilter } from './crosshatch';

// Export all filter types and implementations
export type { FilterProcessor } from './types';
export { fisheyeFilter } from './fisheye';
export { glitchFilter } from './glitch';
export { crosshatchFilter } from './crosshatch';

// Filter registry - maps filter keys to their processing functions
export const filterRegistry: Record<string, FilterProcessor> = {
  fisheye: fisheyeFilter,
  glitch: glitchFilter,
  crosshatch: crosshatchFilter
}; 