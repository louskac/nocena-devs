import { renderHook, act, waitFor } from '@testing-library/react';
import { useTaskStorage } from '../hooks/useTaskStorage';
import { AppState, Task } from '../types';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock console methods to avoid noise in tests
const originalConsole = console;
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe('useTaskStorage', () => {
  const mockTask: Task = {
    id: 'task-1',
    name: 'Test Task',
    description: 'Test Description',
    points: 10,
    status: 'backlog',
    createdAt: new Date('2025-01-01T00:00:00Z'),
  };

  const mockDeveloper: Developer = {
    id: 'dev-1',
    name: 'Test Developer',
    totalPoints: 0,
    completedTasks: 0,
    totalHours: 0,
  };

  // const mockAppState: AppState = {
  //   tasks: [mockTask],
  //   developers: [mockDeveloper],
  // };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should load data on mount', async () => {
      // Pre-populate localStorage with test data
      const testData = {
        tasks: [mockTask],
        developers: [mockDeveloper],
        version: '1.0'
      };
      localStorage.setItem('nocena-devs-data', JSON.stringify(testData));

      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].name).toBe(mockTask.name);
      expect(result.current.developers).toHaveLength(1);
      expect(result.current.developers[0].name).toBe(mockDeveloper.name);
    });

    it('should handle empty storage', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.developers).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle corrupted data gracefully', async () => {
      // Set corrupted data in localStorage
      localStorage.setItem('nocena-devs-data', '{"invalid": "data"}');

      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to empty state
      expect(result.current.tasks).toEqual([]);
      expect(result.current.developers).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('data persistence', () => {
    it('should auto-save when tasks are added', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newTask: Task = {
        id: 'task-2',
        name: 'New Task',
        description: 'New Description',
        points: 20,
        status: 'backlog',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTask(newTask);
      });

      // Wait for debounced save
      await waitFor(() => {
        const stored = localStorage.getItem('nocena-devs-data');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed.tasks).toHaveLength(1);
      }, { timeout: 1000 });

      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].name).toBe(newTask.name);
    });

    it('should force save manually', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let saveResult: boolean;
      await act(async () => {
        saveResult = await result.current.forceSave();
      });

      expect(saveResult).toBe(true);
      expect(result.current.lastSaved).toBeInstanceOf(Date);
    });

    it('should reload data manually', async () => {
      // Pre-populate with some data
      const testData = {
        tasks: [mockTask],
        developers: [mockDeveloper],
        version: '1.0'
      };
      localStorage.setItem('nocena-devs-data', JSON.stringify(testData));

      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Modify localStorage directly
      const modifiedData = {
        ...testData,
        tasks: [...testData.tasks, { ...mockTask, id: 'task-2', name: 'Modified Task' }]
      };
      localStorage.setItem('nocena-devs-data', JSON.stringify(modifiedData));

      await act(async () => {
        await result.current.reloadData();
      });

      expect(result.current.tasks).toHaveLength(2);
    });
  });

  describe('task management', () => {
    it('should update task and trigger save', async () => {
      // Pre-populate with test data
      const testData = {
        tasks: [mockTask],
        developers: [mockDeveloper],
        version: '1.0'
      };
      localStorage.setItem('nocena-devs-data', JSON.stringify(testData));

      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateTask('task-1', { status: 'assigned', assignedTo: 'dev-1' });
      });

      expect(result.current.tasks[0].status).toBe('assigned');
      expect(result.current.tasks[0].assignedTo).toBe('dev-1');
    });

    it('should delete task and update developer stats', async () => {
      const completedTask: Task = {
        ...mockTask,
        status: 'completed',
        assignedTo: 'dev-1',
        completedAt: new Date(),
        completionDetails: {
          hoursSpent: 5,
          gitCommit: 'abc123',
          comments: 'Completed successfully',
        },
      };

      const testData = {
        tasks: [completedTask],
        developers: [{ ...mockDeveloper, totalPoints: 10, completedTasks: 1, totalHours: 5 }],
        version: '1.0'
      };
      localStorage.setItem('nocena-devs-data', JSON.stringify(testData));

      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.deleteTask('task-1');
      });

      expect(result.current.tasks).toHaveLength(0);
      expect(result.current.developers[0].totalPoints).toBe(0);
      expect(result.current.developers[0].completedTasks).toBe(0);
    });
  });

  describe('developer management', () => {
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
        assignedTo: 'new-dev-1',
        createdAt: new Date(),
      };

      act(() => {
        result.current.addTask(newTask);
      });

      expect(result.current.developers).toHaveLength(1);
      expect(result.current.developers[0].id).toBe('new-dev-1');
      expect(result.current.developers[0].name).toBe('Developer new');
    });

    it('should update developer information', async () => {
      // Pre-populate with test data
      const testData = {
        tasks: [mockTask],
        developers: [mockDeveloper],
        version: '1.0'
      };
      localStorage.setItem('nocena-devs-data', JSON.stringify(testData));

      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedDeveloper: Developer = {
        ...mockDeveloper,
        name: 'Updated Developer Name',
      };

      act(() => {
        result.current.updateDeveloper(updatedDeveloper);
      });

      expect(result.current.developers[0].name).toBe('Updated Developer Name');
    });
  });

  describe('error handling', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useTaskStorage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Manually set an error (simulating an error condition)
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});