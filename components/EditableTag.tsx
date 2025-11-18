import React, { useState, useEffect, useRef } from 'react';
import { ManagedItem, ManagedStatus } from '../types';

interface EditableTagProps {
  value: string;
  options: (ManagedItem | ManagedStatus)[];
  onSave: (newValue: string) => void;
  color: string;
}

export const EditableTag: React.FC<EditableTagProps> = ({ value, options, onSave, color }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | undefined>(undefined);
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
  
  // Force white text for stronger contrast in dark mode and uniform readability.
  const textColor = 'text-white';

  const openMenu = () => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 200,
        pointerEvents: 'auto',
    });
    setIsEditing(true);
  };

  return (
    <div className="relative inline-block" ref={wrapperRef} style={{ zIndex: isEditing ? 40 : 'auto' }}>
      <span
        onClick={openMenu}
        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-transform transform hover:scale-105 ${textColor}`}
        style={{ backgroundColor: color }}
      >
        {value}
      </span>

      {isEditing && (
        <div 
            className="min-w-max bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-2 flex flex-col items-stretch space-y-1"
            style={menuStyle}
        >
          {options.map(option => {
            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option.name)}
                className="w-full text-left px-3 py-1 text-xs font-semibold rounded-md transition-opacity hover:opacity-80 text-white"
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
