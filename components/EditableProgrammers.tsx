import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ManagedItem } from '../types';

// Function to determine if a color is light or dark for optimal text contrast
const isColorLight = (colorString: string) => {
    if (!colorString) return true;

    let r, g, b;

    if (colorString.startsWith('hsl')) {
        const lightness = parseInt(colorString.split(',')[2]?.replace('%', '').trim() || '0', 10);
        return lightness > 65;
    }

    if (colorString.startsWith('#')) {
        let hex = colorString.slice(1);
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        if (hex.length !== 6) return true;

        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    } else if (colorString.startsWith('rgb')) {
        const parts = colorString.match(/(\d+)/g);
        if (!parts || parts.length < 3) return true;
        [r, g, b] = parts.slice(0, 3).map(Number);
    } else {
        return true; // Default for unknown formats
    }

    if (typeof r === 'undefined' || typeof g === 'undefined' || typeof b === 'undefined') return true;

    // Using a standard luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
};


interface EditableProgrammersProps {
  value: string[];
  options: ManagedItem[];
  onSave: (newValue: string[]) => void;
}

export const EditableProgrammers: React.FC<EditableProgrammersProps> = ({ value, options, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const programmerOptionsMap = useMemo(() => 
    new Map(options.map(opt => [opt.name, opt])), 
  [options]);

  useEffect(() => {
    // Sync state if external value changes while not editing
    if (!isEditing) {
      setSelected(value);
    }
  }, [value, isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (isEditing) {
          // Save on click outside if changes were made
          if (JSON.stringify([...selected].sort()) !== JSON.stringify([...value].sort())) {
            onSave(selected);
          }
          setIsEditing(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, selected, value, onSave]);

  const handleToggle = (name: string) => {
    setSelected(currentSelected => {
      const isCurrentlySelected = currentSelected.includes(name);
      let newSelected;

      // Logic to add/remove the item
      if (isCurrentlySelected) {
        newSelected = currentSelected.filter(p => p !== name);
      } else {
        newSelected = [...currentSelected, name];
      }

      // Business logic for 'Sin asignar'
      if (newSelected.length > 1 && newSelected.includes('Sin asignar')) {
        // If another programmer is selected, 'Sin asignar' should be removed
        return newSelected.filter(p => p !== 'Sin asignar');
      }
      
      if (newSelected.length === 0) {
        // If no programmer is selected, it should default to 'Sin asignar'
        return ['Sin asignar'];
      }
      
      if (name === 'Sin asignar' && newSelected.includes('Sin asignar')) {
        // If 'Sin asignar' was just selected, it should be the only one
        return ['Sin asignar'];
      }

      return newSelected;
    });
  };
  
  const programmersToShow = value && value.length > 0 ? value : ['Sin asignar'];

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        onClick={() => setIsEditing(true)}
        className="cursor-pointer min-h-[36px] p-1 flex items-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 w-full"
      >
        <div className="flex flex-wrap gap-1">
            {programmersToShow.map((name, idx) => {
                const programmer = programmerOptionsMap.get(name);
                const color = programmer?.color || '#ccc';
                const textColor = isColorLight(color) ? 'text-gray-800' : 'text-white';
                return (
                    <span
                        key={`${name}-${idx}`}
                        className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${textColor}`}
                        style={{ backgroundColor: color }}
                    >
                        {name}
                    </span>
                );
            })}
        </div>
      </div>

      {isEditing && (
        <div 
            className="absolute z-20 mt-2 min-w-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-2 flex flex-col items-stretch"
            style={{ top: '100%', left: 0 }}
        >
          <div className="max-h-60 overflow-y-auto pr-2 space-y-1">
            {options.map(option => (
              <label key={option.id} className="flex items-center space-x-3 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-md">
                <input
                  type="checkbox"
                  checked={selected.includes(option.name)}
                  onChange={() => handleToggle(option.name)}
                  className="form-checkbox h-4 w-4 text-brand-primary rounded focus:ring-brand-primary border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900"
                />
                <span className="text-sm text-gray-800 dark:text-gray-200">{option.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
