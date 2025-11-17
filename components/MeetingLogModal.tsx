import React, { useState, useEffect, useMemo } from 'react';
import { Task, ManagedItem } from '../types';
import { SpinnerIcon, XIcon, UserIcon } from './Icons';

interface MeetingLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    programmers: ManagedItem[];
    date: string | null;
    onProcessMeeting: (requirementId: string, meetingNotes: string, date: string) => Promise<void>;
}

export const MeetingLogModal: React.FC<MeetingLogModalProps> = ({ isOpen, onClose, tasks, programmers, date, onProcessMeeting }) => {
    const [step, setStep] = useState(1);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [meetingNotes, setMeetingNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const effectiveDate = useMemo(() => {
        if (date) return date;
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }, [date]);

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setStep(1);
            setSelectedTaskId(null);
            setMeetingNotes('');
            setIsProcessing(false);
            setSearchTerm('');
        }
    }, [isOpen]);

    const filteredTasks = useMemo(() => {
        if (!searchTerm) return tasks;
        return tasks.filter(task =>
            task.requirement.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tasks, searchTerm]);
    
    const selectedTask = useMemo(() => {
        return tasks.find(t => t.id === selectedTaskId);
    }, [tasks, selectedTaskId]);

    const handleProcess = async () => {
        if (!selectedTaskId || !meetingNotes.trim() || !effectiveDate) return;
        setIsProcessing(true);
        try {
            await onProcessMeeting(selectedTaskId, meetingNotes, effectiveDate);
            // The parent component will close the modal on success
        } finally {
            setIsProcessing(false);
        }
    };

    const formattedDate = effectiveDate ? new Date(effectiveDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl transform transition-all p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 pb-4 border-b dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Registrar Notas de Reunión</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                {/* Step 1: Select Requirement */}
                {step === 1 && (
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-700 dark:text-gray-300">Paso 1: Selecciona el Requisito</h3>
                        <input
                            type="text"
                            placeholder="Buscar requisito por nombre o ID..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm mb-3 bg-white dark:bg-gray-700"
                        />
                        <div className="max-h-60 overflow-y-auto border dark:border-gray-600 rounded-md p-2">
                            {filteredTasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => setSelectedTaskId(task.id)}
                                    className={`p-3 rounded-md cursor-pointer transition-colors ${selectedTaskId === task.id ? 'bg-brand-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <p className="font-semibold">{task.requirement}</p>
                                    <p className={`text-sm ${selectedTaskId === task.id ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                        ID: {task.id} &bull; Módulo: {task.module}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {selectedTask && (
                             <div className="mt-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                                <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">Programadores Asignados:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTask.assignments.map(({ programmerName }) => {
                                        const programmer = programmers.find(p => p.name === programmerName);
                                        return (
                                            <span key={programmerName} className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                                                {programmer && <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: programmer.color}}></span>}
                                                <span>{programmerName}</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <footer className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                            <button onClick={() => setStep(2)} disabled={!selectedTaskId} className="bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed">
                                Siguiente
                            </button>
                        </footer>
                    </div>
                )}

                {/* Step 2: Paste Notes */}
                {step === 2 && selectedTask && (
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-700 dark:text-gray-300">Paso 2: Pega las Notas de la Reunión</h3>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md mb-4 space-y-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Requisito: <strong className="text-gray-800 dark:text-gray-200">{selectedTask.requirement}</strong></p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Fecha: <strong className="text-gray-800 dark:text-gray-200">{formattedDate}</strong></p>
                        </div>
                        <textarea
                            value={meetingNotes}
                            onChange={(e) => setMeetingNotes(e.target.value)}
                            rows={10}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            placeholder="Pega aquí el texto de la reunión. La IA identificará las acciones y las asignará a los programadores involucrados..."
                        />
                         <footer className="flex justify-between items-center pt-4 mt-4 border-t dark:border-gray-700">
                            <button onClick={() => setStep(1)} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
                                Atrás
                            </button>
                             <button onClick={handleProcess} disabled={isProcessing || !meetingNotes.trim()} className="bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow flex items-center justify-center w-48 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isProcessing ? <SpinnerIcon className="w-5 h-5"/> : 'Procesar con IA'}
                            </button>
                        </footer>
                    </div>
                )}
            </div>
        </div>
    );
};