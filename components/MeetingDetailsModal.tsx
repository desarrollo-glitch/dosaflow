import React, { useState, useEffect, useMemo } from 'react';
import { Meeting, MeetingTask, Task, ManagedItem } from '../types';
import { XIcon, EditIcon, PlusIcon, TrashIcon, PrinterIcon } from './Icons';

interface MeetingDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: Meeting | null;
    onUpdateMeeting: (updatedMeeting: Meeting, originalDocId: string) => Promise<void>;
    onDeleteMeeting: (docId: string) => void;
    tasks: Task[];
    programmers: ManagedItem[];
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{title}</h4>
        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md text-gray-700 dark:text-gray-300 text-sm prose prose-sm dark:prose-invert max-w-none">
            {children}
        </div>
    </div>
);

const EditableListSection: React.FC<{
    title: string;
    items: string[];
    onChange: (index: number, value: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}> = ({ title, items, onChange, onAdd, onRemove }) => {
    const isTextArea = title === "Acciones Analizadas" || title === "Conclusiones";
    
    return (
    <div>
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h4>
            <button type="button" onClick={onAdd} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200">
                <PlusIcon className="w-4 h-4" />
            </button>
        </div>
        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={index} className="flex items-start space-x-2">
                    {isTextArea ? (
                        <textarea
                            value={item}
                            onChange={(e) => onChange(index, e.target.value)}
                            rows={3}
                            className="flex-grow w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 resize-y"
                        />
                    ) : (
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => onChange(index, e.target.value)}
                            className="flex-grow w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                    )}
                    <button type="button" onClick={() => onRemove(index)} className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 mt-1">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    </div>
);
};

export const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({ isOpen, onClose, meeting, onUpdateMeeting, onDeleteMeeting, tasks, programmers }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localMeeting, setLocalMeeting] = useState<Meeting | null>(null);

    useEffect(() => {
        const ensureArray = (value: any): string[] => {
            if (Array.isArray(value)) {
                return value.filter(item => typeof item === 'string');
            }
            if (typeof value === 'string') {
                return value.split('\n').filter(line => line.trim() !== '');
            }
            return [];
        };

        if (meeting) {
            const sanitizedMeeting = {
                ...meeting,
                actionsAnalyzed: ensureArray(meeting.actionsAnalyzed),
                conclusions: ensureArray(meeting.conclusions),
                decisions: ensureArray(meeting.decisions),
            };
            setLocalMeeting(JSON.parse(JSON.stringify(sanitizedMeeting)));
        }
        setIsEditing(false);
    }, [isOpen, meeting]);

    const availableProgrammers = useMemo(() => {
        return [...programmers.filter(p => p.name !== "Sin asignar"), { id: 'all', docId: 'all', name: 'Todos', color: '#ccc' }];
    }, [programmers]);

    if (!isOpen || !localMeeting || !meeting) return null;
    
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const { requirementName, date, summary, actionsAnalyzed, conclusions, decisions, tasks } = localMeeting;
            const participants = new Set<string>();
            tasks.forEach(task => participants.add(task.programmer));

            const printContent = `
                <html>
                    <head>
                        <title>Informe de Reunión: ${requirementName}</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>
                            @media print {
                                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                .no-print { display: none; }
                            }
                            body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; }
                        </style>
                    </head>
                    <body class="p-8">
                        <header class="mb-8 text-center">
                           <h1 class="text-3xl font-bold text-gray-800">Informe de Reunión</h1>
                           <h2 class="text-xl font-semibold text-indigo-600">${requirementName}</h2>
                           <p class="text-md text-gray-500">${new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </header>
                        
                        <main>
                            <section class="mb-6">
                                <h3 class="text-lg font-bold border-b-2 border-indigo-500 pb-2 mb-3">Resumen</h3>
                                <p class="text-gray-700 whitespace-pre-line">${summary}</p>
                            </section>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                <div>
                                    <h3 class="text-lg font-bold border-b-2 border-indigo-500 pb-2 mb-3">Acciones Analizadas</h3>
                                    <ul class="list-disc pl-5 space-y-1 text-gray-700">${actionsAnalyzed.map(item => `<li>${item}</li>`).join('')}</ul>
                                </div>
                                 <div>
                                    <h3 class="text-lg font-bold border-b-2 border-indigo-500 pb-2 mb-3">Conclusiones</h3>
                                    <ul class="list-disc pl-5 space-y-1 text-gray-700">${conclusions.map(item => `<li>${item}</li>`).join('')}</ul>
                                </div>
                            </div>

                             <section class="mb-6">
                                <h3 class="text-lg font-bold border-b-2 border-indigo-500 pb-2 mb-3">Decisiones Tomadas</h3>
                                <ul class="list-disc pl-5 space-y-1 text-gray-700">${decisions.map(item => `<li>${item}</li>`).join('')}</ul>
                            </section>

                            <section>
                                <h3 class="text-lg font-bold border-b-2 border-indigo-500 pb-2 mb-3">Plan de Acción / Tareas Asignadas</h3>
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr class="bg-gray-100">
                                            <th class="p-2 border">Estado</th>
                                            <th class="p-2 border">Tarea</th>
                                            <th class="p-2 border">Asignado a</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${tasks.map(task => `
                                            <tr class="border-b">
                                                <td class="p-2 border text-center">${task.completed ? '✅' : '⬜️'}</td>
                                                <td class="p-2 border">${task.text}</td>
                                                <td class="p-2 border">${task.programmer}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </section>
                        </main>
                    </body>
                </html>
            `;
            
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { // Timeout to allow content to render
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };


    const handleFieldChange = (field: keyof Meeting, value: any) => {
        setLocalMeeting(prev => {
            if (!prev) return null;
            const newMeeting = { ...prev, [field]: value };
            if (field === 'requirementId') {
                const newRequirementName = tasks.find(t => t.id === value)?.requirement || 'N/A';
                return { ...newMeeting, requirementName: newRequirementName };
            }
            return newMeeting;
        });
    };
    
    const handleListChange = (field: 'actionsAnalyzed' | 'conclusions' | 'decisions', index: number, value: string) => {
        setLocalMeeting(prev => {
            if (!prev) return null;
            const newList = [...prev[field]];
            newList[index] = value;
            return { ...prev, [field]: newList };
        });
    };

    const handleAddListItem = (field: 'actionsAnalyzed' | 'conclusions' | 'decisions') => {
        setLocalMeeting(prev => prev ? { ...prev, [field]: [...prev[field], ''] } : null);
    };

    const handleRemoveListItem = (field: 'actionsAnalyzed' | 'conclusions' | 'decisions', index: number) => {
        setLocalMeeting(prev => prev ? { ...prev, [field]: prev[field].filter((_, i) => i !== index) } : null);
    };

    const handleTaskChange = (index: number, field: keyof MeetingTask, value: any) => {
        setLocalMeeting(prev => {
            if (!prev) return null;
            const newTasks = [...prev.tasks];
            newTasks[index] = { ...newTasks[index], [field]: value };
            return { ...prev, tasks: newTasks };
        });
    };

    const handleAddTask = () => {
        setLocalMeeting(prev => prev ? { ...prev, tasks: [...prev.tasks, { text: '', programmer: availableProgrammers[0]?.name || '', completed: false }] } : null);
    };

    const handleRemoveTask = (index: number) => {
        setLocalMeeting(prev => prev ? { ...prev, tasks: prev.tasks.filter((_, i) => i !== index) } : null);
    };

    const handleSaveChanges = async () => {
        if (localMeeting) {
            await onUpdateMeeting(localMeeting, meeting.docId);
            onClose();
        }
    };
    
    const handleCancelEdit = () => {
        setLocalMeeting(JSON.parse(JSON.stringify(meeting)));
        setIsEditing(false);
    };
    
    const handleDelete = () => {
        if (meeting) {
            onDeleteMeeting(meeting.docId);
        }
    };

    const formattedDate = new Date(localMeeting.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-screen h-screen sm:w-[95vw] sm:h-[95vh] flex flex-col p-6" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            {isEditing ? (
                                <input type="date" value={localMeeting.date} onChange={e => handleFieldChange('date', e.target.value)} className="text-sm p-1 border rounded-md border-gray-300 dark:border-gray-400 bg-white dark:bg-white text-gray-900 dark:text-gray-900 dark:[color-scheme:light]" />
                            ) : (
                                <p className="text-sm text-brand-primary font-semibold">{formattedDate}</p>
                            )}
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">Detalles de la Reunión</h2>
                            {isEditing ? (
                                <select value={localMeeting.requirementId} onChange={e => handleFieldChange('requirementId', e.target.value)} className="w-full mt-1 p-1 border rounded-md border-gray-300 dark:border-gray-400 bg-white dark:bg-white text-gray-900 dark:text-gray-900">
                                    {tasks.map(task => <option key={task.id} value={task.id}>{task.requirement}</option>)}
                                </select>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400">Requisito: {localMeeting.requirementName} ({localMeeting.requirementId})</p>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                           <button onClick={handlePrint} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200" title="Imprimir reunión">
                                <PrinterIcon className="w-5 h-5"/>
                            </button>
                           {!isEditing && (
                               <button onClick={() => setIsEditing(true)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600" title="Editar reunión">
                                   <EditIcon className="w-5 h-5"/>
                               </button>
                           )}
                           <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                               <XIcon className="w-6 h-6" />
                           </button>
                        </div>
                    </div>
                    <hr className="my-4 dark:border-gray-700" />
                </header>

                <main className="flex-grow overflow-y-auto pr-2">
                    {isEditing ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {/* Column 1 */}
                            <div className="space-y-6 flex flex-col">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Resumen</h4>
                                    <textarea value={localMeeting.summary} onChange={(e) => handleFieldChange('summary', e.target.value)} rows={5} className="w-full text-sm p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                                </div>
                                <EditableListSection title="Acciones Analizadas" items={localMeeting.actionsAnalyzed} onChange={(i, v) => handleListChange('actionsAnalyzed', i, v)} onAdd={() => handleAddListItem('actionsAnalyzed')} onRemove={(i) => handleRemoveListItem('actionsAnalyzed', i)} />
                                <EditableListSection title="Conclusiones" items={localMeeting.conclusions} onChange={(i, v) => handleListChange('conclusions', i, v)} onAdd={() => handleAddListItem('conclusions')} onRemove={(i) => handleRemoveListItem('conclusions', i)} />
                                <EditableListSection title="Decisiones" items={localMeeting.decisions} onChange={(i, v) => handleListChange('decisions', i, v)} onAdd={() => handleAddListItem('decisions')} onRemove={(i) => handleRemoveListItem('decisions', i)} />
                            </div>

                            {/* Column 2 */}
                            <div className="space-y-6 flex flex-col">
                                <div className="flex-grow flex flex-col min-h-[200px]">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tareas Asignadas</h4>
                                        <button type="button" onClick={handleAddTask} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200">
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2 flex-grow overflow-y-auto pr-1">
                                        {localMeeting.tasks.map((task, index) => (
                                            <div key={index} className="grid grid-cols-[1fr,auto,auto] gap-2 items-center">
                                                <input type="text" value={task.text} onChange={e => handleTaskChange(index, 'text', e.target.value)} placeholder="Descripción de la tarea" className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                                                <select value={task.programmer} onChange={e => handleTaskChange(index, 'programmer', e.target.value)} className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200">
                                                    {availableProgrammers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                                </select>
                                                <button type="button" onClick={() => handleRemoveTask(index)} className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <DetailSection title="Resumen">{localMeeting.summary}</DetailSection>
                            <DetailSection title="Acciones Analizadas">
                                <ul className="list-disc pl-5 space-y-1">
                                    {localMeeting.actionsAnalyzed.map((action, i) => <li key={i} className="whitespace-pre-line">{action}</li>)}
                                </ul>
                            </DetailSection>
                            <DetailSection title="Conclusiones">
                                <ul className="list-disc pl-5 space-y-1">
                                    {localMeeting.conclusions.map((conc, i) => <li key={i} className="whitespace-pre-line">{conc}</li>)}
                                </ul>
                            </DetailSection>
                            <DetailSection title="Decisiones">
                                <ul className="list-disc pl-5 space-y-1">
                                    {localMeeting.decisions.map((dec, i) => <li key={i} className="whitespace-pre-line">{dec}</li>)}
                                </ul>
                            </DetailSection>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tareas Asignadas</h4>
                                <div className="space-y-2">
                                    {localMeeting.tasks.length > 0 ? localMeeting.tasks.map((task, index) => (
                                        <div key={index} className={`flex items-center p-2 rounded-md ${task.completed ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-50 dark:bg-gray-900/50'}`}>
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => handleTaskChange(index, 'completed', !task.completed)}
                                                className="h-5 w-5 rounded text-brand-primary focus:ring-brand-primary border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                            />
                                            <div className="ml-3 flex-grow">
                                                <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {task.text}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Asignado a: <span className="font-semibold">{task.programmer}</span></p>
                                            </div>
                                        </div>
                                    )) : <p className="text-sm text-gray-500 italic p-2">No se asignaron tareas.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="flex justify-between items-center pt-4 mt-2 border-t dark:border-gray-700 flex-shrink-0">
                    {isEditing ? (
                        <>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow flex items-center space-x-2 transition-colors"
                            >
                                <TrashIcon className="w-5 h-5"/>
                                <span>Eliminar Reunión</span>
                            </button>
                            <div>
                                <button type="button" onClick={handleCancelEdit} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                                <button onClick={handleSaveChanges} className="bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow">
                                    Guardar Cambios
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="bg-transparent hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center space-x-2"
                            >
                                <TrashIcon className="w-5 h-5"/>
                                <span>Eliminar Reunión</span>
                            </button>
                            <button onClick={handleSaveChanges} className="bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow">
                               Guardar Estado de Tareas
                            </button>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
};
