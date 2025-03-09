import { FilterProcessor } from './types';

/**
 * Applies an enhanced digital glitch effect to an image
 * with more dramatic visual artifacts and RGB shifts
 */
export const applyGlitchEffect: FilterProcessor = (ctx, img) => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // Create a temporary canvas for effects
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  // Draw the original image first
  ctx.drawImage(img, 0, 0, width, height);
  tempCtx.drawImage(img, 0, 0, width, height);
  
  // Get the image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Number of glitch lines - more for dramatic effect
  const numGlitches = Math.floor(Math.random() * 15) + 10;
  
  // Apply enhanced glitch effect
  for (let i = 0; i < numGlitches; i++) {
    // Random position for glitch
    const y = Math.floor(Math.random() * height);
    const glitchLength = Math.floor(Math.random() * 150) + 50;
    const shiftAmount = Math.floor(Math.random() * 40) - 20; // Increased shift
    
    // Shift pixels horizontally with more dramatic effect
    for (let j = 0; j < glitchLength; j++) {
      const row = y + j;
      if (row >= height) break;
      
      // Random chance for scanline effect
      if (Math.random() > 0.7) {
        for (let x = 0; x < width; x++) {
          const i = (row * width + x) * 4;
          // Increase brightness for scanline effect
          data[i] = Math.min(255, data[i] * 1.5);
          data[i + 1] = Math.min(255, data[i + 1] * 1.5);
          data[i + 2] = Math.min(255, data[i + 2] * 1.5);
        }
        continue;
      }
      
      for (let x = 0; x < width; x++) {
        const newX = (x + shiftAmount + width) % width;
        const i = (row * width + x) * 4;
        const newI = (row * width + newX) * 4;
        
        // Shift RGB channels
        data[i] = data[newI];
        data[i + 1] = data[newI + 1];
        data[i + 2] = data[newI + 2];
      }
    }
    
    // Add random blocks of corruption
    if (Math.random() > 0.5) {
      const blockX = Math.floor(Math.random() * (width - 50));
      const blockY = Math.floor(Math.random() * (height - 50));
      const blockWidth = Math.floor(Math.random() * 100) + 20;
      const blockHeight = Math.floor(Math.random() * 50) + 10;
      
      // Corrupt the block with random data or shifted pixels
      if (Math.random() > 0.5) {
        // Random noise
        for (let y = blockY; y < blockY + blockHeight; y++) {
          for (let x = blockX; x < blockX + blockWidth; x++) {
            if (x < width && y < height) {
              const i = (y * width + x) * 4;
              // Random RGB values
              data[i] = Math.random() * 255;
              data[i + 1] = Math.random() * 255;
              data[i + 2] = Math.random() * 255;
            }
          }
        }
      } else {
        // Shift block
        const shiftX = Math.floor(Math.random() * 100) - 50;
        const shiftY = Math.floor(Math.random() * 100) - 50;
        
        for (let y = blockY; y < blockY + blockHeight; y++) {
          for (let x = blockX; x < blockX + blockWidth; x++) {
            if (x < width && y < height) {
              const newX = (x + shiftX + width) % width;
              const newY = (y + shiftY + height) % height;
              
              const i = (y * width + x) * 4;
              const newI = (newY * width + newX) * 4;
              
              if (newI < data.length - 4) {
                data[i] = data[newI];
                data[i + 1] = data[newI + 1];
                data[i + 2] = data[newI + 2];
              }
            }
          }
        }
      }
    }
    
    // Enhanced RGB channel shift - more dramatic
    const channelIndex = Math.floor(Math.random() * 3);
    const shiftY = Math.floor(Math.random() * 20) - 10; // Increased shift
    const shiftX = Math.floor(Math.random() * 20) - 10; // Added horizontal shift
    
    for (let y = 0; y < height; y++) {
      const newY = (y + shiftY + height) % height;
      for (let x = 0; x < width; x++) {
        const newX = (x + shiftX + width) % width;
        const i = (y * width + x) * 4;
        const newI = (newY * width + newX) * 4;
        
        if (newI < data.length - 4) {
          // Shift only one color channel
          data[i + channelIndex] = data[newI + channelIndex];
        }
      }
    }
  }
  
  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
  
  // Add VHS-like scan lines
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let y = 0; y < height; y += 2) {
    ctx.fillRect(0, y, width, 1);
  }
  
  // Add RGB chromatic aberration effect
  tempCtx.globalCompositeOperation = 'screen';
  
  // Red channel shift
  tempCtx.fillStyle = 'rgba(255, 0, 0, 0.1)';
  tempCtx.fillRect(2, 0, width, height);
  
  // Blue channel shift
  tempCtx.fillStyle = 'rgba(0, 0, 255, 0.1)';
  tempCtx.fillRect(-2, 0, width, height);
  
  // Apply the temp canvas back to main canvas
  ctx.globalAlpha = 0.7;
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.globalAlpha = 1.0;
  
  // Apply some contrast and saturation for final touch
  ctx.filter = 'contrast(130%) saturate(130%) brightness(110%)';
  ctx.drawImage(ctx.canvas, 0, 0);
  ctx.filter = 'none';
}; 