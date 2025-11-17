
import React, { useState } from 'react';
import { Suggestion } from '../types';
import { SparklesIcon, XIcon, CheckIcon } from './Icons';

interface ApplySuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    suggestion: Suggestion | null;
}

export const ApplySuggestionModal: React.FC<ApplySuggestionModalProps> = ({ isOpen, onClose, suggestion }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !suggestion) return null;

    const promptText = `Por favor, implementa la siguiente mejora en la aplicación:\n\n**${suggestion.category}: ${suggestion.text}**\n\nRealiza los cambios necesarios en los ficheros existentes para añadir esta funcionalidad, siguiendo las guías de estilo del proyecto.`;

    const handleCopy = () => {
        navigator.clipboard.writeText(promptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl transform transition-all p-6" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                        <SparklesIcon className="w-6 h-6 text-brand-primary" />
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Aplicar Sugerencia con IA</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-3xl">&times;</button>
                </header>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Copia el siguiente prompt y pégalo en el chat con el asistente de IA para que implemente esta mejora en el código de la aplicación.
                </p>
                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono text-sm">{promptText}</p>
                </div>
                <footer className="mt-6 flex justify-end">
                    <button 
                        onClick={handleCopy}
                        className={`flex items-center justify-center space-x-2 w-40 font-bold py-2 px-4 rounded-lg shadow transition duration-300 ${copied ? 'bg-emerald-500' : 'bg-brand-primary hover:bg-indigo-700'} text-white`}
                    >
                        {copied ? <CheckIcon className="w-5 h-5" /> : null}
                        <span>{copied ? '¡Copiado!' : 'Copiar Prompt'}</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};
