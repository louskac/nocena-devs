import { renderHook, act, waitFor } from '@testing-library/react';
import { useTaskStorage } from '../hooks/useTaskStorage';
import { Task } from '../types';

// Basic integration tests for data persistence
describe('Data Persistence - Basic Functionality', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should initialize with empty state when no data exists', async () => {
    const { result } = renderHook(() => useTaskStorage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.developers).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should add a task and persist it', async () => {
    const { result } = renderHook(() => useTaskStorage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newTask: Task = {
      id: 'test-task-1',
      name: 'Test Task',
      description: 'Test Description',
      points: 10,
      status: 'backlog',
      createdAt: new Date('2025-01-01T00:00:00Z'),
    };

    act(() => {
      result.current.addTask(newTask);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].name).toBe('Test Task');

    // Wait for auto-save
    await waitFor(() => {
      const stored = localStorage.getItem('nocena-devs-data');
      expect(stored).toBeTruthy();
    }, { timeout: 1000 });

    // Verify data was saved correctly
    const stored = localStorage.getItem('nocena-devs-data');
    const parsed = JSON.parse(stored!);
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.tasks[0].name).toBe('Test Task');
  });

  it('should load persisted data on initialization', async () => {
    // Pre-populate localStorage with test data
    const testData = {
      tasks: [{
        id: 'test-task-1',
        name: 'Persisted Task',
        description: 'This task was persisted',
        points: 15,
        status: 'backlog',
        createdAt: '2025-01-01T00:00:00.000Z'
      }],
      developers: [{
        id: 'dev-1',
        name: 'Test Developer',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0
      }],
      version: '1.0'
    };
    localStorage.setItem('nocena-devs-data', JSON.stringify(testData));

    const { result } = renderHook(() => useTaskStorage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].name).toBe('Persisted Task');
    expect(result.current.tasks[0].createdAt).toBeInstanceOf(Date);
    expect(result.current.developers).toHaveLength(1);
    expect(result.current.developers[0].name).toBe('Test Developer');
  });

  it('should update task and persist changes', async () => {
    // Start with a task
    const testData = {
      tasks: [{
        id: 'test-task-1',
        name: 'Original Task',
        description: 'Original description',
        points: 10,
        status: 'backlog',
        createdAt: '2025-01-01T00:00:00.000Z'
      }],
      developers: [],
      version: '1.0'
    };
    localStorage.setItem('nocena-devs-data', JSON.stringify(testData));

    const { result } = renderHook(() => useTaskStorage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Update the task
    act(() => {
      result.current.updateTask('test-task-1', {
        status: 'assigned',
        assignedTo: 'dev-1'
      });
    });

    expect(result.current.tasks[0].status).toBe('assigned');
    expect(result.current.tasks[0].assignedTo).toBe('dev-1');

    // Wait for auto-save
    await waitFor(() => {
      const stored = localStorage.getItem('nocena-devs-data');
      const parsed = JSON.parse(stored!);
      expect(parsed.tasks[0].status).toBe('assigned');
    }, { timeout: 1000 });
  });

  it('should auto-create developer when task is assigned', async () => {
    const { result } = renderHook(() => useTaskStorage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newTask: Task = {
      id: 'test-task-1',
      name: 'Test Task',
      description: 'Test Description',
      points: 10,
      status: 'assigned',
      assignedTo: 'new-dev-123',
      createdAt: new Date(),
    };

    act(() => {
      result.current.addTask(newTask);
    });

    expect(result.current.developers).toHaveLength(1);
    expect(result.current.developers[0].id).toBe('new-dev-123');
    expect(result.current.developers[0].name).toBe('Developer new');
  });

  it('should handle manual save and reload', async () => {
    const { result } = renderHook(() => useTaskStorage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Add a task
    const newTask: Task = {
      id: 'test-task-1',
      name: 'Manual Save Test',
      description: 'Test Description',
      points: 20,
      status: 'backlog',
      createdAt: new Date(),
    };

    act(() => {
      result.current.addTask(newTask);
    });

    // Force save
    let saveResult: boolean;
    await act(async () => {
      saveResult = await result.current.forceSave();
    });

    expect(saveResult).toBe(true);
    expect(result.current.lastSaved).toBeInstanceOf(Date);

    // Modify localStorage directly to simulate external change
    const stored = localStorage.getItem('nocena-devs-data');
    const parsed = JSON.parse(stored!);
    parsed.tasks.push({
      id: 'external-task',
      name: 'External Task',
      description: 'Added externally',
      points: 5,
      status: 'backlog',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('nocena-devs-data', JSON.stringify(parsed));

    // Reload data
    await act(async () => {
      await result.current.reloadData();
    });

    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.tasks.some(t => t.name === 'External Task')).toBe(true);
  });

  it('should handle corrupted data gracefully', async () => {
    // Set invalid JSON in localStorage
    localStorage.setItem('nocena-devs-data', '{"invalid": json}');

    const { result } = renderHook(() => useTaskStorage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should fall back to empty state without error
    expect(result.current.tasks).toEqual([]);
    expect(result.current.developers).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});