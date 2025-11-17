import React, { useState, useRef, useEffect } from 'react';
import { ManagedItem, ManagedStatus } from '../types';

const isColorLight = (colorString: string) => {
    if (!colorString) return true;
    let r, g, b;
    if (colorString.startsWith('#')) {
        let hex = colorString.slice(1);
        if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
        if (hex.length !== 6) return true;
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    } else if (colorString.startsWith('rgb')) {
        const parts = colorString.match(/(\d+)/g);
        if (!parts || parts.length < 3) return true;
        [r, g, b] = parts.slice(0, 3).map(Number);
    } else return true;
    if ([r, g, b].some(c => typeof c === 'undefined')) return true;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
};

interface TagSelectorProps {
    label: string;
    options: (ManagedItem | ManagedStatus)[];
    selectedValue: string;
    onSelect: (newValue: string) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ label, options, selectedValue, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (newValue: string) => {
        onSelect(newValue);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.name === selectedValue) || { name: 'Seleccionar...', color: '#9CA3AF' };
    const textColor = isColorLight(selectedOption.color) ? 'text-gray-800' : 'text-white';

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <div className="relative" ref={wrapperRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full text-left px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                    <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${textColor}`}
                        style={{ backgroundColor: selectedOption.color }}
                    >
                        {selectedOption.name}
                    </span>
                </button>
                {isOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto p-2">
                        <div className="flex flex-wrap gap-2">
                            {options.map(option => {
                                const optionTextColor = isColorLight(option.color) ? 'text-gray-800' : 'text-white';
                                const isSelected = selectedValue === option.name;
                                return (
                                    <button
                                        type="button"
                                        key={option.id}
                                        onClick={() => handleSelect(option.name)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 transform hover:scale-105 ${optionTextColor} ${isSelected ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-brand-primary' : ''}`}
                                        style={{ backgroundColor: option.color }}
                                    >
                                        {option.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};