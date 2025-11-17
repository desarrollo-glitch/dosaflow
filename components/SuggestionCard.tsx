
import React from 'react';
import { Suggestion } from '../types';
import { CheckCircleIcon, LightbulbIcon, SparklesIcon, XIcon } from './Icons';

interface SuggestionCardProps {
    suggestion: Suggestion;
    onStatusChange: (id: string, newStatus: Suggestion['status']) => void;
    onApply: (suggestion: Suggestion) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, onStatusChange, onApply }) => {
    const { id, text, status, category } = suggestion;

    const handleApplyClick = () => {
        if (status === 'pending') {
            onApply(suggestion);
        }
    };

    let cardStyle = "bg-white dark:bg-gray-800 hover:shadow-xl hover:-translate-y-1";
    let textStyle = "text-gray-700 dark:text-gray-300";
    let iconColor = "text-amber-500";

    if (status === 'completed') {
        cardStyle = "bg-emerald-50 dark:bg-emerald-900/20 opacity-70";
        textStyle = "line-through text-gray-500 dark:text-gray-400";
        iconColor = "text-emerald-500";
    } else if (status === 'discarded') {
        cardStyle = "bg-gray-100 dark:bg-gray-800/50 opacity-50";
        textStyle = "line-through text-gray-500 dark:text-gray-400";
        iconColor = "text-gray-500";
    }

    const checkButtonBase = "p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800";
    const checkButtonCompleted = "bg-emerald-500 text-white focus:ring-emerald-400";
    const checkButtonPending = "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-brand-primary";

    return (
        <div className={`flex flex-col h-full p-5 rounded-lg shadow-md transition-all duration-300 ${cardStyle}`}>
            <span className="text-xs font-semibold text-brand-primary dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-full self-start mb-3">
                {category}
            </span>
            <div className="flex-grow">
                <div className="flex items-start mb-3">
                    <span className={`mr-3 mt-1 flex-shrink-0 ${iconColor}`}>
                        <LightbulbIcon className="w-6 h-6" />
                    </span>
                    <p className={textStyle}>
                        {text}
                    </p>
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center space-x-2">
                 <button
                    onClick={handleApplyClick}
                    disabled={status !== 'pending'}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 hover:bg-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Aplicar sugerencia con IA"
                >
                    <SparklesIcon className="w-4 h-4" />
                    <span>Aplicar con IA</span>
                </button>
                <button
                    onClick={() => onStatusChange(id, status === 'completed' ? 'pending' : 'completed')}
                    className={`${checkButtonBase} ${status === 'completed' ? checkButtonCompleted : checkButtonPending}`}
                    aria-label={status === 'completed' ? 'Marcar como pendiente' : 'Marcar como completada'}
                >
                    <CheckCircleIcon className="w-6 h-6" />
                </button>
                 <button
                    onClick={() => onStatusChange(id, 'discarded')}
                    className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-red-500"
                    aria-label="Descartar sugerencia"
                >
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};
