import React, { useState, useMemo } from 'react';
import { Task, Status } from '../types';
import { XIcon } from './Icons';

interface PlannerTaskSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (taskIds: string[]) => void;
  tasks: Task[];
  statusConfig: Record<Status, { color: string; name: string }>;
}

const isColorLight = (colorString: string) => {
    if (!colorString) return true;

    let r, g, b;

    if (colorString.startsWith('hsl')) {
        const lightness = parseInt(colorString.split(',')[2]?.replace('%', '').trim() || '0', 10);
        return lightness > 65;
    }

    if (colorString.startsWith('#')) {
        let hex = colorString.slice(1);
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        if (hex.length !== 6) return true;

        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    } else if (colorString.startsWith('rgb')) {
        const parts = colorString.match(/(\d+)/g);
        if (!parts || parts.length < 3) return true;
        [r, g, b] = parts.slice(0, 3).map(Number);
    } else {
        return true; // Default for unknown formats
    }

    if (typeof r === 'undefined' || typeof g === 'undefined' || typeof b === 'undefined') return true;

    // Using a standard luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
};

export const PlannerTaskSelectorModal: React.FC<PlannerTaskSelectorModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  tasks,
  statusConfig
}) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const filteredTasks = useMemo(() => {
    let tasksToShow = tasks;

    if (!showCompleted) {
        tasksToShow = tasksToShow.filter(task => task.status !== 'Finalizado');
    }

    if (!searchTerm) return tasksToShow;

    return tasksToShow.filter(task =>
      task.requirement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm, showCompleted]);

  const handleToggleSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleAssignClick = () => {
    if (selectedTaskIds.length > 0) {
      onAssign(selectedTaskIds);
      setSelectedTaskIds([]);
      setSearchTerm('');
    }
  };
  
  const handleClose = () => {
    setSelectedTaskIds([]);
    setSearchTerm('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-4xl transform transition-all flex flex-col" style={{height: '80vh'}} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Asignar Requisito</h2>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                <XIcon className="w-6 h-6" />
            </button>
        </div>
        
        <div className="flex justify-between items-center mb-4">
            <input
                type="text"
                placeholder="Buscar por necesidad o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-white dark:text-gray-900"
            />
            <label className="flex items-center space-x-2 ml-4 text-sm text-gray-600 dark:text-gray-300 flex-shrink-0">
                <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-brand-primary rounded focus:ring-brand-primary border-gray-300 dark:border-gray-600"
                />
                <span>Mostrar finalizados</span>
            </label>
        </div>

        <div className="flex-grow overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                        <th className="px-6 py-3 w-12"></th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Necesidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Programadores</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTasks.map((task) => {
                        const config = statusConfig[task.status];
                        const textColor = config && isColorLight(config.color) ? 'text-gray-800' : 'text-white';
                        const assignedProgrammers = task.assignments.map(a => a.programmerName).join(', ');
                        const isUnassigned = assignedProgrammers === 'Sin asignar' || assignedProgrammers === '';

                        return (
                            <tr 
                                key={task.id} 
                                className={`cursor-pointer ${isUnassigned ? 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`} 
                                onClick={() => handleToggleSelection(task.id)}
                            >
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedTaskIds.includes(task.id)}
                                        readOnly
                                        className="form-checkbox h-5 w-5 text-brand-primary rounded focus:ring-brand-primary border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 checked:bg-brand-primary"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{task.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{task.requirement}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {assignedProgrammers}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {config ? (
                                        <span
                                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${textColor}`}
                                            style={{ backgroundColor: config.color }}
                                        >
                                            {task.status}
                                        </span>
                                    ) : task.status}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        
        <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
            <button type="button" onClick={handleClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-300">Cancelar</button>
            <button 
                type="button" 
                onClick={handleAssignClick}
                disabled={selectedTaskIds.length === 0}
                className="bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Asignar ({selectedTaskIds.length})
            </button>
          </div>
      </div>
    </div>
  );
};