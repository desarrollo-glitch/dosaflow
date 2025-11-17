
import React from 'react';
import { Task, Status } from '../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  status: Status;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDrop: (status: Status) => void;
  statusConfig: { name: string; color: string };
  // FIX: Update type to include 'name' for consistency with the data source.
  allItemsConfig: Record<string, { name: string; color: string }>;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, tasks, onEdit, onDrop, statusConfig, allItemsConfig }) => {
  const config = statusConfig;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDrop(status);
  };

  if (!config) {
    return null; // Or a fallback UI
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="bg-gray-100 dark:bg-gray-900/50 rounded-lg w-80 flex-shrink-0"
    >
      <div className="p-4 border-b-4" style={{ borderBottomColor: config.color }}>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: config.color }}></span>
          {config.name}
          <span className="ml-2 text-sm font-semibold text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded-full px-2 py-0.5">
            {tasks.length}
          </span>
        </h2>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-190px)]">
        {tasks.map(task => (
          <KanbanCard key={task.id} task={task} onEdit={onEdit} allItemsConfig={allItemsConfig} />
        ))}
      </div>
    </div>
  );
};
