import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { getFilterCss, isSpecialFilter, GridLayout, getGridDimensions } from '../types/PhotoBoothTypes';

interface PhotoStripProps {
  photos: string[];
  filter: string;
  onThemeChange?: (theme: 'dark' | 'light') => void;
  initialTheme?: 'dark' | 'light';
  showTimestamp?: boolean;
  gridLayout?: GridLayout;
}

interface ThemeColors {
  background: string;
  text: string;
  border: string;
  shadow: string;
}

const themes = {
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
};

const StripContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 640px;
  margin-top: 20px;
  padding: 20px;
  background-color: #222;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

const PhotosGrid = styled.div<{ theme: ThemeColors }>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 15px;
  background-color: ${props => props.theme.background};
  border-radius: 5px;
  box-shadow: 0 0 10px ${props => props.theme.shadow} inset;
  position: relative;
  transition: background-color 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 5px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 14px;
    color: ${props => props.theme.text};
    font-family: 'Brush Script MT', cursive;
    font-style: italic;
  }
`;

const GridContainer = styled.div<{ columns: number; rows: number; theme: ThemeColors }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns}, 1fr);
  grid-template-rows: repeat(${props => props.rows}, 1fr);
  gap: 10px;
  width: 100%;
  background-color: ${props => props.theme.background};
  border-radius: 5px;
  padding: 10px;
`;

const PhotoWrapper = styled.div`
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
`;

const Photo = styled.img<{ filter: string }>`
  width: 100%;
  height: 100%;
  display: block;
  filter: ${props => props.filter};
  object-fit: cover;
  border-radius: 10px;
`;

const DateStamp = styled.div<{ theme: ThemeColors }>`
  font-size: 14px;
  color: ${props => props.theme.text === 'rgba(0, 0, 0, 0.5)' ? '#999' : '#666'};
  text-align: center;
  margin-top: 10px;
  margin-bottom: 5px;
  font-family: 'Brush Script MT', cursive;
  font-style: italic;
  transition: color 0.3s ease;
`;

const ThemeToggleContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
  gap: 10px;
`;

const ThemeButton = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  background-color: ${props => props.$active ? '#FFD700' : '#333'};
  color: ${props => props.$active ? '#000' : '#fff'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
`;

export const PhotoStrip: React.FC<PhotoStripProps> = ({ 
  photos, 
  filter,
  onThemeChange,
  initialTheme = 'dark',
  showTimestamp = true,
  gridLayout = '1x3'
}) => {
  const photoRefs = useRef<(HTMLImageElement | null)[]>([]);
  const date = new Date();
  const dateString = date.toLocaleDateString();
  const timeString = date.toLocaleTimeString();
  const formattedDate = showTimestamp 
    ? `Snapshot • ${dateString} ${timeString}`
    : 'Snapshot';
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(initialTheme);
  
  // Get grid dimensions
  const { columns, rows } = getGridDimensions(gridLayout);
  
  // Check if current filter is special
  const currentFilterIsSpecial = isSpecialFilter(filter);
  
  // Get CSS filter value
  const cssFilter = getFilterCss(filter);
  
  // Ensure refs array is the right size
  useEffect(() => {
    photoRefs.current = photoRefs.current.slice(0, photos.length);
  }, [photos]);
  
  // Update theme when initialTheme prop changes
  useEffect(() => {
    if (initialTheme !== currentTheme) {
      setCurrentTheme(initialTheme);
    }
  }, [initialTheme, currentTheme]);
  
  // Apply filter directly to the image elements
  useEffect(() => {
    photoRefs.current.forEach(ref => {
      if (ref) {
        // Only apply CSS filter if it's not a special filter
        if (!currentFilterIsSpecial) {
          ref.style.filter = cssFilter;
        } else {
          ref.style.filter = 'none';
          // For special filters, we'll rely on the applyFilterToImage function
          // which is called when saving/sharing
        }
      }
    });
  }, [filter, photos, cssFilter, currentFilterIsSpecial]);
  
  const toggleTheme = (theme: 'dark' | 'light') => {
    console.log(`PhotoStrip: Setting theme to ${theme}`);
    setCurrentTheme(theme);
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };
  
  return (
    <StripContainer id="photo-strip">
      {photos.length > 0 && (
        <>
          <ThemeToggleContainer>
            <ThemeButton 
              $active={currentTheme === 'dark'} 
              onClick={() => toggleTheme('dark')}
            >
              Dark Background
            </ThemeButton>
            <ThemeButton 
              $active={currentTheme === 'light'} 
              onClick={() => toggleTheme('light')}
            >
              Light Background
            </ThemeButton>
          </ThemeToggleContainer>
          
          <PhotosGrid theme={themes[currentTheme]}>
            <GridContainer columns={columns} rows={rows} theme={themes[currentTheme]}>
              {photos.slice(0, columns * rows).map((photo, index) => (
                <PhotoWrapper key={index}>
                  <Photo 
                    ref={(el: HTMLImageElement | null) => { photoRefs.current[index] = el; }}
                    src={photo} 
                    alt={`Photo ${index + 1}`} 
                    filter={currentFilterIsSpecial ? 'none' : cssFilter}
                    className="photo-with-filter"
                    data-filter={filter}
                  />
                </PhotoWrapper>
              ))}
            </GridContainer>
            <DateStamp theme={themes[currentTheme]}>{formattedDate}</DateStamp>
          </PhotosGrid>
        </>
      )}
    </StripContainer>
  );
}; 