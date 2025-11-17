import React, { useMemo } from 'react';
import { Task, ManagedItem, ManagedStatus, Status } from '../types';
import { StatCard } from './StatCard';
import { DonutChart } from './DonutChart';
import { BarChart } from './BarChart';
import { CheckCircleIcon, DocumentIcon, UserIcon } from './Icons';

interface DashboardViewProps {
    tasks: Task[];
    programmers: ManagedItem[];
    modules: ManagedItem[];
    managedStatuses: ManagedStatus[];
    statusConfig: Record<Status, { color: string; name: string }>;
}

const Widget: React.FC<{ title: string; children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-shadow hover:shadow-xl ${className}`}>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{title}</h2>
        {children}
    </div>
);


export const DashboardView: React.FC<DashboardViewProps> = ({ tasks, programmers, modules, statusConfig }) => {
    
    const kpis = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'Finalizado').length;
        const inProgress = tasks.filter(t => t.status === 'En proceso' || t.status === 'En testeo' || t.status === 'Asignado').length;
        const unassigned = tasks.filter(t => t.status === 'Sin asignar').length;
        return { total, completed, inProgress, unassigned };
    }, [tasks]);

    const statusDistribution = useMemo(() => {
        const statusCounts = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<Status, number>);
        
        // FIX: Refactor to use Object.keys for more robust type inference, resolving the arithmetic operation error.
        return Object.keys(statusCounts)
            .map(name => ({
                name,
                value: statusCounts[name as Status],
                color: statusConfig[name as Status]?.color || '#ccc'
            }))
            .sort((a, b) => b.value - a.value);
    }, [tasks, statusConfig]);

    const programmerWorkload = useMemo(() => {
        return programmers
            .filter(p => p.name !== 'Sin asignar')
            .map(programmer => {
                const assignedTasks = tasks.filter(task =>
                    task.assignments.some(a => a.programmerName === programmer.name)
                );
                const completed = assignedTasks.filter(t => t.status === 'Finalizado').length;
                const active = assignedTasks.length - completed;
                
                return {
                    name: programmer.name,
                    values: [
                        { value: active, color: programmer.color, label: 'Activas' },
                        { value: completed, color: '#059669', label: 'Finalizadas' } // emerald-600
                    ]
                };
            })
            .sort((a, b) => {
                const totalA = a.values.reduce((sum, v) => sum + v.value, 0);
                const totalB = b.values.reduce((sum, v) => sum + v.value, 0);
                return totalB - totalA;
            });
    }, [tasks, programmers]);


    const moduleDistribution = useMemo(() => {
        const moduleCounts = tasks.reduce((acc, task) => {
            acc[task.module] = (acc[task.module] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return modules
            .map(m => ({
                name: m.name,
                values: [{
                    value: moduleCounts[m.name] || 0,
                    color: m.color
                }]
            }))
            .filter(m => m.values[0].value > 0)
            .sort((a, b) => b.values[0].value - a.values[0].value);

    }, [tasks, modules]);
    
    const recentActivity = useMemo(() => {
        return tasks
            .filter(t => t.startDate && t.status !== 'Sin asignar' && t.status !== 'Descartado')
            .sort((a, b) => new Date(b.startDate!).getTime() - new Date(a.startDate!).getTime())
            .slice(0, 5);
    }, [tasks]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/50">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard General</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                <StatCard title="Requisitos Totales" value={kpis.total} icon={<DocumentIcon className="w-8 h-8"/>} color="text-blue-500" />
                <StatCard title="Completados" value={kpis.completed} icon={<CheckCircleIcon className="w-8 h-8"/>} color="text-emerald-500" />
                <StatCard title="En Progreso" value={kpis.inProgress} icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="text-amber-500" />
                <StatCard title="Sin Asignar" value={kpis.unassigned} icon={<UserIcon className="w-8 h-8"/>} color="text-gray-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <Widget title="Distribución por Estado" className="xl:col-span-2">
                   <DonutChart data={statusDistribution} />
                </Widget>

                <Widget title="Carga de Trabajo (Activas / Finalizadas)">
                    <BarChart data={programmerWorkload} orientation="horizontal" />
                </Widget>
                
                <Widget title="Requisitos por Módulo" className="lg:col-span-2 xl:col-span-2">
                    <BarChart data={moduleDistribution} orientation="vertical" />
                </Widget>
                
                <Widget title="Actividad Reciente">
                    <ul className="space-y-4">
                        {recentActivity.map(task => (
                            <li key={task.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                <span className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-brand-primary dark:text-indigo-400">
                                    <DocumentIcon className="w-5 h-5" />
                                </span>
                                <div>
                                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">{task.requirement}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {task.id} &bull; Iniciado en {new Date(task.startDate!).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Widget>
            </div>
        </div>
    );
};