/**
 * Type definition for filter processing functions
 */
export type FilterProcessor = (
  ctx: CanvasRenderingContext2D, 
  img: HTMLImageElement | HTMLVideoElement
) => void; 