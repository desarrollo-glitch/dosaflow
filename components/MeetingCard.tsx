import React from 'react';
import { Meeting, Task, ManagedItem } from '../types';
import { EditIcon, PrinterIcon, CheckBadgeIcon, UsersIcon } from './Icons';

interface MeetingCardProps {
    meeting: Meeting;
    tasks: Task[];
    programmers: ManagedItem[];
    onEdit: (meeting: Meeting) => void;
}

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

export const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, tasks, programmers, onEdit }) => {
    const { requirementName, date, tasks: meetingTasks } = meeting;

    const taskForMeeting = tasks.find(t => t.id === meeting.requirementId);
    const participants = taskForMeeting ? taskForMeeting.assignments
        .map(a => a.programmerName)
        .filter(name => name !== 'Sin asignar' && name !== 'Todos')
        : [];
    
    const completedTasks = meetingTasks.filter(t => t.completed).length;
    const totalTasks = meetingTasks.length;

    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex flex-col border-l-4 border-brand-primary">
            <header className="p-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-brand-primary dark:text-indigo-400">{formattedDate}</p>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mt-1 truncate" title={requirementName}>
                    {requirementName}
                </h3>
            </header>
            <div className="p-4 flex-grow">
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                       <UsersIcon className="w-4 h-4 mr-1.5"/> Participantes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {participants.length > 0 ? participants.map(name => {
                            const programmer = programmers.find(p => p.name === name);
                            const color = programmer?.color || '#ccc';
                            const textColor = isColorLight(color) ? 'text-gray-800' : 'text-white';
                            return (
                                <span key={name} style={{ backgroundColor: color }} className={`px-2 py-1 text-xs font-semibold rounded-full ${textColor}`}>
                                    {name}
                                </span>
                            );
                        }) : <span className="text-xs italic text-gray-500">No hay participantes asignados al requisito.</span>}
                    </div>
                </div>
            </div>
            <footer className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg flex justify-between items-center">
                 <div title={`${completedTasks} de ${totalTasks} tareas completadas`} className={`flex items-center space-x-2 px-3 py-1 text-sm font-semibold rounded-full ${totalTasks > 0 && completedTasks === totalTasks ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    <CheckBadgeIcon className="w-5 h-5"/>
                    <span>{completedTasks}/{totalTasks} Tareas</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onEdit(meeting)} className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700" title="Ver y Editar Detalles">
                        <EditIcon className="w-5 h-5" />
                    </button>
                </div>
            </footer>
        </div>
    );
};
