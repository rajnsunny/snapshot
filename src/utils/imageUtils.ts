// Import filter registry
import { filterRegistry } from './filters';


// Add html2canvas type declaration
declare global {
  interface Window {
    html2canvas: (
      element: HTMLElement, 
      options?: {
        allowTaint?: boolean;
        useCORS?: boolean;
        scale?: number;
        backgroundColor?: string | null;
        logging?: boolean;
        foreignObjectRendering?: boolean;
        removeContainer?: boolean;
        ignoreElements?: (element: Element) => boolean;
        onclone?: (doc: Document) => void;
      }
    ) => Promise<HTMLCanvasElement>;
  }
}

/**
 * Applies a filter to an image and returns a data URL
 * 
 * @param imageUrl - The URL or data URL of the image to filter
 * @param filter - The filter key to apply
 * @returns A Promise that resolves to a data URL of the filtered image
 */
export const applyFilterToImage = async (imageUrl: string, filter: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Get context and draw image
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      // Draw the original image first
      ctx.drawImage(img, 0, 0);
      
      // Apply filter based on filter key
      if (filterRegistry[filter]) {
        // Apply special filter using the registered processor
        filterRegistry[filter](ctx, img);
      } else {
        // Apply regular CSS filter
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = filter;
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
      }
      
      // Convert canvas to data URL
      const filteredImageUrl = canvas.toDataURL('image/jpeg', 0.95);
      resolve(filteredImageUrl);
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Creates a photo strip from multiple photos and returns a data URL
 * 
 * @param photos - Array of photo URLs or data URLs
 * @param filter - The filter key to apply
 * @returns A Promise that resolves to a data URL of the photo strip
 */
export const createPhotoStrip = async (photos: string[], filter: string): Promise<string> => {
  // Create a canvas to draw all photos
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  
  // Set canvas size
  const photoWidth = 300;
  const photoHeight = 225;
  const padding = 20;
  const headerHeight = 60;
  const footerHeight = 40;
  
  canvas.width = photoWidth + (padding * 2);
  canvas.height = (photoHeight * photos.length) + headerHeight + footerHeight + (padding * (photos.length + 1));
  
  // Fill background
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw header
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Your Photos', canvas.width / 2, padding + 30);
  
  // Load and draw each photo with filter
  for (let i = 0; i < photos.length; i++) {
    try {
      // Get filtered photo
      const filteredPhotoUrl = await applyFilterToImage(photos[i], filter);
      
      // Load the filtered image
      const img = new Image();
      img.src = filteredPhotoUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Continue even if image fails to load
      });
      
      // Draw photo with white background
      const y = headerHeight + (i * (photoHeight + padding)) + padding;
      
      // Draw white background
      ctx.fillStyle = 'white';
      ctx.fillRect(padding, y, photoWidth, photoHeight);
      
      // Draw the filtered photo
      ctx.drawImage(img, 0, 0, img.width, img.height, padding, y, photoWidth, photoHeight);
      
      // Draw border
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      ctx.strokeRect(padding, y, photoWidth, photoHeight);
    } catch (error) {
      console.error(`Error processing photo ${i}:`, error);
    }
  }
  
  // Draw footer with date and app signature
  const date = new Date();
  const dateString = date.toLocaleDateString();
  const timeString = date.toLocaleTimeString();
  
  ctx.fillStyle = '#999';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${dateString} ${timeString}`, canvas.width / 2, canvas.height - padding);
  
  // Draw app signature
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.font = 'italic 12px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('Snapshot', canvas.width - padding, canvas.height - padding);
  
  // Convert canvas to data URL
  return canvas.toDataURL('image/jpeg', 0.95);
};

/**
 * Saves photos as a photo strip
 * 
 * @param photos - Array of photo URLs or data URLs
 * @param filter - The filter key to apply
 * @returns A Promise that resolves when the save operation is complete
 */
export const savePhotos = async (photos: string[], filter: string): Promise<void> => {
  if (photos.length === 0) return;
  
  try {
    // Get the image data URL
    const dataUrl = await createPhotoStrip(photos, filter);
    
    // Create a link element
    const link = document.createElement('a');
    link.download = `snapshot-photobooth-${new Date().getTime()}.jpg`;
    link.href = dataUrl;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Error saving photos:', error);
    
    // Fallback to saving just the first photo
    try {
      const link = document.createElement('a');
      link.download = `snapshot-photo-${new Date().getTime()}.jpg`;
      link.href = photos[0];
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert('Could not save the photo strip. Saved the first photo instead.');
    } catch (fallbackError) {
      console.error('Fallback save failed:', fallbackError);
      alert('Unable to save photos. Please try again later.');
    }
  }
};

/**
 * Shares photos using the Web Share API
 * 
 * @param photos - Array of photo URLs or data URLs
 * @returns A Promise that resolves when the share operation is complete
 */
export const sharePhotos = async (photos: string[]): Promise<void> => {
  if (photos.length === 0) return;
  
  try {
    // Check if Web Share API is supported
    if (!navigator.share) {
      alert("Sharing is not supported on your browser. Try saving the photos instead.");
      return;
    }
    
    // Try to share the first photo directly (most reliable method)
    try {
      // Create a blob from the first photo
      const response = await fetch(photos[0]);
      const blob = await response.blob();
      const file = new File([blob], 'snapshot-photo.jpg', { type: 'image/jpeg' });
      
      // Share the file
      await navigator.share({
        title: 'My Snapshot Photobooth Photo',
        text: 'Check out my photo from Snapshot Photobooth!',
        files: [file]
      });
      
      console.log('Shared successfully with direct photo');
    } catch (error) {
      console.error('Error sharing photo:', error);
      
      // Fallback to sharing URL
      try {
        await navigator.share({
          title: 'My Snapshot Photobooth',
          text: 'Check out my photos from Snapshot Photobooth!',
          url: window.location.href
        });
        console.log('Shared successfully with URL');
      } catch (urlError) {
        console.error('Error sharing URL:', urlError);
        alert('Unable to share. Try saving the photos instead.');
      }
    }
  } catch (error) {
    console.error('Error in share function:', error);
    alert('Sharing failed. Try saving the photos instead.');
  }
}; 