import { ValidationError, FormValidationResult, TaskFormData, CompletionFormData, Task } from './types';

// Generate unique IDs for tasks and developers
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}-${randomStr}`;
}

// Validate task creation form
export function validateTaskForm(data: TaskFormData): FormValidationResult {
  const errors: ValidationError[] = [];

  if (!data.name.trim()) {
    errors.push({ field: 'name', message: 'Task name is required' });
  }

  if (!data.description.trim()) {
    errors.push({ field: 'description', message: 'Task description is required' });
  }

  if (data.points <= 0) {
    errors.push({ field: 'points', message: 'Points must be greater than 0' });
  }

  if (!Number.isInteger(data.points)) {
    errors.push({ field: 'points', message: 'Points must be a whole number' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate task completion form
export function validateCompletionForm(data: CompletionFormData): FormValidationResult {
  const errors: ValidationError[] = [];

  if (data.hoursSpent <= 0) {
    errors.push({ field: 'hoursSpent', message: 'Hours spent must be greater than 0' });
  }

  if (!data.gitCommit.trim()) {
    errors.push({ field: 'gitCommit', message: 'Git commit reference is required' });
  } else if (!/^[a-f0-9]{6,40}$/i.test(data.gitCommit.trim())) {
    errors.push({ field: 'gitCommit', message: 'Git commit must be a valid hash (6-40 characters)' });
  }

  if (!data.comments.trim()) {
    errors.push({ field: 'comments', message: 'Completion comments are required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Format date for display
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Calculate developer statistics
export function calculateDeveloperStats(tasks: Task[], developerId: string) {
  const developerTasks = tasks.filter(task => 
    task.assignedTo === developerId && task.status === 'completed'
  );

  return {
    totalPoints: developerTasks.reduce((sum, task) => sum + task.points, 0),
    completedTasks: developerTasks.length,
    totalHours: developerTasks.reduce((sum, task) => 
      sum + (task.completionDetails?.hoursSpent || 0), 0
    )
  };
}

// Debounce function for storage operations
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}