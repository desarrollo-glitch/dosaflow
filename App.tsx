

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskModal } from './components/AddTaskModal';
import { TableView } from './components/TableView';
import { PlannerView } from './components/PlannerView';
import { DbManagementView } from './components/DbManagementView';
import { Sidebar } from './components/Sidebar';
import { SuggestionsView } from './components/SuggestionsView';
import { LoadingScreen } from './components/LoadingScreen';
import { Toast } from './components/Toast';
import { PlannerTaskSelectorModal } from './components/PlannerTaskSelectorModal';
import { DashboardView } from './components/DashboardView';
import { ProjectDocumentationView } from './components/ProjectDocumentationView';
import { FilestoreView } from './components/FilestoreView';
import { ActivityLogView } from './components/ActivityLogView';
import { DailyLogView } from './components/DailyLogView';
import { ApplySuggestionModal } from './components/ApplySuggestionModal';
import { MeetingLogModal } from './components/MeetingLogModal';
import { MeetingDetailsModal } from './components/MeetingDetailsModal';
import { MeetingsView } from './components/MeetingsView';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Task, Status, ManagedStatus, ManagedItem, SortConfig, FilterState, VisibilityFilters, Suggestion, Assignment, View, TaskDoc, TaskAssignmentDoc, Target, Subtask, ActivityLog, ActivityLogDoc, DailyLog, DailySummary, Attachment, Meeting, MeetingDoc, UserAccessDoc, UserAccessStatus } from './types';
import * as firestore from './utils/firestore';
import * as storage from './utils/storage';
import { useAuth } from './src/contexts/AuthContext';
import { LoginView } from './components/LoginView';
import { PendingAccessView } from './components/PendingAccessView';
import { UserAccessView } from './components/UserAccessView';
import { logOut } from './utils/auth';
// FIX: Import GenerateContentResponse for explicit API response typing.
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
// FIX: Import firestoreDB and writeBatch for batch database operations.
import { firestoreDB } from './utils/firebase';
import { doc, writeBatch } from 'firebase/firestore';

const App: React.FC = () => {
    const { user, loading } = useAuth();
    const [userAccessRecord, setUserAccessRecord] = useState<UserAccessDoc | null>(null);
    const [isAccessLoading, setIsAccessLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        if (!user || !user.email) {
            setUserAccessRecord(null);
            setIsAccessLoading(false);
            return;
        }
        setIsAccessLoading(true);
        firestore.ensureUserAccessRecord(user.email, user.displayName || user.email)
            .then(record => {
                if (isMounted) {
                    setUserAccessRecord(record);
                }
            })
            .catch(error => {
                console.error('Error checking user access:', error);
                if (isMounted) {
                    setUserAccessRecord(null);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsAccessLoading(false);
                }
            });
        return () => {
            isMounted = false;
        };
    }, [user]);

    if (loading || isAccessLoading) {
        return <LoadingScreen />;
    }
    if (!user) {
        return <LoginView />;
    }
    if (!userAccessRecord) {
        return <PendingAccessView email={user.email ?? undefined} status="pending" />;
    }

    if (userAccessRecord.status !== 'approved') {
        return <PendingAccessView email={user.email ?? undefined} status={userAccessRecord.status} />;
    }

    return <AppContent />;
};

const customProgrammerOrder = [
    'Jacinta', 'Miguel', 'Martín', 'Javi Gil', 'Cristian', 'Edu', 
    'Victoria', 'Jesús', 'Jose Ojeda', 'Pepe Poveda', 'Sergio', 'Juan Antonio'
];

const AppContent: React.FC = () => {
  // View models for UI
  const [tasks, setTasks] = useState<Task[]>([]);
  const [programmers, setProgrammers] = useState<ManagedItem[]>([]);
  const [modules, setModules] = useState<ManagedItem[]>([]);
  const [platforms, setPlatforms] = useState<ManagedItem[]>([]);
  const [targets, setTargets] = useState<ManagedItem[]>([]);
  const [managedStatuses, setManagedStatuses] = useState<ManagedStatus[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [userAccessRequests, setUserAccessRequests] = useState<UserAccessDoc[]>([]);
  const [userAccessActionId, setUserAccessActionId] = useState<string | null>(null);
  
  // Raw Firestore data
  const [taskDocs, setTaskDocs] = useState<TaskDoc[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignmentDoc[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [visibilityFilters, setVisibilityFilters] = useState<VisibilityFilters>({ status: [], module: [], programmer: [] });
  const [notification, setNotification] = useState({ show: false, message: '', subMessage: '' });
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [plannerModalContext, setPlannerModalContext] = useState<{ programmer: ManagedItem, month: string } | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [suggestionToApply, setSuggestionToApply] = useState<Suggestion | null>(null);
  const [meetingModalContext, setMeetingModalContext] = useState<{isOpen: boolean, date: string | null}>({isOpen: false, date: null});
  const [meetingDetailsModalState, setMeetingDetailsModalState] = useState<{ isOpen: boolean; meeting: Meeting | null }>({ isOpen: false, meeting: null });
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const { user } = useAuth();


  const joinData = useCallback((
    tasks: TaskDoc[],
    assignments: TaskAssignmentDoc[],
    programmers: ManagedItem[],
    modules: ManagedItem[],
    platforms: ManagedItem[],
    targets: ManagedItem[],
    statuses: ManagedStatus[]
  ): Task[] => {
    const programmersMap = new Map(programmers.map(p => [p.id, p]));
    const modulesMap = new Map(modules.map(m => [m.id, m]));
    const platformsMap = new Map(platforms.map(p => [p.id, p]));
    const targetsMap = new Map(targets.map(t => [t.id, t]));
    const statusesMap = new Map(statuses.map(s => [s.id, s]));

    const assignmentsByTask = assignments.reduce((acc, assignment) => {
        if (!acc[assignment.taskId]) acc[assignment.taskId] = [];
        const programmer = programmersMap.get(assignment.programmerId);
        if (programmer) {
            acc[assignment.taskId].push({ programmerName: programmer.name, endDate: assignment.endDate });
        }
        return acc;
    }, {} as Record<string, Assignment[]>);


    return tasks.map(taskDoc => ({
        id: taskDoc.id,
        requirement: taskDoc.requirement,
        link: taskDoc.link,
        startDate: taskDoc.startDate,
        module: modulesMap.get(taskDoc.moduleId)?.name || 'N/A',
        platform: platformsMap.get(taskDoc.platformId)?.name || 'N/A',
        target: (targetsMap.get(taskDoc.targetId)?.name as Target) || 'N/A',
        status: (statusesMap.get(taskDoc.statusId)?.name as Status) || 'N/A',
        assignments: assignmentsByTask[taskDoc.id] || [],
        subtasks: taskDoc.subtasks || [],
        attachments: taskDoc.attachments || [],
    }));
  }, []);

  const refreshData = useCallback(async () => {
        if (!user) return;
        try {
            const data = await firestore.getAllData();
            
            const joinedTasks = joinData(
                data.tasks,
                data.task_assignments,
                data.programmers,
                data.modules,
                data.platforms,
                data.targets,
                data.managedStatuses
            );

            // FIX: Explicitly type `tasksMap` to ensure TypeScript correctly infers the type of its values as `TaskDoc`, resolving property access errors.
            const tasksMap: Map<string, TaskDoc> = new Map(data.tasks.map(t => [t.id, t]));
            const joinedMeetings: Meeting[] = data.meetings.map(meetingDoc => ({
                ...meetingDoc,
                requirementName: tasksMap.get(meetingDoc.requirementId)?.requirement || 'N/A',
            }));

            setTaskDocs(data.tasks);
            setTaskAssignments(data.task_assignments);
            
            const sortedProgrammers = data.programmers.sort((a, b) => {
                const nameA = a.name || '';
                const nameB = b.name || '';
                const indexA = customProgrammerOrder.indexOf(nameA);
                const indexB = customProgrammerOrder.indexOf(nameB);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return nameA.localeCompare(nameB);
            });
            setProgrammers(sortedProgrammers);

            setModules(data.modules.sort((a,b) => (a.name || '').localeCompare(b.name || '')));
            setPlatforms(data.platforms.sort((a,b) => (a.name || '').localeCompare(b.name || '')));
            setTargets(data.targets.sort((a,b) => (a.name || '').localeCompare(b.name || '')));
            setManagedStatuses(data.managedStatuses);
            setSuggestions(data.suggestions);
            setActivityLog(data.activity_log);
            setDailyLogs(data.daily_logs);
            setMeetings(joinedMeetings);
            setUserAccessRequests(data.userAccess || []);

            setTasks(joinedTasks);
        } catch (error) {
            console.error("Error refreshing data:", error);
            showNotification('Error', 'No se pudieron cargar los datos.');
        } finally {
            setIsLoading(false);
        }
    }, [joinData, user]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    useEffect(() => {
        if (currentView === 'userAccess') {
            refreshData();
        }
    }, [currentView, refreshData]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const showNotification = (message: string, subMessage = '') => {
        setNotification({ show: true, message, subMessage });
        setTimeout(() => setNotification({ show: false, message: '', subMessage: '' }), 3000);
    };
    
    const requestConfirmation = (title: string, message: React.ReactNode, onConfirm: () => void) => {
        setConfirmationState({ isOpen: true, title, message, onConfirm });
    };

    const closeConfirmation = () => {
        setConfirmationState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    };

    const handleAddTask = () => {
        setTaskToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setTaskToEdit(task);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTaskToEdit(null);
    };
    
    const handleAddActivityLog = useCallback(async (action: string, task: Task, details: string) => {
        if (!user || !user.email) return;
        const newLogEntry: Omit<ActivityLog, 'id' | 'docId' | 'timestamp'> = {
            taskId: task.id,
            taskRequirement: task.requirement,
            user: user.email,
            action,
            details,
        };
        const addedLog = await firestore.addActivityLog(newLogEntry);
        setActivityLog(prev => [addedLog, ...prev]);
    }, [user]);

    const handleSaveTask = async (taskData: Omit<Task, 'id' | 'assignments' | 'subtasks' | 'attachments'> & { id?: string; assignments: Assignment[] }) => {
        try {
            const isEditing = !!taskData.id;
            const originalTask = isEditing ? tasks.find(t => t.id === taskData.id) : null;

            const getManagedItemId = (name: string, collection: ManagedItem[] | ManagedStatus[]) => collection.find(item => item.name === name)?.id || '';

            // FIX: Ensure taskDoc object matches the TaskDoc type for saving, including required fields like subtasks and attachments.
            const taskDoc: Omit<TaskDoc, 'id'> & { id?: string } = {
                docId: taskData.id || '', // Use existing id as docId, or empty for new tasks.
                id: taskData.id,
                requirement: taskData.requirement,
                moduleId: getManagedItemId(taskData.module, modules),
                platformId: getManagedItemId(taskData.platform, platforms),
                targetId: getManagedItemId(taskData.target, targets),
                statusId: getManagedItemId(taskData.status, managedStatuses),
                link: taskData.link,
                startDate: taskData.startDate,
                subtasks: isEditing && originalTask ? originalTask.subtasks : [],
                attachments: isEditing && originalTask ? originalTask.attachments : [],
            };

            const assignments = taskData.assignments
                .map(a => ({
                    programmerId: getManagedItemId(a.programmerName, programmers),
                    endDate: a.endDate,
                }))
                .filter(a => a.programmerId);

            const existingAssignments = isEditing ? taskAssignments.filter(a => a.taskId === taskData.id) : [];

            const savedTaskId = await firestore.saveTask(taskDoc, assignments, existingAssignments);
            
            const savedTask = { ...taskData, id: savedTaskId } as Task;
            
            if (isEditing && originalTask) {
                const changes = Object.keys(taskData).map(key => {
                    const typedKey = key as keyof Task;
                    if (typedKey === 'assignments') {
                         const oldNames = originalTask.assignments.map(a => a.programmerName).sort().join(', ');
                         const newNames = taskData.assignments.map(a => a.programmerName).sort().join(', ');
                         if (oldNames !== newNames) return `Programadores: de '${oldNames}' a '${newNames}'`;
                    } else if (String(originalTask[typedKey]) !== String(taskData[typedKey])) {
                        return `${key}: de '${originalTask[typedKey]}' a '${taskData[typedKey]}'`;
                    }
                    return null;
                }).filter(Boolean).join('; ');
                
                if (changes) {
                    await handleAddActivityLog('Requisito Actualizado', savedTask, changes);
                }
            } else {
                 await handleAddActivityLog('Requisito Creado', savedTask, `Se ha creado el requisito '${savedTask.requirement}'.`);
            }
            
            await refreshData();
            handleCloseModal();
            showNotification('Éxito', isEditing ? 'Requisito actualizado correctamente.' : 'Requisito añadido correctamente.');
        } catch (error) {
            console.error("Error saving task:", error);
            showNotification('Error', 'No se pudo guardar el requisito.');
        }
    };
    
    const handleTaskStatusChange = async (taskId: string, newStatus: Status) => {
        const task = tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
            const statusId = managedStatuses.find(s => s.name === newStatus)?.id;
            if (statusId) {
                try {
                    await firestore.updateTaskDoc(taskId, { statusId });
                    await handleAddActivityLog('Requisito Actualizado', task, `Cambió estado de '${task.status}' a '${newStatus}'.`);
                    await refreshData();
                    showNotification('Estado Actualizado', `El estado de "${task.requirement}" ahora es "${newStatus}".`);
                } catch (error) {
                    console.error("Error changing task status:", error);
                    showNotification('Error', 'No se pudo cambiar el estado.');
                }
            }
        }
    };

    const handleTaskUpdateFromTable = async (taskId: string, updatedFields: Partial<Task> & { programmers?: string[] }) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const { programmers: newProgrammerNames, ...otherFields } = updatedFields;
        // FIX: Correctly instantiate a write batch with the firestore database instance.
        const batch = writeBatch(firestoreDB);
        const updates: Partial<TaskDoc> = {};
        let changesDescription = '';

        if (otherFields.requirement && otherFields.requirement !== task.requirement) {
            updates.requirement = otherFields.requirement;
            changesDescription += `Necesidad: '${task.requirement}' -> '${updates.requirement}'. `;
        }
        if (otherFields.status && otherFields.status !== task.status) {
            const statusId = managedStatuses.find(s => s.name === otherFields.status)?.id;
            if(statusId) updates.statusId = statusId;
            changesDescription += `Estado: '${task.status}' -> '${otherFields.status}'. `;
        }
        if (otherFields.module && otherFields.module !== task.module) {
            const moduleId = modules.find(m => m.name === otherFields.module)?.id;
            if(moduleId) updates.moduleId = moduleId;
            changesDescription += `Módulo: '${task.module}' -> '${otherFields.module}'. `;
        }
        // ... (add other fields similarly)

        if (Object.keys(updates).length > 0) {
            await firestore.updateTaskDoc(taskId, updates);
        }

        if (newProgrammerNames) {
            const originalProgrammers = task.assignments.map(a => a.programmerName).sort().join(', ');
            const newProgrammers = newProgrammerNames.sort().join(', ');
            if (originalProgrammers !== newProgrammers) {
                 changesDescription += `Programadores: '${originalProgrammers}' -> '${newProgrammers}'.`;
                 // This requires more complex logic to add/remove from task_assignments
                 // For now, we'll just log it. A full implementation would handle this.
                 // This simplified approach will be handled by the full modal for now.
                 // To implement here: fetch assignments, compare, and batch write changes.
                 console.warn("Updating programmers directly from table is complex. Use the modal for now.");
            }
        }

        if (changesDescription) {
            await handleAddActivityLog('Edición Rápida', task, changesDescription);
            await refreshData();
            showNotification('Actualización Rápida', 'El requisito ha sido actualizado.');
        }
    };
    
    // Subtask handlers
    const handleAddSubtask = async (parentId: string, text: string) => {
        const task = taskDocs.find(t => t.id === parentId);
        if (!task) return;
        const newSubtask: Subtask = { id: Date.now().toString(), text, completed: false };
        const updatedSubtasks = [...(task.subtasks || []), newSubtask];
        try {
            await firestore.updateTaskDoc(parentId, { subtasks: updatedSubtasks });
            await handleAddActivityLog('Subtarea Añadida', tasks.find(t => t.id === parentId)!, `Se añadió la subtarea: "${text}".`);
            await refreshData();
        } catch(e) { console.error(e) }
    };

    const handleUpdateSubtask = async (parentId: string, subtask: Subtask) => {
        const task = taskDocs.find(t => t.id === parentId);
        if (!task) return;
        const updatedSubtasks = (task.subtasks || []).map(st => st.id === subtask.id ? subtask : st);
        try {
            await firestore.updateTaskDoc(parentId, { subtasks: updatedSubtasks });
            const action = subtask.completed ? 'completó' : 'reabrió';
            await handleAddActivityLog('Subtarea Actualizada', tasks.find(t => t.id === parentId)!, `Se ${action} la subtarea: "${subtask.text}".`);
            await refreshData();
        } catch (e) { console.error(e); }
    };
    
    const handleDeleteSubtask = async (parentId: string, subtaskId: string) => {
         const task = taskDocs.find(t => t.id === parentId);
        if (!task || !task.subtasks) return;
        const subtaskText = task.subtasks.find(st => st.id === subtaskId)?.text || 'N/A';
        const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
        try {
            await firestore.updateTaskDoc(parentId, { subtasks: updatedSubtasks });
            await handleAddActivityLog('Subtarea Eliminada', tasks.find(t => t.id === parentId)!, `Se eliminó la subtarea: "${subtaskText}".`);
            await refreshData();
        } catch (e) { console.error(e); }
    };

    // Attachment handlers
    const handleAddFileAttachment = async (taskId: string, file: File) => {
        const task = taskDocs.find(t => t.id === taskId);
        if (!task) return;
        try {
            const { url, name, type, path } = await storage.uploadFile(file, taskId);
            const newAttachment: Attachment = {
                id: Date.now().toString(),
                name,
                url,
                type: 'file',
                fileType: type,
                storagePath: path,
                createdAt: new Date().toISOString()
            };
            const updatedAttachments = [...(task.attachments || []), newAttachment];
            await firestore.updateTaskDoc(taskId, { attachments: updatedAttachments });
            await handleAddActivityLog('Adjunto Añadido', tasks.find(t => t.id === taskId)!, `Se subió el archivo: "${name}".`);
            await refreshData();
        } catch (error) {
            console.error("Error adding file attachment:", error);
            showNotification('Error', 'No se pudo subir el archivo.');
        }
    };
    
    const handleAddLinkAttachment = async (taskId: string, url: string, name: string) => {
        const task = taskDocs.find(t => t.id === taskId);
        if (!task) return;
        const newAttachment: Attachment = {
            id: Date.now().toString(),
            name,
            url,
            type: 'link',
            createdAt: new Date().toISOString()
        };
        const updatedAttachments = [...(task.attachments || []), newAttachment];
        try {
            await firestore.updateTaskDoc(taskId, { attachments: updatedAttachments });
            await handleAddActivityLog('Adjunto Añadido', tasks.find(t => t.id === taskId)!, `Se añadió el enlace: "${name}".`);
            await refreshData();
        } catch (e) { console.error(e); }
    };

    const handleUpdateAttachment = async (taskId: string, attachment: Attachment) => {
        const task = taskDocs.find(t => t.id === taskId);
        if (!task || !task.attachments) return;
        const originalAttachment = task.attachments.find(a => a.id === attachment.id);
        if(!originalAttachment) return;

        const updatedAttachments = task.attachments.map(att => att.id === attachment.id ? attachment : att);
        try {
            await firestore.updateTaskDoc(taskId, { attachments: updatedAttachments });
            await handleAddActivityLog('Adjunto Actualizado', tasks.find(t => t.id === taskId)!, `Se actualizó el adjunto '${originalAttachment.name}' a '${attachment.name}'.`);
            await refreshData();
        } catch (e) { console.error(e); }
    };
    
    const handleDeleteAttachment = async (taskId: string, attachment: Attachment) => {
        requestConfirmation(
            `Eliminar "${attachment.name}"`,
            `¿Estás seguro de que quieres eliminar este adjunto? Esta acción no se puede deshacer.`,
            async () => {
                const task = taskDocs.find(t => t.id === taskId);
                if (!task || !task.attachments) return;
                try {
                    if (attachment.type === 'file' && attachment.storagePath) {
                        await storage.deleteFile(attachment.storagePath);
                    }
                    const updatedAttachments = task.attachments.filter(att => att.id !== attachment.id);
                    await firestore.updateTaskDoc(taskId, { attachments: updatedAttachments });
                    await handleAddActivityLog('Adjunto Eliminado', tasks.find(t => t.id === taskId)!, `Se eliminó el adjunto: "${attachment.name}".`);
                    await refreshData();
                    showNotification('Éxito', 'Adjunto eliminado.');
                } catch (error) {
                    console.error("Error deleting attachment:", error);
                    showNotification('Error', 'No se pudo eliminar el adjunto.');
                }
            }
        );
    };


    const exportToCsv = () => {
        const headers = ['ID', 'Necesidad', 'Módulo', 'Destino', 'Programadores', 'Plataforma', 'Enlace', 'Estado', 'Inicio', 'Fin'];
        const rows = tasks.map(task => {
            const programmerNames = task.assignments.map(a => a.programmerName).join(', ');
            const latestEndDate = task.assignments.map(a => a.endDate).sort().pop() || '';
            const row = [task.id, task.requirement, task.module, task.target, programmerNames, task.platform, task.link, task.status, task.startDate, latestEndDate];
            return row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "planificador_desarrollos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Exportación Completa', 'El fichero CSV ha sido descargado.');
    };
    
    // Sort and Filter Logic
    const sortedAndFilteredTasks = useMemo(() => {
        let filtered = [...tasks];

        // Visibility filters
        if (visibilityFilters.status.length > 0 && visibilityFilters.status.length < managedStatuses.length) {
            filtered = filtered.filter(task => visibilityFilters.status.includes(task.status));
        }
        if (visibilityFilters.module.length > 0 && visibilityFilters.module.length < modules.length) {
            filtered = filtered.filter(task => visibilityFilters.module.includes(task.module));
        }
        if (visibilityFilters.programmer.length > 0 && visibilityFilters.programmer.length < programmers.length) {
            filtered = filtered.filter(task => task.assignments.some(a => visibilityFilters.programmer.includes(a.programmerName)));
        }

        // Text filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                // FIX: Safely convert filter value to a lowercase string to prevent `toLowerCase` errors on potentially `unknown` types.
                const lowercasedValue = String(value).toLowerCase();
                const filterKey = key as keyof Task | 'programmers';
                filtered = filtered.filter(task => {
                    if (filterKey === 'programmers') {
                        // FIX: Safely convert programmerName to a string before calling toLowerCase to avoid potential runtime errors.
                        return task.assignments.some(a => String(a.programmerName).toLowerCase().includes(lowercasedValue));
                    }
                    const taskValue = task[filterKey as keyof Task];
                    // FIX: Safely convert taskValue to a string before calling toLowerCase as its type can be an array or other non-string types, which could cause a runtime error.
                    return String(taskValue ?? '').toLowerCase().includes(lowercasedValue);
                });
            }
        });

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: string | number = '';
                let bValue: string | number = '';

                if (sortConfig.key === 'endDate') {
                    aValue = a.assignments.map(a => a.endDate).sort().pop() || '0';
                    bValue = b.assignments.map(a => a.endDate).sort().pop() || '0';
                } else if (sortConfig.key === 'programmers') {
                     aValue = a.assignments.map(p => p.programmerName).sort().join(', ');
                     bValue = b.assignments.map(p => p.programmerName).sort().join(', ');
                } else {
                    // FIX: Safely access and convert potentially non-primitive task properties to strings for comparison, avoiding runtime errors.
                    aValue = String(a[sortConfig.key as keyof Task] ?? '');
                    bValue = String(b[sortConfig.key as keyof Task] ?? '');
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return filtered;
    }, [tasks, filters, sortConfig, visibilityFilters, managedStatuses.length, modules.length, programmers.length]);


    const handleSort = (key: keyof Task | 'endDate' | 'programmers') => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const allItemsConfig = useMemo(() => {
      // FIX: Ensure the configuration object includes both 'name' and 'color' to match the expected type in consuming components.
      const config: Record<string, { name: string, color: string }> = {};
      [...programmers, ...modules, ...platforms, ...targets, ...managedStatuses].forEach(item => {
        if (item.name) {
            config[item.name] = { name: item.name, color: item.color };
        }
      });
      return config;
    }, [programmers, modules, platforms, targets, managedStatuses]);

    // Planner modal logic
    const handleOpenPlannerModal = (programmer: ManagedItem, month: string) => {
        setPlannerModalContext({ programmer, month });
        setIsPlannerModalOpen(true);
    };

    const handleUpdateUserAccess = async (docId: string, status: UserAccessStatus) => {
        setUserAccessActionId(docId);
        try {
            await firestore.updateUserAccessStatus(docId, status);
            await refreshData();
            showNotification('Acceso actualizado', status === 'approved' ? 'El usuario ahora puede acceder a la aplicación.' : 'El usuario ha sido revocado.');
        } catch (error) {
            console.error('Error updating user access:', error);
            showNotification('Error', 'No se pudo actualizar el acceso del usuario.');
        } finally {
            setUserAccessActionId(null);
        }
    };

    const handleApproveUserAccess = (docId: string) => handleUpdateUserAccess(docId, 'approved');
    const handleRevokeUserAccess = (docId: string) => handleUpdateUserAccess(docId, 'revoked');

    const handleAssignToPlanner = async (taskIds: string[]) => {
        if (!plannerModalContext) return;
        const { programmer, month } = plannerModalContext;
        
        try {
            for (const taskId of taskIds) {
                const taskDoc = taskDocs.find(t => t.id === taskId);
                const task = tasks.find(t => t.id === taskId);
                if (!taskDoc || !task) continue;

                // Set start date if not present
                if (!taskDoc.startDate) {
                    await firestore.updateTaskDoc(taskId, { startDate: month });
                }
                
                // Get existing assignments for the task
                const existingAssignments = taskAssignments.filter(a => a.taskId === taskId);
                const programmerId = programmers.find(p => p.name === programmer.name)?.id;
                if (!programmerId) continue;
                
                const newAssignment = { programmerId, endDate: month };
                const updatedAssignments = [...existingAssignments.filter(a => a.programmerId !== programmerId), newAssignment];
                
                await firestore.saveTask(taskDoc, updatedAssignments, existingAssignments);
                await handleAddActivityLog('Asignación Planificador', task, `Asignado a ${programmer.name} en ${month}.`);
            }
            await refreshData();
            showNotification('Asignación Completa', `${taskIds.length} requisito(s) asignado(s) a ${programmer.name}.`);
        } catch (error) {
             console.error("Error assigning task to planner:", error);
             showNotification('Error', 'No se pudo asignar el requisito.');
        }

        setIsPlannerModalOpen(false);
        setPlannerModalContext(null);
    };
    
     const handleTaskMove = async (taskId: string, oldProgrammerName: string, newProgrammerName: string, newMonth: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        try {
            const taskDoc = taskDocs.find(t => t.id === taskId)!;
            const currentAssignments = taskAssignments.filter(a => a.taskId === taskId);

            const oldProgrammerId = programmers.find(p => p.name === oldProgrammerName)?.id;
            const newProgrammerId = programmers.find(p => p.name === newProgrammerName)?.id;
            
            if (!newProgrammerId) return;

            // Remove old assignment if programmer changed
            const assignmentsWithoutOld = oldProgrammerName !== newProgrammerName
                ? currentAssignments.filter(a => a.programmerId !== oldProgrammerId)
                : currentAssignments;
            
            const newAssignment = { programmerId: newProgrammerId, endDate: newMonth };

            // Remove any existing assignment for the new programmer to avoid duplicates, then add the new one.
            const finalAssignments = [
                ...assignmentsWithoutOld.filter(a => a.programmerId !== newProgrammerId),
                newAssignment
            ];

            await firestore.saveTask(taskDoc, finalAssignments, currentAssignments);

            // Update startDate if it's now later than the endDate
            const startDateNum = parseInt((task.startDate || '0').replace('-', ''), 10);
            const endDateNum = parseInt(newMonth.replace('-', ''), 10);
            if (!task.startDate || startDateNum > endDateNum) {
                await firestore.updateTaskDoc(taskId, { startDate: newMonth });
            }

            await handleAddActivityLog('Planificador Actualizado', task, `Movido a ${newProgrammerName} para finalizar en ${newMonth}.`);
            await refreshData();
        } catch (error) {
            console.error("Error moving task:", error);
            showNotification('Error', 'No se pudo mover la tarea.');
        }
    };
    
    const handleTaskResize = async (taskId: string, newDates: { startDate?: string; endDate?: string }) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        try {
            const taskDoc = taskDocs.find(t => t.id === taskId)!;
            const currentAssignments = taskAssignments.filter(a => a.taskId === taskId);
            
            // For simplicity, we assume resizing applies the new end date to all assignees.
            if (newDates.endDate) {
                const updatedAssignments = currentAssignments.map(a => ({...a, endDate: newDates.endDate! }));
                await firestore.saveTask(taskDoc, updatedAssignments.map(a => ({programmerId: a.programmerId, endDate: a.endDate})), currentAssignments);
            }
            if (newDates.startDate) {
                await firestore.updateTaskDoc(taskId, { startDate: newDates.startDate });
            }
            
            const dateChange = newDates.startDate ? `Inicio: ${newDates.startDate}` : `Fin: ${newDates.endDate}`;
            await handleAddActivityLog('Planificador Actualizado', task, `Fechas ajustadas. ${dateChange}.`);
            await refreshData();
        } catch (error) {
             console.error("Error resizing task:", error);
             showNotification('Error', 'No se pudo ajustar la tarea.');
        }
    };

    const handleSuggestionStatusChange = async (id: string, newStatus: Suggestion['status']) => {
        const suggestion = suggestions.find(s => s.id === id);
        if (suggestion) {
            const updatedSuggestion = { ...suggestion, status: newStatus };
            try {
                await firestore.updateSuggestion(updatedSuggestion);
                setSuggestions(prev => prev.map(s => s.id === id ? updatedSuggestion : s));
            } catch (error) {
                console.error("Error updating suggestion:", error);
            }
        }
    };
    
    const handleApplySuggestion = (suggestion: Suggestion) => {
        setSuggestionToApply(suggestion);
        setIsApplyModalOpen(true);
    };

    const handleSaveDailyLog = async (log: Omit<DailyLog, 'id' | 'docId'>) => {
        try {
            await firestore.saveDailyLog(log);
            await refreshData();
            showNotification('Parte guardado', 'El parte diario se ha guardado correctamente.');
        } catch (error) {
            console.error("Error saving daily log:", error);
            showNotification('Error', 'No se pudo guardar el parte diario.');
        }
    };
    
    const handleDeleteDailyLog = async (date: string, programmerId: string) => {
        const programmerName = programmers.find(p => p.id === programmerId)?.name || 'desconocido';
        requestConfirmation(
            'Eliminar Parte Diario',
            `¿Estás seguro de que quieres eliminar el parte de ${programmerName} para este día?`,
            async () => {
                try {
                    await firestore.deleteDailyLog(date, programmerId);
                    await refreshData();
                    showNotification('Parte eliminado', 'El parte diario se ha eliminado.');
                } catch (error) {
                    console.error("Error deleting daily log:", error);
                    showNotification('Error', 'No se pudo eliminar el parte diario.');
                }
            }
        );
    };

    const handleProcessDailySummary = async (date: string, summary: string) => {
        const programmerNames = programmers.map(p => p.name).filter(name => name !== "Sin asignar");

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Analiza el siguiente resumen del día y extrae las tareas realizadas por cada programador. Responde únicamente con un objeto JSON. Los nombres de los programadores válidos son: ${programmerNames.join(', ')}.

Resumen: "${summary}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            daily_logs: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        programmer_name: { type: Type.STRING },
                                        tasks: {
                                            type: Type.ARRAY,
                                            items: { type: Type.STRING }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const result = JSON.parse(response.text);
            const logs = result.daily_logs as { programmer_name: string, tasks: string[] }[];

            if (!logs || logs.length === 0) {
                 showNotification('Sin resultados', 'La IA no pudo extraer información del resumen.');
                 return;
            }

            for (const log of logs) {
                const programmer = programmers.find(p => p.name === log.programmer_name);
                if (programmer) {
                    const logText = log.tasks.join('\n');
                    await firestore.saveDailyLog({ date, programmerId: programmer.id, text: logText });
                }
            }

            await refreshData();
            showNotification('Resumen Procesado', 'Los partes diarios han sido generados por la IA.');

        } catch (error) {
            console.error("Error processing summary with AI:", error);
            showNotification('Error de IA', 'No se pudo procesar el resumen.');
        }
    };
    
    const handleProcessMeeting = async (requirementId: string, meetingNotes: string, date: string) => {
        const task = tasks.find(t => t.id === requirementId);
        if (!task) {
            showNotification('Error', 'No se encontró el requisito seleccionado.');
            return;
        }

        const involvedProgrammerNames = task.assignments.map(a => a.programmerName).filter(name => name !== 'Sin asignar');
        if (involvedProgrammerNames.length === 0) {
            showNotification('Error', 'El requisito no tiene programadores válidos asignados.');
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Analiza las siguientes notas de una reunión sobre el requisito "${task.requirement}" del día ${date}. Extrae un resumen, las acciones analizadas, las conclusiones, las decisiones tomadas y una lista de tareas asignadas a los programadores. Los programadores válidos son: [${involvedProgrammerNames.join(', ')}]. Si no se asigna una tarea a alguien, usa "Todos". Devuelve el resultado únicamente en formato JSON. Las acciones, conclusiones y decisiones deben ser arrays de strings.

Notas de la reunión:
---
${meetingNotes}
---`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            summary: { type: Type.STRING, description: "Resumen conciso de la reunión." },
                            actionsAnalyzed: { type: Type.ARRAY, description: "Lista de puntos o acciones clave que se discutieron.", items: { type: Type.STRING } },
                            conclusions: { type: Type.ARRAY, description: "Lista de conclusiones principales a las que se llegó.", items: { type: Type.STRING } },
                            decisions: { type: Type.ARRAY, description: "Lista de decisiones firmes que se tomaron.", items: { type: Type.STRING } },
                            tasks: {
                                type: Type.ARRAY,
                                description: "Lista de tareas específicas asignadas.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        text: { type: Type.STRING, description: "La descripción de la tarea." },
                                        programmer: { type: Type.STRING, description: `El programador asignado. Debe ser uno de: ${involvedProgrammerNames.join(', ')} o "Todos".` }
                                    },
                                    required: ['text', 'programmer']
                                }
                            }
                        },
                        required: ['summary', 'actionsAnalyzed', 'conclusions', 'decisions', 'tasks']
                    },
                },
            });

            const resultText = response.text.trim();
            if (!resultText) {
                throw new Error("La IA ha devuelto una respuesta vacía.");
            }
            
            let structuredResult;
            try {
                structuredResult = JSON.parse(resultText);
            } catch(e) {
                console.error("Fallo al parsear JSON de Gemini:", resultText);
                throw new Error("La respuesta de la IA no es un JSON válido.");
            }

            const meetingId = `${date}_${requirementId}`;
            // FIX: Add missing 'requirementName' property to ensure type compatibility.
            const newMeeting: Omit<MeetingDoc, 'docId'> = {
                id: meetingId,
                date,
                requirementId,
                requirementName: task.requirement,
                summary: structuredResult.summary || 'N/A',
                actionsAnalyzed: structuredResult.actionsAnalyzed || [],
                conclusions: structuredResult.conclusions || [],
                decisions: structuredResult.decisions || [],
                tasks: (structuredResult.tasks || []).map((t: any) => ({
                    text: t.text,
                    programmer: t.programmer,
                    completed: false
                })),
            };

            await firestore.saveMeeting(newMeeting);

            setMeetingModalContext({isOpen: false, date: null});
            showNotification('Reunión Procesada', 'La reunión ha sido guardada correctamente.');
            await refreshData();
        } catch (error) {
            console.error("Error processing meeting notes:", error);
            showNotification('Error de IA', 'No se pudo procesar la reunión. Revisa la consola para más detalles.');
        }
    };
    
    const handleOpenMeetingDetailsModal = (meeting: Meeting) => {
        setMeetingDetailsModalState({ isOpen: true, meeting });
    };

    const handleUpdateMeeting = async (updatedMeeting: Meeting, originalDocId: string) => {
        try {
            const newDocId = `${updatedMeeting.date}_${updatedMeeting.requirementId}`;
            const { docId, ...meetingToSave } = updatedMeeting;

            if (newDocId !== originalDocId) {
                // ID has changed, so we delete the old one and create a new one.
                await firestore.deleteMeeting(originalDocId);
                const newMeetingData = { ...meetingToSave, id: newDocId };
                await firestore.saveMeeting(newMeetingData);
            } else {
                // ID is the same, just update.
                await firestore.saveMeeting(meetingToSave);
            }
            
            await refreshData();
            setMeetingDetailsModalState({ isOpen: false, meeting: null });
            showNotification('Éxito', 'Reunión actualizada correctamente.');
        } catch (error) {
            console.error("Error updating meeting:", error);
            showNotification('Error', 'No se pudo actualizar la reunión.');
        }
    };

    const handleDeleteMeeting = async (docId: string) => {
        const meetingToDelete = meetings.find(m => m.docId === docId);
        requestConfirmation(
            'Eliminar Reunión',
            `¿Estás seguro de que quieres ELIMINAR permanentemente la reunión sobre "${meetingToDelete?.requirementName || 'Requisito desconocido'}"?`,
            async () => {
                try {
                    await firestore.deleteMeeting(docId);
                    setMeetings(prevMeetings => prevMeetings.filter(m => m.docId !== docId));
                    setMeetingDetailsModalState({ isOpen: false, meeting: null });
                    showNotification('Éxito', 'Reunión eliminada correctamente.');
                } catch (error) {
                    console.error("Error deleting meeting:", error);
                    showNotification('Error', 'No se pudo eliminar la reunión.');
                }
            }
        );
    };
    
    const handleManagedItemDelete = (collectionName: 'programmers' | 'modules' | 'platforms' | 'targets', item: ManagedItem) => {
        requestConfirmation(
            `Eliminar ${item.name}`,
            `¿Estás seguro de que quieres eliminar "${item.name}"? Esta acción no se puede deshacer.`,
            async () => {
                await firestore.deleteManagedItem(collectionName, item.docId);
                refreshData();
                showNotification('Éxito', `"${item.name}" ha sido eliminado.`);
            }
        );
    };

    const handleStatusDelete = (status: ManagedStatus) => {
        requestConfirmation(
            `Eliminar ${status.name}`,
            `¿Estás seguro de que quieres eliminar el estado "${status.name}"?`,
            async () => {
                await firestore.deleteManagedStatus(status.docId);
                refreshData();
                showNotification('Éxito', `El estado "${status.name}" ha sido eliminado.`);
            }
        );
    };


    const renderView = () => {
        switch (currentView) {
            case 'board':
                return <KanbanBoard tasks={sortedAndFilteredTasks} onEdit={handleEditTask} onTaskStatusChange={handleTaskStatusChange} statuses={managedStatuses.map(s => s.name)} statusConfig={allItemsConfig} allItemsConfig={allItemsConfig} />;
            case 'table':
                return <TableView 
                            tasks={sortedAndFilteredTasks} 
                            onEdit={handleEditTask} 
                            statusConfig={allItemsConfig}
                            managedItemsMap={{ module: modules, target: targets, programmer: programmers, platform: platforms }}
                            allItemsConfig={allItemsConfig}
                            onTaskUpdate={handleTaskUpdateFromTable}
                            managedStatuses={managedStatuses}
                            sortConfig={sortConfig}
                            onSort={handleSort}
                            filters={filters}
                            onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
                            visibilityFilters={visibilityFilters}
                            onVisibilityFiltersChange={setVisibilityFilters}
                            allModules={modules}
                            allProgrammers={programmers}
                        />;
            case 'planner':
                return <PlannerView tasks={tasks} programmers={programmers} onEdit={handleEditTask} statusConfig={allItemsConfig} allItemsConfig={allItemsConfig} onOpenPlannerModal={handleOpenPlannerModal} onTaskMove={handleTaskMove} onTaskResize={handleTaskResize} />;
            case 'dbManagement':
                return <DbManagementView 
                    programmers={programmers}
                    onProgrammerAdd={(item) => firestore.addManagedItem('programmers', item).then(refreshData)}
                    onProgrammerUpdate={(item) => firestore.updateManagedItem('programmers', item).then(refreshData)}
                    onProgrammerDelete={(item) => handleManagedItemDelete('programmers', item)}
                    modules={modules}
                    onModuleAdd={(item) => firestore.addManagedItem('modules', item).then(refreshData)}
                    onModuleUpdate={(item) => firestore.updateManagedItem('modules', item).then(refreshData)}
                    onModuleDelete={(item) => handleManagedItemDelete('modules', item)}
                    platforms={platforms}
                    onPlatformAdd={(item) => firestore.addManagedItem('platforms', item).then(refreshData)}
                    onPlatformUpdate={(item) => firestore.updateManagedItem('platforms', item).then(refreshData)}
                    onPlatformDelete={(item) => handleManagedItemDelete('platforms', item)}
                    targets={targets}
                    onTargetAdd={(item) => firestore.addManagedItem('targets', item).then(refreshData)}
                    onTargetUpdate={(item) => firestore.updateManagedItem('targets', item).then(refreshData)}
                    onTargetDelete={(item) => handleManagedItemDelete('targets', item)}
                    managedStatuses={managedStatuses}
                    onStatusAdd={(item) => firestore.addManagedStatus(item).then(refreshData)}
                    onStatusUpdate={(item) => firestore.updateManagedStatus(item).then(refreshData)}
                    onStatusDelete={handleStatusDelete}
                />
            case 'suggestions':
                return <SuggestionsView suggestions={suggestions} onStatusChange={handleSuggestionStatusChange} onApply={handleApplySuggestion} />;
            case 'documentation':
                return <ProjectDocumentationView />;
            case 'filestore':
                return <FilestoreView />;
            case 'activityLog':
                return <ActivityLogView logs={activityLog} />;
            case 'dailyLog':
                 return <DailyLogView 
                            programmers={programmers} 
                            dailyLogs={dailyLogs} 
                            onSaveLog={handleSaveDailyLog} 
                            onDeleteLog={handleDeleteDailyLog}
                            onProcessSummary={handleProcessDailySummary}
                            onOpenMeetingModal={(date) => setMeetingModalContext({isOpen: true, date: date})}
                            meetings={meetings}
                            tasks={tasks}
                            onOpenMeetingDetailsModal={handleOpenMeetingDetailsModal}
                        />;
             case 'meetings':
                return <MeetingsView 
                            meetings={meetings}
                            tasks={tasks}
                            programmers={programmers}
                            onOpenMeetingModal={() => setMeetingModalContext({isOpen: true, date: null})}
                            onOpenMeetingDetailsModal={handleOpenMeetingDetailsModal}
                            onUpdateMeeting={handleUpdateMeeting}
                        />;
            case 'userAccess':
                return (
                    <UserAccessView
                        requests={userAccessRequests}
                        processingId={userAccessActionId}
                        onApprove={handleApproveUserAccess}
                        onRevoke={handleRevokeUserAccess}
                    />
                );
            case 'dashboard':
            default:
                return <DashboardView tasks={tasks} programmers={programmers} modules={modules} managedStatuses={managedStatuses} statusConfig={allItemsConfig} />;
        }
    };

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${isDarkMode ? 'dark' : ''}`}>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          <Sidebar currentView={currentView} onSetView={setCurrentView} isOpen={isSidebarOpen} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header
              onAddTaskClick={handleAddTask}
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode(!isDarkMode)}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onExportCsv={exportToCsv}
              user={user}
              onLogout={logOut}
            />
            <main className="flex-1 overflow-y-auto">
              {renderView()}
            </main>
          </div>
          <TaskModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onSave={handleSaveTask}
            programmers={programmers}
            taskToEdit={taskToEdit}
            modules={modules}
            platforms={platforms}
            targets={targets}
            managedStatuses={managedStatuses}
            onAddSubtask={handleAddSubtask}
            onUpdateSubtask={handleUpdateSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onAddFileAttachment={handleAddFileAttachment}
            onAddLinkAttachment={handleAddLinkAttachment}
            onUpdateAttachment={handleUpdateAttachment}
            onDeleteAttachment={handleDeleteAttachment}
          />
           <PlannerTaskSelectorModal 
                isOpen={isPlannerModalOpen}
                onClose={() => setIsPlannerModalOpen(false)}
                onAssign={handleAssignToPlanner}
                tasks={tasks}
                statusConfig={allItemsConfig}
           />
           <ApplySuggestionModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                suggestion={suggestionToApply}
           />
           <MeetingLogModal
                isOpen={meetingModalContext.isOpen}
                onClose={() => setMeetingModalContext({isOpen: false, date: null})}
                date={meetingModalContext.date}
                tasks={tasks}
                programmers={programmers}
                onProcessMeeting={handleProcessMeeting}
           />
           <MeetingDetailsModal
                isOpen={meetingDetailsModalState.isOpen}
                onClose={() => setMeetingDetailsModalState({ isOpen: false, meeting: null })}
                meeting={meetingDetailsModalState.meeting}
                onUpdateMeeting={handleUpdateMeeting}
                onDeleteMeeting={handleDeleteMeeting}
                tasks={tasks}
                programmers={programmers}
           />
           <ConfirmationModal
                isOpen={confirmationState.isOpen}
                onClose={closeConfirmation}
                onConfirm={confirmationState.onConfirm}
                title={confirmationState.title}
                message={confirmationState.message}
           />
          <Toast
            show={notification.show}
            message={notification.message}
            subMessage={notification.subMessage}
            onClose={() => setNotification({ ...notification, show: false })}
          />
        </>
      )}
    </div>
  );
};

export default App;
