
import React, { useMemo, useState } from 'react';
import { Task, Status, ManagedItem, ManagedStatus, SortConfig, FilterState, VisibilityFilters, Subtask } from '../types';
import { REQUIREMENT_TYPE_OPTIONS } from '../constants';
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
  requirementTypeOptions?: { id: string; docId: string; name: string; color: string }[];
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
        allProgrammers,
        requirementTypeOptions = [...REQUIREMENT_TYPE_OPTIONS]
    } = props;

    const [groupBy, setGroupBy] = useState<'none' | 'status' | 'module' | 'target' | 'programmer' | 'requirementType' | 'platform'>('none');
    const [globalQuery, setGlobalQuery] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const [showGroupOptions, setShowGroupOptions] = useState(false);
    const [showColumnFilters, setShowColumnFilters] = useState(false);

    // Build a harmonious palette for modules if they share colors.
    const modulePalette = ['#4f46e5', '#10b981', '#f97316', '#ef4444', '#6366f1', '#0ea5e9', '#f59e0b', '#22c55e', '#9333ea', '#14b8a6', '#64748b', '#8b5cf6'];

    const hashToIndex = (text: string, length: number) => {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = (hash << 5) - hash + text.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) % length;
    };
    const moduleColorMap = useMemo(() => {
        const map = new Map<string, string>();
        managedItemsMap.module.forEach((mod) => {
            const color = modulePalette[hashToIndex(mod.name || mod.id, modulePalette.length)];
            map.set(mod.name, color);
        });
        return map;
    }, [managedItemsMap.module]);

    const moduleOptionsWithPalette = useMemo(() => {
        return managedItemsMap.module.map(mod => ({ ...mod, color: moduleColorMap.get(mod.name) || mod.color }));
    }, [managedItemsMap.module, moduleColorMap]);

    const modulesForFilters = moduleOptionsWithPalette.length ? moduleOptionsWithPalette : allModules;

    const renderAttachmentIcon = (att: Task['attachments'][number]) => {
        if (att.source === 'drive') return <LinkIcon className="w-4 h-4 text-green-600" />;
        if (att.type === 'link') return <LinkIcon className="w-4 h-4 text-blue-500" />;
        return <PaperclipIcon className="w-4 h-4 text-gray-500" />;
    };

  const FilterInput: React.FC<{ filterKey: keyof Task | 'programmers' }> = ({ filterKey }) => (
    <input
      type="text"
      placeholder="Filtrar..."
      value={filters[filterKey] || ''}
      onChange={(e) => onFilterChange(filterKey, e.target.value)}
      className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      onClick={(e) => e.stopPropagation()}
    />
  );

  const normalizedTasks = useMemo(() => {
    const query = globalQuery.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter(task => {
        const haystack = [
            task.requirement,
            task.module,
            task.platform,
            task.target,
            task.status,
            task.requirementType,
            task.link,
            ...task.assignments.map(a => a.programmerName),
            ...task.attachments.map(a => a.name),
            ...task.subtasks.map((s: Subtask) => s.text),
        ].filter(Boolean).join(' | ').toLowerCase();
        return haystack.includes(query);
    });
  }, [tasks, globalQuery]);

  const displayTasks = useMemo(() => {
    const cloned = [...normalizedTasks];
    return cloned.sort((a, b) => {
        const aUnassigned = a.status === 'Sin asignar';
        const bUnassigned = b.status === 'Sin asignar';
        if (aUnassigned && !bUnassigned) return 1; // Sin asignar al final
        if (!aUnassigned && bUnassigned) return -1;
        return 0;
    });
  }, [normalizedTasks]);

  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') return { '': displayTasks };
    const groups: Record<string, Task[]> = {};
    const getKey = (task: Task) => {
        switch (groupBy) {
            case 'status': return task.status || 'Sin estado';
            case 'module': return task.module || 'Sin módulo';
            case 'target': return task.target || 'Sin destino';
            case 'platform': return task.platform || 'Sin plataforma';
            case 'requirementType': return (task as any).requirementType || 'Sin tipo';
            case 'programmer': return task.assignments.map(a => a.programmerName).join(', ') || 'Sin programador';
            default: return '';
        }
    };
    displayTasks.forEach(task => {
        const key = getKey(task);
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
    });
    return groups;
  }, [displayTasks, groupBy]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="flex flex-col gap-3 mb-4">
            <div className="w-full">
                <label className="text-base font-bold text-gray-800 dark:text-white block mb-2">¿Qué buscas?</label>
                <input
                    type="text"
                    value={globalQuery}
                    onChange={(e) => setGlobalQuery(e.target.value)}
                    placeholder="Escribe para filtrar en todos los campos y subtareas..."
                    className="w-full text-lg px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary shadow-sm"
                />
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <TableToolbar
                    visibilityFilters={visibilityFilters}
                    onVisibilityFiltersChange={onVisibilityFiltersChange}
                    allStatuses={managedStatuses}
                    allModules={modulesForFilters}
                    allProgrammers={allProgrammers}
                    allRequirementTypes={requirementTypeOptions}
                />
                <div className="relative">
                    <button
                        onClick={() => setShowGroupOptions(!showGroupOptions)}
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        <span>Agrupar por</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-brand-primary text-white">{groupBy === 'none' ? 'Ninguno' : groupBy}</span>
                    </button>
                    {showGroupOptions && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-2 space-y-1">
                            {[
                                { key: 'none', label: 'Ninguno', icon: '－' },
                                { key: 'status', label: 'Estado', icon: '🗂️' },
                                { key: 'module', label: 'Módulo', icon: '📘' },
                                { key: 'target', label: 'Destino', icon: '🎯' },
                                { key: 'platform', label: 'Plataforma', icon: '🖥️' },
                                { key: 'requirementType', label: 'Tipo', icon: '🏷️' },
                                { key: 'programmer', label: 'Programador', icon: '👤' },
                            ].map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => { setGroupBy(opt.key as any); setShowGroupOptions(false); }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                                        groupBy === opt.key ? 'bg-brand-primary text-white' : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <span>{opt.icon}</span>
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setShowColumnFilters(prev => !prev)}
                    className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${showColumnFilters ? 'bg-brand-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                >
                    {showColumnFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                </button>
            </div>
        </div>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              <TableHeader sortKey="status" title="Estado" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader sortKey="requirementType" title="Tipo" onSort={onSort} sortConfig={sortConfig} />
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
            {showColumnFilters && (
              <tr className="bg-gray-100 dark:bg-gray-700/50">
                <td className="px-6 py-2"></td>
                <td className="px-6 py-2"><FilterInput filterKey="status" /></td>
                <td className="px-6 py-2"><FilterInput filterKey="requirementType" /></td>
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
            )}
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(groupedTasks).map(([groupName, grouped]) => (
              <React.Fragment key={groupName || 'all'}>
                {groupBy !== 'none' && (
                  <tr className="bg-gray-100 dark:bg-gray-700 cursor-pointer" onClick={() => setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))}>
                    <td colSpan={13} className="px-6 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center justify-between">
                      <span>{groupName || 'Sin grupo'}</span>
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-800 text-white text-xs">{grouped.length}</span>
                    </td>
                  </tr>
                )}
                {!collapsedGroups[groupName] && grouped.map((task) => {
                  const programmerNames = task.assignments.map(a => a.programmerName);
                  const latestEndDate = task.assignments?.map(a => a.endDate).filter(Boolean).sort().pop();
                  const isUnassigned = task.status === 'Sin asignar';
                  return (
                  <tr key={task.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isUnassigned ? 'bg-gray-50 dark:bg-gray-900/40 ring-1 ring-gray-200 dark:ring-gray-800' : ''}`}>
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
                      color={statusConfig[task.status]?.color || '#4f46e5'}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <EditableTag
                      value={task.requirementType}
                      options={requirementTypeOptions}
                      onSave={(newValue) => onTaskUpdate(task.id, { requirementType: newValue })}
                      color={allItemsConfig[task.requirementType]?.color || '#0ea5e9'}
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
                      {task.attachments && task.attachments.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap max-w-xs">
                          {task.attachments.slice(0, 3).map(att => (
                            <a
                              key={att.id}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={att.name}
                              className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors max-w-[150px]"
                            >
                              {renderAttachmentIcon(att)}
                              <span className="truncate">{att.name}</span>
                            </a>
                          ))}
                          {task.attachments.length > 3 && (
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">+{task.attachments.length - 3} más</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-gray-400 dark:text-gray-600">
                          <PaperclipIcon className="w-4 h-4" />
                          <span className="text-xs">-</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <EditableTag
                        value={task.module}
                        options={moduleOptionsWithPalette}
                        onSave={(newValue) => onTaskUpdate(task.id, { module: newValue })}
                        color={moduleColorMap.get(task.module) || allItemsConfig[task.module]?.color || '#4f46e5'}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <EditableTag
                        value={task.target}
                        options={managedItemsMap.target}
                        onSave={(newValue) => onTaskUpdate(task.id, { target: newValue })}
                        color={allItemsConfig[task.target]?.color || '#0ea5e9'}
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
                        color={allItemsConfig[task.platform]?.color || '#22c55e'}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatMonthYear(task.startDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatMonthYear(latestEndDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{task.id}</td>
                  </tr>
                )})}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
