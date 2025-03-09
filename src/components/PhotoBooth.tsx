import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Webcam from 'react-webcam';
import styled from 'styled-components';
import { Camera } from './Camera';
import { CameraControls } from './CameraControls';
import { FilterSelector } from './FilterSelector';
import { PhotoStrip } from './PhotoStrip';
import { PreviewModal } from './PreviewModal';
import { PhotoBoothSettings, FILTERS, isSpecialFilter, getFilterCss, getBestGridLayout, getGridDimensions } from '../types/PhotoBoothTypes';
import { applyFilterToImage } from '../utils/imageUtils';

// Styled components
const PhotoBoothContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #1a1a1a;
  color: white;
  min-height: 100vh;
`;

// Flash effect overlay
const FlashOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  opacity: 0;
  pointer-events: none;
  z-index: 1000;
  transition: opacity 0.1s ease-out;
  
  &.flash {
    opacity: 1;
    animation: flash-animation 0.5s ease-out;
  }
  
  @keyframes flash-animation {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
`;

const HelpIconContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
`;

const HelpIcon = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #FFD700;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
`;

const Tooltip = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 40px;
  right: 0;
  width: 300px;
  background-color: #333;
  color: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  font-size: 14px;
  line-height: 1.5;
  z-index: 101;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transform: ${props => props.$visible ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: -10px;
    right: 10px;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid #333;
  }
`;

const TooltipTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 10px;
  color: #FFD700;
  font-size: 16px;
`;

const TooltipText = styled.p`
  margin: 0 0 10px 0;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Footer = styled.footer`
  width: 100%;
  padding: 15px 0;
  margin-top: 30px;
  text-align: center;
  color: #888;
  font-size: 14px;
  border-top: 1px solid #444;
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
`;

const SocialLink = styled.a`
  color: #FFD700;
  font-size: 24px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-3px);
    color: #FFC400;
  }
`;

const MadeByText = styled.p`
  margin-bottom: 10px;
  font-size: 14px;
`;

const ControlsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 20px;
`;

const ThemeToggleContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const ThemeButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background-color: ${props => props.$active ? '#FFD700' : '#444'};
  color: ${props => props.$active ? '#000' : '#fff'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 18px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
`;

// Update the Button styled component to use a data attribute instead of primary
const Button = styled.button<{ $primary?: boolean }>`
  padding: 12px 24px;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${props => props.$primary ? '#FFD700' : '#333'};
  color: ${props => props.$primary ? '#000' : '#fff'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
    background-color: ${props => props.$primary ? '#FFC400' : '#444'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const CameraErrorMessage = styled.div`
  background-color: #ff5252;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
  max-width: 640px;
  width: 100%;
`;

const CameraPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 20px;
  background-color: #1a1a1a;
  color: white;
  text-align: center;
`;

const CameraPlaceholderText = styled.p`
  margin: 0;
  font-size: 16px;
`;

export const PhotoBooth: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const photoStripRef = useRef<HTMLDivElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showPhotoCount, setShowPhotoCount] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('normal');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>('dark');
  const [showModal, setShowModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [webcamReady, setWebcamReady] = useState(false);
  const [settings, setSettings] = useState<PhotoBoothSettings>({
    photoCount: 3,
    intervalSeconds: 1,
    countdownSeconds: 3,
    showTimestamp: true,
    mirrorMode: true,
    gridLayout: '1x3', // Default to vertical strip for 3 photos
  });
  
  // Theme colors - wrapped in useMemo to prevent unnecessary re-renders
  const themes = useMemo(() => ({
    dark: {
      background: '#222',
      text: 'rgba(0, 0, 0, 0.5)',
      border: '#333',
      shadow: 'rgba(0, 0, 0, 0.2)'
    },
    light: {
      background: '#f5f5f5',
      text: 'rgba(0, 0, 0, 0.6)',
      border: '#e0e0e0',
      shadow: 'rgba(0, 0, 0, 0.1)'
    }
  }), []);
  
  // Check if current filter is special
  const currentFilterIsSpecial = isSpecialFilter(currentFilter);

  // Handle webcam ready state
  const handleUserMedia = useCallback(() => {
    console.log("Camera initialized successfully");
    setIsCameraReady(true);
    setCameraError(null);
  }, []);

  // Function to trigger flash effect
  const triggerSnapshotEffect = useCallback(() => {
    // Trigger flash effect
    if (flashRef.current) {
      flashRef.current.classList.add('flash');
      setTimeout(() => {
        if (flashRef.current) {
          flashRef.current.classList.remove('flash');
        }
      }, 500);
    }
  }, []);

  // Function to capture a photo
  const capturePhoto = useCallback(async () => {
    if (webcamRef.current) {
      try {
        // Trigger snapshot effect
        triggerSnapshotEffect();
        
        // Short delay to allow flash effect to be visible
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the webcam video element
        const video = webcamRef.current.video;
        if (!video) {
          console.error("Video element not available");
          setCameraError("Video element not available. Please refresh the page.");
          return null;
        }
        
        // Create a canvas with 4:3 aspect ratio
        const canvas = document.createElement('canvas');
        const videoAspectRatio = video.videoWidth / video.videoHeight;
        
        // Set canvas size to maintain 4:3 aspect ratio
        const targetAspectRatio = 4/3;
        let canvasWidth, canvasHeight;
        
        if (videoAspectRatio > targetAspectRatio) {
          // Video is wider than 4:3, crop the sides
          canvasHeight = video.videoHeight;
          canvasWidth = video.videoHeight * targetAspectRatio;
        } else {
          // Video is taller than 4:3, crop the top/bottom
          canvasWidth = video.videoWidth;
          canvasHeight = video.videoWidth / targetAspectRatio;
        }
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Get the canvas context
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error("Could not get canvas context");
          setCameraError("Could not process image. Please try again.");
          return null;
        }
        
        // Calculate the cropping position to center the image
        const sourceX = (video.videoWidth - canvasWidth) / 2;
        const sourceY = (video.videoHeight - canvasHeight) / 2;
        
        // Draw the video frame onto the canvas, cropping to 4:3
        ctx.drawImage(
          video,
          sourceX, sourceY, canvasWidth, canvasHeight, // Source rectangle (cropped)
          0, 0, canvasWidth, canvasHeight // Destination rectangle
        );
        
        // Convert canvas to data URL
        const imageSrc = canvas.toDataURL('image/jpeg', 0.95);
        
        if (imageSrc) {
          console.log("Photo captured successfully");
          
          // If using a special filter, apply it immediately
          if (currentFilterIsSpecial) {
            try {
              const filteredImage = await applyFilterToImage(imageSrc, currentFilter);
              console.log(`Applied ${currentFilter} filter during capture`);
              return filteredImage;
            } catch (error) {
              console.error(`Error applying ${currentFilter} filter:`, error);
              return imageSrc; // Fallback to original image
            }
          }
          
          return imageSrc;
        } else {
          console.error("Failed to capture photo: No image data");
          setCameraError("Failed to capture photo. Please try again.");
        }
      } catch (error) {
        console.error("Error capturing photo:", error);
        setCameraError("Error capturing photo. Please check your camera.");
      }
    } else {
      console.error("Webcam reference not available");
      setCameraError("Camera not initialized. Please refresh the page.");
    }
    return null;
  }, [webcamRef, currentFilter, currentFilterIsSpecial, triggerSnapshotEffect, setCameraError]);

  // Function to start the photo capture sequence
  const startCapture = useCallback(async () => {
    if (!isCameraReady) {
      console.error("Camera not ready");
      setCameraError("Camera not ready. Please wait for initialization.");
      return;
    }
    
    setIsCapturing(true);
    setPhotos([]);
    setCurrentPhotoIndex(0);
    
    // Take photos
    const newPhotos: string[] = [];
    for (let i = 0; i < settings.photoCount; i++) {
      console.log(`Preparing for photo ${i + 1} of ${settings.photoCount}`);
      
      // Show photo count overlay
      setCurrentPhotoIndex(i);
      setShowPhotoCount(true);
      
      // Countdown for each photo
      console.log(`Starting countdown for photo ${i + 1}`);
      for (let j = settings.countdownSeconds; j >= 0; j--) {
        setCountdown(j);
        if (j > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Reset countdown display
      setCountdown(null);
      
      // Take photo
      console.log(`Taking photo ${i + 1} of ${settings.photoCount}`);
      const photo = await capturePhoto();
      if (photo) {
        newPhotos.push(photo);
        setPhotos([...newPhotos]);
        
        // Hide the overlay after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setShowPhotoCount(false);
        
        // Wait for interval unless it's the last photo
        if (i < settings.photoCount - 1) {
          console.log(`Waiting ${settings.intervalSeconds} seconds for next photo...`);
          await new Promise(resolve => setTimeout(resolve, settings.intervalSeconds * 1000));
        }
      } else {
        console.error("Failed to capture photo");
        setShowPhotoCount(false);
        i--; // Retry this photo
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Finished capturing
    console.log("Photo sequence complete");
    setIsCapturing(false);
    setIsCameraActive(false);
    setIsCameraReady(false);
    
    // Show modal
    setShowModal(true);
  }, [settings.countdownSeconds, settings.photoCount, settings.intervalSeconds, capturePhoto, isCameraReady]);

  // Function to save photos
  const savePhotos = useCallback(async () => {
    if (photos.length === 0) return;
    
    try {
      // Create a canvas to draw all photos
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      // Get grid dimensions
      const { columns, rows } = getGridDimensions(settings.gridLayout);
      const maxPhotos = columns * rows;
      const photosToUse = photos.slice(0, maxPhotos);
      
      // Set canvas size
      const photoWidth = 300;
      const photoHeight = 225;
      const padding = 20;
      const headerHeight = headerText ? 60 : 0; // Only add header height if text is provided
      const footerHeight = 40;
      
      // Calculate canvas dimensions based on grid layout
      const totalWidth = (photoWidth * columns) + (padding * (columns + 1));
      const totalHeight = (photoHeight * rows) + headerHeight + footerHeight + (padding * (rows + 1));
      
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      
      // Fill background with theme color
      ctx.fillStyle = themes[currentTheme].background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw header if text is provided
      if (headerText) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(headerText, canvas.width / 2, padding + 30);
      }
      
      // Load and draw each photo with filter
      for (let i = 0; i < photosToUse.length; i++) {
        // Create a temporary canvas to apply filter
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) continue;
        
        // Load the image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = photosToUse[i];
        
        // Wait for image to load
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if image fails to load
        });
        
        // Set temp canvas size
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        
        // Draw the original image to temp canvas
        tempCtx.drawImage(img, 0, 0);
        
        // Apply filter if it's a special filter
        if (currentFilterIsSpecial) {
          try {
            const filteredImageUrl = await applyFilterToImage(photosToUse[i], currentFilter);
            const filteredImg = new Image();
            filteredImg.src = filteredImageUrl;
            await new Promise<void>((resolve) => {
              filteredImg.onload = () => resolve();
              filteredImg.onerror = () => resolve();
            });
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(filteredImg, 0, 0);
          } catch (error) {
            console.error(`Error applying ${currentFilter} filter:`, error);
            // Continue with original image if filter fails
          }
        } else {
          // Apply CSS filter
          tempCtx.filter = getFilterCss(currentFilter);
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.drawImage(img, 0, 0);
          tempCtx.filter = 'none';
        }
        
        // Calculate position in grid
        const row = Math.floor(i / columns);
        const col = i % columns;
        const x = padding + (col * (photoWidth + padding));
        const y = headerHeight + padding + (row * (photoHeight + padding));
        
        // Draw white background with rounded corners
        ctx.fillStyle = 'white';
        const cornerRadius = 10;
        
        // Draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + photoWidth - cornerRadius, y);
        ctx.quadraticCurveTo(x + photoWidth, y, x + photoWidth, y + cornerRadius);
        ctx.lineTo(x + photoWidth, y + photoHeight - cornerRadius);
        ctx.quadraticCurveTo(x + photoWidth, y + photoHeight, x + photoWidth - cornerRadius, y + photoHeight);
        ctx.lineTo(x + cornerRadius, y + photoHeight);
        ctx.quadraticCurveTo(x, y + photoHeight, x, y + photoHeight - cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        ctx.closePath();
        ctx.fill();
        
        // Create a clipping path for the photo with rounded corners
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + photoWidth - cornerRadius, y);
        ctx.quadraticCurveTo(x + photoWidth, y, x + photoWidth, y + cornerRadius);
        ctx.lineTo(x + photoWidth, y + photoHeight - cornerRadius);
        ctx.quadraticCurveTo(x + photoWidth, y + photoHeight, x + photoWidth - cornerRadius, y + photoHeight);
        ctx.lineTo(x + cornerRadius, y + photoHeight);
        ctx.quadraticCurveTo(x, y + photoHeight, x, y + photoHeight - cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        ctx.closePath();
        ctx.clip();
        
        // Draw the filtered photo
        ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, x, y, photoWidth, photoHeight);
        
        // Restore the context
        ctx.restore();
        
        // Draw border
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + photoWidth - cornerRadius, y);
        ctx.quadraticCurveTo(x + photoWidth, y, x + photoWidth, y + cornerRadius);
        ctx.lineTo(x + photoWidth, y + photoHeight - cornerRadius);
        ctx.quadraticCurveTo(x + photoWidth, y + photoHeight, x + photoWidth - cornerRadius, y + photoHeight);
        ctx.lineTo(x + cornerRadius, y + photoHeight);
        ctx.quadraticCurveTo(x, y + photoHeight, x, y + photoHeight - cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
        ctx.closePath();
        ctx.stroke();
      }
      
      // Get current date and time
      const date = new Date();
      const dateString = date.toLocaleDateString();
      const timeString = date.toLocaleTimeString();
      const formattedSignature = settings.showTimestamp 
        ? `Snapshot • ${dateString} ${timeString}`
        : 'Snapshot';
      
      // Draw stylish signature
      ctx.fillStyle = currentTheme === 'dark' ? '#999' : '#666';
      ctx.font = 'italic 16px "Brush Script MT", cursive';
      ctx.textAlign = 'center';
      ctx.fillText(formattedSignature, canvas.width / 2, canvas.height - padding);
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
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
  }, [photos, currentFilter, currentFilterIsSpecial, headerText, currentTheme, themes, settings.showTimestamp, settings.gridLayout]);

  // Function to share photos
  const sharePhotos = useCallback(async () => {
    if (photos.length === 0) return;
    
    // Set sharing state to show loading indicator
    setIsSharing(true);
    
    try {
      // Check if Web Share API is supported
      if (!navigator.share) {
        alert("Sharing is not supported on your browser. Try saving the photos instead.");
        setIsSharing(false);
        return;
      }
      
      // Create a photo strip with all photos and the current filter
      try {
        // Get the photo strip element
        const photoStripElement = photoStripRef.current;
        if (!photoStripElement) {
          throw new Error("Photo strip element not found");
        }
        
        // Process photos with special filters if needed
        let photosToShare = [...photos];
        if (currentFilterIsSpecial) {
          try {
            // Apply the special filter to each photo
            photosToShare = await Promise.all(
              photos.map(photo => applyFilterToImage(photo, currentFilter))
            );
          } catch (filterError) {
            console.error('Error applying filters for sharing:', filterError);
            // Continue with original photos if filter application fails
          }
        }
        
        // Get grid dimensions
        const { columns, rows } = getGridDimensions(settings.gridLayout);
        const maxPhotos = columns * rows;
        const photosToUse = photosToShare.slice(0, maxPhotos);
        
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
        const headerHeight = headerText ? 60 : 0; // Only add header height if text is provided
        const footerHeight = 40;
        
        // Calculate canvas dimensions based on grid layout
        const totalWidth = (photoWidth * columns) + (padding * (columns + 1));
        const totalHeight = (photoHeight * rows) + headerHeight + footerHeight + (padding * (rows + 1));
        
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        
        // Fill background with theme color
        ctx.fillStyle = themes[currentTheme].background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw header if text is provided
        if (headerText) {
          ctx.fillStyle = '#FFD700';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(headerText, canvas.width / 2, padding + 30);
        }
        
        // Load and draw each photo with filter
        for (let i = 0; i < photosToUse.length; i++) {
          try {
            // Load the photo
            const img = new Image();
            img.src = photosToUse[i];
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Continue even if image fails to load
            });
            
            // Calculate position in grid
            const row = Math.floor(i / columns);
            const col = i % columns;
            const x = padding + (col * (photoWidth + padding));
            const y = headerHeight + padding + (row * (photoHeight + padding));
            
            // Draw white background with rounded corners
            ctx.fillStyle = 'white';
            const cornerRadius = 10;
            
            // Draw rounded rectangle
            ctx.beginPath();
            ctx.moveTo(x + cornerRadius, y);
            ctx.lineTo(x + photoWidth - cornerRadius, y);
            ctx.quadraticCurveTo(x + photoWidth, y, x + photoWidth, y + cornerRadius);
            ctx.lineTo(x + photoWidth, y + photoHeight - cornerRadius);
            ctx.quadraticCurveTo(x + photoWidth, y + photoHeight, x + photoWidth - cornerRadius, y + photoHeight);
            ctx.lineTo(x + cornerRadius, y + photoHeight);
            ctx.quadraticCurveTo(x, y + photoHeight, x, y + photoHeight - cornerRadius);
            ctx.lineTo(x, y + cornerRadius);
            ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
            ctx.closePath();
            ctx.fill();
            
            // Create a clipping path for the photo with rounded corners
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x + cornerRadius, y);
            ctx.lineTo(x + photoWidth - cornerRadius, y);
            ctx.quadraticCurveTo(x + photoWidth, y, x + photoWidth, y + cornerRadius);
            ctx.lineTo(x + photoWidth, y + photoHeight - cornerRadius);
            ctx.quadraticCurveTo(x + photoWidth, y + photoHeight, x + photoWidth - cornerRadius, y + photoHeight);
            ctx.lineTo(x + cornerRadius, y + photoHeight);
            ctx.quadraticCurveTo(x, y + photoHeight, x, y + photoHeight - cornerRadius);
            ctx.lineTo(x, y + cornerRadius);
            ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
            ctx.closePath();
            ctx.clip();
            
            // Draw the photo
            ctx.drawImage(img, 0, 0, img.width, img.height, x, y, photoWidth, photoHeight);
            
            // Apply CSS filter if not a special filter
            if (!currentFilterIsSpecial) {
              // This is a workaround since we can't directly apply CSS filters to canvas
              // We'll draw the image to a temporary canvas with the filter applied
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = photoWidth;
              tempCanvas.height = photoHeight;
              const tempCtx = tempCanvas.getContext('2d');
              if (tempCtx) {
                tempCtx.filter = getFilterCss(currentFilter);
                tempCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, photoWidth, photoHeight);
                tempCtx.filter = 'none';
                
                // Draw the filtered image back to the main canvas
                ctx.drawImage(tempCanvas, x, y);
              }
            }
            
            // Restore the context
            ctx.restore();
            
            // Draw border
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + cornerRadius, y);
            ctx.lineTo(x + photoWidth - cornerRadius, y);
            ctx.quadraticCurveTo(x + photoWidth, y, x + photoWidth, y + cornerRadius);
            ctx.lineTo(x + photoWidth, y + photoHeight - cornerRadius);
            ctx.quadraticCurveTo(x + photoWidth, y + photoHeight, x + photoWidth - cornerRadius, y + photoHeight);
            ctx.lineTo(x + cornerRadius, y + photoHeight);
            ctx.quadraticCurveTo(x, y + photoHeight, x, y + photoHeight - cornerRadius);
            ctx.lineTo(x, y + cornerRadius);
            ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
            ctx.closePath();
            ctx.stroke();
          } catch (error) {
            console.error(`Error processing photo ${i}:`, error);
          }
        }
        
        // Get current date and time
        const date = new Date();
        const dateString = date.toLocaleDateString();
        const timeString = date.toLocaleTimeString();
        const formattedSignature = settings.showTimestamp 
          ? `Snapshot • ${dateString} ${timeString}`
          : 'Snapshot';
        
        // Draw stylish signature
        ctx.fillStyle = currentTheme === 'dark' ? '#999' : '#666';
        ctx.font = 'italic 16px "Brush Script MT", cursive';
        ctx.textAlign = 'center';
        ctx.fillText(formattedSignature, canvas.width / 2, canvas.height - padding);
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob from canvas"));
          }, 'image/jpeg', 0.95);
        });
        
        // Create a file from the blob
        const file = new File([blob], 'snapshot-photobooth.jpg', { type: 'image/jpeg' });
        
        // Share the file
        await navigator.share({
          title: 'My Snapshot Photobooth Photos',
          text: 'Check out my photos from Snapshot Photobooth!',
          files: [file]
        });
        
        console.log('Shared successfully with photo strip');
      } catch (error) {
        console.error('Error creating photo strip for sharing:', error);
        
        // Fallback to sharing just the first photo
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
          
          console.log('Shared successfully with direct photo (fallback)');
        } catch (photoError) {
          console.error('Error sharing single photo:', photoError);
          
          // Final fallback to sharing URL
          try {
            await navigator.share({
              title: 'My Snapshot Photobooth',
              text: 'Check out my photos from Snapshot Photobooth!',
              url: window.location.href
            });
            console.log('Shared successfully with URL (fallback)');
          } catch (urlError) {
            console.error('Error sharing URL:', urlError);
            alert('Unable to share. Try saving the photos instead.');
          }
        }
      }
    } catch (error) {
      console.error('Error in share function:', error);
      alert('Sharing failed. Try saving the photos instead.');
    } finally {
      // Reset sharing state
      setIsSharing(false);
    }
  }, [photos, currentFilter, currentFilterIsSpecial, photoStripRef, headerText, currentTheme, themes, settings.showTimestamp, settings.gridLayout]);

  // Function to update settings
  const updateSettings = (newSettings: Partial<PhotoBoothSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // If photoCount changed, update the grid layout to a suitable one
      if (newSettings.photoCount && newSettings.photoCount !== prev.photoCount) {
        updated.gridLayout = getBestGridLayout(newSettings.photoCount);
      }
      
      return updated;
    });
  };

  // Function to open modal and close camera
  const openModal = useCallback(() => {
    setShowModal(true);
    setIsCameraActive(false);
    
    // Stop the webcam stream when modal opens
    if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.srcObject) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      tracks.forEach(track => {
        track.stop();
      });
      
      webcamRef.current.video.srcObject = null;
    }
  }, [webcamRef]);
  
  // Function to close modal and reopen camera
  const closeModal = useCallback(() => {
    setShowModal(false);
    setIsCameraActive(true);
    setCameraError(null);
    
    // Reset camera ready state with a delay
    setTimeout(() => {
      setIsCameraReady(true);
    }, 100);
  }, []);
  
  // Function to take new photos
  const takeNewPhotos = useCallback(() => {
    setShowModal(false);
    setIsCameraActive(true);
    setCameraError(null);
    setPhotos([]);
    setCurrentFilter('normal');
    setCurrentTheme('dark');
    setHeaderText('');
    
    // Reset camera ready state with a delay
    setTimeout(() => {
      setIsCameraReady(true);
    }, 100);
  }, []);

  // Function to toggle settings
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Function to update filter
  const updateFilter = (newFilter: string) => {
    console.log(`Changing filter to: ${newFilter}`);
    setCurrentFilter(newFilter);
  };

  // Function to handle theme changes
  const handleThemeChange = useCallback((theme: 'dark' | 'light') => {
    console.log(`Changing theme to: ${theme}`);
    setCurrentTheme(theme);
  }, []);

  // Toggle tooltip visibility
  const toggleTooltip = useCallback(() => {
    setShowTooltip(prev => !prev);
  }, []);
  
  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showTooltip && !target.closest('.help-icon-container')) {
        setShowTooltip(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  // Listen for visibility change events to stop/start camera
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Tab is hidden, stopping camera");
        if (!showModal) { // Only stop if modal is not showing (camera already stopped)
          setIsCameraActive(false);
          setIsCameraReady(false);
          // Stop camera stream
          if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.srcObject) {
            const stream = webcamRef.current.video.srcObject as MediaStream;
            const tracks = stream.getTracks();
            
            tracks.forEach(track => {
              track.stop();
            });
            
            webcamRef.current.video.srcObject = null;
          }
        }
      } else {
        console.log("Tab is visible, reactivating camera");
        if (!showModal) { // Only restart if modal is not showing
          setIsCameraActive(true);
          // Reset camera ready state with a delay
          setTimeout(() => {
            setIsCameraReady(true);
          }, 100);
        }
      }
    };
    
    // Add event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [showModal, webcamRef]);

  // Debug camera state
  useEffect(() => {
    console.log(`Camera state: active=${isCameraActive}, ready=${isCameraReady}`);
  }, [isCameraActive, isCameraReady]);

  return (
    <PhotoBoothContainer>
      <HelpIconContainer className="help-icon-container">
        <HelpIcon onClick={toggleTooltip}>?</HelpIcon>
        <Tooltip $visible={showTooltip}>
          <TooltipTitle>Welcome to Snapshot Photobooth!</TooltipTitle>
          <TooltipText>
            Have fun with our photobooth! All photos you take are stored locally on your device - 
            no one else can see them but you.
          </TooltipText>
          <TooltipText>
            You can apply fun filters, arrange your photos in different grid layouts, and customize 
            the look with light or dark themes.
          </TooltipText>
          <TooltipText>
            When you're done, save your photos to print them out or share them with friends. 
            Snap some cute pics and enjoy!
          </TooltipText>
        </Tooltip>
      </HelpIconContainer>
      
      {isCameraActive ? (
        <>
          <Camera
            webcamRef={webcamRef}
            filter={currentFilterIsSpecial ? 'none' : getFilterCss(currentFilter)}
            onUserMedia={handleUserMedia}
            isCapturing={isCapturing}
            countdown={countdown}
            currentPhotoIndex={currentPhotoIndex}
            showPhotoCount={showPhotoCount}
            totalPhotos={settings.photoCount}
            specialFilter={currentFilterIsSpecial ? currentFilter : undefined}
            mirrorMode={settings.mirrorMode}
          />
          
          {cameraError && (
            <CameraErrorMessage>
              {cameraError}
            </CameraErrorMessage>
          )}
          
          <CameraControls 
            onStartCapture={startCapture}
            isCapturing={isCapturing}
            webcamReady={isCameraReady}
            isSharing={isSharing}
            showSettings={showSettings}
            toggleSettings={toggleSettings}
            settings={settings}
            onUpdateSettings={updateSettings}
          />
          
          {!isCapturing && (
            <FilterSelector 
              currentFilter={currentFilter} 
              onSelectFilter={updateFilter} 
              filters={FILTERS}
              disabled={isCapturing}
            />
          )}
        </>
      ) : (
        <CameraPlaceholder>
          <CameraPlaceholderText>Camera paused while viewing photos</CameraPlaceholderText>
        </CameraPlaceholder>
      )}
      
      {/* Hidden PhotoStrip for capturing */}
      <div style={{ display: 'none' }}>
        <div id="photo-strip" ref={photoStripRef}>
          <PhotoStrip 
            photos={photos} 
            filter={currentFilter} 
            onThemeChange={handleThemeChange}
            initialTheme={currentTheme}
            showTimestamp={settings.showTimestamp}
            gridLayout={settings.gridLayout}
          />
        </div>
      </div>
      
      {/* Preview Modal */}
      {showModal && photos.length > 0 && (
        <PreviewModal 
          photos={photos}
          currentFilter={currentFilter}
          onClose={closeModal}
          onTakeNewPhotos={takeNewPhotos}
          onFilterChange={updateFilter}
          filters={FILTERS}
          onSavePhotos={savePhotos}
          onSharePhotos={sharePhotos}
          isSharing={isSharing}
          headerText={headerText}
          setHeaderText={setHeaderText}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
          showTimestamp={settings.showTimestamp}
          gridLayout={settings.gridLayout}
          onUpdateGridLayout={(layout) => updateSettings({ gridLayout: layout })}
        />
      )}
      
      {/* Flash overlay for snapshot effect */}
      <FlashOverlay ref={flashRef} />
      
      <Footer>
        <MadeByText>Made By: rajnsunny</MadeByText>
        <SocialLinks>
          <SocialLink 
            href="https://www.instagram.com/rajnsunny9/" 
            target="_blank" 
            rel="noopener noreferrer"
            title="Instagram"
          >
            📸
          </SocialLink>
          <SocialLink 
            href="https://www.linkedin.com/in/rajnsunny/" 
            target="_blank" 
            rel="noopener noreferrer"
            title="LinkedIn"
          >
            💼
          </SocialLink>
          <SocialLink 
            href="https://github.com/rajnsunny" 
            target="_blank" 
            rel="noopener noreferrer"
            title="GitHub"
          >
            💻
          </SocialLink>
        </SocialLinks>
      </Footer>
    </PhotoBoothContainer>
  );
}; 