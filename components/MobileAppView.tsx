import React, { useMemo, useState } from 'react';
import { Task, Meeting, DailyLog, ManagedItem } from '../types';
import {
    CalendarIcon,
    PlusIcon,
    UsersIcon,
    ListBulletIcon,
    EditIcon,
    RefreshIcon,
    LightbulbIcon,
    DashboardIcon,
    ChatBubbleLeftRightIcon,
    LinkIcon
} from './Icons';

interface MobileAppViewProps {
    userName?: string | null;
    tasks: Task[];
    programmers: ManagedItem[];
    meetings: Meeting[];
    dailyLogs: DailyLog[];
    onEditTask: (task: Task) => void;
    onOpenMeetingModal: () => void;
    onOpenMeetingDetails: (meeting: Meeting) => void;
    onForceDesktop: () => void;
    onToggleTheme: () => void;
    isDarkMode: boolean;
    onRefresh: () => void;
}

type MobileSection = 'overview' | 'tasks' | 'meetings' | 'logs';

const sections: { id: MobileSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Inicio', icon: <DashboardIcon className="w-4 h-4" /> },
    { id: 'tasks', label: 'Requisitos', icon: <UsersIcon className="w-4 h-4" /> },
    { id: 'meetings', label: 'Reuniones', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'logs', label: 'Bitácora', icon: <ListBulletIcon className="w-4 h-4" /> },
];

const formatDate = (date: string) => {
    if (!date) return 'Sin fecha';
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: '2-digit'
    });
};

const limitText = (text: string, max = 120) => {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max)}…` : text;
};

const statusColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes('final')) return '#10b981';
    if (normalized.includes('pausa') || normalized.includes('bloque')) return '#f59e0b';
    if (normalized.includes('curso')) return '#3b82f6';
    return '#6366f1';
};

const getMeetingEndTimestamp = (meeting: Meeting) => {
    const time = meeting.endTime || '23:59';
    const parsed = meeting.date ? new Date(`${meeting.date}T${time}`) : new Date(NaN);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const getMeetingTimeRange = (meeting: Meeting) => meeting.startTime && meeting.endTime
    ? `${meeting.startTime} - ${meeting.endTime}`
    : 'Hora no registrada';

export const MobileAppView: React.FC<MobileAppViewProps> = ({
    userName,
    tasks,
    programmers,
    meetings,
    dailyLogs,
    onEditTask,
    onOpenMeetingModal,
    onOpenMeetingDetails,
    onForceDesktop,
    onToggleTheme,
    isDarkMode,
    onRefresh,
}) => {
    const [activeSection, setActiveSection] = useState<MobileSection>('overview');
    const [taskQuery, setTaskQuery] = useState('');

    const programmerMap = useMemo(() => {
        const map = new Map<string, ManagedItem>();
        programmers.forEach(p => map.set(p.id, p));
        return map;
    }, [programmers]);

    const taskStats = useMemo(() => {
        const active = tasks.filter(t => t.status !== 'Finalizado').length;
        const finished = tasks.length - active;
        const unassigned = tasks.filter(t => t.assignments.length === 0 || t.assignments.every(a => a.programmerName === 'Sin asignar')).length;
        return { total: tasks.length, active, finished, unassigned };
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        const q = taskQuery.trim().toLowerCase();
        const base = q
            ? tasks.filter(task =>
                [task.requirement, task.module, task.status, ...task.assignments.map(a => a.programmerName)]
                    .filter(Boolean)
                    .some(value => value!.toLowerCase().includes(q))
            )
            : tasks;
        return base.slice(0, 30);
    }, [taskQuery, tasks]);

    const upcomingMeetings = useMemo(() => {
        return [...meetings]
            .sort((a, b) => getMeetingEndTimestamp(a) - getMeetingEndTimestamp(b))
            .slice(0, 5);
    }, [meetings]);

    const logsByDate = useMemo(() => {
        const map = new Map<string, DailyLog[]>();
        dailyLogs.forEach(log => {
            if (!map.has(log.date)) map.set(log.date, []);
            map.get(log.date)!.push(log);
        });
        return Array.from(map.entries())
            .sort((a, b) => (a[0] > b[0] ? -1 : 1))
            .slice(0, 5);
    }, [dailyLogs]);

    const statCards = [
        {
            title: 'Requisitos activos',
            value: taskStats.active,
            subtitle: `de ${taskStats.total} totales`,
            classes: 'bg-gradient-to-br from-[#4338ca] via-[#4f46e5] to-[#7c3aed]',
            badge: 'bg-white/20 text-white',
            icon: <DashboardIcon className="w-5 h-5" />,
        },
        {
            title: 'Finalizados',
            value: taskStats.finished,
            subtitle: `+${Math.max(taskStats.finished - taskStats.unassigned, 0)} este curso`,
            classes: 'bg-gradient-to-br from-[#0f766e] via-[#14b8a6] to-[#22d3ee]',
            badge: 'bg-white/20 text-white',
            icon: <LightbulbIcon className="w-5 h-5" />,
        },
        {
            title: 'Sin asignar',
            value: taskStats.unassigned,
            subtitle: 'Pendientes de reparto',
            classes: 'bg-gradient-to-br from-[#f97316] via-[#fb923c] to-[#facc15]',
            badge: 'bg-black/10 text-white',
            icon: <UsersIcon className="w-5 h-5" />,
        },
        {
            title: 'Reuniones próximas',
            value: upcomingMeetings.length,
            subtitle: 'Siguiente mes',
            classes: 'bg-gradient-to-br from-[#7c3aed] via-[#a855f7] to-[#ec4899]',
            badge: 'bg-white/20 text-white',
            icon: <CalendarIcon className="w-5 h-5" />,
        },
    ];

    const renderOverview = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {statCards.map(card => (
                    <div key={card.title} className={`rounded-2xl p-4 text-white shadow-lg ${card.classes}`}>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs uppercase tracking-wide opacity-80">{card.title}</p>
                            <span className={`rounded-full p-1 ${card.badge}`}>{card.icon}</span>
                        </div>
                        <p className="text-2xl font-extrabold">{card.value}</p>
                        <p className="text-xs opacity-80">{card.subtitle}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl border border-indigo-50 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Próximas reuniones</h3>
                        <p className="text-xs text-gray-500">Planifica la semana</p>
                    </div>
                    <button onClick={onOpenMeetingModal} className="flex items-center gap-1 text-xs font-semibold text-brand-primary">
                        <PlusIcon className="w-3.5 h-3.5" /> Nueva
                    </button>
                </div>
                {upcomingMeetings.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay reuniones agendadas.</p>
                ) : (
                    <div className="space-y-3">
                {upcomingMeetings.map(meeting => {
                    const isPrivate = (meeting.visibility || 'public') === 'private';
                    const gradient = isPrivate
                        ? 'from-emerald-50 to-green-50 dark:from-emerald-900/60 dark:to-emerald-900/20 border-emerald-100 dark:border-emerald-800'
                        : 'from-indigo-50 to-blue-50 dark:from-gray-900/60 dark:to-gray-900/20 border-indigo-100 dark:border-gray-700';
                    return (
                    <button
                        key={meeting.id}
                        onClick={() => onOpenMeetingDetails(meeting)}
                        className={`w-full text-left bg-gradient-to-r rounded-xl p-3 border ${gradient}`}
                    >
                        <p className="text-xs text-indigo-600 dark:text-indigo-300 flex items-center gap-2 font-semibold">
                            <CalendarIcon className="w-4 h-4" /> {formatDate(meeting.date)}
                        </p>
                        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{meeting.requirementName}</p>
                        <p className="text-xs text-gray-500">{getMeetingTimeRange(meeting)}</p>
                        <p className="text-xs text-gray-500">{limitText(meeting.summary, 80)}</p>
                    </button>
                );
                })}
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl border border-amber-50 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Últimos partes diarios</h3>
                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-amber-500" />
                </div>
                {logsByDate.length === 0 ? (
                    <p className="text-sm text-gray-500">Todavía no hay registros esta semana.</p>
                ) : (
                    logsByDate.slice(0, 2).map(([date, logs]) => (
                        <div key={date} className="mb-3 last:mb-0 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40">
                            <p className="text-xs uppercase text-gray-500 flex items-center gap-2">
                                <ListBulletIcon className="w-4 h-4" /> {formatDate(date)}
                            </p>
                            <ul className="mt-2 space-y-1">
                                {logs.slice(0, 2).map(log => (
                                    <li key={log.id} className="text-sm text-gray-700 dark:text-gray-200 flex flex-col border-l-2 border-brand-primary pl-2">
                                        <span className="font-semibold">{programmerMap.get(log.programmerId)?.name || 'Desconocido'}</span>
                                        <span className="text-xs opacity-80">{limitText(log.text, 70)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderTasks = () => (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    value={taskQuery}
                    onChange={(e) => setTaskQuery(e.target.value)}
                    placeholder="Buscar requisito, módulo o programador..."
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                />
                <button onClick={onRefresh} className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    <RefreshIcon className="w-4 h-4" />
                </button>
            </div>
            {filteredTasks.length === 0 ? (
                <p className="text-sm text-gray-500">No hay requisitos que coincidan con la búsqueda.</p>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map(task => {
                        const firstAssignment = task.assignments[0];
                        const pillColor = statusColor(task.status);
                        return (
                            <div key={task.id} className="bg-gradient-to-br from-white via-white to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-3 space-y-2 border border-indigo-50 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase text-gray-500 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-900">
                                        {task.module || 'Sin módulo'}
                                    </span>
                                    <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${pillColor}22`, color: pillColor }}>
                                        {task.status}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{task.requirement}</p>
                                <p className="text-xs text-gray-500">{task.id}</p>
                                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-1 font-semibold">
                                        <UsersIcon className="w-3.5 h-3.5" />
                                        {firstAssignment?.programmerName || 'Sin asignar'}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {task.link && (
                                            <a href={task.link} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-brand-primary">
                                                <LinkIcon className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        <button onClick={() => onEditTask(task)} className="flex items-center gap-1 text-brand-primary">
                                            <EditIcon className="w-3.5 h-3.5" /> Abrir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderMeetings = () => (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button onClick={onOpenMeetingModal} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-indigo-600 text-white rounded-full shadow-lg">
                    <PlusIcon className="w-4 h-4" /> Registrar reunión
                </button>
            </div>
            {meetings.length === 0 ? (
                <p className="text-sm text-gray-500">Sin reuniones registradas todavía.</p>
            ) : (
                meetings
                    .sort((a, b) => getMeetingEndTimestamp(b) - getMeetingEndTimestamp(a))
                    .slice(0, 20)
                    .map(meeting => {
                        const isPrivate = (meeting.visibility || 'public') === 'private';
                        const base = isPrivate ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700';
                        return (
                        <button
                            key={meeting.id}
                            onClick={() => onOpenMeetingDetails(meeting)}
                            className={`w-full text-left rounded-2xl shadow-sm p-3 space-y-1 border ${base}`}
                        >
                            <p className="text-xs uppercase text-gray-500">{formatDate(meeting.date)}</p>
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{meeting.requirementName}</p>
                            <p className="text-xs text-gray-500">{getMeetingTimeRange(meeting)}</p>
                            <p className="text-xs text-gray-500">{limitText(meeting.summary, 100)}</p>
                        </button>
                        );
                    })
            )}
        </div>
    );

    const renderLogs = () => (
        <div className="space-y-4">
            {logsByDate.length === 0 ? (
                <p className="text-sm text-gray-500">No hay parte diario registrado recientemente.</p>
            ) : (
                logsByDate.map(([date, logs]) => (
                    <div key={date} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 space-y-2 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-xs uppercase text-gray-500">
                            <ListBulletIcon className="w-4 h-4" /> {formatDate(date)}
                        </div>
                        {logs.map(log => (
                            <div key={log.id} className="text-sm text-gray-800 dark:text-gray-100 border-t border-gray-100 dark:border-gray-700 pt-2">
                                <p className="font-semibold text-xs text-brand-primary">{programmerMap.get(log.programmerId)?.name || 'Desconocido'}</p>
                                <p className="text-sm whitespace-pre-wrap mt-1">{limitText(log.text, 160)}</p>
                            </div>
                        ))}
                    </div>
                ))
            )}
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'tasks':
                return renderTasks();
            case 'meetings':
                return renderMeetings();
            case 'logs':
                return renderLogs();
            case 'overview':
            default:
                return renderOverview();
        }
    };

    return (
        <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gradient-to-b from-[#f4f4ff] via-white to-white text-gray-900'}`}>
            <header className="bg-gradient-to-r from-[#4c1d95] via-[#6d28d9] to-[#9333ea] text-white px-4 py-5 shadow-2xl rounded-b-3xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-white/80">DosaFlow / Móvil</p>
                        <p className="text-2xl font-bold">{userName || 'Invitado'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onToggleTheme} className="px-3 py-2 text-xs rounded-full bg-white/20 backdrop-blur">
                            {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
                        </button>
                        <button onClick={onForceDesktop} className="px-3 py-2 text-xs rounded-full bg-white text-brand-primary">
                            Versión completa
                        </button>
                    </div>
                </div>
                <div className="flex mt-4 bg-white/30 rounded-full p-1 backdrop-blur border border-white/40">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex-1 text-sm font-semibold px-2 py-1 rounded-full transition-colors ${
                                activeSection === section.id
                                    ? 'bg-white text-brand-primary shadow'
                                    : 'text-white/80'
                            }`}
                        >
                            <span className="flex items-center justify-center gap-1">
                                {section.icon}
                                {section.label}
                            </span>
                        </button>
                    ))}
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-4 -mt-6">
                {renderContent()}
            </main>
        </div>
    );
};
