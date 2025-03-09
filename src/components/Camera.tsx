import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import styled from 'styled-components';

interface CameraProps {
  webcamRef: React.RefObject<Webcam | null>;
  filter: string;
  onUserMedia: () => void;
  isCapturing: boolean;
  countdown: number | null;
  currentPhotoIndex: number;
  showPhotoCount: boolean;
  totalPhotos: number;
  specialFilter?: string;
  mirrorMode?: boolean;
}

const CameraContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 640px;
  margin-bottom: 20px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  
  /* Maintain 4:3 aspect ratio */
  &::before {
    content: "";
    display: block;
    padding-top: 75%; /* 3:4 aspect ratio (height/width = 0.75) */
  }
`;

const WebcamContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const StyledWebcam = styled(Webcam)<{ filter: string; $mirrored: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: ${props => props.filter};
  transform: ${props => props.$mirrored ? 'scaleX(-1)' : 'none'};
`;

// Canvas overlay for special filters
const FilterCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
`;

const AppSignature = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  z-index: 5;
`;

const CountdownOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 120px;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 10;
`;

const CountdownLabel = styled.div`
  font-size: 24px;
  margin-top: 20px;
  color: #FFD700;
`;

const DebugInfo = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 3px;
  z-index: 5;
`;

const PhotoCountOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 120px;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.9);
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10;
  animation: fadeInOut 1.5s;
  
  @keyframes fadeInOut {
    0% { opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; }
  }
`;

// Function to apply fisheye effect
const applyFisheyeEffect = (ctx: CanvasRenderingContext2D, img: HTMLVideoElement) => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  
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

// Function to apply glitch effect
const applyGlitchEffect = (ctx: CanvasRenderingContext2D, img: HTMLVideoElement) => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw the original image first
  ctx.drawImage(img, 0, 0, width, height);
  
  // Get the image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Number of glitch lines
  const numGlitches = Math.floor(Math.random() * 5) + 3;
  
  // Apply glitch effect
  for (let i = 0; i < numGlitches; i++) {
    // Random position for glitch
    const y = Math.floor(Math.random() * height);
    const glitchLength = Math.floor(Math.random() * 50) + 20;
    const shiftAmount = Math.floor(Math.random() * 20) - 10;
    
    // Shift pixels horizontally
    for (let j = 0; j < glitchLength; j++) {
      const row = y + j;
      if (row >= height) break;
      
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
  }
  
  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
};

// Function to apply crosshatch effect
const applyCrosshatchEffect = (ctx: CanvasRenderingContext2D, img: HTMLVideoElement) => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);
  
  // First apply grayscale
  ctx.filter = 'grayscale(100%) contrast(150%)';
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
  const baseSpacing = Math.max(8, Math.min(20, Math.floor(Math.min(width, height) / 40)));
  
  // Draw lines at different angles
  const angles = [0, 45, 90, 135];
  
  // Threshold values for different line densities
  const thresholds = [220, 180, 120, 60];
  
  // Draw the crosshatch pattern for each angle
  angles.forEach((angle) => {
    // Convert angle to radians
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    // Set line width
    tempCtx.lineWidth = 1;
    
    // Set spacing
    const spacing = baseSpacing;
    
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
  });
  
  // Get the crosshatch pattern
  const patternData = tempCtx.getImageData(0, 0, width, height);
  const patternPixels = patternData.data;
  
  // Apply the crosshatch based on brightness
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
    // Determine which threshold this pixel falls under
    let thresholdIndex = thresholds.findIndex(t => brightness < t);
    if (thresholdIndex === -1) thresholdIndex = thresholds.length;
    
    // If below threshold, use the pattern pixel, otherwise use white
    if (thresholdIndex < thresholds.length) {
      data[i] = Math.min(data[i], patternPixels[i]);
      data[i + 1] = Math.min(data[i + 1], patternPixels[i + 1]);
      data[i + 2] = Math.min(data[i + 2], patternPixels[i + 2]);
    } else {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }
  
  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
};

export const Camera: React.FC<CameraProps> = ({
  webcamRef,
  filter,
  onUserMedia,
  isCapturing,
  countdown,
  currentPhotoIndex,
  showPhotoCount,
  totalPhotos,
  specialFilter,
  mirrorMode = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [debug, setDebug] = useState<string>('');
  const [canvasWidth, setCanvasWidth] = useState<number>(0);
  const [canvasHeight, setCanvasHeight] = useState<number>(0);
  const animationRef = useRef<number | null>(null);
  
  // Set up canvas size when webcam is ready
  useEffect(() => {
    const updateCanvasSize = () => {
      if (webcamRef.current && webcamRef.current.video) {
        const video = webcamRef.current.video;
        setCanvasWidth(video.videoWidth);
        setCanvasHeight(video.videoHeight);
      }
    };
    
    // Update canvas size when webcam is ready
    if (webcamRef.current && webcamRef.current.video) {
      updateCanvasSize();
    }
    
    // Set up resize observer
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    
    if (webcamRef.current && webcamRef.current.video) {
      resizeObserver.observe(webcamRef.current.video);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [webcamRef]);
  
  // Apply special filter effect to canvas
  useEffect(() => {
    if (!specialFilter || !canvasRef.current || !webcamRef.current || !webcamRef.current.video) {
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = webcamRef.current.video;
    
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Function to draw the current frame with the filter
    const drawFrame = () => {
      if (!ctx || !video) return;
      
      // Apply the appropriate filter
      switch (specialFilter) {
        case 'fisheye':
          applyFisheyeEffect(ctx, video);
          break;
        case 'glitch':
          applyGlitchEffect(ctx, video);
          break;
        case 'crosshatch':
          applyCrosshatchEffect(ctx, video);
          break;
        default:
          // Just draw the video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      
      // Request next frame
      animationRef.current = requestAnimationFrame(drawFrame);
    };
    
    // Start the animation
    drawFrame();
    
    // Clean up
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [specialFilter, canvasWidth, canvasHeight, webcamRef]);
  
  return (
    <CameraContainer>
      <WebcamContainer>
        <StyledWebcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 1280,
            height: 720,
            facingMode: "user"
          }}
          onUserMedia={onUserMedia}
          filter={filter}
          $mirrored={mirrorMode}
        />
        
        {specialFilter && (
          <FilterCanvas 
            ref={canvasRef} 
            width={canvasWidth} 
            height={canvasHeight} 
          />
        )}
        
        <AppSignature>Snapshot Photobooth</AppSignature>
        
        {debug && <DebugInfo>{debug}</DebugInfo>}
      </WebcamContainer>
      
      {countdown !== null && (
        <CountdownOverlay>
          {countdown}
          <CountdownLabel>Get Ready!</CountdownLabel>
        </CountdownOverlay>
      )}
      
      {showPhotoCount && (
        <PhotoCountOverlay>
          {currentPhotoIndex + 1}/{totalPhotos}
        </PhotoCountOverlay>
      )}
    </CameraContainer>
  );
}; 