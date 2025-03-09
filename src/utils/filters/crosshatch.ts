import { FilterProcessor } from './types';

/**
 * Applies a crosshatch drawing effect to an image
 */
export const crosshatchFilter: FilterProcessor = (ctx, img) => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // First apply grayscale
  ctx.filter = 'grayscale(100%) contrast(150%)';
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  ctx.filter = 'none';
  
  // Get the grayscale image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Create a new canvas for the crosshatch
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return;
  
  // Clear the temp canvas
  tempCtx.fillStyle = 'white';
  tempCtx.fillRect(0, 0, width, height);
  
  // Set line properties
  tempCtx.strokeStyle = 'black';
  tempCtx.lineCap = 'round';
  
  // Calculate appropriate spacing based on image size
  const baseSpacing = Math.max(4, Math.min(12, Math.floor(Math.min(width, height) / 50)));
  
  // Draw lines at different angles with different densities
  const angles = [0, 45, 90, 135]; // 4 angles for richer crosshatching
  const spacings = [
    baseSpacing * 4, // Very sparse lines for highlights
    baseSpacing * 2, // Medium density for mid-tones
    baseSpacing,     // Dense lines for shadows
    baseSpacing / 2  // Very dense for deep shadows
  ];
  
  // Threshold values for different line densities
  const thresholds = [220, 180, 120, 60];
  
  // Draw the crosshatch pattern for each angle and density
  angles.forEach((angle, angleIndex) => {
    // Convert angle to radians
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    // For each threshold level
    thresholds.forEach((threshold, thresholdIndex) => {
      // Skip higher density patterns for higher angles to avoid over-darkening
      if (angleIndex > 0 && thresholdIndex === 3) return;
      
      // Set line width based on density
      tempCtx.lineWidth = 0.5 + (thresholdIndex * 0.25);
      
      // Set spacing for this density
      const spacing = spacings[thresholdIndex];
      
      // Start drawing lines
      tempCtx.beginPath();
      
      // Calculate line positions based on angle
      const length = Math.sqrt(width * width + height * height);
      const step = spacing;
      
      for (let i = -length; i < length; i += step) {
        // Calculate start and end points for the line
        let startX, startY, endX, endY;
        
        if (Math.abs(cos) > Math.abs(sin)) {
          // More horizontal line
          startX = i / cos;
          startY = 0;
          endX = (i - height * sin) / cos;
          endY = height;
        } else {
          // More vertical line
          startX = 0;
          startY = i / sin;
          endX = width;
          endY = (i - width * cos) / sin;
        }
        
        // Draw the line
        tempCtx.moveTo(startX, startY);
        tempCtx.lineTo(endX, endY);
      }
      
      tempCtx.stroke();
      
      // Apply this set of lines to the main canvas based on brightness threshold
      const linePattern = tempCtx.getImageData(0, 0, width, height);
      const lineData = linePattern.data;
      
      // Apply the lines to the main image based on brightness
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        
        // If pixel is darker than threshold, copy the line pattern
        if (brightness < threshold) {
          data[i] = Math.min(data[i], lineData[i]);
          data[i + 1] = Math.min(data[i + 1], lineData[i + 1]);
          data[i + 2] = Math.min(data[i + 2], lineData[i + 2]);
        }
      }
      
      // Clear the temp canvas for the next set of lines
      tempCtx.clearRect(0, 0, width, height);
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, width, height);
    });
  });
  
  // Add a subtle paper texture
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(245, 240, 230, 0.3)'; // Slight off-white for paper color
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
  
  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
  
  // Add a subtle vignette effect
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) / 1.5
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}; 