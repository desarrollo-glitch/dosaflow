import React, { useState, useRef, useEffect } from 'react';
import { VisibilityFilters, ManagedStatus, ManagedItem } from '../types';
import { FilterIcon } from './Icons';

interface TableToolbarProps {
    visibilityFilters: VisibilityFilters;
    onVisibilityFiltersChange: React.Dispatch<React.SetStateAction<VisibilityFilters>>;
    allStatuses: ManagedStatus[];
    allModules: ManagedItem[];
    allProgrammers: ManagedItem[];
}

interface FilterSectionProps {
    title: string;
    items: (ManagedStatus | ManagedItem)[];
    selectedItems: string[];
    onSelectionChange: (newSelection: string[]) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, items, selectedItems, onSelectionChange }) => {
    const handleToggleAll = (select: boolean) => {
        if (select) {
            onSelectionChange(items.map(item => item.name));
        } else {
            onSelectionChange([]);
        }
    };

    const handleItemToggle = (itemName: string) => {
        const newSelection = selectedItems.includes(itemName)
            ? selectedItems.filter(name => name !== itemName)
            : [...selectedItems, itemName];
        onSelectionChange(newSelection);
    };

    return (
        <div className="p-2">
            <h4 className="font-semibold text-md mb-2 text-gray-700 dark:text-gray-200">{title}</h4>
            <div className="flex items-center space-x-2 mb-2 text-xs">
                <button onClick={() => handleToggleAll(true)} className="text-brand-primary hover:underline">Seleccionar todo</button>
                <span className="text-gray-400">/</span>
                <button onClick={() => handleToggleAll(false)} className="text-brand-primary hover:underline">Deseleccionar todo</button>
            </div>
            <div className="max-h-48 overflow-y-auto pr-2 space-y-1">
                {items.map(item => (
                    <label key={item.id} className="flex items-center space-x-2 cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        <input
                            type="checkbox"
                            checked={selectedItems.includes(item.name)}
                            onChange={() => handleItemToggle(item.name)}
                            className="form-checkbox h-4 w-4 text-brand-primary rounded focus:ring-brand-primary"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{item.name}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export const TableToolbar: React.FC<TableToolbarProps> = ({
    visibilityFilters,
    onVisibilityFiltersChange,
    allStatuses,
    allModules,
    allProgrammers,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFilterChange = (category: keyof VisibilityFilters, newSelection: string[]) => {
        onVisibilityFiltersChange(prev => ({
            ...prev,
            [category]: newSelection,
        }));
    };

    // FIX: Replaced a potentially unsafe reduce operation with a direct, type-safe sum to prevent runtime errors.
    const activeFilterCount = visibilityFilters.status.length + visibilityFilters.module.length + visibilityFilters.programmer.length;
    const totalFilterCount = allStatuses.length + allModules.length + allProgrammers.length;
    const isAnyFilterActive = activeFilterCount < totalFilterCount;

    return (
        <div className="mb-4 relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors
                    ${isAnyFilterActive 
                        ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
            >
                <FilterIcon className="w-5 h-5" />
                <span>Opciones de Visualización</span>
                {isAnyFilterActive && (
                    <span className="bg-brand-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {/* FIX: Use a type-safe array of keys to prevent potential TypeScript errors with Object.keys. */}
                        {(['status', 'module', 'programmer'] as const).filter(key => {
                            const allItems = { status: allStatuses, module: allModules, programmer: allProgrammers };
                            return visibilityFilters[key].length < allItems[key].length;
                        }).length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-20 p-2">
                    <div className="grid grid-cols-1 divide-y divide-gray-200 dark:divide-gray-700">
                        <FilterSection
                            title="Estados"
                            items={allStatuses}
                            selectedItems={visibilityFilters.status}
                            onSelectionChange={(newSelection) => handleFilterChange('status', newSelection)}
                        />
                        <FilterSection
                            title="Módulos"
                            items={allModules}
                            selectedItems={visibilityFilters.module}
                            onSelectionChange={(newSelection) => handleFilterChange('module', newSelection)}
                        />
                         <FilterSection
                            title="Programadores"
                            items={allProgrammers}
                            selectedItems={visibilityFilters.programmer}
                            onSelectionChange={(newSelection) => handleFilterChange('programmer', newSelection)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
