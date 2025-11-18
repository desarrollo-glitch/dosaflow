import React, { useState, useMemo } from 'react';
import { DailyLog, ManagedItem, Meeting, Task } from '../types';
import { DailyLogModal } from './DailyLogModal';
import { DailySummaryModal } from './DailySummaryModal';
import { EditIcon, PlusIcon, ChatBubbleLeftRightIcon } from './Icons';

type ViewMode = 'month' | 'week' | 'day';

interface DailyLogViewProps {
  programmers: ManagedItem[];
  dailyLogs: DailyLog[];
  meetings: Meeting[];
  tasks: Task[];
  onSaveLog: (log: Omit<DailyLog, 'id' | 'docId'>) => void;
  onDeleteLog: (date: string, programmerId: string) => Promise<void>;
  onProcessSummary: (date: string, summary: string) => Promise<void>;
  onOpenMeetingModal: (date: string) => void;
  onOpenMeetingDetailsModal: (meeting: Meeting) => void;
}

const getWeekDays = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);

    const weekDays: Date[] = [];
    for (let i = 0; i < 5; i++) {
        const weekDay = new Date(startOfWeek);
        weekDay.setDate(startOfWeek.getDate() + i);
        weekDays.push(weekDay);
    }
    return weekDays;
};

const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) => {
    return date.toLocaleDateString('es-ES', options).replace(/^\w/, c => c.toUpperCase());
};

const toDateString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

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

type ParsedLogLine = { label: string; completed: boolean };

const parseLogLines = (text: string): ParsedLogLine[] => {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const normalized = line.toLowerCase();
            const isDone = normalized.startsWith('- [x]') || normalized.startsWith('[x]') || normalized.startsWith('✅');
            const label = line.replace(/^- \[(x| )\]\s*/i, '').replace(/^\[(x| )\]\s*/i, '').replace(/^✅\s*/, '').trim();
            return { label: label || line, completed: isDone };
        });
};

const reconstructLogText = (lines: ParsedLogLine[]) => {
    return lines.map(l => `- [${l.completed ? 'x' : ' '}] ${l.label}`).join('\n');
};


export const DailyLogView: React.FC<DailyLogViewProps> = ({ programmers, dailyLogs, meetings, tasks, onSaveLog, onProcessSummary, onDeleteLog, onOpenMeetingModal, onOpenMeetingDetailsModal }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [logModalState, setLogModalState] = useState<{ isOpen: boolean; date: string; programmer: ManagedItem | null; initialText: string }>({ isOpen: false, date: '', programmer: null, initialText: '' });
    const [summaryModalState, setSummaryModalState] = useState<{ isOpen: boolean; date: string }>({ isOpen: false, date: '' });
    const [addingProgrammerToDate, setAddingProgrammerToDate] = useState<string | null>(null);
   
    const dailyLogsMap = useMemo(() => {
        const map = new Map<string, string>(); // Key: 'YYYY-MM-DD_programmerId', Value: text
        dailyLogs.forEach(log => {
            map.set(`${log.date}_${log.programmerId}`, log.text);
        });
        return map;
    }, [dailyLogs]);
    
    const meetingsByDate = useMemo(() => {
        const map = new Map<string, Meeting[]>();
        meetings.forEach(meeting => {
            if (!map.has(meeting.date)) {
                map.set(meeting.date, []);
            }
            map.get(meeting.date)!.push(meeting);
        });
        return map;
    }, [meetings]);

    const handleOpenLogModal = (date: string, programmer: ManagedItem) => {
        const initialText = dailyLogsMap.get(`${date}_${programmer.id}`) || '';
        setLogModalState({ isOpen: true, date, programmer, initialText });
    };

    const handleSaveLog = (log: Omit<DailyLog, 'id' | 'docId'>) => {
        onSaveLog(log);
        setLogModalState({ isOpen: false, date: '', programmer: null, initialText: '' });
    };

    const handleToggleLogLine = (date: string, programmerId: string, index: number) => {
        const currentLogText = dailyLogsMap.get(`${date}_${programmerId}`) || '';
        const parsed = parseLogLines(currentLogText);
        if (!parsed[index]) return;
        const updated = parsed.map((line, i) => i === index ? { ...line, completed: !line.completed } : line);
        const newText = reconstructLogText(updated);
        onSaveLog({ date, programmerId, text: newText });
    };
    
    const handleDeleteLog = async (date: string, programmerId: string) => {
        await onDeleteLog(date, programmerId);
        setLogModalState({ isOpen: false, date: '', programmer: null, initialText: '' });
    };

    const handleOpenSummaryModal = (date: string) => {
        setSummaryModalState({ isOpen: true, date });
    };

    const handleProcessSummary = async (date: string, summary: string) => {
        await onProcessSummary(date, summary);
        setSummaryModalState({ isOpen: false, date: '' });
    };
    
    const changeDate = (offset: number) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + offset);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + offset * 7);
        } else if (viewMode === 'day') {
            let currentDay = newDate.getDate();
            let newDay = newDate;
            do {
                currentDay += offset;
                newDay.setDate(currentDay);
            } while (newDay.getDay() === 0 || newDay.getDay() === 6); // Skip weekends
             newDate.setDate(currentDay);
        }
        setCurrentDate(newDate);
    };
    
    const handleToggleAddMode = (dateStr: string) => {
        setAddingProgrammerToDate(prevDate => (prevDate === dateStr ? null : dateStr));
    };

    const renderHeader = () => {
        let title = '';
        if (viewMode === 'month') {
            title = formatDate(currentDate, { month: 'long', year: 'numeric' });
        } else if (viewMode === 'week') {
            const weekDays = getWeekDays(currentDate);
            const start = formatDate(weekDays[0], { day: 'numeric', month: 'long' });
            const end = formatDate(weekDays[4], { day: 'numeric', month: 'long', year: 'numeric' });
            title = `Semana del ${start} al ${end}`;
        } else {
            title = formatDate(currentDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
        
        return (
             <header className="flex justify-between items-center mb-6 flex-shrink-0">
                <div></div>
                <div className="flex items-center space-x-4">
                     <div className="p-1 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center space-x-1">
                        {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                                    viewMode === mode
                                        ? 'bg-white dark:bg-gray-900 text-brand-primary shadow'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                                }`}
                            >
                                {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
                            </button>
                        ))}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 w-96 text-center">{title}</h2>
                    <div className="flex space-x-2">
                        <button onClick={() => changeDate(-1)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">&lt;</button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Hoy</button>
                        <button onClick={() => changeDate(1)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">&gt;</button>
                    </div>
                </div>
            </header>
        );
    };

    const renderMonthView = () => {
        const { month, year, daysInMonth } = {
            month: currentDate.getMonth(),
            year: currentDate.getFullYear(),
            daysInMonth: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(),
        };

        let firstWorkday = 1;
        let firstWorkdayDate: Date | undefined;
        while (firstWorkday <= daysInMonth) {
            firstWorkdayDate = new Date(year, month, firstWorkday);
            const dayOfWeek = firstWorkdayDate.getDay();
            if (dayOfWeek > 0 && dayOfWeek < 6) break;
            firstWorkday++;
        }

        const firstWorkdayOfWeek = firstWorkdayDate ? firstWorkdayDate.getDay() : 1;
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const weekdayCells = days
            .map((day) => {
                const dayDate = new Date(year, month, day);
                if (dayDate.getDay() === 0 || dayDate.getDay() === 6) return null;

                const dateStr = toDateString(dayDate);
                const isToday = toDateString(new Date()) === dateStr;
                
                const programmersWithLogs = programmers.filter(p => dailyLogsMap.has(`${dateStr}_${p.id}`));
                const programmersWithoutLogs = programmers.filter(p => !dailyLogsMap.has(`${dateStr}_${p.id}`));
                const meetingsOnThisDay = meetingsByDate.get(dateStr) || [];

                return (
                    <div key={dateStr} style={day === firstWorkday ? { gridColumnStart: firstWorkdayOfWeek } : {}} className={`min-h-[120px] p-2 flex flex-col relative transition-colors ${isToday ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-white dark:bg-gray-900'}`}>
                        <div className={`text-lg font-bold text-right ${isToday ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'}`}>{day}</div>
                        <div className="absolute top-2 left-2 flex items-center space-x-1">
                            <button onClick={() => onOpenMeetingModal(dateStr)} className="p-1 rounded-md text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-300" title="Registrar reunión">
                                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleOpenSummaryModal(dateStr)} className="p-1 rounded-md text-gray-400 hover:bg-yellow-100 hover:text-yellow-600 dark:hover:bg-gray-700 dark:hover:text-yellow-400" title="Resumen con IA">
                                <EditIcon className="w-4 h-4" />
                            </button>
                            {programmersWithoutLogs.length > 0 && (
                                <button onClick={() => handleToggleAddMode(dateStr)} className="p-1 rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200" title="Añadir parte">
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="mt-1 space-y-1 overflow-y-auto">
                             {meetingsOnThisDay.map(meeting => (
                                <div
                                    key={meeting.id}
                                    onClick={() => onOpenMeetingDetailsModal(meeting)}
                                    className="flex items-center cursor-pointer p-1 rounded-md bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/70"
                                    title={`Reunión: ${meeting.requirementName}`}
                                >
                                    <ChatBubbleLeftRightIcon className="w-3 h-3 mr-1.5 text-blue-600 dark:text-blue-300 flex-shrink-0" />
                                    <span className="text-xs font-medium text-blue-800 dark:text-blue-200 truncate">{meeting.requirementName}</span>
                                </div>
                            ))}
                            {programmersWithLogs.map(p => (
                                <div key={p.id} onClick={() => handleOpenLogModal(dateStr, p)} className="flex items-center cursor-pointer p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                    <span className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: p.color }}></span>
                                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{p.name}</span>
                                </div>
                            ))}
                            {addingProgrammerToDate === dateStr && programmersWithoutLogs.map(p => (
                                <div key={p.id} onClick={() => handleOpenLogModal(dateStr, p)} className="flex items-center cursor-pointer p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 opacity-70">
                                    <span className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ring-2 ring-offset-1 dark:ring-offset-gray-900 ring-gray-300 dark:ring-gray-600"></span>
                                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{p.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })
            .filter(Boolean);

        return (
            <div className="flex flex-col h-full">
                <div className="sticky top-0 z-10 grid grid-cols-5">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(day => (
                        <div key={day} className="py-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">{day}</div>
                    ))}
                </div>
                <div className="grid flex-grow grid-cols-5 gap-px bg-gray-200 dark:bg-gray-700 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg">
                    {weekdayCells.length > 0 ? weekdayCells : (
                        <div className="col-span-5 bg-white dark:bg-gray-900 min-h-[120px] flex items-center justify-center text-gray-500">
                            No hay días laborables en este mes.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const weekDays = getWeekDays(currentDate);

        return (
            <div className="grid grid-cols-5 gap-4">
                {weekDays.map(day => {
                    const dateStr = toDateString(day);
                    const isToday = toDateString(new Date()) === dateStr;
                    const programmersWithLogs = programmers.filter(p => dailyLogsMap.has(`${dateStr}_${p.id}`));
                    const programmersWithoutLogs = programmers.filter(p => !dailyLogsMap.has(`${dateStr}_${p.id}`));
                    const meetingsOnThisDay = meetingsByDate.get(dateStr) || [];

                    return (
                        <div key={dateStr} className={`rounded-lg p-4 flex flex-col ${isToday ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                    {formatDate(day, { weekday: 'long', day: 'numeric' })}
                                </h3>
                                <div className="flex items-center space-x-1">
                                    <button onClick={() => onOpenMeetingModal(dateStr)} className="p-1.5 rounded-md text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-300" title="Registrar reunión">
                                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleOpenSummaryModal(dateStr)} className="p-1.5 rounded-md text-gray-400 hover:bg-yellow-100 hover:text-yellow-600 dark:hover:bg-gray-700 dark:hover:text-yellow-400" title="Resumen con IA">
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                     {programmersWithoutLogs.length > 0 && (
                                        <button onClick={() => handleToggleAddMode(dateStr)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200" title="Añadir parte">
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 overflow-y-auto">
                                {meetingsOnThisDay.map(meeting => (
                                    <div
                                        key={meeting.id}
                                        onClick={() => onOpenMeetingDetailsModal(meeting)}
                                        className="p-2 rounded-lg cursor-pointer bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/70"
                                    >
                                        <div className="flex items-center">
                                            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-300 flex-shrink-0" />
                                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Reunión</p>
                                        </div>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 pl-6 truncate">{meeting.requirementName}</p>
                                    </div>
                                ))}
                                {programmersWithLogs.map(p => {
                                    const logText = dailyLogsMap.get(`${dateStr}_${p.id}`) || '';
                                    const logLines = parseLogLines(logText);
                                    return (
                                        <div key={p.id} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                            <div className="flex items-center">
                                                <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: p.color }}></span>
                                                <button onClick={() => handleOpenLogModal(dateStr, p)} className="text-left text-sm font-semibold text-gray-700 dark:text-gray-200 hover:underline">
                                                    {p.name}
                                                </button>
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                {logLines.length === 0 && (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 pl-5 italic">Sin tareas registradas.</p>
                                                )}
                                                {logLines.map((line, idx) => (
                                                    <label key={`${p.id}-${idx}`} className="flex items-start space-x-2 text-xs text-gray-700 dark:text-gray-200 pl-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={line.completed}
                                                            onChange={() => handleToggleLogLine(dateStr, p.id, idx)}
                                                            className="mt-[2px] h-3.5 w-3.5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                                                        />
                                                        <span className={line.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}>{line.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {addingProgrammerToDate === dateStr && (
                                    <>
                                        <div className="border-t border-dashed border-gray-200 dark:border-gray-600 my-2"></div>
                                        {programmersWithoutLogs.map(p => (
                                             <div key={p.id} onClick={() => handleOpenLogModal(dateStr, p)} className="p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 opacity-70">
                                                <div className="flex items-center">
                                                    <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0 ring-2 ring-gray-300 dark:ring-gray-500"></span>
                                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{p.name}</p>
                                                </div>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 pl-5 italic">Sin parte</p>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDayView = () => {
        const dateStr = toDateString(currentDate);
        const programmersWithLogs = programmers.filter(p => dailyLogsMap.has(`${dateStr}_${p.id}`));
        const programmersWithoutLogs = programmers.filter(p => !dailyLogsMap.has(`${dateStr}_${p.id}`));
        const meetingsOnThisDay = meetingsByDate.get(dateStr) || [];

        return (
            <div className="space-y-4">
                 <div className="flex items-center space-x-2 p-3 mb-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Acciones del día:</span>
                    <button
                        onClick={() => onOpenMeetingModal(dateStr)}
                        className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60"
                    >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        <span>Reunión</span>
                    </button>
                    <button
                        onClick={() => handleOpenSummaryModal(dateStr)}
                        className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        <EditIcon className="w-4 h-4" />
                        <span>Resumen IA</span>
                    </button>
                </div>
                 {meetingsOnThisDay.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Reuniones</h4>
                        <div className="space-y-2">
                            {meetingsOnThisDay.map(meeting => {
                                const taskForMeeting = tasks.find(t => t.id === meeting.requirementId);
                                const participants = taskForMeeting ? taskForMeeting.assignments.map(a => a.programmerName).filter(name => name !== 'Sin asignar') : [];
                                
                                return (
                                 <div
                                    key={meeting.id}
                                    onClick={() => onOpenMeetingDetailsModal(meeting)}
                                    className="p-3 rounded-lg cursor-pointer bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/70"
                                 >
                                    <div className="flex items-start">
                                         <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
                                         <div className="flex-grow">
                                            <p className="font-semibold text-blue-800 dark:text-blue-200">Reunión sobre "{meeting.requirementName}"</p>
                                            <p className="text-xs text-blue-600 dark:text-blue-400">Haz clic para ver detalles y tareas asignadas.</p>
                                             {participants.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {participants.map(name => {
                                                        const programmer = programmers.find(p => p.name === name);
                                                        const color = programmer?.color || '#ccc';
                                                        const textColor = isColorLight(color) ? 'text-gray-800' : 'text-white';
                                                        return (
                                                            <span key={name} style={{backgroundColor: color}} className={`px-2 py-0.5 text-xs font-semibold rounded-full ${textColor}`}>
                                                                {name}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                         </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                 )}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {programmersWithLogs.map(p => {
                        const logText = dailyLogsMap.get(`${dateStr}_${p.id}`) || '';
                        const logLines = parseLogLines(logText);
                        
                        return (
                            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                        <span className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: p.color }}></span>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{p.name}</h3>
                                    </div>
                                    <button onClick={() => handleOpenLogModal(dateStr, p)} className="text-gray-400 hover:text-brand-primary">
                                        <EditIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                                <div className="flex-grow min-h-[100px] space-y-2">
                                    {logLines.length === 0 && (
                                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">Sin tareas registradas.</p>
                                    )}
                                    {logLines.map((line, idx) => (
                                        <label key={`${p.id}-${idx}`} className="flex items-start space-x-3 text-sm text-gray-700 dark:text-gray-200">
                                            <input
                                                type="checkbox"
                                                checked={line.completed}
                                                onChange={() => handleToggleLogLine(dateStr, p.id, idx)}
                                                className="mt-[3px] h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                                            />
                                            <span className={line.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}>{line.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {programmersWithoutLogs.length > 0 && (
                     <div className="mt-8">
                        <button onClick={() => handleToggleAddMode(dateStr)} className="flex items-center space-x-2 text-lg font-semibold text-gray-600 dark:text-gray-400 hover:text-brand-primary">
                            <PlusIcon className="w-6 h-6"/>
                            <span>Añadir Parte Faltante</span>
                        </button>
                        {addingProgrammerToDate === dateStr && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                                {programmersWithoutLogs.map(p => (
                                    <div key={p.id} onClick={() => handleOpenLogModal(dateStr, p)} className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-primary hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                        <div className="flex items-center">
                                            <span className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: p.color }}></span>
                                            <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">{p.name}</h3>
                                        </div>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Añadir parte</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            {renderHeader()}
            <div className="flex-grow overflow-y-auto">
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
            </div>
            
            <DailyLogModal
                isOpen={logModalState.isOpen}
                onClose={() => setLogModalState({ ...logModalState, isOpen: false, programmer: null })}
                onSave={handleSaveLog}
                onDelete={handleDeleteLog}
                date={logModalState.date}
                programmer={logModalState.programmer}
                initialText={logModalState.initialText}
            />

            <DailySummaryModal
                isOpen={summaryModalState.isOpen}
                date={summaryModalState.date}
                onSave={(summary) => handleProcessSummary(summaryModalState.date, summary)}
                onClose={() => setSummaryModalState({ ...summaryModalState, isOpen: false })}
            />
        </div>
    );
};
