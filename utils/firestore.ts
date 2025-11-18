import {
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    writeBatch,
    query,
    where,
    getDoc
} from 'firebase/firestore';
import { firestoreDB } from './firebase';
import { ManagedItem, ManagedStatus, Suggestion, Task, TaskDoc, TaskAssignmentDoc, ActivityLog, ActivityLogDoc, DailyLogDoc, DailySummaryDoc, MeetingDoc, UserAccessDoc, UserAccessStatus } from '../types';
import { DEFAULT_REQUIREMENT_TYPE } from '../constants';
import { INITIAL_SUGGESTIONS, AUTO_APPROVED_EMAILS } from '../constants';

type ManagedCollectionName = 'programmers' | 'modules' | 'platforms' | 'targets';

export const COLLECTIONS = {
    TASKS: 'tasks',
    TASK_ASSIGNMENTS: 'task_assignments',
    PROGRAMMERS: 'programmers',
    MODULES: 'modules',
    PLATFORMS: 'platforms',
    TARGETS: 'targets',
    MANAGED_STATUSES: 'managedStatuses',
    SUGGESTIONS: 'suggestions',
    ACTIVITY_LOG: 'activity_log',
    DAILY_LOGS: 'daily_logs',
    MEETINGS: 'meetings',
    USER_ACCESS: 'user_access',
} as const;

const getCollectionRef = (collectionName: string) => {
    // Firestore paths for collections must have an odd number of segments.
    // The structure is assumed to be: PLANIFICADOR (collection) / data (document) / {collectionName} (subcollection)
    return collection(firestoreDB, 'PLANIFICADOR', 'data', collectionName);
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const emailToDocId = (email: string) => normalizeEmail(email).replace(/[^a-z0-9]/g, '_');
    
const getDocRef = (collectionName: string, docId: string) => {
    // Firestore paths for documents must have an even number of segments.
    // The structure is assumed to be: PLANIFICADOR (collection) / data (document) / {collectionName} (subcollection) / {docId} (document)
    return doc(firestoreDB, 'PLANIFICADOR', 'data', collectionName, docId);
};

async function getNextId(collectionName: string): Promise<number> {
    const collectionRef = getCollectionRef(collectionName);
    const querySnapshot = await getDocs(collectionRef);

    if (querySnapshot.empty) {
        return 1;
    }

    let maxId = 0;
    querySnapshot.docs.forEach(doc => {
        // Use the 'id' field from the document data, not the document's own ID
        const data = doc.data();
        const id = parseInt(data.id, 10);
        if (!isNaN(id) && id > maxId) {
            maxId = id;
        }
    });

    return maxId + 1;
}

// FIX: Export `getAllFromCollection` to make it accessible to other modules.
export async function getAllFromCollection<T>(collectionName: string): Promise<T[]> {
    const collectionRef = getCollectionRef(collectionName);
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const docId = doc.id;
        // The object's `id` property will be from inside the document (the numeric one).
        // The document's own ID is stored as `docId` for DB operations.
        return { ...data, id: data.id || docId, docId } as T;
    });
}

export async function seedSuggestions() {
    const suggestionsCollection = getCollectionRef(COLLECTIONS.SUGGESTIONS);
    const batch = writeBatch(firestoreDB);
    let currentId = 1;

    INITIAL_SUGGESTIONS.forEach((suggestion) => {
        const newId = currentId.toString();
        const docRef = doc(suggestionsCollection, newId);
        const suggestionData: Omit<Suggestion, 'id'|'docId'> & {id: string} = {
            id: newId,
            text: suggestion.text,
            status: suggestion.status,
            category: suggestion.category,
        };
        batch.set(docRef, suggestionData);
        currentId++;
    });
    
    await batch.commit();
}


export async function getAllData() {
    const [
        tasks,
        task_assignments,
        programmers,
        modules,
        platforms,
        targets,
        managedStatuses,
        activity_log,
        daily_logs,
        meetings,
        userAccess,
    ] = await Promise.all([
        getAllFromCollection<TaskDoc>(COLLECTIONS.TASKS),
        getAllFromCollection<TaskAssignmentDoc>(COLLECTIONS.TASK_ASSIGNMENTS),
        getAllFromCollection<ManagedItem>(COLLECTIONS.PROGRAMMERS),
        getAllFromCollection<ManagedItem>(COLLECTIONS.MODULES),
        getAllFromCollection<ManagedItem>(COLLECTIONS.PLATFORMS),
        getAllFromCollection<ManagedItem>(COLLECTIONS.TARGETS),
        getAllFromCollection<ManagedStatus>(COLLECTIONS.MANAGED_STATUSES),
        getAllFromCollection<ActivityLogDoc>(COLLECTIONS.ACTIVITY_LOG),
        getAllFromCollection<DailyLogDoc>(COLLECTIONS.DAILY_LOGS),
        getAllFromCollection<MeetingDoc>(COLLECTIONS.MEETINGS),
        getAllFromCollection<UserAccessDoc>(COLLECTIONS.USER_ACCESS),
    ]);
    
    let suggestions = await getAllFromCollection<Suggestion>(COLLECTIONS.SUGGESTIONS);
    if (suggestions.length === 0 && INITIAL_SUGGESTIONS.length > 0) {
        await seedSuggestions();
        suggestions = await getAllFromCollection<Suggestion>(COLLECTIONS.SUGGESTIONS);
    }

    return {
        tasks,
        task_assignments,
        programmers,
        modules,
        platforms,
        targets,
        managedStatuses,
        suggestions,
        activity_log,
        daily_logs,
        meetings,
        userAccess,
    };
}

export async function addManagedItem(collectionName: ManagedCollectionName, item: Omit<ManagedItem, 'id' | 'docId'>) {
    const newId = (await getNextId(collectionName)).toString();
    const docRef = getDocRef(collectionName, newId);
    const newItemData = { ...item, id: newId };
    await setDoc(docRef, newItemData);
    return { ...newItemData, docId: newId };
}

export async function updateManagedItem(collectionName: ManagedCollectionName, item: ManagedItem) {
    const docRef = getDocRef(collectionName, item.docId);
    const { docId, ...itemToSave } = item;
    await setDoc(docRef, itemToSave, { merge: true });
}

export async function deleteManagedItem(collectionName: ManagedCollectionName, docId: string) {
    await deleteDoc(getDocRef(collectionName, docId));
}

export async function addManagedStatus(item: Omit<ManagedStatus, 'id' | 'docId'>) {
    const newId = (await getNextId(COLLECTIONS.MANAGED_STATUSES)).toString();
    const docRef = getDocRef(COLLECTIONS.MANAGED_STATUSES, newId);
    const newItemData = { ...item, id: newId };
    await setDoc(docRef, newItemData);
    return { ...newItemData, docId: newId };
}

export async function updateManagedStatus(item: ManagedStatus) {
    const docRef = getDocRef(COLLECTIONS.MANAGED_STATUSES, item.docId);
    const { docId, ...itemToSave } = item;
    await setDoc(docRef, itemToSave, { merge: true });
}

export async function deleteManagedStatus(docId: string) {
    await deleteDoc(getDocRef(COLLECTIONS.MANAGED_STATUSES, docId));
}


export async function saveTask(
    taskDoc: Omit<TaskDoc, 'id'> & { id?: string },
    assignments: { programmerId: string, endDate: string }[],
    existingAssignments: TaskAssignmentDoc[]
) {
    const batch = writeBatch(firestoreDB);
    const tasksCollectionRef = getCollectionRef(COLLECTIONS.TASKS);
    
    let taskId: string;
    let taskRef;

    if (taskDoc.id) {
        taskId = taskDoc.id;
        taskRef = doc(tasksCollectionRef, taskId);
    } else {
        const newNumericId = await getNextId(COLLECTIONS.TASKS);
        taskId = newNumericId.toString();
        taskRef = doc(tasksCollectionRef, taskId);
    }

    const { id, ...taskDataToSave } = taskDoc;
    // Ensure subtasks is an array, defaulting to empty if it's not present
    const finalTaskData = { 
        ...taskDataToSave, 
        id: taskId, 
        requirementType: taskDataToSave.requirementType || DEFAULT_REQUIREMENT_TYPE,
        subtasks: taskDataToSave.subtasks || [],
        attachments: taskDataToSave.attachments || [] 
    };
    batch.set(taskRef, finalTaskData);

    const assignmentsCollectionRef = getCollectionRef(COLLECTIONS.TASK_ASSIGNMENTS);
    const newProgrammerIds = new Set(assignments.map(a => a.programmerId));

    for (const oldAssignment of existingAssignments) {
        if (!newProgrammerIds.has(oldAssignment.programmerId)) {
            const assignmentRef = getDocRef(COLLECTIONS.TASK_ASSIGNMENTS, oldAssignment.docId);
            batch.delete(assignmentRef);
        }
    }

    let nextAssignmentId = -1; 

    for (const assignment of assignments) {
        const existing = existingAssignments.find(a => a.programmerId === assignment.programmerId);
        if (existing) {
            if (existing.endDate !== assignment.endDate) {
                const assignmentRef = getDocRef(COLLECTIONS.TASK_ASSIGNMENTS, existing.docId);
                batch.update(assignmentRef, { endDate: assignment.endDate });
            }
        } else {
             if (nextAssignmentId === -1) {
                nextAssignmentId = await getNextId(COLLECTIONS.TASK_ASSIGNMENTS);
            }
            const newId = nextAssignmentId.toString();
            const newAssignmentRef = doc(assignmentsCollectionRef, newId);
            batch.set(newAssignmentRef, {
                id: newId,
                taskId: taskId,
                programmerId: assignment.programmerId,
                endDate: assignment.endDate,
            });
            nextAssignmentId++;
        }
    }

    await batch.commit();
    return taskId;
}


export async function updateTaskDoc(taskId: string, updatedFields: Partial<Omit<TaskDoc, 'id'>>) {
     const docRef = getDocRef(COLLECTIONS.TASKS, taskId);
     await setDoc(docRef, updatedFields, { merge: true });
}

export async function getAssignmentsForTask(taskId: string): Promise<TaskAssignmentDoc[]> {
    const assignmentsCollectionRef = getCollectionRef(COLLECTIONS.TASK_ASSIGNMENTS);
    const q = query(assignmentsCollectionRef, where("taskId", "==", taskId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskAssignmentDoc));
}


export async function updateSuggestion(suggestion: Suggestion) {
    const docRef = getDocRef(COLLECTIONS.SUGGESTIONS, suggestion.id);
    await setDoc(docRef, suggestion, { merge: true });
}

export async function clearCollection(collectionName: string) {
    const collectionRef = getCollectionRef(collectionName);
    const querySnapshot = await getDocs(collectionRef);
    const batch = writeBatch(firestoreDB);
    querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}

export async function updateDocument(collectionName: string, docId: string, data: any) {
    const docRef = getDocRef(collectionName, docId);
    // Remove docId from the data payload before saving, as it's the document's key, not a field.
    const { docId: idToRemove, ...dataToSave } = data;
    await setDoc(docRef, dataToSave, { merge: true });
}

export async function addActivityLog(log: Omit<ActivityLog, 'id' | 'docId' | 'timestamp'>) {
    const newId = (await getNextId(COLLECTIONS.ACTIVITY_LOG)).toString();
    const docRef = getDocRef(COLLECTIONS.ACTIVITY_LOG, newId);
    const newLogData = { ...log, id: newId, timestamp: new Date().toISOString() };
    await setDoc(docRef, newLogData);
    return { ...newLogData, docId: newId };
}

export async function saveDailyLog(log: Omit<DailyLogDoc, 'id' | 'docId'>) {
    const docId = `${log.date}_${log.programmerId}`;
    const docRef = getDocRef(COLLECTIONS.DAILY_LOGS, docId);
    const logData = { ...log, id: docId };
    await setDoc(docRef, logData);
    return { ...logData, docId };
}

export async function deleteDailyLog(date: string, programmerId: string) {
    const docId = `${date}_${programmerId}`;
    const docRef = getDocRef(COLLECTIONS.DAILY_LOGS, docId);
    await deleteDoc(docRef);
}

export async function saveMeeting(meetingData: Omit<MeetingDoc, 'docId'>) {
    const docId = meetingData.id;
    const docRef = getDocRef(COLLECTIONS.MEETINGS, docId);
    await setDoc(docRef, meetingData, { merge: true });
    return { ...meetingData, docId };
}


export async function deleteMeeting(docId: string) {
    console.log(`[Firestore] Iniciando eliminación para el docId: ${docId}`);
    if (!docId) {
        console.error("[Firestore] Se intentó eliminar una reunión sin docId. Operación cancelada.");
        throw new Error("ID de documento no válido para la eliminación.");
    }
    try {
        const docRef = getDocRef(COLLECTIONS.MEETINGS, docId);
        console.log(`[Firestore] Referencia de documento creada. Ruta: ${docRef.path}`);
        await deleteDoc(docRef);
        console.log(`[Firestore] Éxito: Reunión con ID ${docId} eliminada correctamente.`);
    } catch (error) {
        console.error(`[Firestore] ERROR al intentar eliminar la reunión con ID ${docId}:`, error);
        throw error;
    }
}

export async function ensureUserAccessRecord(email: string, displayName?: string): Promise<UserAccessDoc> {
    const normalizedEmail = normalizeEmail(email);
    const docId = emailToDocId(normalizedEmail);
    const docRef = getDocRef(COLLECTIONS.USER_ACCESS, docId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
        return { ...(snapshot.data() as UserAccessDoc), docId };
    }

    const defaultStatus: UserAccessStatus = AUTO_APPROVED_EMAILS.some(allowed => allowed.toLowerCase() === normalizedEmail)
        ? 'approved'
        : 'pending';
    const timestamp = new Date().toISOString();
    const newRecord: Omit<UserAccessDoc, 'docId'> = {
        id: docId,
        email: normalizedEmail,
        displayName: displayName || '',
        status: defaultStatus,
        requestedAt: timestamp,
        updatedAt: timestamp,
    };
    await setDoc(docRef, newRecord);
    return { ...newRecord, docId };
}

export async function updateUserAccessStatus(docId: string, status: UserAccessStatus) {
    const docRef = getDocRef(COLLECTIONS.USER_ACCESS, docId);
    await setDoc(docRef, { status, updatedAt: new Date().toISOString() }, { merge: true });
}
