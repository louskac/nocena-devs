import { renderHook, act, waitFor } from '@testing-library/react';
import { useTaskStorage } from '../../lib/hooks/useTaskStorage';
import { Task } from '../../lib/types';

// Mock localStorage for data persistence testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Task Lifecycle Integration Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Complete Task Lifecycle Workflows', () => {
    it('successfully completes task creation → assignment → completion workflow', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Step 1: Create a new task
      const newTask: Task = {
        id: 'task-1',
        name: 'Implement User Authentication',
        description: 'Add login/logout functionality with JWT tokens',
        points: 75,
        status: 'backlog',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTask(newTask);
      });

      // Verify task was added
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].name).toBe('Implement User Authentication');
      expect(result.current.tasks[0].status).toBe('backlog');
      expect(result.current.tasks[0].points).toBe(75);

      // Step 2: Assign task to developer
      act(() => {
        result.current.updateTask('task-1', {
          status: 'assigned',
          assignedTo: 'dev-1',
        });
      });

      // Verify task assignment
      const assignedTask = result.current.tasks.find(t => t.id === 'task-1');
      expect(assignedTask?.status).toBe('assigned');
      expect(assignedTask?.assignedTo).toBe('dev-1');

      // Verify developer was auto-created
      expect(result.current.developers).toHaveLength(1);
      const developer = result.current.developers[0];
      expect(developer.id).toBe('dev-1');
      expect(developer.name).toBe('Developer 1');
      expect(developer.totalPoints).toBe(0);
      expect(developer.completedTasks).toBe(0);
      expect(developer.totalHours).toBe(0);

      // Step 3: Complete the task
      act(() => {
        result.current.updateTask('task-1', {
          status: 'completed',
          completedAt: new Date(),
          completionDetails: {
            hoursSpent: 12,
            gitCommit: 'abc123def456',
            comments: 'Implemented JWT authentication with refresh tokens',
          },
        });
      });

      // Verify task completion
      const completedTask = result.current.tasks.find(t => t.id === 'task-1');
      expect(completedTask?.status).toBe('completed');
      expect(completedTask?.completedAt).toBeDefined();
      expect(completedTask?.completionDetails?.hoursSpent).toBe(12);
      expect(completedTask?.completionDetails?.gitCommit).toBe('abc123def456');
      expect(completedTask?.completionDetails?.comments).toBe('Implemented JWT authentication with refresh tokens');

      // Verify developer stats were updated
      const updatedDeveloper = result.current.developers.find(d => d.id === 'dev-1');
      expect(updatedDeveloper?.totalPoints).toBe(75);
      expect(updatedDeveloper?.completedTasks).toBe(1);
      expect(updatedDeveloper?.totalHours).toBe(12);
    });

    it('handles multiple tasks across different developers with proper state management', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create multiple tasks
      const tasks = [
        {
          id: 'task-1',
          name: 'Frontend Dashboard',
          description: 'Build React dashboard',
          points: 50,
          status: 'backlog' as const,
          createdAt: new Date(),
        },
        {
          id: 'task-2',
          name: 'API Integration',
          description: 'Connect to backend APIs',
          points: 40,
          status: 'backlog' as const,
          createdAt: new Date(),
        },
        {
          id: 'task-3',
          name: 'Database Schema',
          description: 'Design user tables',
          points: 30,
          status: 'backlog' as const,
          createdAt: new Date(),
        },
      ];

      // Add all tasks
      tasks.forEach(task => {
        act(() => {
          result.current.addTask(task);
        });
      });

      // Verify all tasks created
      expect(result.current.tasks).toHaveLength(3);
      expect(result.current.getTasksByStatus('backlog')).toHaveLength(3);

      // Assign tasks to different developers
      act(() => {
        result.current.updateTask('task-1', { status: 'assigned', assignedTo: 'dev-1' });
      });

      act(() => {
        result.current.updateTask('task-2', { status: 'assigned', assignedTo: 'dev-2' });
      });

      // Verify assignments
      expect(result.current.getTasksByDeveloper('dev-1')).toHaveLength(1);
      expect(result.current.getTasksByDeveloper('dev-2')).toHaveLength(1);
      expect(result.current.getTasksByStatus('backlog')).toHaveLength(1); // task-3 remains

      // Verify developers were created
      expect(result.current.developers).toHaveLength(2);
      const dev1 = result.current.developers.find(d => d.id === 'dev-1');
      const dev2 = result.current.developers.find(d => d.id === 'dev-2');
      expect(dev1?.name).toBe('Developer 1');
      expect(dev2?.name).toBe('Developer 2');

      // Complete Alice's task
      act(() => {
        result.current.updateTask('task-1', {
          status: 'completed',
          completedAt: new Date(),
          completionDetails: {
            hoursSpent: 8,
            gitCommit: 'abc123',
            comments: 'Frontend completed',
          },
        });
      });

      // Complete Bob's task
      act(() => {
        result.current.updateTask('task-2', {
          status: 'completed',
          completedAt: new Date(),
          completionDetails: {
            hoursSpent: 6,
            gitCommit: 'def456',
            comments: 'API integration done',
          },
        });
      });

      // Verify both developers have updated stats
      const updatedDev1 = result.current.developers.find(d => d.id === 'dev-1');
      const updatedDev2 = result.current.developers.find(d => d.id === 'dev-2');

      expect(updatedDev1?.totalPoints).toBe(50);
      expect(updatedDev1?.completedTasks).toBe(1);
      expect(updatedDev1?.totalHours).toBe(8);

      expect(updatedDev2?.totalPoints).toBe(40);
      expect(updatedDev2?.completedTasks).toBe(1);
      expect(updatedDev2?.totalHours).toBe(6);

      // Verify backlog task remains unchanged
      const backlogTask = result.current.tasks.find(t => t.id === 'task-3');
      expect(backlogTask?.status).toBe('backlog');
    });
  });

  describe('Data Persistence Across Browser Sessions', () => {
    it('persists task creation and retrieval across sessions', async () => {
      // Session 1: Create and save tasks
      const { result: session1 } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(session1.current.isLoading).toBe(false);
      });

      const task: Task = {
        id: 'task-1',
        name: 'Persistent Task',
        description: 'Should persist across sessions',
        points: 60,
        status: 'backlog',
        createdAt: new Date(),
      };

      act(() => {
        session1.current.addTask(task);
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
      expect(session2.current.tasks[0].name).toBe('Persistent Task');
      expect(session2.current.tasks[0].points).toBe(60);
      expect(session2.current.tasks[0].status).toBe('backlog');
    });

    it('persists task assignment and completion across sessions', async () => {
      // Session 1: Create, assign, and complete task
      const { result: session1 } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(session1.current.isLoading).toBe(false);
      });

      const task: Task = {
        id: 'task-1',
        name: 'Complex Task',
        description: 'Task with full lifecycle',
        points: 100,
        status: 'backlog',
        createdAt: new Date(),
      };

      act(() => {
        session1.current.addTask(task);
      });

      act(() => {
        session1.current.updateTask('task-1', {
          status: 'assigned',
          assignedTo: 'dev-1',
        });
      });

      act(() => {
        session1.current.updateTask('task-1', {
          status: 'completed',
          completedAt: new Date(),
          completionDetails: {
            hoursSpent: 15,
            gitCommit: 'xyz789abc',
            comments: 'Complex feature implemented successfully',
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
      expect(persistedTask.completionDetails?.hoursSpent).toBe(15);
      expect(persistedTask.completionDetails?.gitCommit).toBe('xyz789abc');

      // Check developer was persisted with correct stats
      expect(session2.current.developers).toHaveLength(1);
      const developer = session2.current.developers[0];
      expect(developer.id).toBe('dev-1');
      expect(developer.totalPoints).toBe(100);
      expect(developer.completedTasks).toBe(1);
      expect(developer.totalHours).toBe(15);
    });

    it('handles corrupted data gracefully and recovers', async () => {
      // Simulate corrupted localStorage data
      localStorageMock.setItem('nocena-devs-data', '{"tasks": [invalid json}');

      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should recover gracefully with empty state
      expect(result.current.tasks).toEqual([]);
      expect(result.current.developers).toEqual([]);
      expect(result.current.error).toBeNull();

      // Should be able to create new tasks after recovery
      const newTask: Task = {
        id: 'recovery-task',
        name: 'Recovery Test Task',
        description: 'Created after data corruption',
        points: 25,
        status: 'backlog',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTask(newTask);
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].name).toBe('Recovery Test Task');
    });

    it('maintains data consistency during rapid operations', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate rapid concurrent operations
      const rapidTasks = Array.from({ length: 10 }, (_, i) => ({
        id: `task-${i}`,
        name: `Rapid Task ${i}`,
        description: `Description ${i}`,
        points: 10 + i,
        status: 'backlog' as const,
        createdAt: new Date(),
      }));

      // Add tasks rapidly
      rapidTasks.forEach(task => {
        act(() => {
          result.current.addTask(task);
        });
      });

      expect(result.current.tasks).toHaveLength(10);

      // Rapidly assign and complete some tasks
      act(() => {
        result.current.updateTask('task-0', { status: 'assigned', assignedTo: 'dev-1' });
        result.current.updateTask('task-1', { status: 'assigned', assignedTo: 'dev-2' });
        result.current.updateTask('task-2', { status: 'assigned', assignedTo: 'dev-1' });
      });

      act(() => {
        result.current.updateTask('task-0', {
          status: 'completed',
          completedAt: new Date(),
          completionDetails: { hoursSpent: 2, gitCommit: 'rapid1', comments: 'Done' },
        });
        result.current.updateTask('task-1', {
          status: 'completed',
          completedAt: new Date(),
          completionDetails: { hoursSpent: 3, gitCommit: 'rapid2', comments: 'Done' },
        });
      });

      // Verify data consistency
      expect(result.current.tasks).toHaveLength(10);
      expect(result.current.getTasksByStatus('completed')).toHaveLength(2);
      expect(result.current.getTasksByStatus('assigned')).toHaveLength(1);
      expect(result.current.getTasksByStatus('backlog')).toHaveLength(7);

      const dev1 = result.current.developers.find(d => d.id === 'dev-1');
      const dev2 = result.current.developers.find(d => d.id === 'dev-2');

      expect(dev1?.totalPoints).toBe(10); // task-0 points
      expect(dev1?.completedTasks).toBe(1);
      expect(dev1?.totalHours).toBe(2);

      expect(dev2?.totalPoints).toBe(11); // task-1 points
      expect(dev2?.completedTasks).toBe(1);
      expect(dev2?.totalHours).toBe(3);
    });
  });

  describe('Leaderboard Accuracy with Multiple Developers and Tasks', () => {
    it('calculates and maintains accurate leaderboard rankings', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create complex scenario with multiple developers and varying task completions
      const tasks = [
        { id: 'task-1', name: 'High Value Task', points: 100, assignedTo: 'dev-1' },
        { id: 'task-2', name: 'Medium Task 1', points: 50, assignedTo: 'dev-2' },
        { id: 'task-3', name: 'Medium Task 2', points: 60, assignedTo: 'dev-1' },
        { id: 'task-4', name: 'Small Task 1', points: 25, assignedTo: 'dev-3' },
        { id: 'task-5', name: 'Small Task 2', points: 30, assignedTo: 'dev-2' },
      ];

      // Add and assign tasks
      tasks.forEach(taskData => {
        const task: Task = {
          ...taskData,
          description: `Description for ${taskData.name}`,
          status: 'assigned',
          createdAt: new Date(),
        };

        act(() => {
          result.current.addTask(task);
        });
      });

      // Complete all tasks with different hours
      const completionData = [
        { taskId: 'task-1', hours: 10, commit: 'abc123' },
        { taskId: 'task-2', hours: 5, commit: 'def456' },
        { taskId: 'task-3', hours: 6, commit: 'ghi789' },
        { taskId: 'task-4', hours: 2, commit: 'jkl012' },
        { taskId: 'task-5', hours: 3, commit: 'mno345' },
      ];

      completionData.forEach(({ taskId, hours, commit }) => {
        act(() => {
          result.current.updateTask(taskId, {
            status: 'completed',
            completedAt: new Date(),
            completionDetails: {
              hoursSpent: hours,
              gitCommit: commit,
              comments: `Completed ${taskId}`,
            },
          });
        });
      });

      // Verify developer stats
      const developers = result.current.developers.sort((a, b) => b.totalPoints - a.totalPoints);

      // dev-1 should be #1 with 160 points (100 + 60)
      expect(developers[0].id).toBe('dev-1');
      expect(developers[0].totalPoints).toBe(160);
      expect(developers[0].completedTasks).toBe(2);
      expect(developers[0].totalHours).toBe(16); // 10 + 6

      // dev-2 should be #2 with 80 points (50 + 30)
      expect(developers[1].id).toBe('dev-2');
      expect(developers[1].totalPoints).toBe(80);
      expect(developers[1].completedTasks).toBe(2);
      expect(developers[1].totalHours).toBe(8); // 5 + 3

      // dev-3 should be #3 with 25 points
      expect(developers[2].id).toBe('dev-3');
      expect(developers[2].totalPoints).toBe(25);
      expect(developers[2].completedTasks).toBe(1);
      expect(developers[2].totalHours).toBe(2);
    });

    it('updates leaderboard rankings when new tasks are completed', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start with initial rankings
      const initialTasks = [
        { id: 'task-1', points: 100, assignedTo: 'dev-1' },
        { id: 'task-2', points: 120, assignedTo: 'dev-2' },
      ];

      initialTasks.forEach(taskData => {
        const task: Task = {
          ...taskData,
          name: `Task ${taskData.id}`,
          description: 'Initial task',
          status: 'completed',
          createdAt: new Date(),
          completedAt: new Date(),
          completionDetails: {
            hoursSpent: 5,
            gitCommit: 'initial',
            comments: 'Initial completion',
          },
        };

        act(() => {
          result.current.addTask(task);
        });
      });

      // Verify initial rankings (dev-2 leading)
      let sortedDevs = result.current.developers.sort((a, b) => b.totalPoints - a.totalPoints);
      expect(sortedDevs[0].id).toBe('dev-2');
      expect(sortedDevs[0].totalPoints).toBe(120);
      expect(sortedDevs[1].id).toBe('dev-1');
      expect(sortedDevs[1].totalPoints).toBe(100);

      // Add high-value task for dev-1
      const gameChangerTask: Task = {
        id: 'task-3',
        name: 'Game Changer Task',
        description: 'High value task for dev-1',
        points: 150,
        status: 'assigned',
        assignedTo: 'dev-1',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTask(gameChangerTask);
      });

      // Complete the high-value task
      act(() => {
        result.current.updateTask('task-3', {
          status: 'completed',
          completedAt: new Date(),
          completionDetails: {
            hoursSpent: 15,
            gitCommit: 'gamechanger',
            comments: 'Major milestone achieved',
          },
        });
      });

      // Verify rankings flipped (dev-1 now leading)
      sortedDevs = result.current.developers.sort((a, b) => b.totalPoints - a.totalPoints);
      expect(sortedDevs[0].id).toBe('dev-1');
      expect(sortedDevs[0].totalPoints).toBe(250); // 100 + 150
      expect(sortedDevs[0].completedTasks).toBe(2);
      expect(sortedDevs[0].totalHours).toBe(20); // 5 + 15

      expect(sortedDevs[1].id).toBe('dev-2');
      expect(sortedDevs[1].totalPoints).toBe(120); // Unchanged
    });
  });

  describe('Drag and Drop Functionality Simulation', () => {
    it('handles task movement between different states', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Setup initial tasks in different states
      const tasks = [
        {
          id: 'task-1',
          name: 'Backlog Task',
          description: 'In backlog',
          points: 25,
          status: 'backlog' as const,
          createdAt: new Date(),
        },
        {
          id: 'task-2',
          name: 'Assigned Task',
          description: 'Assigned to developer',
          points: 35,
          status: 'assigned' as const,
          assignedTo: 'dev-1',
          createdAt: new Date(),
        },
      ];

      tasks.forEach(task => {
        act(() => {
          result.current.addTask(task);
        });
      });

      // Verify initial state
      expect(result.current.getTasksByStatus('backlog')).toHaveLength(1);
      expect(result.current.getTasksByStatus('assigned')).toHaveLength(1);
      expect(result.current.getTasksByDeveloper('dev-1')).toHaveLength(1);

      // Test 1: Move backlog task to developer (simulate drag and drop)
      act(() => {
        result.current.updateTask('task-1', {
          status: 'assigned',
          assignedTo: 'dev-1',
        });
      });

      // Verify task moved
      expect(result.current.getTasksByStatus('backlog')).toHaveLength(0);
      expect(result.current.getTasksByStatus('assigned')).toHaveLength(2);
      expect(result.current.getTasksByDeveloper('dev-1')).toHaveLength(2);

      // Test 2: Move task back to backlog
      act(() => {
        result.current.updateTask('task-1', {
          status: 'backlog',
          assignedTo: undefined,
        });
      });

      // Verify task moved back
      expect(result.current.getTasksByStatus('backlog')).toHaveLength(1);
      expect(result.current.getTasksByStatus('assigned')).toHaveLength(1);
      expect(result.current.getTasksByDeveloper('dev-1')).toHaveLength(1);

      // Test 3: Move task between developers
      act(() => {
        result.current.updateTask('task-2', {
          assignedTo: 'dev-2',
        });
      });

      // Verify task reassignment
      expect(result.current.getTasksByDeveloper('dev-1')).toHaveLength(0);
      expect(result.current.getTasksByDeveloper('dev-2')).toHaveLength(1);

      // Verify new developer was created
      expect(result.current.developers).toHaveLength(2);
      const dev2 = result.current.developers.find(d => d.id === 'dev-2');
      expect(dev2?.name).toBe('Developer 2');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles localStorage quota exceeded gracefully', async () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const task: Task = {
        id: 'task-1',
        name: 'Test Task',
        description: 'Test Description',
        points: 25,
        status: 'backlog',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTask(task);
      });

      // Should handle the error gracefully
      await waitFor(() => {
        expect(result.current.error).toContain('Failed to save data');
      });

      // Restore original setItem
      localStorageMock.setItem = originalSetItem;
    });

    it('prevents invalid operations on completed tasks', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create and complete a task
      const task: Task = {
        id: 'task-1',
        name: 'Completed Task',
        description: 'Already done',
        points: 50,
        status: 'completed',
        assignedTo: 'dev-1',
        createdAt: new Date(),
        completedAt: new Date(),
        completionDetails: {
          hoursSpent: 5,
          gitCommit: 'abc123',
          comments: 'All done',
        },
      };

      act(() => {
        result.current.addTask(task);
      });

      // Verify task is completed
      const completedTask = result.current.tasks.find(t => t.id === 'task-1');
      expect(completedTask?.status).toBe('completed');
      expect(completedTask?.completionDetails?.hoursSpent).toBe(5);

      // Verify developer stats
      const developer = result.current.developers.find(d => d.id === 'dev-1');
      expect(developer?.totalPoints).toBe(50);
      expect(developer?.completedTasks).toBe(1);
      expect(developer?.totalHours).toBe(5);

      // Attempting to modify completed task should not change its completion status
      // (This would be prevented at the UI level, but the data model should maintain integrity)
      const originalCompletionDetails = completedTask?.completionDetails;
      
      act(() => {
        result.current.updateTask('task-1', {
          status: 'assigned', // This shouldn't change a completed task
        });
      });

      // Task should remain completed
      const stillCompletedTask = result.current.tasks.find(t => t.id === 'task-1');
      expect(stillCompletedTask?.status).toBe('completed');
      expect(stillCompletedTask?.completionDetails).toEqual(originalCompletionDetails);
    });

    it('handles large datasets efficiently', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Create a large number of tasks
      const largeTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        name: `Task ${i}`,
        description: `Description for task ${i}`,
        points: 10 + (i % 50), // Vary points from 10-59
        status: 'backlog' as const,
        createdAt: new Date(),
      }));

      // Add tasks in batches
      largeTasks.forEach(task => {
        act(() => {
          result.current.addTask(task);
        });
      });

      expect(result.current.tasks).toHaveLength(100);

      // Assign tasks to multiple developers
      for (let i = 0; i < 50; i++) {
        const devId = `dev-${i % 10}`; // 10 developers
        act(() => {
          result.current.updateTask(`task-${i}`, {
            status: 'assigned',
            assignedTo: devId,
          });
        });
      }

      // Complete some tasks
      for (let i = 0; i < 25; i++) {
        act(() => {
          result.current.updateTask(`task-${i}`, {
            status: 'completed',
            completedAt: new Date(),
            completionDetails: {
              hoursSpent: 2 + (i % 8), // Vary hours from 2-9
              gitCommit: `commit-${i}`,
              comments: `Completed task ${i}`,
            },
          });
        });
      }

      // Verify final state
      expect(result.current.tasks).toHaveLength(100);
      expect(result.current.getTasksByStatus('completed')).toHaveLength(25);
      expect(result.current.getTasksByStatus('assigned')).toHaveLength(25);
      expect(result.current.getTasksByStatus('backlog')).toHaveLength(50);
      expect(result.current.developers).toHaveLength(10);

      // Verify developer stats are calculated correctly
      const developers = result.current.developers;
      const totalPoints = developers.reduce((sum, dev) => sum + dev.totalPoints, 0);
      const totalTasks = developers.reduce((sum, dev) => sum + dev.completedTasks, 0);
      const totalHours = developers.reduce((sum, dev) => sum + dev.totalHours, 0);

      expect(totalTasks).toBe(25); // 25 completed tasks
      expect(totalPoints).toBeGreaterThan(0);
      expect(totalHours).toBeGreaterThan(0);
    });
  });
});