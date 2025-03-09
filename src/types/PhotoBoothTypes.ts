// Define available grid layout options
export type GridLayout = '1x1' | '1x2' | '1x3' | '2x1' | '2x2' | '2x3' | '3x1' | '3x2' | '3x3';

export interface PhotoBoothSettings {
  photoCount: number;
  intervalSeconds: number;
  countdownSeconds: number;
  showTimestamp: boolean;
  mirrorMode: boolean;
  gridLayout: GridLayout;
}

/**
 * Interface for filter definitions
 */
export interface FilterDefinition {
  cssFilter: string;
  isSpecial: boolean;
  displayName?: string;
}

/**
 * All available filters with their properties
 */
export const FILTERS: Record<string, FilterDefinition> = {
  none: {
    cssFilter: 'none',
    isSpecial: false,
    displayName: 'Normal'
  },
  grayscale: {
    cssFilter: 'grayscale(100%)',
    isSpecial: false,
    displayName: 'Grayscale'
  },
  sepia: {
    cssFilter: 'sepia(100%)',
    isSpecial: false,
    displayName: 'Sepia'
  },
  invert: {
    cssFilter: 'invert(100%)',
    isSpecial: false,
    displayName: 'Invert'
  },
  blur: {
    cssFilter: 'blur(3px)',
    isSpecial: false,
    displayName: 'Blur'
  },
  brightness: {
    cssFilter: 'brightness(150%)',
    isSpecial: false,
    displayName: 'Brightness'
  },
  contrast: {
    cssFilter: 'contrast(200%)',
    isSpecial: false,
    displayName: 'Contrast'
  },
  hueRotate: {
    cssFilter: 'hue-rotate(90deg)',
    isSpecial: false,
    displayName: 'Hue Rotate'
  },
  saturate: {
    cssFilter: 'saturate(200%)',
    isSpecial: false,
    displayName: 'Saturate'
  },
  vintage: {
    cssFilter: 'sepia(50%) contrast(120%) brightness(90%)',
    isSpecial: false,
    displayName: 'Vintage'
  },
  coldBlue: {
    cssFilter: 'saturate(150%) hue-rotate(180deg)',
    isSpecial: false,
    displayName: 'Cold Blue'
  },
  warmOrange: {
    cssFilter: 'sepia(30%) saturate(140%) hue-rotate(20deg)',
    isSpecial: false,
    displayName: 'Warm Orange'
  },
  nineties: {
    cssFilter: 'contrast(110%) brightness(110%) saturate(130%) sepia(30%)',
    isSpecial: false,
    displayName: '90\'s'
  },
  twoThousands: {
    cssFilter: 'contrast(90%) brightness(120%) saturate(85%) hue-rotate(-10deg)',
    isSpecial: false,
    displayName: '2000\'s'
  },
  noir: {
    cssFilter: 'grayscale(100%) contrast(150%) brightness(80%)',
    isSpecial: false,
    displayName: 'Noir'
  },
  fisheye: {
    cssFilter: 'none',
    isSpecial: true,
    displayName: 'Fisheye'
  },
  rainbow: {
    cssFilter: 'saturate(200%) hue-rotate(360deg)',
    isSpecial: false,
    displayName: 'Rainbow'
  },
  glitch: {
    cssFilter: 'none',
    isSpecial: true,
    displayName: 'Glitch'
  },
  crosshatch: {
    cssFilter: 'none',
    isSpecial: true,
    displayName: 'Crosshatch'
  }
};

/**
 * Check if a filter requires special processing
 */
export const isSpecialFilter = (filterKey: string): boolean => {
  return FILTERS[filterKey]?.isSpecial || false;
};

/**
 * Get the CSS filter string for a filter
 */
export const getFilterCss = (filterKey: string): string => {
  return FILTERS[filterKey]?.cssFilter || 'none';
};

/**
 * Get the display name for a filter
 */
export const getFilterDisplayName = (filterKey: string): string => {
  return FILTERS[filterKey]?.displayName || formatFilterName(filterKey);
};

/**
 * Get all special filters
 */
export const getSpecialFilters = (): string[] => {
  return Object.entries(FILTERS)
    .filter(([_, definition]) => definition.isSpecial)
    .map(([key, _]) => key);
};

/**
 * Get all normal (CSS-based) filters
 */
export const getNormalFilters = (): string[] => {
  return Object.entries(FILTERS)
    .filter(([_, definition]) => !definition.isSpecial)
    .map(([key, _]) => key);
};

/**
 * Format a filter key into a readable name
 */
export const formatFilterName = (filterKey: string): string => {
  return filterKey
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
};

// Helper function to get columns and rows from grid layout
export const getGridDimensions = (layout: GridLayout): { columns: number, rows: number } => {
  const [columns, rows] = layout.split('x').map(Number);
  return { columns, rows };
};

// Helper function to get maximum photos for a grid layout
export const getMaxPhotosForGrid = (layout: GridLayout): number => {
  const { columns, rows } = getGridDimensions(layout);
  return columns * rows;
};

// Helper function to get suitable grid layouts for a number of photos
export const getSuitableGridLayouts = (photoCount: number): GridLayout[] => {
  const allLayouts: GridLayout[] = ['1x1', '1x2', '1x3', '2x1', '2x2', '2x3', '3x1', '3x2', '3x3'];
  return allLayouts.filter(layout => getMaxPhotosForGrid(layout) >= photoCount);
};

// Helper function to get the best grid layout for a number of photos
export const getBestGridLayout = (photoCount: number): GridLayout => {
  if (photoCount <= 1) return '1x1';
  if (photoCount <= 2) return '1x2';
  if (photoCount <= 3) return '1x3';
  if (photoCount <= 4) return '2x2';
  if (photoCount <= 6) return '2x3';
  return '3x3';
}; 