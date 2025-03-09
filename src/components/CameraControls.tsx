import React from 'react';
import styled from 'styled-components';
import { PhotoBoothSettings } from '../types/PhotoBoothTypes';
import { SettingsPanel } from './SettingsPanel';

interface CameraControlsProps {
  onStartCapture: () => void;
  isCapturing: boolean;
  webcamReady: boolean;
  isSharing: boolean;
  showSettings: boolean;
  toggleSettings: () => void;
  settings: PhotoBoothSettings;
  onUpdateSettings: (newSettings: Partial<PhotoBoothSettings>) => void;
}

const ControlsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  width: 100%;
`;

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

export const CameraControls: React.FC<CameraControlsProps> = ({
  onStartCapture,
  isCapturing,
  webcamReady,
  isSharing,
  showSettings,
  toggleSettings,
  settings,
  onUpdateSettings
}) => {
  return (
    <>
      <ControlsContainer>
        <Button 
          $primary 
          onClick={onStartCapture} 
          disabled={isCapturing || !webcamReady || isSharing}
        >
          {!webcamReady ? 'Camera Initializing...' : 'Take Photos'}
        </Button>
        
        <Button 
          onClick={toggleSettings}
          disabled={isCapturing || isSharing}
        >
          {showSettings ? 'Hide Settings' : 'Settings'}
        </Button>
      </ControlsContainer>
      
      {showSettings && (
        <SettingsPanel 
          settings={settings} 
          onUpdateSettings={onUpdateSettings} 
        />
      )}
    </>
  );
}; 