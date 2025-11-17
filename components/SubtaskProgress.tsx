import React from 'react';
import { Subtask } from '../types';

interface SubtaskProgressProps {
  subtasks: Subtask[];
}

export const SubtaskProgress: React.FC<SubtaskProgressProps> = ({ subtasks }) => {
  if (!subtasks || subtasks.length === 0) {
    return null;
  }
  const completedCount = subtasks.filter(st => st.completed).length;
  const totalCount = subtasks.length;

  return (
    <div
      className="flex items-center justify-center bg-white text-black text-xs font-bold rounded-full h-5 min-w-[2rem] px-1.5 shadow-sm border border-gray-300"
      title={`${completedCount} de ${totalCount} tareas completadas`}
    >
      <span>{completedCount}/{totalCount}</span>
    </div>
  );
};
