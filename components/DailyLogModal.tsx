import React, { useState, useEffect } from 'react';
import { ManagedItem, DailyLog } from '../types';
import { TrashIcon } from './Icons';

interface DailyLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (log: Omit<DailyLog, 'id' | 'docId'>) => void;
    onDelete: (date: string, programmerId: string) => Promise<void>;
    date: string;
    programmer: ManagedItem | null;
    initialText: string;
}

export const DailyLogModal: React.FC<DailyLogModalProps> = ({ isOpen, onClose, onSave, onDelete, date, programmer, initialText }) => {
    const [text, setText] = useState('');

    useEffect(() => {
        if (isOpen) {
            setText(initialText);
        }
    }, [isOpen, initialText]);

    const handleSave = () => {
        if (programmer) {
            onSave({
                date,
                programmerId: programmer.id,
                text,
            });
        }
    };
    
    const handleDelete = async () => {
        if (programmer) {
            await onDelete(date, programmer.id);
        }
    };


    if (!isOpen || !programmer) return null;

    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Parte Diario</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-2xl">&times;</button>
                </div>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    Añade el parte para <span className="font-semibold text-brand-primary">{programmer.name}</span> del día <span className="font-semibold text-brand-primary">{formattedDate}</span>.
                </p>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                    placeholder="Escribe aquí el parte diario..."
                />
                <div className="flex justify-between items-center mt-6">
                    <div>
                         {initialText && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="bg-transparent hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center space-x-2"
                            >
                                <TrashIcon className="w-5 h-5"/>
                                <span>Eliminar</span>
                            </button>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-300">Cancelar</button>
                        <button
                            onClick={handleSave}
                            className="bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300"
                        >
                            Guardar Parte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};