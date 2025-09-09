import { AppState, StorageData, Task, Developer } from './types';

const STORAGE_KEY = 'nocena-devs-data';
const STORAGE_VERSION = '1.0';

// Default empty state
const DEFAULT_STATE: AppState = {
  tasks: [],
  developers: []
};

// Convert dates from JSON strings back to Date objects
function deserializeDates(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(deserializeDates);
  }

  if (data && typeof data === 'object' && data.constructor === Object) {
    const result = { ...data } as Record<string, unknown>;

    // Convert date strings back to Date objects
    if (result.createdAt && typeof result.createdAt === 'string') {
      result.createdAt = new Date(result.createdAt);
    }
    if (result.completedAt && typeof result.completedAt === 'string') {
      result.completedAt = new Date(result.completedAt);
    }

    // Recursively process nested objects (but not Date objects)
    Object.keys(result).forEach(key => {
      if (result[key] && typeof result[key] === 'object' && !(result[key] instanceof Date)) {
        result[key] = deserializeDates(result[key]);
      }
    });

    return result;
  }

  return data;
}

// Validate storage data structure
function validateStorageData(data: unknown): data is StorageData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const dataObj = data as Record<string, unknown>;

  if (!Array.isArray(dataObj.tasks) || !Array.isArray(dataObj.developers)) {
    return false;
  }

  // Validate task structure
  for (const task of dataObj.tasks) {
    const taskObj = task as Record<string, unknown>;
    if (!taskObj.id || !taskObj.name || typeof taskObj.points !== 'number') {
      return false;
    }
    if (!['backlog', 'assigned', 'completed'].includes(taskObj.status as string)) {
      return false;
    }
  }

  // Validate developer structure
  for (const dev of dataObj.developers) {
    const devObj = dev as Record<string, unknown>;
    if (!devObj.id || !devObj.name || typeof devObj.totalPoints !== 'number') {
      return false;
    }
  }

  return true;
}

// Load data from localStorage with enhanced error recovery
export function loadData(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      console.log('No stored data found, initializing with default state');
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(stored);

    // Try to migrate data if it's from an older version
    const migratedData = migrateData(parsed);

    if (!validateStorageData(migratedData)) {
      console.warn('Invalid storage data structure detected');

      // Try to recover partial data
      const recoveredData = recoverPartialData(migratedData);
      if (recoveredData) {
        console.log('Partial data recovery successful');
        return recoveredData;
      }

      console.warn('Data recovery failed, falling back to default state');
      // Backup corrupted data before clearing
      backupCorruptedData(stored);
      return DEFAULT_STATE;
    }

    // Deserialize dates and return the data
    const deserializedData = deserializeDates(migratedData) as StorageData;

    return {
      tasks: deserializedData.tasks || [],
      developers: deserializedData.developers || []
    };

  } catch (error) {
    console.error('Error loading data from localStorage:', error);

    // Try to backup the corrupted data
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        backupCorruptedData(stored);
      }
    } catch (backupError) {
      console.error('Failed to backup corrupted data:', backupError);
    }

    return DEFAULT_STATE;
  }
}

// Save data to localStorage with enhanced error handling
export function saveData(state: AppState): boolean {
  try {
    // Validate data before saving
    if (!state || !Array.isArray(state.tasks) || !Array.isArray(state.developers)) {
      throw new Error('Invalid state structure');
    }

    const storageData: StorageData = {
      tasks: state.tasks,
      developers: state.developers,
      version: STORAGE_VERSION
    };

    // Validate the storage data structure
    if (!validateStorageData(storageData)) {
      throw new Error('Data validation failed before save');
    }

    const serialized = JSON.stringify(storageData, null, 2);

    // Check if we have enough storage space
    const estimatedSize = new Blob([serialized]).size;
    if (estimatedSize > 5 * 1024 * 1024) { // 5MB limit
      console.warn('Data size is large:', estimatedSize, 'bytes');
    }

    // Create a backup of current data before overwriting (only if data exists)
    const currentData = localStorage.getItem(STORAGE_KEY);
    if (currentData && currentData !== 'null') {
      try {
        const backupKey = `${STORAGE_KEY}-backup-last`;
        localStorage.setItem(backupKey, currentData);
      } catch (backupError) {
        console.warn('Failed to create backup before save:', backupError);
        // Continue with save even if backup fails
      }
    }

    localStorage.setItem(STORAGE_KEY, serialized);

    console.log('Data saved successfully', {
      tasks: state.tasks.length,
      developers: state.developers.length,
      size: estimatedSize
    });
    return true;

  } catch (error) {
    console.error('Error saving data to localStorage:', error);

    // Try to restore from backup if save failed
    try {
      const backupData = localStorage.getItem(`${STORAGE_KEY}-backup-last`);
      if (backupData) {
        localStorage.setItem(STORAGE_KEY, backupData);
        console.log('Restored from backup after save failure');
      }
    } catch (restoreError) {
      console.error('Failed to restore backup after save failure:', restoreError);
    }

    return false;
  }
}

// Clear all stored data
export function clearData(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}

// Export data as JSON string for backup
export function exportData(state: AppState): string {
  try {
    const storageData: StorageData = {
      tasks: state.tasks,
      developers: state.developers,
      version: STORAGE_VERSION
    };

    return JSON.stringify(storageData, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('Failed to export data');
  }
}

// Import data from JSON string
export function importData(jsonString: string): AppState {
  try {
    const parsed = JSON.parse(jsonString);

    if (!validateStorageData(parsed)) {
      throw new Error('Invalid data format');
    }

    const deserializedData = deserializeDates(parsed) as StorageData;

    return {
      tasks: deserializedData.tasks || [],
      developers: deserializedData.developers || []
    };

  } catch (error) {
    console.error('Error importing data:', error);
    throw new Error('Failed to import data: Invalid JSON format');
  }
}

// Check if localStorage is available
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Migrate data from older versions (for future use)
export function migrateData(data: unknown): StorageData {
  // Currently no migrations needed, but this function
  // can be extended when the data structure changes
  const dataObj = data as Record<string, unknown>;
  if (!dataObj.version) {
    // Add version to legacy data
    dataObj.version = STORAGE_VERSION;
  }

  return dataObj as unknown as StorageData;
}

// Attempt to recover partial data from corrupted storage
function recoverPartialData(data: unknown): AppState | null {
  try {
    const recovered: AppState = {
      tasks: [],
      developers: []
    };

    const dataObj = data as Record<string, unknown>;

    // Try to recover tasks
    if (Array.isArray(dataObj.tasks)) {
      recovered.tasks = dataObj.tasks.filter((task: unknown) => {
        const taskObj = task as Record<string, unknown>;
        return taskObj &&
          typeof taskObj.id === 'string' &&
          typeof taskObj.name === 'string' &&
          typeof taskObj.points === 'number' &&
          ['backlog', 'assigned', 'completed'].includes(taskObj.status as string);
      }) as Task[];
    }

    // Try to recover developers
    if (Array.isArray(dataObj.developers)) {
      recovered.developers = dataObj.developers.filter((dev: unknown) => {
        const devObj = dev as Record<string, unknown>;
        return devObj &&
          typeof devObj.id === 'string' &&
          typeof devObj.name === 'string' &&
          typeof devObj.totalPoints === 'number';
      }) as Developer[];
    }

    // Only return recovered data if we got something useful
    if (recovered.tasks.length > 0 || recovered.developers.length > 0) {
      console.log(`Recovered ${recovered.tasks.length} tasks and ${recovered.developers.length} developers`);
      return recovered;
    }

    return null;
  } catch (error) {
    console.error('Data recovery failed:', error);
    return null;
  }
}

// Backup corrupted data for potential manual recovery
function backupCorruptedData(corruptedData: string): void {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `${STORAGE_KEY}-corrupted-${timestamp}`;
    localStorage.setItem(backupKey, corruptedData);
    console.log(`Corrupted data backed up to: ${backupKey}`);
  } catch (error) {
    console.error('Failed to backup corrupted data:', error);
  }
}

// Get list of backup keys for corrupted data
export function getCorruptedDataBackups(): string[] {
  try {
    const backupKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_KEY}-corrupted-`)) {
        backupKeys.push(key);
      }
    }
    return backupKeys.sort().reverse(); // Most recent first
  } catch (error) {
    console.error('Failed to get backup list:', error);
    return [];
  }
}

// Restore data from a backup
export function restoreFromBackup(backupKey: string): AppState | null {
  try {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      throw new Error('Backup not found');
    }

    const parsed = JSON.parse(backupData);
    const recovered = recoverPartialData(parsed);

    if (recovered) {
      console.log(`Data restored from backup: ${backupKey}`);
      return recovered;
    }

    return null;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return null;
  }
}