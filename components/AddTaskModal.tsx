
import React, { useState, useEffect, useRef } from 'react';
import { Task, Target, ManagedItem, ManagedStatus, Status, Assignment, Subtask, Attachment } from '../types';
import { TagSelector } from './TagSelector';
import { PlusIcon, TrashIcon, EditIcon, CheckIcon, XIcon, SpinnerIcon, LinkIcon, DocumentIcon, UploadIcon, GoogleDriveIcon } from './Icons';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newTask: Omit<Task, 'id' | 'assignments' | 'subtasks' | 'attachments'> & { id?: string; assignments: Assignment[] }) => void;
  programmers: ManagedItem[];
  taskToEdit: Task | null;
  modules: ManagedItem[];
  platforms: ManagedItem[];
  targets: ManagedItem[];
  managedStatuses: ManagedStatus[];
  onAddSubtask: (parentId: string, text: string) => void;
  onUpdateSubtask: (parentId: string, subtask: Subtask) => void;
  onDeleteSubtask: (parentId: string, subtaskId: string) => void;
  onAddFileAttachment: (taskId: string, file: File) => void;
  onAddLinkAttachment: (taskId: string, url: string, name: string) => void;
  onUpdateAttachment: (taskId: string, attachment: Attachment) => void;
  onDeleteAttachment: (taskId: string, attachment: Attachment) => void;
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

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, programmers: allProgrammers, taskToEdit, modules, platforms, targets, managedStatuses, onAddSubtask, onUpdateSubtask, onDeleteSubtask, onAddFileAttachment, onAddLinkAttachment, onUpdateAttachment, onDeleteAttachment }) => {
  const [requirement, setRequirement] = useState('');
  const [module, setModule] = useState('');
  const [target, setTarget] = useState<Target>('web');
  const [selectedProgrammers, setSelectedProgrammers] = useState<string[]>(['Sin asignar']);
  const [platform, setPlatform] = useState('');
  const [link, setLink] = useState('');
  const [status, setStatus] = useState<Status>('Sin asignar');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  
  // State for attachments
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(null);


  const [isProgrammerDropdownOpen, setIsProgrammerDropdownOpen] = useState(false);
  const programmerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = taskToEdit !== null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (programmerRef.current && !programmerRef.current.contains(event.target as Node)) {
        setIsProgrammerDropdownOpen(false);
      }
    };
    if (isProgrammerDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProgrammerDropdownOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setRequirement(taskToEdit.requirement);
        setModule(taskToEdit.module);
        setTarget(taskToEdit.target);
        setSelectedProgrammers(taskToEdit.assignments.map(a => a.programmerName));
        const latestEndDate = taskToEdit.assignments.map(a => a.endDate).sort().pop() || '';
        setEndDate(latestEndDate);
        setPlatform(taskToEdit.platform);
        setLink(taskToEdit.link || '');
        setStatus(taskToEdit.status);
        setStartDate(taskToEdit.startDate || '');
      } else {
        // Reset form for new task
        setRequirement('');
        setModule(modules[0]?.name || '');
        setTarget(targets[0]?.name || 'web');
        setSelectedProgrammers(['Sin asignar']);
        setPlatform(platforms[0]?.name || '');
        setLink('');
        setStatus(managedStatuses.find(s => s.name === 'Sin asignar')?.name || managedStatuses[0]?.name || '');
        setStartDate('');
        setEndDate('');
        setNewSubtaskText('');
      }
    } else {
        setEditingSubtask(null);
        setShowLinkInput(false);
        setLinkUrl('');
        setLinkName('');
        setEditingAttachment(null);
    }
  }, [isOpen, taskToEdit, isEditing, modules, platforms, targets, managedStatuses]);

  const handleProgrammerToggle = (programmerName: string) => {
    setSelectedProgrammers(current => {
      const isSelected = current.includes(programmerName);
      if (isSelected) {
        const newSelection = current.filter(name => name !== programmerName);
        return newSelection.length > 0 ? newSelection : ['Sin asignar'];
      } else {
        return [...current.filter(name => name !== 'Sin asignar'), programmerName];
      }
    });
  };

  const handleAddLink = () => {
      if(linkUrl && linkName && taskToEdit) {
        onAddLinkAttachment(taskToEdit.id, linkUrl, linkName);
        setLinkUrl('');
        setLinkName('');
        setShowLinkInput(false);
      }
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && taskToEdit) {
          setIsUploading(true);
          try {
              await onAddFileAttachment(taskToEdit.id, file);
          } finally {
              setIsUploading(false);
          }
      }
      // Reset file input
      if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveAttachment = () => {
    if (editingAttachment && taskToEdit) {
      onUpdateAttachment(taskToEdit.id, editingAttachment);
      setEditingAttachment(null);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirement.trim() || !module.trim() || !platform.trim()) {
        alert("Por favor, completa todos los campos obligatorios.");
        return;
    }
    const assignments = selectedProgrammers.map(p => ({
        programmerName: p,
        endDate: endDate
    }));

    const taskPayload: Omit<Task, 'id' | 'assignments' | 'subtasks' | 'attachments'> & { id?: string; assignments: Assignment[] } = {
      requirement,
      module,
      target,
      assignments,
      platform,
      link,
      status,
      startDate
    };

    if (isEditing) {
      taskPayload.id = taskToEdit.id;
    }

    onSave(taskPayload);
  };

  const handleNewSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskText.trim() && taskToEdit) {
      onAddSubtask(taskToEdit.id, newSubtaskText.trim());
      setNewSubtaskText('');
    }
  };

  const handleStartEdit = (subtask: Subtask) => {
    setEditingSubtask({ ...subtask });
  };
  
  const handleCancelEdit = () => {
    setEditingSubtask(null);
  };

  const handleSaveEdit = () => {
    if (editingSubtask && taskToEdit) {
      onUpdateSubtask(taskToEdit.id, editingSubtask);
    }
    setEditingSubtask(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-11/12 h-5/6 flex flex-col transform transition-all" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-6 border-b dark:border-gray-700 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{isEditing ? 'Editar Requisito' : 'Nuevo Requisito'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-3xl">&times;</button>
        </header>

        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
            <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8 p-6 overflow-y-auto">
                {/* Left Column: Main Details */}
                <div className="space-y-4">
                    <div>
                      <label htmlFor="requirement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Necesidad</label>
                      <input type="text" id="requirement" value={requirement} onChange={e => setRequirement(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 dark:placeholder-gray-400"/>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TagSelector label="Módulo" options={modules} selectedValue={module} onSelect={setModule} />
                    <TagSelector label="Plataforma" options={platforms} selectedValue={platform} onSelect={setPlatform} />
                  </div>
                  <div>
                    <label htmlFor="link" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enlace Externo (Principal)</label>
                    <input type="text" id="link" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="flex-grow w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 dark:placeholder-gray-400"/>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TagSelector label="Estado" options={managedStatuses} selectedValue={status} onSelect={setStatus as (val: string) => void} />
                    <div ref={programmerRef}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Programadores</label>
                      <div className="relative">
                        <button 
                            type="button" 
                            onClick={() => setIsProgrammerDropdownOpen(prev => !prev)} 
                            className="w-full text-left px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 min-h-[42px] flex items-center"
                        >
                          <div className="flex flex-wrap gap-1">
                              {selectedProgrammers.map(name => {
                                  const programmer = allProgrammers.find(p => p.name === name) || { name, color: '#ccc' };
                                  const textColor = isColorLight(programmer.color) ? 'text-gray-800' : 'text-white';
                                  return (
                                      <span key={name} className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${textColor}`} style={{ backgroundColor: programmer.color }}>
                                          {name}
                                      </span>
                                  );
                              })}
                          </div>
                        </button>
                        {isProgrammerDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto p-2">
                            <div className="flex flex-wrap gap-2">
                                {allProgrammers.map(p => {
                                    const isSelected = selectedProgrammers.includes(p.name);
                                    const textColor = isColorLight(p.color) ? 'text-gray-800' : 'text-white';
                                    return (
                                        <button
                                            type="button"
                                            key={p.id}
                                            onClick={() => handleProgrammerToggle(p.name)}
                                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 transform hover:scale-105 ${textColor} ${isSelected ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-brand-primary' : ''}`}
                                            style={{ backgroundColor: p.color }}
                                        >
                                            {p.name}
                                        </button>
                                    );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <TagSelector label="Destino" options={targets} selectedValue={target} onSelect={(val) => setTarget(val as Target)} />
                  </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mes de Inicio</label>
                        <input type="month" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 dark:[color-scheme:dark]"/>
                      </div>
                      <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mes de Fin</label>
                        <input type="month" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 dark:[color-scheme:dark]"/>
                      </div>
                  </div>
                </div>

                {/* Right Column: Attachments & Tasks Management */}
                 {isEditing && taskToEdit && (
                    <div className="flex flex-col h-full">
                        {/* Attachments Section */}
                        <div className="flex flex-col mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Archivos Adjuntos</label>
                            
                            {!showLinkInput && (
                                <div className="flex items-stretch space-x-2 mb-2">
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex-1 text-sm flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md px-3 py-2 disabled:opacity-50 transition-colors">
                                        {isUploading ? <SpinnerIcon className="w-5 h-5"/> : <UploadIcon className="w-5 h-5"/>}
                                        <span>Subir Archivo</span>
                                    </button>
                                     <button type="button" onClick={() => alert('La integración con Google Drive estará disponible próximamente.')} className="text-sm flex items-center justify-center space-x-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                        <GoogleDriveIcon className="w-5 h-5"/>
                                        <span className="hidden sm:inline">Google Drive</span>
                                    </button>
                                    <button type="button" onClick={() => setShowLinkInput(true)} className="text-sm flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md px-3 py-2 transition-colors">
                                        <LinkIcon className="w-5 h-5"/>
                                        <span className="hidden sm:inline">Añadir Enlace</span>
                                    </button>
                                </div>
                            )}

                            {showLinkInput && (
                                <div className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md mb-2 space-y-2">
                                    <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="URL del enlace" className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" />
                                    <input type="text" value={linkName} onChange={e => setLinkName(e.target.value)} placeholder="Nombre descriptivo" className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" />
                                    <div className="flex justify-end space-x-2">
                                        <button type="button" onClick={() => setShowLinkInput(false)} className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                                        <button type="button" onClick={handleAddLink} className="text-xs px-2 py-1 rounded bg-brand-primary text-white hover:bg-indigo-700">Guardar</button>
                                    </div>
                                </div>
                            )}

                            <div className="flex-grow overflow-y-auto max-h-40 pr-2 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-2 space-y-2">
                                {(taskToEdit.attachments || []).map(att => {
                                    const isCurrentlyEditing = editingAttachment?.id === att.id;
                                    return (
                                        <div key={att.id} className={`flex items-center justify-between p-2 rounded-md ${isCurrentlyEditing ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-700 shadow-sm'}`}>
                                            {isCurrentlyEditing ? (
                                                <div className="flex-grow flex items-center space-x-2">
                                                    <input type="text" value={editingAttachment.name} onChange={e => setEditingAttachment(prev => prev ? {...prev, name: e.target.value} : null)} placeholder="Nombre" className="flex-grow text-sm px-2 py-1 border border-brand-primary rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                                                    <input type="text" value={editingAttachment.url} onChange={e => setEditingAttachment(prev => prev ? {...prev, url: e.target.value} : null)} placeholder="URL" className="flex-grow text-sm px-2 py-1 border border-brand-primary rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2 truncate">
                                                    {att.type === 'link' ? <LinkIcon className="w-5 h-5 text-blue-500 flex-shrink-0" /> : <DocumentIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />}
                                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-800 dark:text-gray-200 truncate hover:underline" title={att.name}>{att.name}</a>
                                                </div>
                                            )}
                                            <div className="flex items-center space-x-2 ml-2">
                                                {isCurrentlyEditing ? (
                                                    <>
                                                        <button type="button" onClick={handleSaveAttachment} className="text-green-500 hover:text-green-700" title="Guardar"><CheckIcon className="w-5 h-5"/></button>
                                                        <button type="button" onClick={() => setEditingAttachment(null)} className="text-red-500 hover:text-red-700" title="Cancelar"><XIcon className="w-5 h-5"/></button>
                                                    </>
                                                ) : (
                                                     <>
                                                        {att.type === 'link' && <button type="button" onClick={() => setEditingAttachment({...att})} className="text-gray-400 hover:text-blue-500"><EditIcon className="w-5 h-5"/></button>}
                                                        <button type="button" onClick={() => onDeleteAttachment(taskToEdit.id, att)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {(taskToEdit.attachments || []).length === 0 && <p className="text-xs text-center text-gray-500 dark:text-gray-400 p-2">No hay adjuntos.</p>}
                            </div>
                        </div>
                        
                        {/* Subtasks Section */}
                        <div className="flex flex-col flex-grow min-h-0">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tareas</label>
                            
                            {/* Add new task form */}
                            <div className="mb-3 flex space-x-2 flex-shrink-0">
                                <input 
                                    type="text"
                                    value={newSubtaskText}
                                    onChange={e => setNewSubtaskText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleNewSubtaskSubmit(e) }}
                                    placeholder="Añadir nueva tarea y pulsar Enter..."
                                    className="flex-grow w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                />
                                <button type="button" onClick={handleNewSubtaskSubmit} className="bg-brand-secondary hover:bg-emerald-600 text-white font-bold p-2 rounded-md shadow transition duration-300 flex-shrink-0">
                                    <PlusIcon className="w-5 h-5"/>
                                </button>
                            </div>

                            {/* Tasks table */}
                            <div className="flex-grow overflow-y-auto pr-2 border rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                                <table className="min-w-full">
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {(taskToEdit.subtasks || []).map(subtask => {
                                            const isCurrentlyEditing = editingSubtask?.id === subtask.id;
                                            return (
                                            <tr key={subtask.id} className={isCurrentlyEditing ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}>
                                                <td className="p-2 w-10">
                                                    <input 
                                                        type="checkbox"
                                                        checked={subtask.completed}
                                                        onChange={() => onUpdateSubtask(taskToEdit.id, { ...subtask, completed: !subtask.completed })}
                                                        className="h-4 w-4 text-brand-primary rounded border-gray-300 focus:ring-brand-primary"
                                                    />
                                                </td>
                                                <td className="p-2 text-sm text-gray-800 dark:text-gray-200">
                                                    {isCurrentlyEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editingSubtask.text}
                                                            onChange={(e) => setEditingSubtask(prev => prev ? { ...prev, text: e.target.value } : null)}
                                                            className="w-full px-2 py-1 border border-brand-primary rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSaveEdit();
                                                                if (e.key === 'Escape') handleCancelEdit();
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className={subtask.completed ? 'line-through text-gray-500' : ''}>{subtask.text}</span>
                                                    )}
                                                </td>
                                                <td className="p-2 w-28 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {isCurrentlyEditing ? (
                                                            <>
                                                                <button type="button" onClick={handleSaveEdit} className="text-green-500 hover:text-green-700" title="Guardar"><CheckIcon className="w-5 h-5"/></button>
                                                                <button type="button" onClick={handleCancelEdit} className="text-red-500 hover:text-red-700" title="Cancelar"><XIcon className="w-5 h-5"/></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button type="button" onClick={() => handleStartEdit(subtask)} className="text-gray-400 hover:text-blue-500" title="Editar"><EditIcon className="w-5 h-5"/></button>
                                                                <button type="button" onClick={() => onDeleteSubtask(taskToEdit.id, subtask.id)} className="text-gray-400 hover:text-red-500" title="Eliminar"><TrashIcon className="w-5 h-5" /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                        {(taskToEdit.subtasks || []).length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="text-center text-xs text-gray-500 dark:text-gray-400 p-4">No hay tareas.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                  )}
            </main>

            <footer className="flex justify-end p-6 border-t dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
                <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300 dark:hover:bg-gray-500 transition duration-300">Cancelar</button>
                <button type="submit" className="bg-brand-primary hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-300">{isEditing ? 'Guardar Cambios' : 'Crear Requisito'}</button>
            </footer>
        </form>
      </div>
    </div>
  );
};