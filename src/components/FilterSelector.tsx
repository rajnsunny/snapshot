import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { applyFilterToImage } from '../utils/imageUtils';
import { FilterDefinition, getFilterDisplayName } from '../types/PhotoBoothTypes';

interface FilterSelectorProps {
  currentFilter: string;
  onSelectFilter: (filter: string) => void;
  filters: Record<string, FilterDefinition>;
  disabled: boolean;
}

const FilterSelectorContainer = styled.div`
  width: 100%;
  max-width: 640px;
  margin-bottom: 30px;
  background-color: #222;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 10;
`;

const FilterTitle = styled.h3`
  margin-bottom: 20px;
  font-size: 22px;
  color: #FFD700;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background-color: #FFD700;
    border-radius: 3px;
  }
`;

const FilterCategories = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
`;

const CategoryButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${props => props.$active ? '#FFD700' : '#333'};
  color: ${props => props.$active ? '#000' : '#fff'};
  margin-right: 10px;
  margin-bottom: 10px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    background-color: ${props => props.$active ? '#FFC400' : '#444'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const FiltersGridContainer = styled.div`
  width: 100%;
  height: 250px;
  position: relative;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 15px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 10px 5px;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #333;
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 10px;
    
    &:hover {
      background: #666;
    }
  }
`;

const FilterOption = styled.div<{ $selected: boolean; $disabled: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transition: all 0.3s ease;
  
  &:hover {
    transform: ${props => props.$disabled ? 'none' : 'translateY(-5px)'};
  }
`;

// Add a default preview image for basic filters
const DEFAULT_PREVIEW_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZjlhOWUiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmYWQwYzQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNncmFkKSIvPjxjaXJjbGUgY3g9IjM1IiBjeT0iMzUiIHI9IjgiIGZpbGw9IiMzMzMiLz48Y2lyY2xlIGN4PSI2NSIgY3k9IjM1IiByPSI4IiBmaWxsPSIjMzMzIi8+PHBhdGggZD0iTTM1LDYwIEE0MCw0MCAwIDAsMCA2NSw2MCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjUiIGZpbGw9Im5vbmUiLz48L3N2Zz4=';

const FilterPreview = styled.div<{ filter: string; $selected: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
  position: relative;
  filter: ${props => props.filter};
  border: 3px solid ${props => props.$selected ? '#FFD700' : 'transparent'};
  transition: all 0.3s ease;
  background-image: url(${DEFAULT_PREVIEW_IMAGE});
  background-size: cover;
  background-position: center;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.1);
    z-index: 1;
  }
`;

const SpecialEffectPreview = styled.div<{ $selected: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
  position: relative;
  border: 3px solid ${props => props.$selected ? '#FFD700' : 'transparent'};
  transition: all 0.3s ease;
  background-color: #222;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.1);
    z-index: 1;
  }
`;

const FilterName = styled.span<{ $selected: boolean }>`
  font-size: 12px;
  color: ${props => props.$selected ? '#FFD700' : '#ccc'};
  text-align: center;
  transition: color 0.3s ease;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 15px;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 20px;
  color: white;
  margin-bottom: 15px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #FFD700;
    box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.3);
  }
  
  &::placeholder {
    color: #888;
  }
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30px;
  background: linear-gradient(to top, rgba(34, 34, 34, 1), rgba(34, 34, 34, 0));
  pointer-events: none;
  z-index: 2;
  opacity: 0.8;
`;

// Sample images for special effects
const SAMPLE_IMAGES = {
  fisheye: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImciIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2ZmZiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzQ0NCIvPjwvcmFkaWFsR3JhZGllbnQ+PC9kZWZzPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjUwIiBmaWxsPSJ1cmwoI2cpIi8+PGNpcmNsZSBjeD0iMzUiIGN5PSIzNSIgcj0iMTAiIGZpbGw9IiMwMDAiLz48Y2lyY2xlIGN4PSI2NSIgY3k9IjM1IiByPSIxMCIgZmlsbD0iIzAwMCIvPjxwYXRoIGQ9Ik0zMCw2NVE1MCw4NSA3MCw2NVoiIGZpbGw9IiMwMDAiLz48L3N2Zz4=',
  glitch: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMzMzIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNTU1Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjYmcpIi8+PHJlY3QgeD0iMjAiIHk9IjIwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiM2NjYiLz48cmVjdCB4PSIyNSIgeT0iMTUiIHdpZHRoPSI2MCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2YwMCIgZmlsbC1vcGFjaXR5PSIwLjciIHRyYW5zZm9ybT0ic2tld1goNSkiLz48cmVjdCB4PSIxNSIgeT0iNDUiIHdpZHRoPSI2MCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzBmMCIgZmlsbC1vcGFjaXR5PSIwLjciIHRyYW5zZm9ybT0ic2tld1goLTEwKSIvPjxyZWN0IHg9IjM1IiB5PSI2NSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDBmIiBmaWxsLW9wYWNpdHk9IjAuNyIgdHJhbnNmb3JtPSJza2V3WCgxNSkiLz48cmVjdCB4PSIxMCIgeT0iMzAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjMiLz48cmVjdCB4PSI3MCIgeT0iNTAiIHdpZHRoPSIzMCIgaGVpZ2h0PSIxNSIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjIiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwwLDAsMC4zKSIgc3Ryb2tlLXdpZHRoPSIyIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyLDApIi8+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTIsMCkiLz48bGluZSB4MT0iMCIgeTE9IjAiIHgyPSIxMDAiIHkyPSIwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIyIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDEwKSIvPjxsaW5lIHgxPSIwIiB5MT0iMCIgeDI9IjEwMCIgeTI9IjAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMzApIi8+PGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iMTAwIiB5Mj0iMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCw1MCkiLz48bGluZSB4MT0iMCIgeTE9IjAiIHgyPSIxMDAiIHkyPSIwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIyIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDcwKSIvPjxsaW5lIHgxPSIwIiB5MT0iMCIgeDI9IjEwMCIgeTI9IjAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjIiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsOTApIi8+PC9zdmc+',
  crosshatch: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0wLDBMMTAwLDEwME0xMCwwTDExMCwxMDBNMjAsMEwxMjAsMTAwTTMwLDBMMTMwLDEwME00MCwwTDE0MCwxMDBNNTAsMEwxNTAsMTAwTTYwLDBMMTYwLDEwME03MCwwTDE3MCwxMDBNODAsMEwxODAsMTAwTTkwLDBMMTkwLDEwME0xMDAsMEwyMDAsMTAwTTAsMTBMMTAwLDExME0wLDIwTDEwMCwxMjBNMCwzMEwxMDAsMTMwTTAsNDBMMTAwLDE0ME0wLDUwTDEwMCwxNTBNMCw2MEwxMDAsMTYwTTAsNzBMMTAwLDE3ME0wLDgwTDEwMCwxODBNMCw5MEwxMDAsMTkwTTAsMTAwTDEwMCwyMDAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIwLjUiIHN0cm9rZS1vcGFjaXR5PSIwLjUiLz48cGF0aCBkPSJNMTAwLDBMMCwxMDBNOTAsMEwtMTAsMTAwTTgwLDBMLTIwLDEwME03MCwwTC0zMCwxMDBNNjAsMEwtNDAsMTAwTTUwLDBMLTUwLDEwME00MCwwTC02MCwxMDBNMzAsMEwtNzAsMTAwTTIwLDBMLTgwLDEwME0xMCwwTC05MCwxMDBNMCwwTC0xMDAsMTAwTTExMCwxMEwxMCwxMTBNMTIwLDIwTDIwLDEyME0xMzAsMzBMMzAsMTMwTTE0MCw0MEw0MCwxNDBNMTUwLDUwTDUwLDE1ME0xNjAsNjBMNjAsMTYwTTE3MCw3MEw3MCwxNzBNMTgwLDgwTDgwLDE4ME0xOTAsOTBMOTAsMTkwTTIwMCwxMDBMMTAwLDIwMCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAuNSIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIvPjwvc3ZnPg=='
};

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  currentFilter,
  onSelectFilter,
  filters,
  disabled
}) => {
  const previewRefs = useRef<Record<string, HTMLImageElement | null>>({});
  const [category, setCategory] = useState<'all' | 'basic' | 'special'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  
  // Filter the filters based on category and search term
  const filteredFilters = Object.entries(filters).filter(([key, definition]) => {
    const matchesCategory = 
      category === 'all' || 
      (category === 'basic' && !definition.isSpecial) || 
      (category === 'special' && definition.isSpecial);
    
    const filterName = definition.displayName || getFilterDisplayName(key);
    const matchesSearch = searchTerm === '' || 
      filterName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  // Generate preview image for all filters
  useEffect(() => {
    // Create a small canvas with a gradient for filter previews
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, 100, 100);
    gradient.addColorStop(0, '#ff9a9e');
    gradient.addColorStop(1, '#fad0c4');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 100, 100);
    
    // Draw a face-like shape for better filter preview
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(35, 35, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(65, 35, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(35, 60);
    ctx.quadraticCurveTo(50, 70, 65, 60);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 5;
    ctx.stroke();
    
    // Convert to data URL for processing
    const previewImage = canvas.toDataURL('image/jpeg');
    
    // Process special filters
    Object.entries(filters).forEach(([key, definition]) => {
      if (definition.isSpecial && previewRefs.current[key]) {
        // Set sample image first as a fallback
        previewRefs.current[key]!.src = getSampleImage(key);
        
        // Then try to apply the actual filter
        setTimeout(() => {
          try {
            applyFilterToImage(previewImage, key)
              .then(filteredImage => {
                if (previewRefs.current[key]) {
                  previewRefs.current[key]!.src = filteredImage;
                }
              })
              .catch(error => {
                console.error(`Error applying ${key} filter:`, error);
                // Keep using the sample image on error (already set)
              });
          } catch (error) {
            console.error(`Error processing ${key} filter:`, error);
            // Keep using the sample image on error (already set)
          }
        }, 0);
      }
    });
  }, [filters]);

  // Check if grid has scrollable content
  useEffect(() => {
    const checkScrollable = () => {
      if (gridRef.current) {
        setShowScrollIndicator(
          gridRef.current.scrollHeight > gridRef.current.clientHeight
        );
      }
    };
    
    checkScrollable();
    
    // Add resize listener
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      window.removeEventListener('resize', checkScrollable);
    };
  }, [filteredFilters]);

  // Scroll to selected filter
  useEffect(() => {
    if (gridRef.current) {
      const selectedElement = gridRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentFilter]);

  // Get a sample image for a special filter
  const getSampleImage = (filterKey: string): string => {
    if (filterKey === 'fisheye') return SAMPLE_IMAGES.fisheye;
    if (filterKey === 'glitch') return SAMPLE_IMAGES.glitch;
    if (filterKey === 'crosshatch') return SAMPLE_IMAGES.crosshatch;
    
    // Fallback to a generic sample for unknown filters
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzU1NSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+RWZmZWN0PC90ZXh0Pjwvc3ZnPg==';
  };

  return (
    <FilterSelectorContainer>
      <FilterTitle>Choose a Filter</FilterTitle>
      
      <FilterCategories>
        <CategoryButton 
          $active={category === 'all'} 
          onClick={() => setCategory('all')}
          disabled={disabled}
        >
          All Filters
        </CategoryButton>
        <CategoryButton 
          $active={category === 'basic'} 
          onClick={() => setCategory('basic')}
          disabled={disabled}
        >
          Basic
        </CategoryButton>
        <CategoryButton 
          $active={category === 'special'} 
          onClick={() => setCategory('special')}
          disabled={disabled}
        >
          Special Effects
        </CategoryButton>
      </FilterCategories>
      
      <SearchInput 
        type="text" 
        placeholder="Search filters..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <FiltersGridContainer>
        <FiltersGrid ref={gridRef}>
          {filteredFilters.map(([key, definition]) => {
            const filterName = definition.displayName || getFilterDisplayName(key);
            const filterIsSpecial = definition.isSpecial;
            const isSelected = key === currentFilter;
            
            return (
              <FilterOption 
                key={key}
                $selected={isSelected}
                $disabled={disabled}
                onClick={() => !disabled && onSelectFilter(key)}
                data-selected={isSelected}
              >
                {filterIsSpecial ? (
                  <SpecialEffectPreview $selected={isSelected}>
                    <img 
                      ref={(el: HTMLImageElement | null) => { 
                        previewRefs.current[key] = el; 
                        // Immediately set sample image when ref is created
                        if (el) el.src = getSampleImage(key);
                      }}
                      alt={filterName}
                      src={getSampleImage(key)}
                      onError={(e) => {
                        // If the image fails to load, ensure we use the sample
                        e.currentTarget.src = getSampleImage(key);
                      }}
                    />
                  </SpecialEffectPreview>
                ) : (
                  <FilterPreview 
                    filter={definition.cssFilter} 
                    $selected={isSelected}
                  />
                )}
                <FilterName $selected={isSelected}>
                  {filterName}
                </FilterName>
              </FilterOption>
            );
          })}
        </FiltersGrid>
        {showScrollIndicator && <ScrollIndicator />}
      </FiltersGridContainer>
    </FilterSelectorContainer>
  );
}; 