
import React, { useState, useMemo } from 'react';
import { Task, Status, ManagedItem } from '../types';
import { PlusIcon, LinkIcon, WebAppIcon, MobileIcon, PaperclipIcon } from './Icons';
import { SubtaskProgress } from './SubtaskProgress';

interface PlannerViewProps {
  tasks: Task[];
  programmers: ManagedItem[];
  onEdit: (task: Task) => void;
  statusConfig: Record<Status, { color: string; name: string; }>;
  // FIX: Update type to include 'name' for consistency with the data source.
  allItemsConfig: Record<string, { name: string; color: string; }>;
  onOpenPlannerModal: (programmer: ManagedItem, month: string) => void;
  onTaskMove: (taskId: string, oldProgrammerName: string, newProgrammerName: string, newMonth: string) => void;
  onTaskResize: (taskId: string, newDates: { startDate?: string; endDate?: string }) => void;
}

type PlannerTask = Task & {
    endDate: string;
    startDate: string;
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

const darkenColor = (colorStr: string, percent: number): string => {
    if (!colorStr || !colorStr.startsWith('#')) return '#555555'; // Fallback for non-hex colors
    try {
        let num = parseInt(colorStr.slice(1), 16);
        let amt = Math.round(2.55 * percent);
        let R = (num >> 16) - amt;
        let G = ((num >> 8) & 0x00FF) - amt;
        let B = (num & 0x0000FF) - amt;

        R = Math.max(0, Math.min(255, R));
        G = Math.max(0, Math.min(255, G));
        B = Math.max(0, Math.min(255, B));
        
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1).padStart(6, '0')}`;
    } catch (e) {
        return '#555555'; // Fallback on error
    }
};


const monthToNumber = (monthKey: string | undefined): number => {
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return -1;
    const [year, month] = monthKey.split('-').map(Number);
    return year * 12 + (month - 1);
};

const TaskPill: React.FC<{
    task: PlannerTask;
    programmerName: string;
    trackIndex: number;
    monthKeys: string[];
    onEdit: (task: Task) => void;
    handleDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task, programmerName: string) => void;
    handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    // FIX: Update type to include 'name' for consistency with the data source.
    allItemsConfig: Record<string, { name: string; color: string; }>;
    statusConfig: Record<Status, { color: string; name: string; }>;
}> = ({ task, programmerName, trackIndex, monthKeys, onEdit, handleDragStart, handleDragEnd, allItemsConfig, statusConfig }) => {
    const viewStartNum = monthToNumber(monthKeys[0]);
    const viewEndNum = monthToNumber(monthKeys[monthKeys.length - 1]);
    
    const startNum = monthToNumber(task.startDate);
    const endNum = monthToNumber(task.endDate);

    const effectiveStartNum = Math.max(startNum, viewStartNum);
    const effectiveEndNum = Math.min(endNum, viewEndNum);
    
    const startIndex = effectiveStartNum - viewStartNum;
    const duration = effectiveEndNum - effectiveStartNum + 1;
    
    if (startIndex < 0 || duration <= 0) return null;

    const left = `${(startIndex / monthKeys.length) * 100}%`;
    const width = `${(duration / monthKeys.length) * 100}%`;
    const top = `${trackIndex * 7.25 + 0.25}rem`;

    const isDraggable = startNum >= viewStartNum;

    const statusColor = statusConfig[task.status]?.color || '#ccc';
    const headerColor = darkenColor(statusColor, 20); // Darker header based on status color
    const bodyTextColor = isColorLight(statusColor) ? 'text-gray-800' : 'text-white';
        
    let targetIcon;
    switch (task.target) {
        case 'web': targetIcon = <span title="Web"><WebAppIcon className="w-3.5 h-3.5" /></span>; break;
        case 'app': targetIcon = <span title="App"><MobileIcon className="w-3.5 h-3.5" /></span>; break;
        case 'ambos': targetIcon = (<div className="flex items-center" title="Web & App"><WebAppIcon className="w-3 h-3" /><MobileIcon className="w-3 h-3 ml-0.5" /></div>); break;
        default: targetIcon = null;
    }
    
    const borderColor = allItemsConfig[task.status]?.color || '#e5e7eb';

    return (
        <div
            style={{ position: 'absolute', top, left, width, minHeight: '3.5rem' }}
            className="z-10 p-0.5 group"
        >
            <div
                draggable={isDraggable}
                onDragStart={(e) => isDraggable && handleDragStart(e, task, programmerName)}
                onDragEnd={handleDragEnd}
                onClick={() => onEdit(task)}
                className="h-full text-left text-xs shadow-md group-hover:shadow-lg flex flex-col rounded overflow-hidden relative cursor-grab active:cursor-grabbing"
                style={{ border: `1px solid ${borderColor}` }}
                title={`${task.requirement} (${task.module})`}
            >
                 {/* Left Resize Handle */}
                <div
                    draggable
                    onDragStart={(e) => {
                        e.stopPropagation();
                        const dragData = { taskId: task.id, resizeDirection: 'start' };
                        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                        e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={(e) => { e.stopPropagation(); handleDragEnd(e); }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-0 bottom-0 w-2.5 flex items-center justify-center cursor-col-resize z-20"
                >
                    <div className="w-1 h-[60%] bg-black/20 dark:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {/* Main Content */}
                <div 
                    className="px-1.5 py-0.5 text-xs font-bold truncate text-white" 
                    style={{ backgroundColor: headerColor }}
                >
                   {task.module}
                </div>
                <div 
                    style={{ backgroundColor: statusColor }} 
                    className={`relative flex-grow flex flex-col justify-between ${bodyTextColor}`}
                >
                    <div className="p-1.5">
                        <p className="font-semibold break-words leading-tight whitespace-normal">{task.requirement}</p>
                        <p className="text-[10px] opacity-80 break-words">{task.id}</p>
                    </div>
                    
                    <div className="flex justify-between items-center px-1.5 pb-1 h-5">
                        <div className="flex items-center opacity-90">{targetIcon}</div>
                        <div className="flex items-center space-x-2">
                             {task.attachments && task.attachments.length > 0 && (
                                <div className="flex items-center space-x-1" title={`${task.attachments.length} archivos adjuntos`}>
                                    <PaperclipIcon className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">{task.attachments.length}</span>
                                </div>
                            )}
                             <SubtaskProgress subtasks={task.subtasks} />
                            {task.link && (
                                <a href={task.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="z-20 hover:scale-125 transition-transform" title="Abrir enlace externo">
                                    <LinkIcon className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                 {/* Right Resize Handle */}
                <div
                    draggable
                    onDragStart={(e) => {
                        e.stopPropagation();
                        const dragData = { taskId: task.id, resizeDirection: 'end' };
                        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                        e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={(e) => { e.stopPropagation(); handleDragEnd(e); }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-0 bottom-0 w-2.5 flex items-center justify-center cursor-col-resize z-20"
                >
                    <div className="w-1 h-[60%] bg-black/20 dark:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
            </div>
        </div>
    );
};

export const PlannerView: React.FC<PlannerViewProps> = ({ tasks, programmers, onEdit, statusConfig, allItemsConfig, onOpenPlannerModal, onTaskMove, onTaskResize }) => {
    
    const getStartYearOfCurrentCourse = () => {
        const now = new Date();
        return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    };
    
    const [startYearOfCourse, setStartYearOfCourse] = useState(getStartYearOfCurrentCourse());
    
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const courseMonths = useMemo(() => {
        const months = [];
        const monthNamesShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        for (let i = 0; i < 12; i++) {
            const monthIndex = (8 + i) % 12;
            const year = monthIndex >= 8 ? startYearOfCourse : startYearOfCourse + 1;
            months.push({
                key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
                displayName: `${monthNamesShort[monthIndex].toUpperCase()}/${String(year).slice(-2)}`,
            });
        }
        return months;
    }, [startYearOfCourse]);

    const changeCourse = (offset: number) => {
        setStartYearOfCourse(prev => prev + offset);
    };

    const actualProgrammers = useMemo(() => 
        programmers.filter(p => p.name !== 'Sin asignar'), 
    [programmers]);
    
    const plannerLayout = useMemo(() => {
        const viewStartNum = monthToNumber(courseMonths[0].key);
        const viewEndNum = monthToNumber(courseMonths[11].key);

        return actualProgrammers.map(programmer => {
            const programmerTasks = tasks.filter(task => 
                task.assignments.some(a => a.programmerName === programmer.name)
            ).map(task => {
                const latestEndDate = task.assignments
                    .map(a => a.endDate)
                    .filter(Boolean)
                    .sort()
                    .pop();
                
                const plannerStartDate = task.startDate || latestEndDate;
                const plannerEndDate = latestEndDate || task.startDate;

                if (!plannerStartDate || !plannerEndDate) return null;

                return { ...task, startDate: plannerStartDate, endDate: plannerEndDate };
            })
            .filter((task): task is PlannerTask => {
                 if (!task) return false;
                const startNum = monthToNumber(task.startDate);
                const endNum = monthToNumber(task.endDate);
                if (startNum === -1 || endNum === -1 || startNum > endNum) return false;
                return startNum <= viewEndNum && endNum >= viewStartNum;
            })
            .sort((a, b) => {
                const startA = monthToNumber(a.startDate);
                const startB = monthToNumber(b.startDate);
                if (startA !== startB) return startA - startB;
                const endA = monthToNumber(a.endDate);
                const endB = monthToNumber(b.endDate);
                return endA - endB;
            });
            
            const tracks: PlannerTask[][] = [];
            for (const task of programmerTasks) {
                let placed = false;
                const taskStartNum = monthToNumber(task.startDate);
                const taskEndNum = monthToNumber(task.endDate);

                for (const track of tracks) {
                    const hasOverlap = track.some(existingTask => {
                        const existingStartNum = monthToNumber(existingTask.startDate);
                        const existingEndNum = monthToNumber(existingTask.endDate);
                        return taskStartNum <= existingEndNum && taskEndNum >= existingStartNum;
                    });
                    if (!hasOverlap) {
                        track.push(task);
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    tracks.push([task]);
                }
            }
            return { programmer, tracks };
        });

    }, [tasks, actualProgrammers, courseMonths]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task, programmerName: string) => {
        const dragData = { taskId: task.id, oldProgrammerName: programmerName };
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
    };
    
    const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, newProgrammer: ManagedItem, newMonth: string) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-brand-primary/20', 'dark:bg-brand-primary/30');
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));

            if (data.resizeDirection) { // This is a resize operation
                const taskId = data.taskId;
                const task = tasks.find(t => t.id === taskId);
                if (!task) return;

                const latestEndDate = task.assignments.map(a => a.endDate).filter(Boolean).sort().pop();
                const plannerStartDate = task.startDate || latestEndDate;
                const plannerEndDate = latestEndDate || task.startDate;
                
                if (!plannerStartDate || !plannerEndDate) return;

                if (data.resizeDirection === 'start') {
                    const endNum = monthToNumber(plannerEndDate);
                    const newStartNum = monthToNumber(newMonth);
                    if (newStartNum <= endNum) {
                        onTaskResize(taskId, { startDate: newMonth });
                    }
                } else if (data.resizeDirection === 'end') {
                    const startNum = monthToNumber(plannerStartDate);
                    const newEndNum = monthToNumber(newMonth);
                    if (newEndNum >= startNum) {
                        onTaskResize(taskId, { endDate: newMonth });
                    }
                }
            } else if (data.taskId && data.oldProgrammerName) { // This is a move operation
                onTaskMove(data.taskId, data.oldProgrammerName, newProgrammer.name, newMonth);
            }
        } catch (error) {
            console.error("Failed to parse drag data:", error);
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
      e.preventDefault();
      e.currentTarget.classList.add('bg-brand-primary/20', 'dark:bg-brand-primary/30');
    }

    const handleDragLeave = (e: React.DragEvent<HTMLTableCellElement>) => {
      e.currentTarget.classList.remove('bg-brand-primary/20', 'dark:bg-brand-primary/30');
    }

    const endYearOfCourse = startYearOfCourse + 1;
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col h-full">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Planificador Curso: {String(startYearOfCourse).slice(-2)}/{String(endYearOfCourse).slice(-2)}
                    </h2>
                    <div className="flex space-x-2">
                        <button onClick={() => changeCourse(-1)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">&lt;</button>
                        <button onClick={() => changeCourse(1)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">&gt;</button>
                    </div>
                </div>
            </header>
            <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-20">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-60 sticky left-0 bg-gray-50 dark:bg-gray-700 z-30 border-b border-gray-200 dark:border-gray-700">Programador</th>
                            {courseMonths.map(month => (
                                <th key={month.key} className={`px-1 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[10rem] w-40 transition-colors border-b border-l border-gray-200 dark:border-gray-700 ${month.key < currentMonthKey ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>{month.displayName}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                       {plannerLayout.map(({ programmer, tracks }) => {
                            const rowHeight = Math.max(1, tracks.length) * 7.5;
                            return (
                                <React.Fragment key={programmer.id}>
                                    {/* Task Row */}
                                    <tr style={{ height: `${rowHeight}rem` }} className="relative">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 w-60 z-10 align-top">
                                            <div className="flex items-center">
                                                <span className="w-4 h-4 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: programmer.color }}></span>
                                                {programmer.name}
                                            </div>
                                        </td>
                                        
                                        {/* Grid Cells Layer for Dropping */}
                                        {courseMonths.map(month => {
                                            const isPastMonth = month.key < currentMonthKey;
                                            return (
                                                 <td 
                                                     key={month.key} 
                                                     className={`p-0 align-top border-l border-gray-200 dark:border-gray-700 relative transition-colors ${isPastMonth ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`} 
                                                     onDragOver={handleDragOver} 
                                                     onDragLeave={handleDragLeave} 
                                                     onDrop={(e) => handleDrop(e, programmer, month.key)}>
                                                </td>
                                            );
                                        })}
                                        
                                        {/* Tasks Layer (Absolutely Positioned) */}
                                        <td colSpan={courseMonths.length} className="p-0 absolute top-0 left-48 right-0 bottom-0 pointer-events-none">
                                            <div className="relative w-full h-full">
                                                {tracks.map((track, trackIndex) => 
                                                    track.map(task => (
                                                        <div key={task.id} className="pointer-events-auto">
                                                            <TaskPill 
                                                                task={task}
                                                                programmerName={programmer.name}
                                                                trackIndex={trackIndex}
                                                                monthKeys={courseMonths.map(m => m.key)}
                                                                onEdit={onEdit}
                                                                handleDragStart={handleDragStart}
                                                                handleDragEnd={handleDragEnd}
                                                                allItemsConfig={allItemsConfig}
                                                                statusConfig={statusConfig}
                                                            />
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {/* Add Task Row */}
                                    <tr className="h-10">
                                        <td className="sticky left-0 bg-gray-50 dark:bg-gray-800/50 w-60 z-10 border-b-2 border-gray-300 dark:border-gray-600"></td>
                                        {courseMonths.map(month => (
                                            <td key={`${month.key}-add`} className="p-0 align-middle border-l border-t border-gray-200 dark:border-gray-700 border-b-2 border-gray-300 dark:border-gray-600 relative transition-colors group bg-gray-50 dark:bg-gray-800/50">
                                                <button onClick={() => onOpenPlannerModal(programmer, month.key)} className="w-full h-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20" title={`Asignar tarea a ${programmer.name} en ${month.displayName}`}>
                                                    <div className="bg-black/70 rounded-full p-1.5 backdrop-blur-sm shadow-lg">
                                                        <PlusIcon className="w-5 h-5" />
                                                    </div>
                                                </button>
                                            </td>
                                        ))}
                                    </tr>
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
