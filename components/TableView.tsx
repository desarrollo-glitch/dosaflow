
import React from 'react';
import { Task, Status, ManagedItem, ManagedStatus, SortConfig, FilterState, VisibilityFilters } from '../types';
import { EditIcon, LinkIcon, PaperclipIcon, SortIndicatorIcon } from './Icons';
import { EditableTag } from './EditableTag';
import { EditableText } from './EditableText';
import { TableToolbar } from './TableToolbar';
import { EditableProgrammers } from './EditableProgrammers';
import { SubtaskProgress } from './SubtaskProgress';

interface TableViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  statusConfig: Record<Status, { color: string; name: string; }>;
  managedItemsMap: {
    module: ManagedItem[];
    target: ManagedItem[];
    programmer: ManagedItem[];
    platform: ManagedItem[];
  };
  // FIX: Update type to include 'name' for consistency with the data source.
  allItemsConfig: Record<string, { name: string; color: string }>;
  onTaskUpdate: (taskId: string, updatedFields: Partial<Task> & { programmers?: string[] }) => void;
  managedStatuses: ManagedStatus[];
  sortConfig: SortConfig | null;
  // FIX: Update onSort prop to allow sorting by 'programmers' to match usage in the component.
  onSort: (key: keyof Task | 'endDate' | 'programmers') => void;
  filters: FilterState;
  onFilterChange: (key: keyof Task | 'programmers', value: string) => void;
  visibilityFilters: VisibilityFilters;
  onVisibilityFiltersChange: React.Dispatch<React.SetStateAction<VisibilityFilters>>;
  allModules: ManagedItem[];
  allProgrammers: ManagedItem[];
}

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const formatMonthYear = (dateString?: string) => {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length !== 2) return dateString;
    const [year, month] = parts;
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
        const monthName = monthNames[monthIndex];
        const shortYear = year.slice(-2);
        return `${monthName} '${shortYear}`;
    }
    return dateString;
};

const TableHeader: React.FC<{
  sortKey: keyof Task | 'endDate' | 'programmers';
  title: string;
  onSort: (key: keyof Task | 'endDate' | 'programmers') => void;
  sortConfig: SortConfig | null;
  className?: string;
}> = ({ sortKey, title, onSort, sortConfig, className }) => {
  const isSorted = sortConfig?.key === sortKey;
  
  return (
    <th 
      scope="col" 
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center">
        <span>{title}</span>
        <SortIndicatorIcon direction={isSorted ? sortConfig?.direction : undefined} />
      </div>
    </th>
  );
};

export const TableView: React.FC<TableViewProps> = (props) => {
    const { 
        tasks, 
        onEdit, 
        statusConfig, 
        managedItemsMap, 
        allItemsConfig, 
        onTaskUpdate, 
        managedStatuses,
        sortConfig,
        onSort,
        filters,
        onFilterChange,
        visibilityFilters,
        onVisibilityFiltersChange,
        allModules,
        allProgrammers
    } = props;

  const FilterInput: React.FC<{ filterKey: keyof Task | 'programmers' }> = ({ filterKey }) => (
    <input
      type="text"
      placeholder="Filtrar..."
      value={filters[filterKey] || ''}
      onChange={(e) => onFilterChange(filterKey, e.target.value)}
      className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-900 dark:text-gray-200"
      onClick={(e) => e.stopPropagation()}
    />
  );
  
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <TableToolbar
            visibilityFilters={visibilityFilters}
            onVisibilityFiltersChange={onVisibilityFiltersChange}
            allStatuses={managedStatuses}
            allModules={allModules}
            allProgrammers={allProgrammers}
        />
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              <TableHeader sortKey="status" title="Estado" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader sortKey="requirement" title="Necesidad" onSort={onSort} sortConfig={sortConfig} className="min-w-[300px]" />
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subtareas</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Adjuntos</th>
              <TableHeader sortKey="module" title="Módulo" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader sortKey="target" title="Destino" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader sortKey="programmers" title="Programadores" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader sortKey="platform" title="Plataforma" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader sortKey="startDate" title="Inicio" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader sortKey="endDate" title="Fin" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader sortKey="id" title="ID" onSort={onSort} sortConfig={sortConfig} />
            </tr>
            <tr className="bg-gray-100 dark:bg-gray-700/50">
              <td className="px-6 py-2"></td>
              <td className="px-6 py-2"><FilterInput filterKey="status" /></td>
              <td className="px-6 py-2"><FilterInput filterKey="requirement" /></td>
              <td className="px-6 py-2"></td>
              <td className="px-6 py-2"></td>
              <td className="px-6 py-2"><FilterInput filterKey="module" /></td>
              <td className="px-6 py-2"><FilterInput filterKey="target" /></td>
              <td className="px-6 py-2"><FilterInput filterKey="programmers" /></td>
              <td className="px-6 py-2"><FilterInput filterKey="platform" /></td>
              <td className="px-6 py-2"><FilterInput filterKey="startDate" /></td>
              <td className="px-6 py-2"></td>
              <td className="px-6 py-2"><FilterInput filterKey="id" /></td>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => {
              const programmerNames = task.assignments.map(a => a.programmerName);
              const latestEndDate = task.assignments?.map(a => a.endDate).filter(Boolean).sort().pop();
              return (
              <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => onEdit(task)} className="text-brand-primary hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" title="Editar requisito">
                      <EditIcon className="w-5 h-5"/>
                    </button>
                    {task.link ? (
                        <a href={task.link} target="_blank" rel="noopener noreferrer" title="Abrir enlace externo">
                            <LinkIcon className="w-5 h-5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"/>
                        </a>
                    ) : (
                        <span title="No hay enlace externo">
                            <LinkIcon className="w-5 h-5 text-gray-400 dark:text-gray-600"/>
                        </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <EditableTag
                    value={task.status}
                    options={managedStatuses}
                    onSave={(newValue) => onTaskUpdate(task.id, { status: newValue })}
                    color={statusConfig[task.status]?.color || '#ccc'}
                  />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 min-w-[300px]">
                   <EditableText
                    value={task.requirement}
                    onSave={(newValue) => onTaskUpdate(task.id, { requirement: newValue })}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <SubtaskProgress subtasks={task.subtasks} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {task.attachments && task.attachments.length > 0 && (
                    <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                      <PaperclipIcon className="w-4 h-4" />
                      <span>{task.attachments.length}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  <EditableTag
                    value={task.module}
                    options={managedItemsMap.module}
                    onSave={(newValue) => onTaskUpdate(task.id, { module: newValue })}
                    color={allItemsConfig[task.module]?.color || '#ccc'}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  <EditableTag
                    value={task.target}
                    options={managedItemsMap.target}
                    onSave={(newValue) => onTaskUpdate(task.id, { target: newValue })}
                    color={allItemsConfig[task.target]?.color || '#ccc'}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  <EditableProgrammers
                    value={programmerNames}
                    options={managedItemsMap.programmer}
                    onSave={(newValue) => onTaskUpdate(task.id, { programmers: newValue })}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  <EditableTag
                    value={task.platform}
                    options={managedItemsMap.platform}
                    onSave={(newValue) => onTaskUpdate(task.id, { platform: newValue })}
                    color={allItemsConfig[task.platform]?.color || '#ccc'}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatMonthYear(task.startDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatMonthYear(latestEndDate)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{task.id}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};
