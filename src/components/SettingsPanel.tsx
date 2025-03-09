import React, { useEffect } from 'react';
import styled from 'styled-components';
import { PhotoBoothSettings, GridLayout, getSuitableGridLayouts } from '../types/PhotoBoothTypes';

interface SettingsPanelProps {
  settings: PhotoBoothSettings;
  onUpdateSettings: (newSettings: Partial<PhotoBoothSettings>) => void;
}

const SettingsPanelContainer = styled.div`
  background-color: #333;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 640px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

const SettingsTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 15px;
  color: #FFD700;
  text-align: center;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const SettingItem = styled.div`
  margin-bottom: 15px;
`;

const SettingLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  color: #ccc;
  font-size: 14px;
`;

const SettingInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  background-color: #444;
  border: 1px solid #555;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
  }
  
  &::-webkit-inner-spin-button, 
  &::-webkit-outer-spin-button { 
    opacity: 1;
  }
`;

const SettingSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  background-color: #444;
  border: 1px solid #555;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
  }
`;

const ToggleSection = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #444;
  border-radius: 8px;
  padding: 10px 15px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #555;
  }
`;

const ToggleIcon = styled.div`
  width: 24px;
  height: 24px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFD700;
  font-size: 18px;
`;

const ToggleInfo = styled.div`
  flex: 1;
`;

const ToggleLabel = styled.label`
  display: block;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`;

const ToggleDescription = styled.div`
  font-size: 12px;
  color: #aaa;
  margin-top: 2px;
`;

const Checkbox = styled.input`
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: #FFD700;
`;

const GridLayoutSection = styled.div`
  margin-top: 20px;
`;

const GridLayoutTitle = styled.h4`
  color: #ccc;
  margin-bottom: 10px;
  font-size: 16px;
`;

const GridLayoutOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  
  @media (max-width: 500px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const GridLayoutOption = styled.div<{ $selected: boolean }>`
  background-color: ${props => props.$selected ? '#FFD700' : '#444'};
  color: ${props => props.$selected ? '#000' : '#fff'};
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  font-size: 12px;
  
  &:hover {
    background-color: ${props => props.$selected ? '#FFD700' : '#555'};
    transform: translateY(-2px);
  }
`;

const GridPreview = styled.div<{ columns: number; rows: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns}, 1fr);
  grid-template-rows: repeat(${props => props.rows}, 1fr);
  gap: 2px;
  width: 100%;
  aspect-ratio: ${props => props.columns / props.rows};
  margin-bottom: 5px;
`;

const GridCell = styled.div`
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
`;

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdateSettings }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      onUpdateSettings({ [name]: checked } as Partial<PhotoBoothSettings>);
    } else {
      if (type === 'number') {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0) {
          onUpdateSettings({ [name]: numValue } as Partial<PhotoBoothSettings>);
        }
      } else {
        onUpdateSettings({ [name]: value } as Partial<PhotoBoothSettings>);
      }
    }
  };
  
  const handleGridLayoutChange = (layout: GridLayout) => {
    onUpdateSettings({ gridLayout: layout });
  };
  
  // Get suitable grid layouts based on photo count
  const suitableLayouts = getSuitableGridLayouts(settings.photoCount);
  
  // Ensure the current layout is suitable for the photo count
  useEffect(() => {
    if (!suitableLayouts.includes(settings.gridLayout)) {
      onUpdateSettings({ gridLayout: suitableLayouts[0] });
    }
  }, [settings.photoCount, settings.gridLayout, suitableLayouts, onUpdateSettings]);
  
  return (
    <SettingsPanelContainer>
      <SettingsTitle>Photo Booth Settings</SettingsTitle>
      
      <SettingsGrid>
        <SettingItem>
          <SettingLabel htmlFor="photoCount">Number of Photos</SettingLabel>
          <SettingInput 
            type="number" 
            id="photoCount" 
            name="photoCount" 
            min="1" 
            max="9" 
            value={settings.photoCount} 
            onChange={handleChange}
          />
        </SettingItem>
        
        <SettingItem>
          <SettingLabel htmlFor="countdownSeconds">Countdown (seconds)</SettingLabel>
          <SettingInput 
            type="number" 
            id="countdownSeconds" 
            name="countdownSeconds" 
            min="1" 
            max="10" 
            value={settings.countdownSeconds} 
            onChange={handleChange}
          />
        </SettingItem>
        
        <SettingItem>
          <SettingLabel htmlFor="intervalSeconds">Interval Between Photos (seconds)</SettingLabel>
          <SettingInput 
            type="number" 
            id="intervalSeconds" 
            name="intervalSeconds" 
            min="1" 
            max="10" 
            value={settings.intervalSeconds} 
            onChange={handleChange}
          />
        </SettingItem>
      </SettingsGrid>
      
      <GridLayoutSection>
        <GridLayoutTitle>Photo Grid Layout</GridLayoutTitle>
        <GridLayoutOptions>
          {suitableLayouts.map(layout => {
            const [columns, rows] = layout.split('x').map(Number);
            const isSelected = layout === settings.gridLayout;
            
            return (
              <GridLayoutOption 
                key={layout} 
                $selected={isSelected}
                onClick={() => handleGridLayoutChange(layout)}
              >
                <GridPreview columns={columns} rows={rows}>
                  {Array.from({ length: columns * rows }).map((_, i) => (
                    <GridCell key={i} />
                  ))}
                </GridPreview>
                {layout}
              </GridLayoutOption>
            );
          })}
        </GridLayoutOptions>
      </GridLayoutSection>
      
      <ToggleSection>
        <ToggleContainer>
          <ToggleIcon>🕒</ToggleIcon>
          <ToggleInfo>
            <ToggleLabel htmlFor="showTimestamp">Timestamp</ToggleLabel>
            <ToggleDescription>Show date and time on photos</ToggleDescription>
          </ToggleInfo>
          <Checkbox 
            type="checkbox" 
            id="showTimestamp" 
            name="showTimestamp" 
            checked={settings.showTimestamp} 
            onChange={handleChange}
          />
        </ToggleContainer>
        
        <ToggleContainer>
          <ToggleIcon>🪞</ToggleIcon>
          <ToggleInfo>
            <ToggleLabel htmlFor="mirrorMode">Mirror Mode</ToggleLabel>
            <ToggleDescription>Flip camera horizontally</ToggleDescription>
          </ToggleInfo>
          <Checkbox 
            type="checkbox" 
            id="mirrorMode" 
            name="mirrorMode" 
            checked={settings.mirrorMode} 
            onChange={handleChange}
          />
        </ToggleContainer>
      </ToggleSection>
    </SettingsPanelContainer>
  );
}; 