import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import styled from 'styled-components';
import {filterRegistry} from '../utils/filters/index';

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
  const [canvasWidth, setCanvasWidth] = useState<number>(640); // Default width
  const [canvasHeight, setCanvasHeight] = useState<number>(480); // Default height
  const animationRef = useRef<number | null>(null);
  
  // Initialize canvas size when video is ready
  useEffect(() => {
    const updateCanvasSize = () => {
      if (webcamRef.current && webcamRef.current.video) {
        const video = webcamRef.current.video;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setCanvasWidth(video.videoWidth);
          setCanvasHeight(video.videoHeight);
          console.log(`Canvas size updated: ${video.videoWidth}x${video.videoHeight}`);
        } else {
          console.warn("Video dimensions not available yet");
          // Try again in a moment
          setTimeout(updateCanvasSize, 500);
        }
      }
    };
    
    if (webcamRef.current && webcamRef.current.video) {
      if (webcamRef.current.video.readyState >= 2) {
        updateCanvasSize();
      } else {
        webcamRef.current.video.onloadeddata = updateCanvasSize;
      }
    }
    
    return () => {
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.onloadeddata = null;
      }
    };
  }, [webcamRef]);
  
  // Apply special filter effects
  useEffect(() => {
    if (!specialFilter || !canvasRef.current || !webcamRef.current || !webcamRef.current.video) {
      return;
    }
    
    // Make sure canvas dimensions are valid
    if (canvasWidth <= 0 || canvasHeight <= 0) {
      console.warn("Invalid canvas dimensions, skipping filter application");
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Function to draw the current frame with the filter
    const drawFrame = () => {
      if (!webcamRef.current || !webcamRef.current.video || !ctx || !specialFilter) {
        return;
      }
      
      const video = webcamRef.current.video;
      
      // Make sure video is playing and has dimensions
      if (video.readyState < 2 || video.paused || video.ended) {
        animationRef.current = requestAnimationFrame(drawFrame);
        return;
      }
      
      try {
        // Apply the appropriate filter
        switch (specialFilter) {
          case 'fisheye':
            filterRegistry.fisheye(ctx,video);
            break;
          case 'glitch':
            filterRegistry.glitch(ctx, video);
            break;
          case 'crosshatch':
            filterRegistry.crosshatch(ctx, video);
            break;
          default:
            // Just draw the video frame
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      } catch (error) {
        console.error(`Error applying ${specialFilter} filter:`, error);
        // Just draw the video frame on error
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      
      // Request the next frame
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
        
        <AppSignature>Snapshot</AppSignature>
        
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