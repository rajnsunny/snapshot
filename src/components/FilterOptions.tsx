import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { applyFilterToImage } from '../utils/imageUtils';
import { FilterDefinition, getFilterDisplayName } from '../types/PhotoBoothTypes';

interface FilterOptionsProps {
  filters: Record<string, FilterDefinition>;
  currentFilter: string;
  onSelectFilter: (filter: string) => void;
  previewImage?: string;
}

const FilterOptionsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
`;

const FilterOption = styled.div<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const FilterPreview = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const FilterName = styled.div<{ $selected: boolean }>`
  font-size: 14px;
  color: ${props => props.$selected ? '#FFD700' : '#ccc'};
  text-align: center;
  transition: color 0.3s ease;
`;

const FilterTooltip = styled.div`
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 10;
  pointer-events: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
  }
`;

export const FilterOptions: React.FC<FilterOptionsProps> = ({
  filters,
  currentFilter,
  onSelectFilter,
  previewImage
}) => {
  const previewRefs = useRef<Record<string, HTMLImageElement | null>>({});
  
  // Apply special filters to preview images
  useEffect(() => {
    if (!previewImage) return;
    
    // Process each special filter
    Object.entries(filters).forEach(([key, definition]) => {
      if (definition.isSpecial && previewRefs.current[key]) {
        try {
          // Apply the filter and update the preview
          applyFilterToImage(previewImage, key)
            .then(filteredImage => {
              if (previewRefs.current[key]) {
                previewRefs.current[key]!.src = filteredImage;
              }
            })
            .catch(error => {
              console.error(`Error applying ${key} filter:`, error);
            });
        } catch (error) {
          console.error(`Error processing ${key} filter:`, error);
        }
      }
    });
  }, [filters, previewImage]);

  return (
    <FilterOptionsContainer>
      {Object.entries(filters).map(([filterName, filterDef]) => {
        const isSelected = currentFilter === filterName;
        
        return (
          <FilterOption 
            key={filterName} 
            onClick={() => onSelectFilter(filterName)}
            $selected={isSelected}
          >
            <FilterPreview>
              <img 
                ref={(el: HTMLImageElement | null) => { previewRefs.current[filterName] = el; }}
                src={previewImage} 
                alt={filterName} 
                style={{ filter: filterDef.cssFilter }}
              />
            </FilterPreview>
            <FilterName $selected={isSelected}>
              {filterDef.displayName || filterName}
            </FilterName>
          </FilterOption>
        );
      })}
    </FilterOptionsContainer>
  );
}; 