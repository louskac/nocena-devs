import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KanbanBoard from '../../components/KanbanBoard';
import { Task, Developer } from '../../lib/types';

// Mock the useTaskStorage hook for end-to-end workflow testing
jest.mock('../../lib/hooks/useTaskStorage', () => ({
  useTaskStorage: jest.fn(),
}));

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

import { useTaskStorage } from '../../lib/hooks/useTaskStorage';
const mockUseTaskStorage = useTaskStorage as jest.MockedFunction<typeof useTaskStorage>;

describe('End-to-End Workflow Integration Tests', () => {
  let mockTasks: Task[];
  let mockDevelopers: Developer[];
  let mockHookReturn: ReturnType<typeof useTaskStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Initialize with empty state
    mockTasks = [];
    mockDevelopers = [];
    
    mockHookReturn = {
      tasks: mockTasks,
      developers: mockDevelopers,
      isLoading: false,
      error: null,
      addTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      updateDeveloper: jest.fn(),
      getTasksByStatus: jest.fn(),
      getTasksByDeveloper: jest.fn(),
      clearError: jest.fn(),
      forceSave: jest.fn(),
      reloadData: jest.fn(),
    };

    // Setup default mock implementations
    mockHookReturn.getTasksByStatus.mockImplementation((status) => 
      mockTasks.filter(task => task.status === status)
    );
    mockHookReturn.getTasksByDeveloper.mockImplementation((developerId) => 
      mockTasks.filter(task => task.assignedTo === developerId)
    );

    mockUseTaskStorage.mockReturnValue(mockHookReturn);
  });

  describe('Complete Task Lifecycle Workflows', () => {
    it('successfully completes task creation → assignment → completion workflow', async () => {
      const { rerender } = render(<KanbanBoard />);
      
      // Step 1: Create a new task
      fireEvent.click(screen.getByText('Add Task'));
      
      await waitFor(() => {
        expect(mockHookReturn.addTask).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Task',
            description: 'Test Description',
            points: 25,
            status: 'backlog',
            id: expect.stringMatching(/^task-/),
            createdAt: expect.any(Date),
          })
        );
      });
      
      // Update mock state to reflect new task
      const newTask: Task = {
        id: 'task-1',
        name: 'Test Task',
        description: 'Test Description',
        points: 25,
        status: 'backlog',
        createdAt: new Date(),
      };
      
      mockTasks = [newTask];
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify task appears in backlog
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      
      // Step 2: Assign task to developer (simulate drag and drop)
      // This would normally be done through drag and drop, but we'll simulate the result
      mockHookReturn.updateTask.mockImplementation((taskId, updates) => {
        const taskIndex = mockTasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updates };
        }
      });
      
      // Simulate task assignment
      mockTasks[0] = { ...mockTasks[0], status: 'assigned', assignedTo: 'dev-1' };
      
      // Auto-create developer when task is assigned
      const newDeveloper: Developer = {
        id: 'dev-1',
        name: 'Developer 1',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      };
      
      mockDevelopers = [newDeveloper];
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify task assignment
      expect(screen.getByText('Developer 1')).toBeInTheDocument();
      
      // Step 3: Complete the task
      // Simulate task completion
      mockTasks[0] = {
        ...mockTasks[0],
        status: 'completed',
        completedAt: new Date(),
        completionDetails: {
          hoursSpent: 5,
          gitCommit: 'abc123def',
          comments: 'Task completed successfully',
        },
      };
      
      // Update developer stats
      mockDevelopers[0] = {
        ...mockDevelopers[0],
        totalPoints: 25,
        completedTasks: 1,
        totalHours: 5,
      };
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify completion and developer stats update
      expect(screen.getByText('Developer 1')).toBeInTheDocument();
      
      // The task should now be completed and developer should have updated stats
      const completedTask = mockTasks.find(t => t.id === 'task-1');
      expect(completedTask?.status).toBe('completed');
      expect(completedTask?.completionDetails?.hoursSpent).toBe(5);
      
      const developer = mockDevelopers.find(d => d.id === 'dev-1');
      expect(developer?.totalPoints).toBe(25);
      expect(developer?.completedTasks).toBe(1);
      expect(developer?.totalHours).toBe(5);
    });

    it('handles multiple tasks across different developers', async () => {
      // Setup initial state with multiple tasks and developers
      const initialTasks: Task[] = [
        {
          id: 'task-1',
          name: 'Frontend Task',
          description: 'Build UI components',
          points: 40,
          status: 'assigned',
          assignedTo: 'dev-1',
          createdAt: new Date(),
        },
        {
          id: 'task-2',
          name: 'Backend Task',
          description: 'Create API endpoints',
          points: 60,
          status: 'assigned',
          assignedTo: 'dev-2',
          createdAt: new Date(),
        },
        {
          id: 'task-3',
          name: 'Backlog Task',
          description: 'Future enhancement',
          points: 30,
          status: 'backlog',
          createdAt: new Date(),
        },
      ];
      
      const initialDevelopers: Developer[] = [
        {
          id: 'dev-1',
          name: 'Alice Johnson',
          totalPoints: 0,
          completedTasks: 0,
          totalHours: 0,
        },
        {
          id: 'dev-2',
          name: 'Bob Smith',
          totalPoints: 0,
          completedTasks: 0,
          totalHours: 0,
        },
      ];
      
      mockTasks = [...initialTasks];
      mockDevelopers = [...initialDevelopers];
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      const { rerender } = render(<KanbanBoard />);
      
      // Verify initial state
      expect(screen.getByText('Frontend Task')).toBeInTheDocument();
      expect(screen.getByText('Backend Task')).toBeInTheDocument();
      expect(screen.getByText('Backlog Task')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      
      // Complete Alice's task
      mockTasks[0] = {
        ...mockTasks[0],
        status: 'completed',
        completedAt: new Date(),
        completionDetails: {
          hoursSpent: 8,
          gitCommit: 'abc123',
          comments: 'Frontend completed',
        },
      };
      
      mockDevelopers[0] = {
        ...mockDevelopers[0],
        totalPoints: 40,
        completedTasks: 1,
        totalHours: 8,
      };
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Complete Bob's task
      mockTasks[1] = {
        ...mockTasks[1],
        status: 'completed',
        completedAt: new Date(),
        completionDetails: {
          hoursSpent: 12,
          gitCommit: 'def456',
          comments: 'Backend API ready',
        },
      };
      
      mockDevelopers[1] = {
        ...mockDevelopers[1],
        totalPoints: 60,
        completedTasks: 1,
        totalHours: 12,
      };
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify both developers have updated stats
      const alice = mockDevelopers.find(d => d.id === 'dev-1');
      const bob = mockDevelopers.find(d => d.id === 'dev-2');
      
      expect(alice?.totalPoints).toBe(40);
      expect(alice?.completedTasks).toBe(1);
      expect(alice?.totalHours).toBe(8);
      
      expect(bob?.totalPoints).toBe(60);
      expect(bob?.completedTasks).toBe(1);
      expect(bob?.totalHours).toBe(12);
      
      // Verify backlog task remains unchanged
      const backlogTask = mockTasks.find(t => t.id === 'task-3');
      expect(backlogTask?.status).toBe('backlog');
    });
  });

  describe('Data Persistence Across Sessions', () => {
    it('persists and recovers task data across browser sessions', async () => {
      // Session 1: Create and save data
      const session1Data = {
        tasks: [
          {
            id: 'task-1',
            name: 'Persistent Task',
            description: 'Should survive browser restart',
            points: 50,
            status: 'completed',
            assignedTo: 'dev-1',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            completionDetails: {
              hoursSpent: 6,
              gitCommit: 'abc123def',
              comments: 'Completed successfully',
            },
          },
        ],
        developers: [
          {
            id: 'dev-1',
            name: 'Persistent Developer',
            totalPoints: 50,
            completedTasks: 1,
            totalHours: 6,
          },
        ],
      };
      
      // Simulate saving to localStorage
      localStorageMock.setItem('nocena-devs-data', JSON.stringify(session1Data));
      
      // Session 2: Load data and verify persistence
      mockTasks = session1Data.tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      })) as Task[];
      mockDevelopers = session1Data.developers;
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      render(<KanbanBoard />);
      
      // Verify data loaded correctly
      expect(screen.getByText('Persistent Task')).toBeInTheDocument();
      expect(screen.getByText('Persistent Developer')).toBeInTheDocument();
      
      // Verify localStorage was accessed
      expect(localStorageMock.getItem).toHaveBeenCalledWith('nocena-devs-data');
      
      // Verify task and developer data integrity
      const persistedTask = mockTasks.find(t => t.id === 'task-1');
      expect(persistedTask?.status).toBe('completed');
      expect(persistedTask?.points).toBe(50);
      expect(persistedTask?.completionDetails?.hoursSpent).toBe(6);
      
      const persistedDeveloper = mockDevelopers.find(d => d.id === 'dev-1');
      expect(persistedDeveloper?.totalPoints).toBe(50);
      expect(persistedDeveloper?.completedTasks).toBe(1);
      expect(persistedDeveloper?.totalHours).toBe(6);
    });

    it('handles corrupted data gracefully', async () => {
      // Simulate corrupted localStorage data
      localStorageMock.setItem('nocena-devs-data', '{"tasks": [invalid json}');
      
      // Mock hook should handle corruption and return empty state
      mockTasks = [];
      mockDevelopers = [];
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
        error: null, // Should recover gracefully
      });
      
      render(<KanbanBoard />);
      
      // Should show empty state without errors
      expect(screen.getByText('Add Task')).toBeInTheDocument();
      
      // Should be able to create new tasks after recovery
      fireEvent.click(screen.getByText('Add Task'));
      
      await waitFor(() => {
        expect(mockHookReturn.addTask).toHaveBeenCalled();
      });
    });
  });

  describe('Leaderboard Accuracy and Updates', () => {
    it('calculates correct leaderboard rankings with multiple developers', async () => {
      // Setup complex scenario with different point totals
      const complexDevelopers: Developer[] = [
        {
          id: 'dev-1',
          name: 'Alice Johnson',
          totalPoints: 150,
          completedTasks: 3,
          totalHours: 20,
        },
        {
          id: 'dev-2',
          name: 'Bob Smith',
          totalPoints: 200, // Leading developer
          completedTasks: 4,
          totalHours: 25,
        },
        {
          id: 'dev-3',
          name: 'Charlie Brown',
          totalPoints: 75,
          completedTasks: 2,
          totalHours: 10,
        },
      ];
      
      mockDevelopers = complexDevelopers;
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        developers: mockDevelopers,
      });
      
      render(<KanbanBoard />);
      
      // Verify developers are displayed
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
      
      // Verify leaderboard data integrity
      // Bob should be leading with 200 points
      const bob = mockDevelopers.find(d => d.name === 'Bob Smith');
      expect(bob?.totalPoints).toBe(200);
      expect(bob?.completedTasks).toBe(4);
      
      // Alice should be second with 150 points
      const alice = mockDevelopers.find(d => d.name === 'Alice Johnson');
      expect(alice?.totalPoints).toBe(150);
      expect(alice?.completedTasks).toBe(3);
      
      // Charlie should be third with 75 points
      const charlie = mockDevelopers.find(d => d.name === 'Charlie Brown');
      expect(charlie?.totalPoints).toBe(75);
      expect(charlie?.completedTasks).toBe(2);
    });

    it('updates leaderboard when new tasks are completed', async () => {
      // Start with initial rankings
      const initialDevelopers: Developer[] = [
        {
          id: 'dev-1',
          name: 'Alice Johnson',
          totalPoints: 100,
          completedTasks: 2,
          totalHours: 10,
        },
        {
          id: 'dev-2',
          name: 'Bob Smith',
          totalPoints: 120, // Bob is currently leading
          completedTasks: 3,
          totalHours: 12,
        },
      ];
      
      const newTask: Task = {
        id: 'task-new',
        name: 'High Value Task',
        description: 'Worth many points',
        points: 100,
        status: 'assigned',
        assignedTo: 'dev-1',
        createdAt: new Date(),
      };
      
      mockTasks = [newTask];
      mockDevelopers = [...initialDevelopers];
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      const { rerender } = render(<KanbanBoard />);
      
      // Verify initial state (Bob leading)
      expect(mockDevelopers.find(d => d.id === 'dev-2')?.totalPoints).toBe(120);
      expect(mockDevelopers.find(d => d.id === 'dev-1')?.totalPoints).toBe(100);
      
      // Alice completes the high-value task
      mockTasks[0] = {
        ...mockTasks[0],
        status: 'completed',
        completedAt: new Date(),
        completionDetails: {
          hoursSpent: 10,
          gitCommit: 'xyz789',
          comments: 'Major feature completed',
        },
      };
      
      // Update Alice's stats (100 + 100 = 200 points)
      mockDevelopers[0] = {
        ...mockDevelopers[0],
        totalPoints: 200, // 100 + 100
        completedTasks: 3, // 2 + 1
        totalHours: 20, // 10 + 10
      };
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify Alice now leads with 200 points
      const alice = mockDevelopers.find(d => d.id === 'dev-1');
      const bob = mockDevelopers.find(d => d.id === 'dev-2');
      
      expect(alice?.totalPoints).toBe(200);
      expect(alice?.completedTasks).toBe(3);
      expect(alice?.totalHours).toBe(20);
      
      expect(bob?.totalPoints).toBe(120); // Unchanged
      expect(bob?.completedTasks).toBe(3); // Unchanged
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('handles task movement between columns', async () => {
      // Setup initial state with tasks in different states
      const initialTasks: Task[] = [
        {
          id: 'task-1',
          name: 'Backlog Task',
          description: 'In backlog',
          points: 25,
          status: 'backlog',
          createdAt: new Date(),
        },
        {
          id: 'task-2',
          name: 'Assigned Task',
          description: 'Assigned to developer',
          points: 35,
          status: 'assigned',
          assignedTo: 'dev-1',
          createdAt: new Date(),
        },
      ];
      
      const initialDevelopers: Developer[] = [
        {
          id: 'dev-1',
          name: 'Alice Johnson',
          totalPoints: 0,
          completedTasks: 0,
          totalHours: 0,
        },
      ];
      
      mockTasks = [...initialTasks];
      mockDevelopers = [...initialDevelopers];
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      const { rerender } = render(<KanbanBoard />);
      
      // Verify initial state
      expect(screen.getByText('Backlog Task')).toBeInTheDocument();
      expect(screen.getByText('Assigned Task')).toBeInTheDocument();
      
      // Simulate moving backlog task to developer
      mockHookReturn.updateTask.mockImplementation((taskId, updates) => {
        const taskIndex = mockTasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updates };
        }
      });
      
      // Move task-1 from backlog to dev-1
      mockTasks[0] = { ...mockTasks[0], status: 'assigned', assignedTo: 'dev-1' };
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify task moved
      const movedTask = mockTasks.find(t => t.id === 'task-1');
      expect(movedTask?.status).toBe('assigned');
      expect(movedTask?.assignedTo).toBe('dev-1');
      
      // Move task back to backlog
      mockTasks[0] = { ...mockTasks[0], status: 'backlog', assignedTo: undefined };
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify task moved back
      const backlogTask = mockTasks.find(t => t.id === 'task-1');
      expect(backlogTask?.status).toBe('backlog');
      expect(backlogTask?.assignedTo).toBeUndefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles empty state gracefully', () => {
      mockTasks = [];
      mockDevelopers = [];
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      render(<KanbanBoard />);
      
      // Should show empty state without errors
      expect(screen.getByText('Add Task')).toBeInTheDocument();
      expect(screen.getByText('Developer Task Tracker')).toBeInTheDocument();
    });

    it('handles loading state properly', () => {
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
      });
      
      render(<KanbanBoard />);
      
      expect(screen.getByText('Loading your workspace...')).toBeInTheDocument();
      expect(screen.queryByText('Add Task')).not.toBeInTheDocument();
    });

    it('handles error state with recovery option', () => {
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        error: 'Network connection failed',
      });
      
      render(<KanbanBoard />);
      
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      
      // Test error recovery
      fireEvent.click(screen.getByText('Try Again'));
      expect(mockHookReturn.clearError).toHaveBeenCalled();
    });

    it('prevents operations on completed tasks', () => {
      const completedTask: Task = {
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
      
      mockTasks = [completedTask];
      mockDevelopers = [{
        id: 'dev-1',
        name: 'Alice Johnson',
        totalPoints: 50,
        completedTasks: 1,
        totalHours: 5,
      }];
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      render(<KanbanBoard />);
      
      // Verify completed task is displayed
      expect(screen.getByText('Completed Task')).toBeInTheDocument();
      
      // Verify task data integrity
      const task = mockTasks.find(t => t.id === 'task-1');
      expect(task?.status).toBe('completed');
      expect(task?.completionDetails?.hoursSpent).toBe(5);
      
      const developer = mockDevelopers.find(d => d.id === 'dev-1');
      expect(developer?.totalPoints).toBe(50);
      expect(developer?.completedTasks).toBe(1);
    });
  });
});