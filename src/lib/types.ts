// Core data interfaces for the Developer Task Tracker

export type TaskStatus = 'backlog' | 'assigned' | 'completed';

export interface Task {
  id: string;
  name: string;
  description: string;
  points: number;
  status: TaskStatus;
  assignedTo?: string;
  createdAt: Date;
  completedAt?: Date;
  completionDetails?: TaskCompletionDetails;
}

export interface TaskCompletionDetails {
  hoursSpent: number;
  gitCommit: string;
  comments: string;
}

export interface Developer {
  id: string;
  name: string;
  totalPoints: number;
  completedTasks: number;
  totalHours: number;
}

export interface AppState {
  tasks: Task[];
  developers: Developer[];
}

// Form validation types
export interface TaskFormData {
  name: string;
  description: string;
  points: number;
}

export interface CompletionFormData {
  hoursSpent: number;
  gitCommit: string;
  comments: string;
}

// Utility types for form validation
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Drag and drop types
export interface DragData {
  taskId: string;
  sourceColumn: string;
}

// Storage types
export interface StorageData {
  tasks: Task[];
  developers: Developer[];
  version?: string;
}