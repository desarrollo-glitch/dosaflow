import React from 'react';
import { ActivityLog } from '../types';
import { ListBulletIcon, UserIcon } from './Icons';

interface ActivityLogViewProps {
  logs: ActivityLog[];
}

const LogEntry: React.FC<{ log: ActivityLog }> = ({ log }) => {
    const date = new Date(log.timestamp);
    const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="relative flex items-start space-x-4 p-4 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
            <div className="flex-shrink-0 pt-1">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20">
                    <ListBulletIcon className="h-5 w-5 text-brand-primary" />
                </span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">{log.action}</p>
                    <p className="text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">{log.taskRequirement}</span> ({log.taskId})
                    </p>
                </div>
                <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {log.details}
                </div>
                <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <UserIcon className="w-4 h-4 mr-1.5" />
                    <span>{log.user}</span>
                    <span className="mx-2">&bull;</span>
                    <span>{formattedDate} a las {formattedTime}</span>
                </div>
            </div>
        </div>
    );
};


export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs }) => {
    const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Registro de Actividad</h1>
            {sortedLogs.length > 0 ? (
                 <div className="space-y-4">
                    {sortedLogs.map(log => (
                        <LogEntry key={log.docId} log={log} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <ListBulletIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay actividad todavía</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Crea o modifica un requisito para ver el registro de cambios aquí.</p>
                </div>
            )}
        </div>
    );
};