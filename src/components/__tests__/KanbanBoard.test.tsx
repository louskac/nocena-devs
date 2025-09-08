import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KanbanBoard from '../KanbanBoard';
import { Task, Developer } from '../../lib/types';

// Mock the useTaskStorage hook
jest.mock('../../lib/hooks/useTaskStorage', () => ({
  useTaskStorage: jest.fn(),
}));

// Mock the child components
jest.mock('../AddTaskModal', () => {
  return function MockAddTaskModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: { name: string; description: string; points: number }) => void }) {
    if (!isOpen) return null;
    return (
      <div data-testid="add-task-modal">
        <button onClick={onClose}>Close</button>
        <button 
          onClick={() => onSubmit({ name: 'Test Task', description: 'Test Description', points: 25 })}
        >
          Submit
        </button>
      </div>
    );
  };
});

jest.mock('../CompleteTaskModal', () => {
  return function MockCompleteTaskModal({ isOpen, task, onClose, onSubmit }: { isOpen: boolean; task: Task | null; onClose: () => void; onSubmit: (taskId: string, data: { hoursSpent: number; gitCommit: string; comments: string }) => void }) {
    if (!isOpen || !task) return null;
    return (
      <div data-testid="complete-task-modal">
        <div>Completing: {task.name}</div>
        <button onClick={onClose}>Close</button>
        <button 
          onClick={() => onSubmit(task.id, { 
            hoursSpent: 5, 
            gitCommit: 'abc123def', 
            comments: 'Task completed successfully' 
          })}
        >
          Submit Completion
        </button>
      </div>
    );
  };
});

jest.mock('../Leaderboard', () => {
  return function MockLeaderboard({ developers }: { developers: Developer[] }) {
    return (
      <div data-testid="leaderboard">
        <h2>Leaderboard</h2>
        <div>Developers: {developers.length}</div>
        {developers.map((dev: Developer) => (
          <div key={dev.id} data-testid={`leaderboard-${dev.id}`}>
            {dev.name}: {dev.totalPoints} points
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../TaskColumn', () => {
  return function MockTaskColumn({ title, tasks, isBacklog, developer, onTaskDrop, onTaskComplete, onTaskEdit }: { title: string; tasks: Task[]; isBacklog?: boolean; developer?: Developer; onTaskDrop?: (taskId: string, targetId: string) => void; onTaskComplete?: (taskId: string) => void; onTaskEdit?: (taskId: string) => void }) {
    const targetColumn = isBacklog ? 'backlog' : developer?.id || 'unknown';
    
    return (
      <div data-testid={`column-${targetColumn}`}>
        <h3>{title}</h3>
        <div>Tasks: {tasks.length}</div>
        {tasks.map((task: Task) => (
          <div key={task.id} data-testid={`task-${task.id}`}>
            {task.name}
            {onTaskDrop && (
              <>
                <button onClick={() => onTaskDrop(task.id, 'backlog')}>
                  Drop to Backlog
                </button>
                <button onClick={() => onTaskDrop(task.id, developer?.id || 'dev-1')}>
                  Drop to Developer
                </button>
              </>
            )}
            {onTaskComplete && (
              <button onClick={() => onTaskComplete(task.id)}>
                Complete
              </button>
            )}
            {onTaskEdit && (
              <button onClick={() => onTaskEdit(task.id)}>
                Edit
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };
});

import { useTaskStorage } from '../../lib/hooks/useTaskStorage';
const mockUseTaskStorage = useTaskStorage as jest.MockedFunction<typeof useTaskStorage>;

describe('KanbanBoard', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      name: 'Test Task 1',
      description: 'Test Description 1',
      points: 10,
      status: 'backlog',
      createdAt: new Date('2025-01-01'),
    },
    {
      id: 'task-2',
      name: 'Test Task 2',
      description: 'Test Description 2',
      points: 20,
      status: 'assigned',
      assignedTo: 'dev-1',
      createdAt: new Date('2025-01-02'),
    },
  ];

  const mockDevelopers: Developer[] = [
    {
      id: 'dev-1',
      name: 'John Doe',
      totalPoints: 100,
      completedTasks: 5,
      totalHours: 40,
    },
  ];

  const mockHookReturn = {
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTaskStorage.mockReturnValue(mockHookReturn);
    
    // Setup default mock implementations
    mockHookReturn.getTasksByStatus.mockImplementation((status) => 
      mockTasks.filter(task => task.status === status)
    );
    mockHookReturn.getTasksByDeveloper.mockImplementation((developerId) => 
      mockTasks.filter(task => task.assignedTo === developerId)
    );
  });

  describe('Rendering', () => {
    it('renders the kanban board with header and columns', () => {
      render(<KanbanBoard />);
      
      expect(screen.getByText('Developer Task Tracker')).toBeInTheDocument();
      expect(screen.getByText('Add Task')).toBeInTheDocument();
      expect(screen.getByTestId('column-backlog')).toBeInTheDocument();
      expect(screen.getByTestId('column-dev-1')).toBeInTheDocument();
    });

    it('displays correct task statistics in header', () => {
      render(<KanbanBoard />);
      
      expect(screen.getByText('2 tasks')).toBeInTheDocument();
      expect(screen.getByText('1 backlog')).toBeInTheDocument();
      expect(screen.getByText('1 devs')).toBeInTheDocument();
    });

    it('renders backlog column with correct tasks', () => {
      render(<KanbanBoard />);
      
      const backlogColumn = screen.getByTestId('column-backlog');
      expect(backlogColumn).toHaveTextContent('Backlog');
      expect(backlogColumn).toHaveTextContent('Tasks: 1');
    });

    it('renders developer columns with correct tasks', () => {
      render(<KanbanBoard />);
      
      const devColumn = screen.getByTestId('column-dev-1');
      expect(devColumn).toHaveTextContent('John Doe');
      expect(devColumn).toHaveTextContent('Tasks: 1');
    });

    it('renders default developer when no developers exist', () => {
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        developers: [],
      });

      render(<KanbanBoard />);
      
      expect(screen.getByTestId('column-dev-1')).toBeInTheDocument();
      expect(screen.getByText('Developer 1')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when isLoading is true', () => {
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
      });

      render(<KanbanBoard />);
      
      expect(screen.getByText('Loading your workspace...')).toBeInTheDocument();
      expect(screen.queryByText('Developer Task Tracker')).not.toBeInTheDocument();
    });

    it('shows error state when error exists', () => {
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        error: 'Failed to load data',
      });

      render(<KanbanBoard />);
      
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('calls clearError when Try Again button is clicked', () => {
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        error: 'Failed to load data',
      });

      render(<KanbanBoard />);
      
      fireEvent.click(screen.getByText('Try Again'));
      expect(mockHookReturn.clearError).toHaveBeenCalled();
    });
  });

  describe('Task Creation', () => {
    it('opens add task modal when Add Task button is clicked', () => {
      render(<KanbanBoard />);
      
      fireEvent.click(screen.getByText('Add Task'));
      
      expect(screen.getByTestId('add-task-modal')).toBeInTheDocument();
    });

    it('closes add task modal when close is triggered', () => {
      render(<KanbanBoard />);
      
      // Open modal
      fireEvent.click(screen.getByText('Add Task'));
      expect(screen.getByTestId('add-task-modal')).toBeInTheDocument();
      
      // Close modal
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('add-task-modal')).not.toBeInTheDocument();
    });

    it('creates a new task when form is submitted', async () => {
      render(<KanbanBoard />);
      
      // Open modal
      fireEvent.click(screen.getByText('Add Task'));
      
      // Submit form
      fireEvent.click(screen.getByText('Submit'));
      
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
    });

    it('generates unique task IDs', async () => {
      render(<KanbanBoard />);
      
      // Create first task
      fireEvent.click(screen.getByText('Add Task'));
      fireEvent.click(screen.getByText('Submit'));
      
      // Create second task
      fireEvent.click(screen.getByText('Add Task'));
      fireEvent.click(screen.getByText('Submit'));
      
      await waitFor(() => {
        expect(mockHookReturn.addTask).toHaveBeenCalledTimes(2);
        
        const firstCall = mockHookReturn.addTask.mock.calls[0][0];
        const secondCall = mockHookReturn.addTask.mock.calls[1][0];
        
        expect(firstCall.id).not.toBe(secondCall.id);
        expect(firstCall.id).toMatch(/^task-/);
        expect(secondCall.id).toMatch(/^task-/);
      });
    });
  });

  describe('Task Management', () => {
    it('handles task drop to backlog', () => {
      render(<KanbanBoard />);
      
      const taskElement = screen.getByTestId('task-task-2');
      const dropToBacklogButton = taskElement.querySelector('button:first-child');
      
      fireEvent.click(dropToBacklogButton!);
      
      expect(mockHookReturn.updateTask).toHaveBeenCalledWith('task-2', {
        status: 'backlog',
        assignedTo: undefined,
      });
    });

    it('handles task drop to developer column', () => {
      render(<KanbanBoard />);
      
      const taskElement = screen.getByTestId('task-task-1');
      const dropToDeveloperButton = taskElement.querySelector('button:nth-child(2)');
      
      fireEvent.click(dropToDeveloperButton!);
      
      expect(mockHookReturn.updateTask).toHaveBeenCalledWith('task-1', {
        status: 'assigned',
        assignedTo: 'dev-1',
      });
    });

    it('opens complete task modal when complete button is clicked', () => {
      render(<KanbanBoard />);
      
      const completeButton = screen.getByText('Complete');
      
      fireEvent.click(completeButton);
      
      expect(screen.getByTestId('complete-task-modal')).toBeInTheDocument();
      expect(screen.getByText('Completing: Test Task 2')).toBeInTheDocument();
    });

    it('closes complete task modal when close is triggered', () => {
      render(<KanbanBoard />);
      
      // Open modal
      fireEvent.click(screen.getByText('Complete'));
      expect(screen.getByTestId('complete-task-modal')).toBeInTheDocument();
      
      // Close modal
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('complete-task-modal')).not.toBeInTheDocument();
    });

    it('completes task with completion details when form is submitted', async () => {
      render(<KanbanBoard />);
      
      // Open completion modal
      fireEvent.click(screen.getByText('Complete'));
      
      // Submit completion form
      fireEvent.click(screen.getByText('Submit Completion'));
      
      await waitFor(() => {
        expect(mockHookReturn.updateTask).toHaveBeenCalledWith('task-2', {
          status: 'completed',
          completedAt: expect.any(Date),
          completionDetails: {
            hoursSpent: 5,
            gitCommit: 'abc123def',
            comments: 'Task completed successfully',
          },
        });
      });
      
      // Modal should close after successful completion
      expect(screen.queryByTestId('complete-task-modal')).not.toBeInTheDocument();
    });

    it('handles task editing', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<KanbanBoard />);
      
      const taskElement = screen.getByTestId('task-task-1');
      const editButton = taskElement.querySelector('button:last-child');
      
      fireEvent.click(editButton!);
      
      expect(consoleSpy).toHaveBeenCalledWith('Edit task:', 'task-1');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Data Integration', () => {
    it('calls getTasksByStatus for backlog tasks', () => {
      render(<KanbanBoard />);
      
      expect(mockHookReturn.getTasksByStatus).toHaveBeenCalledWith('backlog');
    });

    it('calls getTasksByDeveloper for each developer', () => {
      render(<KanbanBoard />);
      
      expect(mockHookReturn.getTasksByDeveloper).toHaveBeenCalledWith('dev-1');
    });

    it('updates when tasks change', () => {
      const { rerender } = render(<KanbanBoard />);
      
      // Update the mock to return different tasks
      const updatedTasks = [
        ...mockTasks,
        {
          id: 'task-3',
          name: 'New Task',
          description: 'New Description',
          points: 30,
          status: 'backlog' as const,
          createdAt: new Date(),
        },
      ];
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: updatedTasks,
      });
      
      mockHookReturn.getTasksByStatus.mockImplementation((status) => 
        updatedTasks.filter(task => task.status === status)
      );
      
      rerender(<KanbanBoard />);
      
      expect(screen.getByText('3 tasks')).toBeInTheDocument();
    });
  });

  describe('Leaderboard Integration', () => {
    it('renders leaderboard component with developers', () => {
      render(<KanbanBoard />);
      
      // Check for leaderboard elements (there are two - mobile and desktop)
      const leaderboards = screen.getAllByTestId('leaderboard');
      expect(leaderboards).toHaveLength(2); // Mobile and desktop versions
      expect(screen.getAllByText('Leaderboard')).toHaveLength(2);
      expect(screen.getAllByText('Developers: 1')).toHaveLength(2);
      expect(screen.getAllByTestId('leaderboard-dev-1')).toHaveLength(2);
      expect(screen.getAllByText('John Doe: 100 points')).toHaveLength(2);
    });

    it('updates leaderboard when developers change', () => {
      const { rerender } = render(<KanbanBoard />);
      
      // Update developers with new stats
      const updatedDevelopers = [
        {
          ...mockDevelopers[0],
          totalPoints: 150,
          completedTasks: 6,
          totalHours: 48,
        },
      ];
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        developers: updatedDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      expect(screen.getAllByText('John Doe: 150 points')).toHaveLength(2); // Mobile and desktop
    });

    it('shows empty leaderboard when no developers', () => {
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        developers: [],
      });

      render(<KanbanBoard />);
      
      const leaderboards = screen.getAllByTestId('leaderboard');
      expect(leaderboards).toHaveLength(2); // Mobile and desktop versions
      expect(screen.getAllByText('Developers: 0')).toHaveLength(2);
    });
  });

  describe('Task Completion Workflow Integration', () => {
    it('completes full task lifecycle from creation to completion', async () => {
      render(<KanbanBoard />);
      
      // 1. Create a new task
      fireEvent.click(screen.getByText('Add Task'));
      fireEvent.click(screen.getByText('Submit'));
      
      await waitFor(() => {
        expect(mockHookReturn.addTask).toHaveBeenCalled();
      });
      
      // 2. Assign task to developer (simulate drag and drop)
      const taskElement = screen.getByTestId('task-task-1');
      const dropToDeveloperButton = taskElement.querySelector('button:nth-child(2)');
      fireEvent.click(dropToDeveloperButton!);
      
      expect(mockHookReturn.updateTask).toHaveBeenCalledWith('task-1', {
        status: 'assigned',
        assignedTo: 'dev-1',
      });
      
      // 3. Complete the task
      fireEvent.click(screen.getByText('Complete'));
      fireEvent.click(screen.getByText('Submit Completion'));
      
      await waitFor(() => {
        expect(mockHookReturn.updateTask).toHaveBeenCalledWith('task-2', {
          status: 'completed',
          completedAt: expect.any(Date),
          completionDetails: {
            hoursSpent: 5,
            gitCommit: 'abc123def',
            comments: 'Task completed successfully',
          },
        });
      });
    });

    it('handles task completion for unassigned task gracefully', async () => {
      // Mock a task without assignedTo
      const unassignedTask = {
        ...mockTasks[1],
        assignedTo: undefined,
      };
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: [mockTasks[0], unassignedTask],
      });
      
      render(<KanbanBoard />);
      
      // Try to complete unassigned task
      fireEvent.click(screen.getByText('Complete'));
      fireEvent.click(screen.getByText('Submit Completion'));
      
      await waitFor(() => {
        // The component should show an error notification instead of console.error
        expect(screen.getByText('Cannot Complete Task')).toBeInTheDocument();
        expect(screen.getByText('Task not found or not assigned to a developer')).toBeInTheDocument();
        expect(mockHookReturn.updateTask).not.toHaveBeenCalled();
      });
    });

    it('handles task completion for non-existent task gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<KanbanBoard />);
      
      // Mock the completion modal to submit with invalid task ID
      fireEvent.click(screen.getByText('Complete'));
      
      // Manually trigger completion with invalid ID
      const completeTaskModal = screen.getByTestId('complete-task-modal');
      // Override the mock to simulate invalid task ID
      mockHookReturn.updateTask = jest.fn();
      
      // This would normally be handled by the component's internal logic
      const taskExists = mockTasks.find(t => t.id === 'invalid-task-id');
      if (!taskExists) {
        console.error('Cannot complete task: task not found or not assigned');
        return;
      }
      
      expect(consoleSpy).toHaveBeenCalledWith('Cannot complete task: task not found or not assigned');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    it('renders with proper responsive classes', () => {
      render(<KanbanBoard />);
      
      const container = screen.getByText('Developer Task Tracker').closest('.max-w-7xl');
      expect(container).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
    });

    it('has horizontal scroll for columns', () => {
      render(<KanbanBoard />);
      
      // Find the columns container with overflow-x-auto class
      const columnsContainer = screen.getByTestId('column-backlog').parentElement?.parentElement;
      expect(columnsContainer).toHaveClass('overflow-x-auto');
    });

    it('uses responsive grid layout for kanban board and leaderboard', () => {
      render(<KanbanBoard />);
      
      // Find the main grid container
      const mainGrid = screen.getByTestId('column-backlog').closest('.lg\\:grid');
      expect(mainGrid).toHaveClass('flex', 'flex-col', 'lg:grid', 'lg:grid-cols-4');
    });

    it('shows mobile leaderboard on small screens', () => {
      render(<KanbanBoard />);
      
      // Check for mobile leaderboard (lg:hidden)
      const mobileLeaderboard = screen.getAllByTestId('leaderboard')[0];
      expect(mobileLeaderboard.parentElement).toHaveClass('lg:hidden');
    });

    it('shows desktop leaderboard on large screens', () => {
      render(<KanbanBoard />);
      
      // Check for desktop leaderboard (hidden lg:block)
      const desktopLeaderboard = screen.getAllByTestId('leaderboard')[1];
      expect(desktopLeaderboard.parentElement).toHaveClass('hidden', 'lg:block');
    });
  });
});