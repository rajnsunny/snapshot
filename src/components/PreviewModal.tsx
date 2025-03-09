import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Modal, ModalActions, ModalSectionTitle } from './Modal';
import { PhotoStrip } from './PhotoStrip';
import { FilterOptions } from './FilterOptions';
import { FilterDefinition, isSpecialFilter, GridLayout, getSuitableGridLayouts, getGridDimensions } from '../types/PhotoBoothTypes';
import { applyFilterToImage } from '../utils/imageUtils';

interface PreviewModalProps {
  photos: string[];
  currentFilter: string;
  onClose: () => void;
  onTakeNewPhotos: () => void;
  onFilterChange: (filter: string) => void;
  filters: Record<string, FilterDefinition>;
  onSavePhotos: () => void;
  onSharePhotos: () => void;
  isSharing: boolean;
  headerText: string;
  setHeaderText: React.Dispatch<React.SetStateAction<string>>;
  currentTheme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  showTimestamp?: boolean;
  gridLayout?: GridLayout;
  onUpdateGridLayout?: (layout: GridLayout) => void;
}

const ModalPreview = styled.div`
  width: 100%;
  margin-bottom: 20px;
  background-color: #333;
  border-radius: 8px;
  padding: 15px;
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

const HeaderInput = styled.div`
  margin-bottom: 10px;
  width: 100%;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 10px 15px;
  border: 2px solid #444;
  border-radius: 8px;
  background-color: #333;
  color: white;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
  }
  
  &::placeholder {
    color: #888;
  }
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #ccc;
`;

const ControlsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  position: relative;
  width: 100%;
`;

const ThemeToggleContainer = styled.div`
  display: flex;
  gap: 8px;
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
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
`;

const LayoutSelector = styled.div`
  position: relative;
  margin-left: auto; /* Push to far right */
`;

const CurrentLayoutPreview = styled.button<{ columns: number; rows: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns}, 1fr);
  grid-template-rows: repeat(${props => props.rows}, 1fr);
  gap: 2px;
  width: 40px;
  height: 36px;
  background-color: #444;
  padding: 4px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    background-color: #555;
  }
`;

const CurrentLayoutCell = styled.div`
  background-color: #FFD700;
  border-radius: 1px;
`;

const LayoutPopup = styled.div<{ $visible: boolean }>`
  position: fixed;
  z-index: 2000;
  background-color: #333;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  width: 280px;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transform: ${props => props.$visible ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.3s ease;
`;

const LayoutPopupTitle = styled.h4`
  color: #ccc;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 14px;
`;

const LayoutPopupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`;

const LayoutPopupOption = styled.div<{ $selected: boolean }>`
  background-color: ${props => props.$selected ? '#FFD700' : '#444'};
  color: ${props => props.$selected ? '#000' : '#fff'};
  border-radius: 8px;
  padding: 8px;
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

export const PreviewModal: React.FC<PreviewModalProps> = ({
  photos,
  currentFilter,
  onClose,
  onTakeNewPhotos,
  onFilterChange,
  filters,
  onSavePhotos,
  onSharePhotos,
  isSharing,
  headerText,
  setHeaderText,
  currentTheme = 'dark',
  onThemeChange,
  showTimestamp = true,
  gridLayout = '1x3',
  onUpdateGridLayout
}) => {
  const [processedPhotos, setProcessedPhotos] = useState<string[]>(photos);
  const currentFilterIsSpecial = isSpecialFilter(currentFilter);
  const [localTheme, setLocalTheme] = useState<'dark' | 'light'>(currentTheme);
  const [showLayoutPopup, setShowLayoutPopup] = useState(false);
  const layoutPopupRef = useRef<HTMLDivElement>(null);
  const layoutButtonRef = useRef<HTMLButtonElement>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, right: 0 });
  
  // Get suitable grid layouts based on photo count
  const suitableLayouts = getSuitableGridLayouts(photos.length);
  
  // Get current grid dimensions
  const { columns, rows } = getGridDimensions(gridLayout);
  
  // Update local theme when prop changes
  useEffect(() => {
    setLocalTheme(currentTheme);
  }, [currentTheme]);
  
  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layoutPopupRef.current && !layoutPopupRef.current.contains(event.target as Node)) {
        setShowLayoutPopup(false);
      }
    };
    
    if (showLayoutPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLayoutPopup]);
  
  // Update popup position when button is clicked
  useEffect(() => {
    if (showLayoutPopup && layoutButtonRef.current) {
      const buttonRect = layoutButtonRef.current.getBoundingClientRect();
      setPopupPosition({
        top: buttonRect.bottom + 10,
        right: window.innerWidth - buttonRect.right
      });
    }
  }, [showLayoutPopup]);
  
  // Process photos with special filters
  useEffect(() => {
    if (currentFilterIsSpecial) {
      // For special filters, we need to process each photo
      const processPhotos = async () => {
        try {
          const processed = await Promise.all(
            photos.map(photo => applyFilterToImage(photo, currentFilter))
          );
          setProcessedPhotos(processed);
        } catch (error) {
          console.error('Error processing photos with special filter:', error);
          // Fallback to original photos if processing fails
          setProcessedPhotos(photos);
        }
      };
      
      processPhotos();
    } else {
      // For CSS filters, we can use the original photos
      setProcessedPhotos(photos);
    }
  }, [photos, currentFilter, currentFilterIsSpecial]);
  
  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeaderText(e.target.value);
  };
  
  const handleThemeChange = (theme: 'dark' | 'light') => {
    setLocalTheme(theme);
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };
  
  const handleGridLayoutChange = (layout: GridLayout) => {
    if (onUpdateGridLayout) {
      onUpdateGridLayout(layout);
      setShowLayoutPopup(false);
    }
  };
  
  const toggleLayoutPopup = () => {
    setShowLayoutPopup(prev => !prev);
  };
  
  return (
    <Modal title="Your Photos" onClose={onClose}>
      <HeaderInput>
        <InputLabel>Add a custom header text (optional):</InputLabel>
        <StyledInput 
          type="text" 
          value={headerText} 
          onChange={handleHeaderChange} 
          placeholder="Enter text for photo strip header"
          maxLength={30}
        />
      </HeaderInput>
      
      <ControlsRow>
        <ThemeToggleContainer>
          <ThemeButton 
            $active={localTheme === 'dark'} 
            onClick={() => handleThemeChange('dark')}
            title="Dark Theme"
          >
            🌑
          </ThemeButton>
          <ThemeButton 
            $active={localTheme === 'light'} 
            onClick={() => handleThemeChange('light')}
            title="Light Theme"
          >
            ☀️
          </ThemeButton>
        </ThemeToggleContainer>
        
        <LayoutSelector>
          <CurrentLayoutPreview 
            ref={layoutButtonRef}
            columns={columns} 
            rows={rows} 
            onClick={toggleLayoutPopup}
            title="Change Layout"
          >
            {Array.from({ length: columns * rows }).map((_, i) => (
              <CurrentLayoutCell key={i} />
            ))}
          </CurrentLayoutPreview>
          
          <LayoutPopup 
            $visible={showLayoutPopup} 
            ref={layoutPopupRef}
            style={{ 
              top: `${popupPosition.top}px`, 
              right: `${popupPosition.right}px` 
            }}
          >
            <LayoutPopupTitle>Choose a layout:</LayoutPopupTitle>
            <LayoutPopupGrid>
              {suitableLayouts.map(layout => {
                const [cols, rws] = layout.split('x').map(Number);
                const isSelected = layout === gridLayout;
                
                return (
                  <LayoutPopupOption 
                    key={layout} 
                    $selected={isSelected}
                    onClick={() => handleGridLayoutChange(layout)}
                  >
                    <GridPreview columns={cols} rows={rws}>
                      {Array.from({ length: cols * rws }).map((_, i) => (
                        <GridCell key={i} />
                      ))}
                    </GridPreview>
                    {layout}
                  </LayoutPopupOption>
                );
              })}
            </LayoutPopupGrid>
          </LayoutPopup>
        </LayoutSelector>
      </ControlsRow>
      
      <ModalPreview>
        <PhotoStrip 
          photos={processedPhotos} 
          filter={currentFilterIsSpecial ? 'none' : currentFilter} 
          onThemeChange={handleThemeChange}
          initialTheme={localTheme}
          showTimestamp={showTimestamp}
          gridLayout={gridLayout}
        />
      </ModalPreview>
      
      <ModalActions>
        <Button onClick={onClose}>Take New Photos</Button>
        <Button $primary onClick={onSavePhotos}>Save Photos</Button>
        {typeof navigator.share === 'function' && (
          <Button 
            onClick={onSharePhotos}
            disabled={isSharing}
          >
            {isSharing ? 'Sharing...' : 'Share Photos'}
          </Button>
        )}
      </ModalActions>
      
      <ModalSectionTitle>Change Filter</ModalSectionTitle>
      <FilterOptions 
        filters={filters}
        currentFilter={currentFilter}
        onSelectFilter={onFilterChange}
        previewImage={photos[0]}
      />
    </Modal>
  );
}; 