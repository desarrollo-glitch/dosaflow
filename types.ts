export type Status = 'Sin asignar' | 'Asignado' | 'En proceso' | 'Retrasado' | 'En testeo' | 'Finalizado' | 'Descartado' | string;

export type Target = 'web' | 'app' | 'ambos' | string;

export interface Assignment {
  programmerName: string;
  endDate: string; // YYYY-MM
}

export interface Subtask {
  id: string; // A unique identifier (e.g., UUID)
  text: string;
  completed: boolean;
}

export interface Attachment {
  id: string; // UUID
  name: string;
  url: string;
  type: 'link' | 'file';
  fileType?: string; // Mime type for files
  storagePath?: string; // Path in Firebase storage, for deletion
  createdAt: string; // ISO String for timestamp
}

export interface ActivityLog {
  id: string;
  docId: string; // Firestore doc ID
  taskId: string;
  taskRequirement: string;
  user: string;
  timestamp: string; // ISO 8601 string
  action: string;
  details: string;
}

export interface Task {
  id: string;
  requirement: string;
  module: string;
  target: Target;
  assignments: Assignment[];
  platform: string;
  link?: string;
  status: Status;
  startDate?: string;
  subtasks: Subtask[];
  attachments: Attachment[];
}

export interface ManagedItem {
    id: string;
    docId: string; // The Firestore document ID
    name: string;
    color: string;
}

export interface ManagedStatus {
    id: string;
    docId: string; // The Firestore document ID
    name: string;
    color: string;
}

export type SortDirection = 'ascending' | 'descending';

// FIX: Add 'programmers' to the sortable keys to align with its usage in sorting logic.
export interface SortConfig {
  key: keyof Task | 'endDate' | 'programmers';
  direction: SortDirection;
}

export type FilterState = Partial<Record<keyof Task | 'programmers', string>>;

export interface VisibilityFilters {
  status: string[];
  module: string[];
  programmer: string[];
}

export interface Suggestion {
  id: string;
  text: string;
  status: 'pending' | 'completed' | 'discarded';
  category: string;
}

export type View = 'dashboard' | 'table' | 'board' | 'planner' | 'dbManagement' | 'suggestions' | 'documentation' | 'filestore' | 'activityLog' | 'dailyLog' | 'meetings';


// Firestore Document Types
export interface TaskDoc {
  id: string;
  // FIX: Add docId for consistency, as it is added by the data fetching logic.
  docId: string; // The Firestore document ID
  requirement: string;
  moduleId: string;
  targetId: string;
  platformId: string;
  statusId: string;
  link?: string;
  startDate?: string;
  subtasks: Subtask[];
  attachments: Attachment[];
}

export interface TaskAssignmentDoc {
    id: string;
    // FIX: Add docId property to match the data structure returned from Firestore utils.
    docId: string; // The Firestore document ID
    taskId: string;
    programmerId: string;
    endDate: string; // YYYY-MM
}

export interface ActivityLogDoc {
  id: string;
  docId: string;
  taskId: string;
  taskRequirement: string;
  user: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface DailyLogDoc {
  id: string; // Composite key: YYYY-MM-DD_programmerId
  docId: string;
  date: string; // 'YYYY-MM-DD'
  programmerId: string;
  text: string;
}

export interface DailySummaryDoc {
  id: string; // 'YYYY-MM-DD'
  docId: string;
  date: string; // 'YYYY-MM-DD'
  summary: string;
}

export interface MeetingTask {
  text: string;
  programmer: string;
  completed: boolean;
}

export interface Meeting {
  id: string; // YYYY-MM-DD_requirementId
  docId: string;
  date: string; // 'YYYY-MM-DD'
  requirementId: string;
  requirementName: string; // For display purposes
  summary: string;
  actionsAnalyzed: string[];
  conclusions: string[];
  decisions: string[];
  tasks: MeetingTask[];
}

// Firestore Document Type for Meeting
export interface MeetingDoc {
  id: string; // YYYY-MM-DD_requirementId
  docId: string;
  date: string;
  requirementId: string;
  requirementName: string;
  summary: string;
  actionsAnalyzed: string[];
  conclusions: string[];
  decisions: string[];
  tasks: MeetingTask[];
}

// UI Models (can be the same as Doc models if no transformation is needed)
export type DailyLog = DailyLogDoc;
export type DailySummary = DailySummaryDoc;