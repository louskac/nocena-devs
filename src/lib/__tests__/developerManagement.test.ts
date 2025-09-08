import { renderHook, act, waitFor } from '@testing-library/react';
import { useTaskStorage } from '../hooks/useTaskStorage';
import { Task, Developer } from '../types';

describe('Developer Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('Developer Creation', () => {
    it('should add a new developer manually', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newDeveloper: Developer = {
        id: 'dev-manual-1',
        name: 'Manual Developer',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      };

      act(() => {
        result.current.addDeveloper(newDeveloper);
      });

      expect(result.current.developers).toHaveLength(1);
      expect(result.current.developers[0].name).toBe('Manual Developer');
      expect(result.current.developers[0].id).toBe('dev-manual-1');
    });

    it('should auto-create developer when task is assigned', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newTask: Task = {
        id: 'task-1',
        name: 'Test Task',
        description: 'Test Description',
        points: 10,
        status: 'assigned',
        assignedTo: 'auto-dev-123',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTask(newTask);
      });

      expect(result.current.developers).toHaveLength(1);
      expect(result.current.developers[0].id).toBe('auto-dev-123');
      expect(result.current.developers[0].name).toBe('Developer auto');
    });

    it('should generate unique default names for auto-created developers', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add first developer manually with a name that might conflict
      const existingDeveloper: Developer = {
        id: 'existing-dev',
        name: 'Developer auto',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      };

      act(() => {
        result.current.addDeveloper(existingDeveloper);
      });

      // Now add a task that would auto-create a developer with similar ID
      const newTask: Task = {
        id: 'task-1',
        name: 'Test Task',
        description: 'Test Description',
        points: 10,
        status: 'assigned',
        assignedTo: 'auto-dev-456',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTask(newTask);
      });

      expect(result.current.developers).toHaveLength(2);
      
      // Should have generated a different name to avoid conflict
      const autoCreatedDev = result.current.developers.find(d => d.id === 'auto-dev-456');
      expect(autoCreatedDev).toBeTruthy();
      expect(autoCreatedDev!.name).not.toBe('Developer auto');
      expect(autoCreatedDev!.name).toContain('auto'); // Should still contain the base name
    });

    it('should prevent adding duplicate developer IDs', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const developer: Developer = {
        id: 'duplicate-dev',
        name: 'First Developer',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      };

      act(() => {
        result.current.addDeveloper(developer);
      });

      expect(result.current.developers).toHaveLength(1);

      // Try to add another developer with the same ID
      const duplicateDeveloper: Developer = {
        id: 'duplicate-dev',
        name: 'Second Developer',
        totalPoints: 5,
        completedTasks: 1,
        totalHours: 2,
      };

      act(() => {
        result.current.addDeveloper(duplicateDeveloper);
      });

      // Should still only have one developer
      expect(result.current.developers).toHaveLength(1);
      expect(result.current.developers[0].name).toBe('First Developer');
    });
  });

  describe('Developer Updates', () => {
    it('should update existing developer information', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalDeveloper: Developer = {
        id: 'dev-update-1',
        name: 'Original Name',
        totalPoints: 10,
        completedTasks: 1,
        totalHours: 5,
      };

      act(() => {
        result.current.addDeveloper(originalDeveloper);
      });

      const updatedDeveloper: Developer = {
        ...originalDeveloper,
        name: 'Updated Name',
      };

      act(() => {
        result.current.updateDeveloper(updatedDeveloper);
      });

      expect(result.current.developers).toHaveLength(1);
      expect(result.current.developers[0].name).toBe('Updated Name');
      expect(result.current.developers[0].totalPoints).toBe(10); // Other fields preserved
    });

    it('should update developer stats when tasks are completed', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add a task and assign it to a developer
      const task: Task = {
        id: 'task-stats-1',
        name: 'Stats Test Task',
        description: 'Test Description',
        points: 25,
        status: 'assigned',
        assignedTo: 'stats-dev-1',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTask(task);
      });

      // Developer should be auto-created with 0 stats
      expect(result.current.developers).toHaveLength(1);
      expect(result.current.developers[0].totalPoints).toBe(0);
      expect(result.current.developers[0].completedTasks).toBe(0);
      expect(result.current.developers[0].totalHours).toBe(0);

      // Complete the task
      act(() => {
        result.current.updateTask('task-stats-1', {
          status: 'completed',
          completedAt: new Date(),
          completionDetails: {
            hoursSpent: 8,
            gitCommit: 'abc123',
            comments: 'Task completed successfully',
          },
        });
      });

      // Developer stats should be updated
      expect(result.current.developers[0].totalPoints).toBe(25);
      expect(result.current.developers[0].completedTasks).toBe(1);
      expect(result.current.developers[0].totalHours).toBe(8);
    });
  });

  describe('Developer Deletion', () => {
    it('should delete developer with no assigned tasks', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const developer: Developer = {
        id: 'dev-delete-1',
        name: 'Developer to Delete',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      };

      act(() => {
        result.current.addDeveloper(developer);
      });

      expect(result.current.developers).toHaveLength(1);

      act(() => {
        result.current.deleteDeveloper('dev-delete-1');
      });

      expect(result.current.developers).toHaveLength(0);
    });

    it('should reassign tasks to backlog when developer is deleted', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add a developer and assign tasks to them
      const developer: Developer = {
        id: 'dev-with-tasks',
        name: 'Developer with Tasks',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      };

      act(() => {
        result.current.addDeveloper(developer);
      });

      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          description: 'Description 1',
          points: 10,
          status: 'assigned',
          assignedTo: 'dev-with-tasks',
          createdAt: new Date(),
        },
        {
          id: 'task-2',
          name: 'Task 2',
          description: 'Description 2',
          points: 15,
          status: 'assigned',
          assignedTo: 'dev-with-tasks',
          createdAt: new Date(),
        },
      ];

      tasks.forEach(task => {
        act(() => {
          result.current.addTask(task);
        });
      });

      // Verify tasks are assigned
      expect(result.current.tasks.filter(t => t.assignedTo === 'dev-with-tasks')).toHaveLength(2);
      expect(result.current.getTasksByStatus('backlog')).toHaveLength(0);

      // Delete the developer
      act(() => {
        result.current.deleteDeveloper('dev-with-tasks');
      });

      // Developer should be deleted
      expect(result.current.developers).toHaveLength(0);

      // Tasks should be reassigned to backlog
      expect(result.current.tasks.filter(t => t.assignedTo === 'dev-with-tasks')).toHaveLength(0);
      expect(result.current.getTasksByStatus('backlog')).toHaveLength(2);
      expect(result.current.tasks.every(t => t.status === 'backlog')).toBe(true);
    });

    it('should not affect completed tasks when developer is deleted', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add developer and tasks
      const developer: Developer = {
        id: 'dev-completed-tasks',
        name: 'Developer with Completed Tasks',
        totalPoints: 25,
        completedTasks: 1,
        totalHours: 8,
      };

      act(() => {
        result.current.addDeveloper(developer);
      });

      const completedTask: Task = {
        id: 'completed-task',
        name: 'Completed Task',
        description: 'This task is completed',
        points: 25,
        status: 'completed',
        assignedTo: 'dev-completed-tasks',
        createdAt: new Date(),
        completedAt: new Date(),
        completionDetails: {
          hoursSpent: 8,
          gitCommit: 'abc123',
          comments: 'Task completed',
        },
      };

      const assignedTask: Task = {
        id: 'assigned-task',
        name: 'Assigned Task',
        description: 'This task is still assigned',
        points: 15,
        status: 'assigned',
        assignedTo: 'dev-completed-tasks',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTask(completedTask);
        result.current.addTask(assignedTask);
      });

      // Delete the developer
      act(() => {
        result.current.deleteDeveloper('dev-completed-tasks');
      });

      // Completed task should remain completed and assigned
      const completedTaskAfter = result.current.tasks.find(t => t.id === 'completed-task');
      expect(completedTaskAfter?.status).toBe('completed');
      expect(completedTaskAfter?.assignedTo).toBe('dev-completed-tasks');

      // Assigned task should be moved to backlog
      const assignedTaskAfter = result.current.tasks.find(t => t.id === 'assigned-task');
      expect(assignedTaskAfter?.status).toBe('backlog');
      expect(assignedTaskAfter?.assignedTo).toBeUndefined();
    });
  });

  describe('Developer Queries', () => {
    it('should find developer by ID', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const developer: Developer = {
        id: 'query-dev-1',
        name: 'Query Test Developer',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      };

      act(() => {
        result.current.addDeveloper(developer);
      });

      const foundDeveloper = result.current.getDeveloperById('query-dev-1');
      expect(foundDeveloper).toBeTruthy();
      expect(foundDeveloper?.name).toBe('Query Test Developer');

      const notFoundDeveloper = result.current.getDeveloperById('non-existent');
      expect(notFoundDeveloper).toBeUndefined();
    });

    it('should check developer name availability', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const developer: Developer = {
        id: 'name-check-dev',
        name: 'Existing Developer',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      };

      act(() => {
        result.current.addDeveloper(developer);
      });

      // Name should not be available (case insensitive)
      expect(result.current.isDeveloperNameAvailable('Existing Developer')).toBe(false);
      expect(result.current.isDeveloperNameAvailable('existing developer')).toBe(false);
      expect(result.current.isDeveloperNameAvailable('EXISTING DEVELOPER')).toBe(false);

      // Different name should be available
      expect(result.current.isDeveloperNameAvailable('New Developer')).toBe(true);

      // Same name should be available when excluding the current developer
      expect(result.current.isDeveloperNameAvailable('Existing Developer', 'name-check-dev')).toBe(true);
    });
  });

  describe('Data Persistence', () => {
    it('should persist developer management operations', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add a developer
      const developer: Developer = {
        id: 'persist-dev-1',
        name: 'Persistent Developer',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      };

      act(() => {
        result.current.addDeveloper(developer);
      });

      // Force save
      await act(async () => {
        await result.current.forceSave();
      });

      // Verify data was saved
      const stored = localStorage.getItem('nocena-devs-data');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.developers).toHaveLength(1);
      expect(parsed.developers[0].name).toBe('Persistent Developer');

      // Update developer
      act(() => {
        result.current.updateDeveloper({
          ...developer,
          name: 'Updated Persistent Developer',
        });
      });

      // Wait for auto-save
      await waitFor(() => {
        const updatedStored = localStorage.getItem('nocena-devs-data');
        const updatedParsed = JSON.parse(updatedStored!);
        expect(updatedParsed.developers[0].name).toBe('Updated Persistent Developer');
      }, { timeout: 1000 });
    });
  });
});