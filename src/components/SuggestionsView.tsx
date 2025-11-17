

import React, { useState, useMemo } from 'react';
import { Suggestion } from '../types';
import { SuggestionCard } from './SuggestionCard';

interface SuggestionsViewProps {
    suggestions: Suggestion[];
    onStatusChange: (id: string, newStatus: Suggestion['status']) => void;
    onApply: (suggestion: Suggestion) => void;
}

export const SuggestionsView: React.FC<SuggestionsViewProps> = ({ suggestions, onStatusChange, onApply }) => {
    const [showDiscarded, setShowDiscarded] = useState(false);

    const filteredSuggestions = useMemo(() => {
        return suggestions.filter(s => showDiscarded ? true : s.status !== 'discarded');
    }, [suggestions, showDiscarded]);

    const groupedSuggestions = useMemo(() => {
        return filteredSuggestions.reduce((acc, suggestion) => {
            const category = suggestion.category || 'Sin categoría';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(suggestion);
            return acc;
        }, {} as Record<string, Suggestion[]>);
    }, [filteredSuggestions]);

    const categoryOrder = [
        "UI/UX y Experiencia de Usuario",
        "Funcionalidad Principal",
        "Colaboración y Comunicación",
        "Integraciones y Extensibilidad",
        "IA y Automatización",
        "Informes y Analíticas",
        "Rendimiento y Calidad",
        "Administración y Seguridad"
    ];
    
    const sortedCategories = Object.keys(groupedSuggestions).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Sugerencias para Mejorar</h1>
                <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showDiscarded}
                        onChange={e => setShowDiscarded(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-brand-primary rounded focus:ring-brand-primary border-gray-300 dark:border-gray-600"
                    />
                    <span>Mostrar descartadas</span>
                </label>
            </div>

            {sortedCategories.map(category => (
                <div key={category} className="mb-10">
                    <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4 pb-2 border-b-2 border-gray-200 dark:border-gray-700">{category}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {groupedSuggestions[category].map(suggestion => (
                            <SuggestionCard
                                key={suggestion.id}
                                suggestion={suggestion}
                                onStatusChange={onStatusChange}
                                onApply={onApply}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>