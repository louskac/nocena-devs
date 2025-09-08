import { AppState, StorageData } from './types';

// Load data from API
export async function loadData(): Promise<AppState> {
  try {
    const response = await fetch('/api/data', {
      method: 'GET',
      cache: 'no-store' // Always get fresh data
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert date strings back to Date objects
    const deserializedData = deserializeDates(data) as AppState;
    
    console.log('Data loaded successfully from API:', {
      tasks: deserializedData.tasks.length,
      developers: deserializedData.developers.length
    });
    
    return deserializedData;
    
  } catch (error) {
    console.error('Error loading data from API:', error);
    // Return default empty state on error
    return { tasks: [], developers: [] };
  }
}

// Save data to API
export async function saveData(state: AppState): Promise<boolean> {
  try {
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Data saved successfully to API');
      return true;
    } else {
      throw new Error(result.error || 'Save failed');
    }
    
  } catch (error) {
    console.error('Error saving data to API:', error);
    return false;
  }
}

// Clear all data
export async function clearData(): Promise<boolean> {
  try {
    const response = await fetch('/api/data', {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Data cleared successfully');
      return true;
    } else {
      throw new Error(result.error || 'Clear failed');
    }
    
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
      version: '1.0'
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

// Check if API is available (always true for API-based storage)
export function isStorageAvailable(): boolean {
  return true;
}

// Helper function to validate storage data structure
function validateStorageData(data: unknown): data is StorageData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const dataObj = data as Record<string, unknown>;
  
  if (!Array.isArray(dataObj.tasks) || !Array.isArray(dataObj.developers)) {
    return false;
  }
  
  return true;
}

// Helper function to convert date strings back to Date objects
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
    
    // Recursively process nested objects
    Object.keys(result).forEach(key => {
      if (result[key] && typeof result[key] === 'object' && !(result[key] instanceof Date)) {
        result[key] = deserializeDates(result[key]);
      }
    });
    
    return result;
  }
  
  return data;
}