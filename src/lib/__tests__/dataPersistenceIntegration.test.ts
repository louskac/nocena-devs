import { renderHook, act, waitFor } from '@testing-library/react';
import { useTaskStorage } from '../hooks/useTaskStorage';
import { AppState, Task } from '../types';

// Integration tests for data persistence across sessions
describe('Data Persistence Integration', () => {
  const mockTask: Task = {
    id: 'task-1',
    name: 'Integration Test Task',
    description: 'Test task for integration testing',
    points: 25,
    status: 'backlog',
    createdAt: new Date('2025-01-01T10:00:00Z'),
  };

  // const mockDeveloper: Developer = {
  //   id: 'dev-1',
  //   name: 'Integration Test Developer',
  //   totalPoints: 0,
  //   completedTasks: 0,
  //   totalHours: 0,
  // };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('complete task lifecycle persistence', () => {
    it('should persist task creation across sessions', async () => {
      // Session 1: Create and save task
      const { result: session1 } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(session1.current.isLoading).toBe(false);
      });

      act(() => {
        session1.current.addTask(mockTask);
      });

      // Wait for auto-save
      await waitFor(() => {
        expect(session1.current.tasks).toHaveLength(1);
      });

      // Force save to ensure data is persisted
      await act(async () => {
        await session1.current.forceSave();
      });

      // Session 2: Load data and verify persistence
      const { result: session2 } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(session2.current.isLoading).toBe(false);
      });

      expect(session2.current.tasks).toHaveLength(1);
      expect(session2.current.tasks[0].name).toBe(mockTask.name);
      expect(session2.current.tasks[0].points).toBe(mockTask.points);
    });

    it('should persist task assignment and completion across sessions', async () => {
      // Session 1: Create task and assign to developer
      const { result: session1 } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(session1.current.isLoading).toBe(false);
      });

      act(() => {
        session1.current.addTask(mockTask);
      });

      act(() => {
        session1.current.updateTask(mockTask.id, {
          status: 'assigned',
          assignedTo: 'dev-1',
        });
      });

      // Complete the task
      act(() => {
        session1.current.updateTask(mockTask.id, {
          status: 'completed',
          completedAt: new Date('2025-01-01T15:00:00Z'),
          completionDetails: {
            hoursSpent: 5,
            gitCommit: 'abc123def456',
            comments: 'Task completed successfully',
          },
        });
      });

      await act(async () => {
        await session1.current.forceSave();
      });

      // Session 2: Verify completed task and developer stats
      const { result: session2 } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(session2.current.isLoading).toBe(false);
      });

      expect(session2.current.tasks).toHaveLength(1);
      const persistedTask = session2.current.tasks[0];
      expect(persistedTask.status).toBe('completed');
      expect(persistedTask.assignedTo).toBe('dev-1');
      expect(persistedTask.completionDetails?.hoursSpent).toBe(5);
      expect(persistedTask.completionDetails?.gitCommit).toBe('abc123def456');

      // Check developer was auto-created with correct stats
      expect(session2.current.developers).toHaveLength(1);
      const developer = session2.current.developers[0];
      expect(developer.id).toBe('dev-1');
      expect(developer.totalPoints).toBe(25);
      expect(developer.completedTasks).toBe(1);
      expect(developer.totalHours).toBe(5);
    });

    it('should persist multiple developers and their statistics', async () => {
      // Session 1: Create multiple tasks and assign to different developers
      const { result: session1 } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(session1.current.isLoading).toBe(false);
      });

      const tasks = [
        { ...mockTask, id: 'task-1', points: 10 },
        { ...mockTask, id: 'task-2', points: 20 },
        { ...mockTask, id: 'task-3', points: 15 },
      ];

      // Add tasks
      tasks.forEach(task => {
        act(() => {
          session1.current.addTask(task);
        });
      });

      // Assign and complete tasks
      act(() => {
        session1.current.updateTask('task-1', {
          status: 'completed',
          assignedTo: 'dev-1',
          completedAt: new Date(),
          completionDetails: { hoursSpent: 2, gitCommit: 'abc123', comments: 'Done' },
        });
      });

      act(() => {
        session1.current.updateTask('task-2', {
          status: 'completed',
          assignedTo: 'dev-1',
          completedAt: new Date(),
          completionDetails: { hoursSpent: 4, gitCommit: 'def456', comments: 'Done' },
        });
      });

      act(() => {
        session1.current.updateTask('task-3', {
          status: 'completed',
          assignedTo: 'dev-2',
          completedAt: new Date(),
          completionDetails: { hoursSpent: 3, gitCommit: 'ghi789', comments: 'Done' },
        });
      });

      await act(async () => {
        await session1.current.forceSave();
      });

      // Session 2: Verify all data persisted correctly
      const { result: session2 } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(session2.current.isLoading).toBe(false);
      });

      expect(session2.current.tasks).toHaveLength(3);
      expect(session2.current.developers).toHaveLength(2);

      const dev1 = session2.current.developers.find(d => d.id === 'dev-1');
      const dev2 = session2.current.developers.find(d => d.id === 'dev-2');

      expect(dev1?.totalPoints).toBe(30); // 10 + 20
      expect(dev1?.completedTasks).toBe(2);
      expect(dev1?.totalHours).toBe(6); // 2 + 4

      expect(dev2?.totalPoints).toBe(15);
      expect(dev2?.completedTasks).toBe(1);
      expect(dev2?.totalHours).toBe(3);
    });
  });

  describe('error recovery and data integrity', () => {
    it('should recover from corrupted data', async () => {
      // Manually set corrupted data in localStorage
      const corruptedData = '{"tasks": [{"id": "task-1", "name": "Test"}], "developers": "invalid"}';
      localStorage.setItem('nocena-devs-data', corruptedData);

      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to empty state
      expect(result.current.tasks).toEqual([]);
      expect(result.current.developers).toEqual([]);
      expect(result.current.error).toBeNull(); // Should not show error for recovered data
    });

    it('should handle localStorage quota exceeded', async () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addTask(mockTask);
      });

      // Should handle the error gracefully
      await waitFor(() => {
        expect(result.current.error).toContain('Failed to save data');
      });

      // Restore original setItem
      localStorage.setItem = originalSetItem;
    });

    it('should maintain data consistency during concurrent operations', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate rapid concurrent operations
      act(() => {
        result.current.addTask({ ...mockTask, id: 'task-1' });
        result.current.addTask({ ...mockTask, id: 'task-2' });
        result.current.addTask({ ...mockTask, id: 'task-3' });
      });

      act(() => {
        result.current.updateTask('task-1', { status: 'assigned', assignedTo: 'dev-1' });
        result.current.updateTask('task-2', { status: 'assigned', assignedTo: 'dev-2' });
      });

      act(() => {
        result.current.deleteTask('task-3');
      });

      // Wait for all operations to complete
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });

      // Force save and reload to verify consistency
      await act(async () => {
        await result.current.forceSave();
      });

      await act(async () => {
        await result.current.reloadData();
      });

      expect(result.current.tasks).toHaveLength(2);
      expect(result.current.tasks.find(t => t.id === 'task-1')?.assignedTo).toBe('dev-1');
      expect(result.current.tasks.find(t => t.id === 'task-2')?.assignedTo).toBe('dev-2');
      expect(result.current.tasks.find(t => t.id === 'task-3')).toBeUndefined();
    });
  });

  describe('performance and optimization', () => {
    it('should debounce save operations', async () => {
      const saveSpy = jest.spyOn(Storage.prototype, 'setItem');
      
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Perform multiple rapid operations
      act(() => {
        result.current.addTask({ ...mockTask, id: 'task-1' });
        result.current.addTask({ ...mockTask, id: 'task-2' });
        result.current.addTask({ ...mockTask, id: 'task-3' });
      });

      // Should not save immediately due to debouncing
      expect(saveSpy).not.toHaveBeenCalled();

      // Wait for debounced save
      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Should have saved only once due to debouncing
      expect(saveSpy).toHaveBeenCalledTimes(1);

      saveSpy.mockRestore();
    });

    it('should handle large datasets efficiently', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create a large number of tasks
      const largeTasks = Array.from({ length: 100 }, (_, i) => ({
        ...mockTask,
        id: `task-${i}`,
        name: `Task ${i}`,
      }));

      // Add tasks in batches to avoid overwhelming the system
      for (let i = 0; i < largeTasks.length; i += 10) {
        act(() => {
          largeTasks.slice(i, i + 10).forEach(task => {
            result.current.addTask(task);
          });
        });
      }

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(100);
      });

      // Force save and measure performance
      const startTime = performance.now();
      await act(async () => {
        await result.current.forceSave();
      });
      const saveTime = performance.now() - startTime;

      // Save should complete within reasonable time (less than 1 second)
      expect(saveTime).toBeLessThan(1000);

      // Reload and verify all data persisted
      await act(async () => {
        await result.current.reloadData();
      });

      expect(result.current.tasks).toHaveLength(100);
    });
  });

  describe('backup and recovery', () => {
    it('should create backups before overwriting data', async () => {
      // First session: Create initial data
      const { result: session1 } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(session1.current.isLoading).toBe(false);
      });

      act(() => {
        session1.current.addTask(mockTask);
      });

      await act(async () => {
        await session1.current.forceSave();
      });

      // Verify backup was created
      const backupKey = 'nocena-devs-data-backup-last';
      const backup = localStorage.getItem(backupKey);
      expect(backup).toBeTruthy();

      // Second session: Modify data
      const { result: session2 } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(session2.current.isLoading).toBe(false);
      });

      act(() => {
        session2.current.addTask({ ...mockTask, id: 'task-2', name: 'Second Task' });
      });

      await act(async () => {
        await session2.current.forceSave();
      });

      // Verify new backup was created and contains previous data
      const newBackup = localStorage.getItem(backupKey);
      expect(newBackup).toBeTruthy();
      expect(newBackup).not.toBe(backup);

      const parsedBackup = JSON.parse(newBackup!);
      expect(parsedBackup.tasks).toHaveLength(1);
      expect(parsedBackup.tasks[0].name).toBe('Integration Test Task');
    });
  });
});