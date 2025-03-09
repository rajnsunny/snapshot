import { FilterProcessor } from './types';

/**
 * Applies a fisheye lens distortion effect to an image
 */
export const fisheyeFilter: FilterProcessor = (ctx, img) => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // Draw the original image first
  ctx.drawImage(img, 0, 0, width, height);
  
  // Get the image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const newImageData = ctx.createImageData(width, height);
  const newData = newImageData.data;
  
  // Parameters for fisheye effect
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2;
  const strength = 2.5; // Adjust for stronger/weaker effect
  
  // Apply fisheye distortion
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate normalized coordinates
      const nx = (x - centerX) / radius;
      const ny = (y - centerY) / radius;
      const r = Math.sqrt(nx * nx + ny * ny);
      
      // Skip pixels outside the circle
      if (r > 1) {
        // Just copy the original pixel
        const i = (y * width + x) * 4;
        newData[i] = data[i];
        newData[i + 1] = data[i + 1];
        newData[i + 2] = data[i + 2];
        newData[i + 3] = data[i + 3];
        continue;
      }
      
      // Apply fisheye formula
      const newR = Math.pow(r, strength);
      const newNx = nx / r * newR;
      const newNy = ny / r * newR;
      
      // Convert back to pixel coordinates
      const newX = Math.round(newNx * radius + centerX);
      const newY = Math.round(newNy * radius + centerY);
      
      // Ensure coordinates are within bounds
      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        const newI = (y * width + x) * 4;
        const origI = (newY * width + newX) * 4;
        
        // Copy the pixel
        newData[newI] = data[origI];
        newData[newI + 1] = data[origI + 1];
        newData[newI + 2] = data[origI + 2];
        newData[newI + 3] = data[origI + 3];
      }
    }
  }
  
  // Put the new image data back
  ctx.putImageData(newImageData, 0, 0);
}; 