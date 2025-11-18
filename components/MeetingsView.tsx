
import React, { useState, useMemo } from 'react';
import { Meeting, Task, ManagedItem, MeetingTask } from '../types';
import { PlusIcon, UsersIcon, CheckBadgeIcon, CheckCircleIcon } from './Icons';
import { MeetingCard } from './MeetingCard';
import { StatCard } from './StatCard';
import { BarChart } from './BarChart';
import { DonutChart } from './DonutChart';

type SubView = 'timeline' | 'byRequirement' | 'byProgrammer' | 'stats';

interface MeetingsViewProps {
    meetings: Meeting[];
    tasks: Task[];
    programmers: ManagedItem[];
    onOpenMeetingModal: () => void;
    onOpenMeetingDetailsModal: (meeting: Meeting) => void;
    onUpdateMeeting: (updatedMeeting: Meeting, originalDocId: string) => Promise<void>;
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

// --- SUB-VIEWS ---

const TimelineView: React.FC<Omit<MeetingsViewProps, 'onOpenMeetingModal' | 'onUpdateMeeting'>> = ({ meetings, tasks, programmers, onOpenMeetingDetailsModal }) => {
    const sortedMeetings = useMemo(() => {
        return [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [meetings]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedMeetings.map(meeting => (
                <MeetingCard 
                    key={meeting.docId}
                    meeting={meeting}
                    tasks={tasks}
                    programmers={programmers}
                    onEdit={onOpenMeetingDetailsModal}
                />
            ))}
        </div>
    );
};

const ByRequirementView: React.FC<Omit<MeetingsViewProps, 'onOpenMeetingModal' | 'onUpdateMeeting'>> = ({ meetings, tasks, programmers, onOpenMeetingDetailsModal }) => {
    const groupedMeetings = useMemo(() => {
        const groups: Record<string, Meeting[]> = {};
        meetings.forEach(meeting => {
            if (!groups[meeting.requirementId]) {
                groups[meeting.requirementId] = [];
            }
            groups[meeting.requirementId].push(meeting);
        });
        // Sort meetings within each group
        Object.values(groups).forEach(group => {
            group.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
        return groups;
    }, [meetings]);
    
    const sortedRequirementIds = Object.keys(groupedMeetings).sort((a, b) => {
        const taskA = tasks.find(t => t.id === a);
        const taskB = tasks.find(t => t.id === b);
        return (taskA?.requirement || '').localeCompare(taskB?.requirement || '');
    });

    return (
        <div className="space-y-8">
            {sortedRequirementIds.map(reqId => {
                const requirementName = tasks.find(t => t.id === reqId)?.requirement || `Requisito Desconocido (${reqId})`;
                return (
                    <div key={reqId}>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 pb-2 border-b-2 border-gray-200 dark:border-gray-700">
                            {requirementName}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {groupedMeetings[reqId].map(meeting => (
                                <MeetingCard 
                                    key={meeting.docId}
                                    meeting={meeting}
                                    tasks={tasks}
                                    programmers={programmers}
                                    onEdit={onOpenMeetingDetailsModal}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const ByProgrammerView: React.FC<Omit<MeetingsViewProps, 'onOpenMeetingModal'>> = ({ meetings, tasks, programmers, onOpenMeetingDetailsModal, onUpdateMeeting }) => {
    const tasksByProgrammer = useMemo(() => {
        const programmerMap = new Map<string, { meeting: Meeting; task: MeetingTask }[]>();

        meetings.forEach(meeting => {
            meeting.tasks.forEach(task => {
                const assignees = task.programmer === 'Todos'
                    ? (tasks.find(t => t.id === meeting.requirementId)?.assignments.map(a => a.programmerName) || [])
                    : [task.programmer];
                
                assignees.forEach(assigneeName => {
                     if (assigneeName !== 'Sin asignar') {
                        if (!programmerMap.has(assigneeName)) {
                            programmerMap.set(assigneeName, []);
                        }
                        programmerMap.get(assigneeName)!.push({ meeting, task });
                    }
                });
            });
        });
        
        programmerMap.forEach(tasks => {
            tasks.sort((a, b) => new Date(b.meeting.date).getTime() - new Date(a.meeting.date).getTime());
        });

        return programmerMap;
    }, [meetings, tasks]);
    
    const sortedProgrammerNames = [...tasksByProgrammer.keys()].sort((a, b) => a.localeCompare(b));

    const handleTaskToggle = (meeting: Meeting, taskToToggle: MeetingTask) => {
        const updatedMeeting = JSON.parse(JSON.stringify(meeting));
        // Find the task by its content. This assumes task text is unique for a programmer within a meeting.
        const taskIndex = updatedMeeting.tasks.findIndex((t: MeetingTask) => t.text === taskToToggle.text && t.programmer === taskToToggle.programmer);

        if (taskIndex > -1) {
            updatedMeeting.tasks[taskIndex].completed = !updatedMeeting.tasks[taskIndex].completed;
            onUpdateMeeting(updatedMeeting, meeting.docId);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProgrammerNames.map(name => {
                const programmer = programmers.find(p => p.name === name);
                const assignedTasks = tasksByProgrammer.get(name) || [];
                const color = programmer?.color || '#ccc';
                const textColor = isColorLight(color) ? 'text-gray-800' : 'text-white';
                
                const tasksGroupedByMeeting = assignedTasks.reduce((acc, { meeting, task }) => {
                    if (!acc[meeting.docId]) {
                        acc[meeting.docId] = {
                            meetingInfo: meeting,
                            tasks: []
                        };
                    }
                    acc[meeting.docId].tasks.push(task);
                    return acc;
                }, {} as Record<string, { meetingInfo: Meeting; tasks: MeetingTask[] }>);

                // FIX: Explicitly type sort parameters 'a' and 'b' to resolve TypeScript's
                // failure to infer their type from the context of Object.values(). This addresses
                // the "Property 'meetingInfo' does not exist on type 'unknown'" error.
                const sortedMeetingGroups = Object.values(tasksGroupedByMeeting).sort((
                    a: { meetingInfo: Meeting; tasks: MeetingTask[] },
                    b: { meetingInfo: Meeting; tasks: MeetingTask[] }
                ) => {
                    return new Date(b.meetingInfo.date).getTime() - new Date(a.meetingInfo.date).getTime();
                });

                return (
                    <div key={name} className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
                        <header className="p-4 flex items-center" style={{ backgroundColor: color }}>
                            <h3 className={`text-lg font-bold ${textColor}`}>{name}</h3>
                        </header>
                        <div className="p-4 space-y-4 flex-grow overflow-y-auto">
                            {sortedMeetingGroups.map(({ meetingInfo, tasks: meetingTasks }) => (
                                <div key={meetingInfo.docId} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md">
                                    <div 
                                        className="flex justify-between items-center cursor-pointer hover:opacity-80" 
                                        onClick={() => onOpenMeetingDetailsModal(meetingInfo)}
                                        title="Ver detalles de la reunión"
                                    >
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{meetingInfo.requirementName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(meetingInfo.date + 'T00:00:00').toLocaleDateString('es-ES', { day:'numeric', month: 'long' })}
                                            </p>
                                        </div>
                                    </div>
                                    <ul className="mt-2 pl-1 space-y-1">
                                        {meetingTasks.map((task, index) => (
                                            <li key={index}>
                                                <button
                                                    onClick={() => handleTaskToggle(meetingInfo, task)}
                                                    className="w-full flex items-start text-left p-1 rounded-md transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                                                >
                                                    <span className="mr-3 mt-0.5 flex-shrink-0">
                                                        {task.completed 
                                                            ? <CheckCircleIcon className="w-5 h-5 text-emerald-500" /> 
                                                            : <div className="w-4 h-4 mt-px ml-px border-2 border-gray-400 rounded-full"></div>
                                                        }
                                                    </span>
                                                    <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                                        {task.text}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const StatsView: React.FC<Omit<MeetingsViewProps, 'onOpenMeetingModal' | 'onOpenMeetingDetailsModal' | 'onUpdateMeeting'>> = ({ meetings }) => {
    const stats = useMemo(() => {
        const totalMeetings = meetings.length;
        const allMeetingTasks = meetings.flatMap(m => m.tasks);
        const totalTasksCreated = allMeetingTasks.length;
        const completedTasks = allMeetingTasks.filter(t => t.completed).length;
        const completionRate = totalTasksCreated > 0 ? (completedTasks / totalTasksCreated) * 100 : 0;
        
        const meetingsPerMonth = meetings.reduce((acc, meeting) => {
            const month = meeting.date.substring(0, 7); // YYYY-MM
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { totalMeetings, totalTasksCreated, completedTasks, completionRate, meetingsPerMonth };
    }, [meetings]);

    const meetingsPerMonthData = Object.entries(stats.meetingsPerMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({
            name: new Date(month + '-02').toLocaleDateString('es-ES', { month: 'short', year: '2-digit'}),
            values: [{ value: count, color: '#4f46e5' }]
        }));
    
    const completionRateData = [
        { name: 'Completadas', value: stats.completedTasks, color: '#10b981' },
        { name: 'Pendientes', value: stats.totalTasksCreated - stats.completedTasks, color: '#f59e0b' }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total de Reuniones" value={stats.totalMeetings} icon={<UsersIcon className="w-8 h-8"/>} color="text-blue-500" />
                <StatCard title="Tareas Generadas" value={stats.totalTasksCreated} icon={<PlusIcon className="w-8 h-8"/>} color="text-violet-500" />
                <StatCard title="Tasa de Finalización" value={`${stats.completionRate.toFixed(1)}%`} icon={<CheckBadgeIcon className="w-8 h-8"/>} color="text-emerald-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Reuniones por Mes</h2>
                    <BarChart data={meetingsPerMonthData} orientation="vertical" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Estado de Tareas de Reuniones</h2>
                    <DonutChart data={completionRateData} />
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---

export const MeetingsView: React.FC<MeetingsViewProps> = (props) => {
    const [subView, setSubView] = useState<SubView>('timeline');

    const renderSubView = () => {
        switch(subView) {
            case 'timeline': return <TimelineView {...props} />;
            case 'byRequirement': return <ByRequirementView {...props} />;
            case 'byProgrammer': return <ByProgrammerView {...props} />;
            case 'stats': return <StatsView {...props} />;
            default: return <TimelineView {...props} />;
        }
    };
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            <header className="flex-shrink-0 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Reuniones</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Visualiza, organiza y analiza todas las reuniones del equipo.</p>
                </div>
                <button
                    onClick={props.onOpenMeetingModal}
                    className="bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300 ease-in-out transform hover:-translate-y-px flex items-center space-x-2 self-start sm:self-center"
                >
                    <PlusIcon className="w-5 h-5"/>
                    <span>Crear Reunión</span>
                </button>
            </header>

            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {(['timeline', 'byRequirement', 'byProgrammer', 'stats'] as const).map(tab => {
                         const tabNames: Record<SubView, string> = {
                            timeline: 'Cronología',
                            byRequirement: 'Por Requisito',
                            byProgrammer: 'Por Programador',
                            stats: 'Estadísticas'
                        };
                        return (
                             <button
                                key={tab}
                                onClick={() => setSubView(tab)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    subView === tab
                                        ? 'border-brand-primary text-brand-primary dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                                }`}
                            >
                                {tabNames[tab]}
                            </button>
                        );
                    })}
                </nav>
            </div>
            
            <main className="flex-grow overflow-y-auto">
                {renderSubView()}
            </main>
        </div>
    );
};
