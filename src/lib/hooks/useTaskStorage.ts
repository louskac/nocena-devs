import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Task, Developer } from '../types';
import { loadData, saveData, isStorageAvailable } from '../apiStorage';
import { debounce, calculateDeveloperStats } from '../utils';

// Helper function to generate default developer names
function generateDefaultDeveloperName(developerId: string, existingNames: string[]): string {
  // Extract a meaningful part from the developer ID
  const idParts = developerId.split('-');
  const baseName = idParts[0] || 'dev';
  
  // Common developer name patterns
  const namePatterns = [
    `Developer ${baseName}`,
    `Dev ${baseName}`,
    `${baseName.charAt(0).toUpperCase()}${baseName.slice(1)} Developer`,
    `Team Member ${baseName}`,
  ];
  
  // Try each pattern and see if it's available
  for (const pattern of namePatterns) {
    if (!existingNames.some(name => name.toLowerCase() === pattern.toLowerCase())) {
      return pattern;
    }
  }
  
  // If all patterns are taken, add a number
  let counter = 1;
  const baseName2 = `Developer ${baseName}`;
  while (existingNames.some(name => name.toLowerCase() === `${baseName2} ${counter}`.toLowerCase())) {
    counter++;
  }
  
  return `${baseName2} ${counter}`;
}

export function useTaskStorage() {
  const [state, setState] = useState<AppState>({ tasks: [], developers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Enhanced debounced save function with error recovery
  const saveFunction = useCallback(async (data: AppState) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const success = await saveData(data);
      if (success) {
        setLastSaved(new Date());
        retryCountRef.current = 0;
        console.log('Data saved successfully at', new Date().toISOString());
      } else {
        throw new Error('Save operation returned false');
      }
    } catch (err) {
      console.error('Save error:', err);
      retryCountRef.current++;
      
      if (retryCountRef.current <= maxRetries) {
        console.log(`Retrying save operation (attempt ${retryCountRef.current}/${maxRetries})`);
        // Retry after a delay
        setTimeout(async () => {
          try {
            const retrySuccess = await saveData(data);
            if (retrySuccess) {
              setLastSaved(new Date());
              retryCountRef.current = 0;
              console.log('Data saved successfully on retry');
            } else if (retryCountRef.current >= maxRetries) {
              setError('Failed to save data after multiple attempts. Your changes may be lost.');
            }
          } catch {
            if (retryCountRef.current >= maxRetries) {
              setError('Failed to save data after multiple attempts. Your changes may be lost.');
            }
          }
        }, 1000 * retryCountRef.current); // Exponential backoff
      } else {
        setError('Failed to save data after multiple attempts. Your changes may be lost.');
      }
    } finally {
      setIsSaving(false);
    }
  }, [maxRetries]);

  const debouncedSave = useCallback(
    debounce(saveFunction, 500),
    [saveFunction]
  );

  // Enhanced data loading with error recovery
  const loadDataWithRetry = useCallback(async (retryCount = 0) => {
    try {
      if (!isStorageAvailable()) {
        throw new Error('API storage is not available');
      }

      console.log('Loading data from API...');
      const loadedData = await loadData();
      
      setState(loadedData);
      setError(null);
      console.log('Data loaded successfully:', {
        tasks: loadedData.tasks.length,
        developers: loadedData.developers.length
      });
      
    } catch (err) {
      console.error('API loading error:', err);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying data load (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          loadDataWithRetry(retryCount + 1);
        }, 1000 * (retryCount + 1));
      } else {
        setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        // Initialize with empty state as fallback
        setState({ tasks: [], developers: [] });
      }
    } finally {
      if (retryCount >= maxRetries || error === null) {
        setIsLoading(false);
      }
    }
  }, [error]);

  // Load data on component mount
  useEffect(() => {
    loadDataWithRetry();
  }, [loadDataWithRetry]);

  // Auto-save data whenever state changes (with debouncing)
  useEffect(() => {
    // Only save if we're not in the initial loading state
    // Save even with empty data to persist deletions
    if (!isLoading) {
      debouncedSave(state);
    }
  }, [state, isLoading, debouncedSave]);

  // Periodic data validation and cleanup
  useEffect(() => {
    const validateAndCleanup = () => {
      setState(prevState => {
        let hasChanges = false;
        const cleanedTasks = [...prevState.tasks];
        const cleanedDevelopers = [...prevState.developers];

        // Remove orphaned tasks (tasks assigned to non-existent developers)
        const validDeveloperIds = new Set(cleanedDevelopers.map(dev => dev.id));
        cleanedTasks.forEach(task => {
          if (task.assignedTo && !validDeveloperIds.has(task.assignedTo)) {
            console.warn(`Orphaned task found: ${task.id} assigned to non-existent developer ${task.assignedTo}`);
            task.assignedTo = undefined;
            task.status = 'backlog';
            hasChanges = true;
          }
        });

        return hasChanges ? { tasks: cleanedTasks, developers: cleanedDevelopers } : prevState;
      });
    };

    // Run validation every 30 seconds
    const validationInterval = setInterval(validateAndCleanup, 30000);
    
    return () => clearInterval(validationInterval);
  }, []);

  // Handle browser beforeunload to ensure data is saved
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isSaving) {
        event.preventDefault();
        event.returnValue = 'Data is still being saved. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaving]);

  // Update developer statistics based on completed tasks
  const updateDeveloperStats = useCallback((tasks: Task[], developers: Developer[]): Developer[] => {
    const updatedDevelopers = [...developers];

    // Update existing developers
    updatedDevelopers.forEach(dev => {
      const stats = calculateDeveloperStats(tasks, dev.id);
      dev.totalPoints = stats.totalPoints;
      dev.completedTasks = stats.completedTasks;
      dev.totalHours = stats.totalHours;
    });

    // Add new developers for assigned tasks
    const assignedDeveloperIds = new Set(
      tasks
        .filter(task => task.assignedTo)
        .map(task => task.assignedTo!)
    );

    assignedDeveloperIds.forEach(devId => {
      if (!updatedDevelopers.find(dev => dev.id === devId)) {
        const stats = calculateDeveloperStats(tasks, devId);
        // Generate a better default name
        const existingNames = updatedDevelopers.map(dev => dev.name);
        const defaultName = generateDefaultDeveloperName(devId, existingNames);
        
        updatedDevelopers.push({
          id: devId,
          name: defaultName,
          totalPoints: stats.totalPoints,
          completedTasks: stats.completedTasks,
          totalHours: stats.totalHours
        });
      }
    });

    return updatedDevelopers;
  }, []);

  // Add a new task
  const addTask = useCallback((task: Task) => {
    setState(prevState => {
      const newTasks = [...prevState.tasks, task];
      const updatedDevelopers = updateDeveloperStats(newTasks, prevState.developers);
      
      return {
        tasks: newTasks,
        developers: updatedDevelopers
      };
    });
  }, [updateDeveloperStats]);

  // Update an existing task
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setState(prevState => {
      const newTasks = prevState.tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      );
      const updatedDevelopers = updateDeveloperStats(newTasks, prevState.developers);
      
      return {
        tasks: newTasks,
        developers: updatedDevelopers
      };
    });
  }, [updateDeveloperStats]);

  // Delete a task
  const deleteTask = useCallback((taskId: string) => {
    setState(prevState => {
      const newTasks = prevState.tasks.filter(task => task.id !== taskId);
      const updatedDevelopers = updateDeveloperStats(newTasks, prevState.developers);
      
      return {
        tasks: newTasks,
        developers: updatedDevelopers
      };
    });
  }, [updateDeveloperStats]);

  // Add or update a developer
  const updateDeveloper = useCallback((developer: Developer) => {
    setState(prevState => {
      const existingIndex = prevState.developers.findIndex(dev => dev.id === developer.id);
      let newDevelopers;
      
      if (existingIndex >= 0) {
        newDevelopers = [...prevState.developers];
        newDevelopers[existingIndex] = developer;
      } else {
        newDevelopers = [...prevState.developers, developer];
      }
      
      return {
        ...prevState,
        developers: newDevelopers
      };
    });
  }, []);

  // Add a new developer
  const addDeveloper = useCallback((developer: Developer) => {
    setState(prevState => {
      // Check if developer already exists
      const existingDeveloper = prevState.developers.find(dev => dev.id === developer.id);
      if (existingDeveloper) {
        console.warn(`Developer with id ${developer.id} already exists`);
        return prevState;
      }

      return {
        ...prevState,
        developers: [...prevState.developers, developer]
      };
    });
  }, []);

  // Delete a developer (reassigns their non-completed tasks to backlog)
  const deleteDeveloper = useCallback((developerId: string) => {
    setState(prevState => {
      // Only reassign non-completed tasks from this developer back to backlog
      // Completed tasks should remain as they are for historical accuracy
      const updatedTasks = prevState.tasks.map(task => {
        if (task.assignedTo === developerId && task.status !== 'completed') {
          return {
            ...task,
            status: 'backlog' as const,
            assignedTo: undefined
          };
        }
        return task;
      });

      // Remove the developer
      const newDevelopers = prevState.developers.filter(dev => dev.id !== developerId);
      
      const reassignedCount = updatedTasks.filter((task, index) => {
        const originalTask = prevState.tasks[index];
        return originalTask?.assignedTo === developerId && 
               originalTask?.status !== 'completed' && 
               task.assignedTo === undefined;
      }).length;
      
      console.log(`Developer ${developerId} deleted. ${reassignedCount} tasks reassigned to backlog.`);
      
      return {
        tasks: updatedTasks,
        developers: newDevelopers
      };
    });
  }, []);

  // Get developer by ID
  const getDeveloperById = useCallback((developerId: string) => {
    return state.developers.find(dev => dev.id === developerId);
  }, [state.developers]);

  // Check if developer name is available
  const isDeveloperNameAvailable = useCallback((name: string, excludeId?: string) => {
    return !state.developers.some(dev => 
      dev.name.toLowerCase() === name.toLowerCase() && dev.id !== excludeId
    );
  }, [state.developers]);

  // Get tasks by status
  const getTasksByStatus = useCallback((status: Task['status']) => {
    return state.tasks.filter(task => task.status === status);
  }, [state.tasks]);

  // Get tasks assigned to a specific developer
  const getTasksByDeveloper = useCallback((developerId: string) => {
    return state.tasks.filter(task => task.assignedTo === developerId);
  }, [state.tasks]);

  // Manual save function for critical operations
  const forceSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const success = await saveData(state);
      if (success) {
        setLastSaved(new Date());
        console.log('Manual save completed successfully');
        return true;
      } else {
        throw new Error('Manual save failed');
      }
    } catch (err) {
      console.error('Manual save error:', err);
      setError('Failed to save data manually');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [state]);

  // Manual reload function
  const reloadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await loadDataWithRetry();
  }, [loadDataWithRetry]);

  return {
    // State
    tasks: state.tasks,
    developers: state.developers,
    isLoading,
    isSaving,
    error,
    lastSaved,
    
    // Actions
    addTask,
    updateTask,
    deleteTask,
    addDeveloper,
    updateDeveloper,
    deleteDeveloper,
    
    // Queries
    getTasksByStatus,
    getTasksByDeveloper,
    getDeveloperById,
    isDeveloperNameAvailable,
    
    // Utilities
    clearError: () => setError(null),
    forceSave,
    reloadData
  };
}