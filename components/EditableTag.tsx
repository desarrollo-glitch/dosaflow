import React, { useState, useEffect, useRef } from 'react';
import { ManagedItem, ManagedStatus } from '../types';

interface EditableTagProps {
  value: string;
  options: (ManagedItem | ManagedStatus)[];
  onSave: (newValue: string) => void;
  color: string;
}

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


export const EditableTag: React.FC<EditableTagProps> = ({ value, options, onSave, color }) => {
  const [isEditing, setIsEditing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };
    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  const handleSelectOption = (newValue: string) => {
    if (newValue !== value) {
        onSave(newValue);
    }
    setIsEditing(false);
  };
  
  const textColor = isColorLight(color) ? 'text-gray-800' : 'text-white';

  return (
    <div className="relative inline-block" ref={wrapperRef}>
      <span
        onClick={() => setIsEditing(true)}
        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-transform transform hover:scale-105 ${textColor}`}
        style={{ backgroundColor: color }}
      >
        {value}
      </span>

      {isEditing && (
        <div 
            className="absolute z-20 mt-2 min-w-max bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-2 flex flex-col items-stretch space-y-1"
            style={{ top: '100%', left: 0 }}
        >
          {options.map(option => {
            const optionTextColor = isColorLight(option.color) ? 'text-gray-800' : 'text-white';
            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.name)}
                className={`w-full text-left px-3 py-1 text-xs font-semibold rounded-md transition-opacity hover:opacity-80 ${optionTextColor}`}
                style={{ backgroundColor: option.color }}
              >
                {option.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  );
};