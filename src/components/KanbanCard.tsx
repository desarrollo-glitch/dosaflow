
import React from 'react';
import { Task, Target } from '../types';
import { DocumentIcon, EditIcon, MobileIcon, PaperclipIcon, PlatformIcon, UserIcon, WebAppIcon } from './Icons';
import { SubtaskProgress } from './SubtaskProgress';

interface KanbanCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  // FIX: Update type to include 'name' for consistency with the data source.
  allItemsConfig: Record<string, { name: string; color: string }>;
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


const CardDetail: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
        <span className="w-4 h-4 mr-1.5">{icon}</span>
        <span className="truncate" title={label}>{label}</span>
    </div>
);

const TargetIndicator: React.FC<{ task: Task }> = ({ task }) => {
    let icon: React.ReactNode;
    let text: string;
    switch (task.target) {
        case 'web':
            icon = <WebAppIcon className="w-4 h-4 mr-1.5" />;
            text = 'Web';
            break;
        case 'app':
            icon = <MobileIcon className="w-4 h-4 mr-1.5" />;
            text = 'App';
            break;
        case 'ambos':
            icon = <div className="flex items-center mr-1.5"><WebAppIcon className="w-4 h-4" /><MobileIcon className="w-4 h-4" /></div>;
            text = 'Web & App';
            break;
        default:
            icon = null;
            text = '';
    }
    return (
        <div className="mt-2 pt-1.5 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center text-xs font-medium">
            <div className="flex items-center text-brand-secondary">
                {icon}
                <span>{text}</span>
            </div>
             <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                {task.attachments && task.attachments.length > 0 && (
                    <div className="flex items-center space-x-1" title={`${task.attachments.length} archivos adjuntos`}>
                        <PaperclipIcon className="w-4 h-4" />
                        <span className="text-xs font-bold">{task.attachments.length}</span>
                    </div>
                )}
                <SubtaskProgress subtasks={task.subtasks} />
            </div>
        </div>
    );
};


export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onEdit, allItemsConfig }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    localStorage.setItem('draggedTaskId', task.id);
  };

  const handleDragEnd = () => {
    localStorage.removeItem('draggedTaskId');
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onEdit(task);
  };
  
  const moduleConfig = allItemsConfig[task.module];
  const moduleColor = moduleConfig?.color || '#ccc';
  const moduleTextColor = isColorLight(moduleColor) ? 'text-gray-800' : 'text-white';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="bg-white dark:bg-gray-700 rounded-lg p-2 shadow-md hover:shadow-xl transition-shadow duration-200 cursor-grab active:cursor-grabbing border-l-4 border-brand-primary"
    >
      <div className="flex justify-between items-start mb-1.5">
        <div className="flex-1 pr-2 min-w-0">
            <span style={{ backgroundColor: moduleColor }} className={`px-1.5 py-0.5 inline-flex text-[11px] leading-4 font-semibold rounded-full ${moduleTextColor} mb-1`}>
                {task.module}
            </span>
            <h3 className="font-bold text-sm text-gray-800 dark:text-white line-clamp-2" title={task.requirement}>{task.requirement}</h3>
        </div>
        <div className="flex items-center space-x-1.5 flex-shrink-0">
            <span className="text-[11px] font-semibold text-brand-primary dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded-full">{task.id}</span>
            <button onClick={handleEditClick} className="text-gray-400 hover:text-brand-primary dark:hover:text-indigo-400 transition-colors">
                <EditIcon className="w-4 h-4"/>
            </button>
        </div>
      </div>

      <div className="space-y-1.5 mt-1.5">
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <span className="w-4 h-4 mr-1.5 flex-shrink-0"><UserIcon className="text-gray-500" /></span>
            <div className="flex flex-wrap gap-1">
                {task.assignments.map(({ programmerName }) => {
                    const programmerConfig = allItemsConfig[programmerName];
                    const pColor = programmerConfig?.color || '#ccc';
                    const pTextColor = isColorLight(pColor) ? 'text-gray-800' : 'text-white';
                    return (
                        <span key={programmerName} style={{ backgroundColor: pColor }} className={`px-1.5 py-0.5 inline-flex text-[11px] leading-4 font-semibold rounded-full ${pTextColor}`}>
                            {programmerName}
                        </span>
                    );
                })}
            </div>
        </div>
        <CardDetail icon={<PlatformIcon className="text-gray-500" />} label={task.platform} />
      </div>

      <TargetIndicator task={task} />
    </div>
  );
};