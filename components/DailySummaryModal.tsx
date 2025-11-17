import React, { useState, useEffect } from 'react';
import { SpinnerIcon } from './Icons';

interface DailySummaryModalProps {
    isOpen: boolean;
    date: string;
    onSave: (summary: string) => Promise<void>;
    onClose: () => void;
}

export const DailySummaryModal: React.FC<DailySummaryModalProps> = ({ isOpen, date, onSave, onClose }) => {
    const [summary, setSummary] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSummary('');
            setIsSaving(false);
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (!summary.trim() || isSaving) return;
        setIsSaving(true);
        try {
            await onSave(summary);
        } catch(e) {
            console.error("Failed to process summary", e);
            // Parent component will show a notification
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Resumen con IA</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
                </div>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Introduce el resumen para el <span className="font-semibold text-brand-primary">{formattedDate}</span>. La IA lo analizará y creará los partes diarios automáticamente.</p>
                <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={6}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    placeholder="Ej: Miguel ha estado trabajando en la API de pagos. Jacinta ha corregido el bug #123. Martín ha empezado el diseño de la nueva vista de perfil."
                />
                <div className="flex justify-end mt-6">
                    <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-300">Cancelar</button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300 flex items-center justify-center w-40 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <SpinnerIcon className="w-5 h-5" /> : 'Guardar y Procesar'}
                    </button>
                </div>
            </div>
        </div>
    );
};