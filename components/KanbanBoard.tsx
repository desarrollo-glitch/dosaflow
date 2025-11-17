
import React from 'react';
import { Task, Status } from '../types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onTaskStatusChange: (taskId: string, newStatus: Status) => void;
  statuses: Status[];
  statusConfig: Record<Status, { name: string; color: string; }>;
  // FIX: Update type to include 'name' for consistency with the data source.
  allItemsConfig: Record<string, { name: string; color: string }>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onEdit, onTaskStatusChange, statuses, statusConfig, allItemsConfig }) => {

  const handleDrop = (newStatus: Status) => {
    const taskId = localStorage.getItem('draggedTaskId');
    if (taskId) {
      onTaskStatusChange(taskId, newStatus);
      localStorage.removeItem('draggedTaskId');
    }
  };

  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status] = tasks.filter(task => task.status === status);
    return acc;
  }, {} as Record<Status, Task[]>);

  return (
    <main className="flex-1 overflow-x-auto bg-gray-50 dark:bg-gray-900">
      <div className="flex space-x-4 p-4 h-full">
        {statuses.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status] || []}
            onEdit={onEdit}
            onDrop={handleDrop}
            statusConfig={statusConfig[status]}
            allItemsConfig={allItemsConfig}
          />
        ))}
      </div>
    </main>
  );
};
