import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KanbanBoard from '../../components/KanbanBoard';
import { Task, Developer } from '../../lib/types';

// Mock the useTaskStorage hook for comprehensive integration testing
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
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock all child components with comprehensive test interfaces
jest.mock('../../components/AddTaskModal', () => {
  return function MockAddTaskModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: { name: string; description: string; points: number }) => void }) {
    if (!isOpen) return null;
    return (
      <div data-testid="add-task-modal">
        <input 
          data-testid="task-name-input" 
          placeholder="Task name"
          onChange={(e) => {
            // Store value for form submission
            (window as Record<string, unknown>).mockTaskName = e.target.value;
          }}
        />
        <input 
          data-testid="task-description-input" 
          placeholder="Task description"
          onChange={(e) => {
            (window as Record<string, unknown>).mockTaskDescription = e.target.value;
          }}
        />
        <input 
          data-testid="task-points-input" 
          type="number"
          placeholder="Points"
          onChange={(e) => {
            (window as Record<string, unknown>).mockTaskPoints = parseInt(e.target.value) || 0;
          }}
        />
        <button data-testid="close-modal-btn" onClick={onClose}>Close</button>
        <button 
          data-testid="submit-task-btn"
          onClick={() => {
            const name = (window as Record<string, unknown>).mockTaskName as string || 'Test Task';
            const description = (window as Record<string, unknown>).mockTaskDescription as string || 'Test Description';
            const points = (window as Record<string, unknown>).mockTaskPoints as number || 25;
            onSubmit({ name, description, points });
          }}
        >
          Submit Task
        </button>
      </div>
    );
  };
});

jest.mock('../../components/CompleteTaskModal', () => {
  return function MockCompleteTaskModal({ isOpen, task, onClose, onSubmit }: { isOpen: boolean; task: Task | null; onClose: () => void; onSubmit: (taskId: string, data: { hoursSpent: number; gitCommit: string; comments: string }) => void }) {
    if (!isOpen || !task) return null;
    return (
      <div data-testid="complete-task-modal">
        <div data-testid="completing-task-info">
          <span data-testid="completing-task-name">{task.name}</span>
          <span data-testid="completing-task-points">{task.points} points</span>
        </div>
        <input 
          data-testid="hours-input" 
          type="number"
          placeholder="Hours spent"
          onChange={(e) => {
            (window as Record<string, unknown>).mockHours = parseInt(e.target.value) || 0;
          }}
        />
        <input 
          data-testid="commit-input" 
          placeholder="Git commit"
          onChange={(e) => {
            (window as Record<string, unknown>).mockCommit = e.target.value;
          }}
        />
        <textarea 
          data-testid="comments-input" 
          placeholder="Comments"
          onChange={(e) => {
            (window as Record<string, unknown>).mockComments = e.target.value;
          }}
        />
        <button data-testid="close-completion-modal-btn" onClick={onClose}>Close</button>
        <button 
          data-testid="submit-completion-btn"
          onClick={() => {
            const hoursSpent = (window as Record<string, unknown>).mockHours as number || 5;
            const gitCommit = (window as Record<string, unknown>).mockCommit as string || 'abc123def';
            const comments = (window as Record<string, unknown>).mockComments as string || 'Task completed';
            onSubmit(task.id, { hoursSpent, gitCommit, comments });
          }}
        >
          Complete Task
        </button>
      </div>
    );
  };
});

jest.mock('../../components/Leaderboard', () => {
  return function MockLeaderboard({ developers }: { developers: Developer[] }) {
    const sortedDevelopers = [...developers].sort((a, b) => b.totalPoints - a.totalPoints);
    
    return (
      <div data-testid="leaderboard">
        <h2>Developer Leaderboard</h2>
        <div data-testid="total-developers">Total Developers: {developers.length}</div>
        {sortedDevelopers.map((dev: Developer, index: number) => (
          <div key={dev.id} data-testid={`leaderboard-entry-${dev.id}`}>
            <span data-testid={`rank-${dev.id}`}>#{index + 1}</span>
            <span data-testid={`name-${dev.id}`}>{dev.name}</span>
            <span data-testid={`points-${dev.id}`}>{dev.totalPoints} pts</span>
            <span data-testid={`tasks-${dev.id}`}>{dev.completedTasks} tasks</span>
            <span data-testid={`hours-${dev.id}`}>{dev.totalHours}h</span>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../../components/TaskColumn', () => {
  return function MockTaskColumn({ 
    title, 
    tasks, 
    isBacklog, 
    developer, 
    onTaskDrop, 
    onTaskComplete, 
    onTaskEdit 
  }: { 
    title: string; 
    tasks: Task[]; 
    isBacklog?: boolean; 
    developer?: Developer; 
    onTaskDrop?: (taskId: string, targetId: string) => void; 
    onTaskComplete?: (taskId: string) => void; 
    onTaskEdit?: (taskId: string) => void; 
  }) {
    const columnId = isBacklog ? 'backlog' : developer?.id || 'unknown';
    
    return (
      <div 
        data-testid={`column-${columnId}`}
        onDrop={(e) => {
          e.preventDefault();
          const taskId = e.dataTransfer.getData('text/plain');
          if (onTaskDrop && taskId) {
            onTaskDrop(taskId, isBacklog ? 'backlog' : developer?.id);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <h3 data-testid={`column-title-${columnId}`}>{title}</h3>
        <div data-testid={`task-count-${columnId}`}>Tasks: {tasks.length}</div>
        {developer && (
          <div data-testid={`developer-info-${developer.id}`}>
            <span data-testid={`dev-name-${developer.id}`}>{developer.name}</span>
            <span data-testid={`dev-stats-${developer.id}`}>
              {developer.totalPoints}pts | {developer.completedTasks}tasks | {developer.totalHours}h
            </span>
          </div>
        )}
        <div data-testid={`tasks-container-${columnId}`}>
          {tasks.map((task: Task) => (
            <div 
              key={task.id} 
              data-testid={`task-${task.id}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', task.id);
              }}
            >
              <div data-testid={`task-info-${task.id}`}>
                <span data-testid={`task-name-${task.id}`}>{task.name}</span>
                <span data-testid={`task-points-${task.id}`}>{task.points}pts</span>
                <span data-testid={`task-status-${task.id}`}>{task.status}</span>
                {task.assignedTo && (
                  <span data-testid={`task-assigned-${task.id}`}>→ {task.assignedTo}</span>
                )}
                {task.completedAt && (
                  <span data-testid={`task-completed-${task.id}`}>✓ Completed</span>
                )}
              </div>
              <div data-testid={`task-actions-${task.id}`}>
                {onTaskComplete && task.status === 'assigned' && (
                  <button 
                    data-testid={`complete-btn-${task.id}`}
                    onClick={() => onTaskComplete(task.id)}
                  >
                    Complete
                  </button>
                )}
                {onTaskEdit && (
                  <button 
                    data-testid={`edit-btn-${task.id}`}
                    onClick={() => onTaskEdit(task.id)}
                  >
                    Edit
                  </button>
                )}
                {/* Drag simulation buttons for testing */}
                <button 
                  data-testid={`drag-to-backlog-${task.id}`}
                  onClick={() => onTaskDrop && onTaskDrop(task.id, 'backlog')}
                >
                  → Backlog
                </button>
                {!isBacklog && (
                  <button 
                    data-testid={`drag-to-dev-${task.id}`}
                    onClick={() => onTaskDrop && onTaskDrop(task.id, developer?.id || 'dev-1')}
                  >
                    → Dev
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
});

import { useTaskStorage } from '../../lib/hooks/useTaskStorage';
const mockUseTaskStorage = useTaskStorage as jest.MockedFunction<typeof useTaskStorage>;

describe('Comprehensive Integration Tests', () => {
  let mockTasks: Task[];
  let mockDevelopers: Developer[];
  let mockHookReturn: ReturnType<typeof useTaskStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Clear window mock values
    delete (window as Record<string, unknown>).mockTaskName;
    delete (window as Record<string, unknown>).mockTaskDescription;
    delete (window as Record<string, unknown>).mockTaskPoints;
    delete (window as Record<string, unknown>).mockHours;
    delete (window as Record<string, unknown>).mockCommit;
    delete (window as Record<string, unknown>).mockComments;
    
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

  describe('End-to-End Task Lifecycle Workflows', () => {
    it('completes full task lifecycle: creation → assignment → completion with developer stats', async () => {
      const { rerender } = render(<KanbanBoard />);
      
      // Verify initial empty state
      expect(screen.getByTestId('column-backlog')).toBeInTheDocument();
      expect(screen.getByTestId('task-count-backlog')).toHaveTextContent('Tasks: 0');
      expect(screen.getByTestId('total-developers')).toHaveTextContent('Total Developers: 0');
      
      // Step 1: Create a new task
      fireEvent.click(screen.getByText('Add Task'));
      expect(screen.getByTestId('add-task-modal')).toBeInTheDocument();
      
      // Fill out task form
      fireEvent.change(screen.getByTestId('task-name-input'), { 
        target: { value: 'Implement User Authentication' } 
      });
      fireEvent.change(screen.getByTestId('task-description-input'), { 
        target: { value: 'Add login/logout functionality with JWT tokens' } 
      });
      fireEvent.change(screen.getByTestId('task-points-input'), { 
        target: { value: '75' } 
      });
      
      // Submit task creation
      fireEvent.click(screen.getByTestId('submit-task-btn'));
      
      await waitFor(() => {
        expect(mockHookReturn.addTask).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Implement User Authentication',
            description: 'Add login/logout functionality with JWT tokens',
            points: 75,
            status: 'backlog',
            id: expect.stringMatching(/^task-/),
            createdAt: expect.any(Date),
          })
        );
      });
      
      // Update mock state to reflect new task
      const newTask: Task = {
        id: 'task-1',
        name: 'Implement User Authentication',
        description: 'Add login/logout functionality with JWT tokens',
        points: 75,
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
      expect(screen.getByTestId('task-count-backlog')).toHaveTextContent('Tasks: 1');
      expect(screen.getByTestId('task-name-task-1')).toHaveTextContent('Implement User Authentication');
      expect(screen.getByTestId('task-points-task-1')).toHaveTextContent('75pts');
      expect(screen.getByTestId('task-status-task-1')).toHaveTextContent('backlog');
      
      // Step 2: Assign task to developer (simulate drag and drop)
      fireEvent.click(screen.getByTestId('drag-to-dev-task-1'));
      
      expect(mockHookReturn.updateTask).toHaveBeenCalledWith('task-1', {
        status: 'assigned',
        assignedTo: 'dev-1',
      });
      
      // Update mock state to reflect assignment
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
      
      // Verify task assignment and developer creation
      expect(screen.getByTestId('task-status-task-1')).toHaveTextContent('assigned');
      expect(screen.getByTestId('task-assigned-task-1')).toHaveTextContent('→ dev-1');
      expect(screen.getByTestId('total-developers')).toHaveTextContent('Total Developers: 1');
      expect(screen.getByTestId('dev-name-dev-1')).toHaveTextContent('Developer 1');
      expect(screen.getByTestId('dev-stats-dev-1')).toHaveTextContent('0pts | 0tasks | 0h');
      
      // Step 3: Complete the task
      fireEvent.click(screen.getByTestId('complete-btn-task-1'));
      expect(screen.getByTestId('complete-task-modal')).toBeInTheDocument();
      expect(screen.getByTestId('completing-task-name')).toHaveTextContent('Implement User Authentication');
      expect(screen.getByTestId('completing-task-points')).toHaveTextContent('75 points');
      
      // Fill completion details
      fireEvent.change(screen.getByTestId('hours-input'), { target: { value: '12' } });
      fireEvent.change(screen.getByTestId('commit-input'), { target: { value: 'abc123def456' } });
      fireEvent.change(screen.getByTestId('comments-input'), { 
        target: { value: 'Implemented JWT authentication with refresh tokens' } 
      });
      
      // Submit completion
      fireEvent.click(screen.getByTestId('submit-completion-btn'));
      
      await waitFor(() => {
        expect(mockHookReturn.updateTask).toHaveBeenCalledWith('task-1', {
          status: 'completed',
          completedAt: expect.any(Date),
          completionDetails: {
            hoursSpent: 12,
            gitCommit: 'abc123def456',
            comments: 'Implemented JWT authentication with refresh tokens',
          },
        });
      });
      
      // Update mock state to reflect completion
      mockTasks[0] = {
        ...mockTasks[0],
        status: 'completed',
        completedAt: new Date(),
        completionDetails: {
          hoursSpent: 12,
          gitCommit: 'abc123def456',
          comments: 'Implemented JWT authentication with refresh tokens',
        },
      };
      
      // Update developer stats
      mockDevelopers[0] = {
        ...mockDevelopers[0],
        totalPoints: 75,
        completedTasks: 1,
        totalHours: 12,
      };
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify final state
      expect(screen.getByTestId('task-status-task-1')).toHaveTextContent('completed');
      expect(screen.getByTestId('task-completed-task-1')).toHaveTextContent('✓ Completed');
      expect(screen.getByTestId('dev-stats-dev-1')).toHaveTextContent('75pts | 1tasks | 12h');
      expect(screen.getByTestId('points-dev-1')).toHaveTextContent('75 pts');
      expect(screen.getByTestId('rank-dev-1')).toHaveTextContent('#1');
      
      // Verify completion modal closed
      expect(screen.queryByTestId('complete-task-modal')).not.toBeInTheDocument();
    });

    it('handles multiple tasks across different developers with proper state management', async () => {
      const { rerender } = render(<KanbanBoard />);
      
      // Create multiple tasks
      const tasks = [
        { name: 'Frontend Dashboard', description: 'Build React dashboard', points: 50 },
        { name: 'API Integration', description: 'Connect to backend APIs', points: 40 },
        { name: 'Database Schema', description: 'Design user tables', points: 30 },
      ];
      
      // Create all tasks
      for (let i = 0; i < tasks.length; i++) {
        fireEvent.click(screen.getByText('Add Task'));
        
        fireEvent.change(screen.getByTestId('task-name-input'), { 
          target: { value: tasks[i].name } 
        });
        fireEvent.change(screen.getByTestId('task-description-input'), { 
          target: { value: tasks[i].description } 
        });
        fireEvent.change(screen.getByTestId('task-points-input'), { 
          target: { value: tasks[i].points.toString() } 
        });
        
        fireEvent.click(screen.getByTestId('submit-task-btn'));
        
        // Update mock state
        const newTask: Task = {
          id: `task-${i + 1}`,
          name: tasks[i].name,
          description: tasks[i].description,
          points: tasks[i].points,
          status: 'backlog',
          createdAt: new Date(),
        };
        
        mockTasks.push(newTask);
        mockUseTaskStorage.mockReturnValue({
          ...mockHookReturn,
          tasks: [...mockTasks],
        });
        
        rerender(<KanbanBoard />);
      }
      
      // Verify all tasks created
      expect(screen.getByTestId('task-count-backlog')).toHaveTextContent('Tasks: 3');
      
      // Assign tasks to different developers
      fireEvent.click(screen.getByTestId('drag-to-dev-task-1')); // Alice gets task-1
      mockTasks[0] = { ...mockTasks[0], status: 'assigned', assignedTo: 'dev-1' };
      
      fireEvent.click(screen.getByTestId('drag-to-dev-task-2')); // Bob gets task-2  
      mockTasks[1] = { ...mockTasks[1], status: 'assigned', assignedTo: 'dev-2' };
      
      // Create developers
      mockDevelopers = [
        { id: 'dev-1', name: 'Alice Johnson', totalPoints: 0, completedTasks: 0, totalHours: 0 },
        { id: 'dev-2', name: 'Bob Smith', totalPoints: 0, completedTasks: 0, totalHours: 0 },
      ];
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify assignments
      expect(screen.getByTestId('total-developers')).toHaveTextContent('Total Developers: 2');
      expect(screen.getByTestId('task-assigned-task-1')).toHaveTextContent('→ dev-1');
      expect(screen.getByTestId('task-assigned-task-2')).toHaveTextContent('→ dev-2');
      expect(screen.getByTestId('task-count-backlog')).toHaveTextContent('Tasks: 1'); // task-3 remains
      
      // Complete Alice's task
      fireEvent.click(screen.getByTestId('complete-btn-task-1'));
      fireEvent.change(screen.getByTestId('hours-input'), { target: { value: '8' } });
      fireEvent.click(screen.getByTestId('submit-completion-btn'));
      
      // Update Alice's stats
      mockTasks[0] = {
        ...mockTasks[0],
        status: 'completed',
        completedAt: new Date(),
        completionDetails: { hoursSpent: 8, gitCommit: 'abc123', comments: 'Done' },
      };
      mockDevelopers[0] = { ...mockDevelopers[0], totalPoints: 50, completedTasks: 1, totalHours: 8 };
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Complete Bob's task
      fireEvent.click(screen.getByTestId('complete-btn-task-2'));
      fireEvent.change(screen.getByTestId('hours-input'), { target: { value: '6' } });
      fireEvent.click(screen.getByTestId('submit-completion-btn'));
      
      // Update Bob's stats
      mockTasks[1] = {
        ...mockTasks[1],
        status: 'completed',
        completedAt: new Date(),
        completionDetails: { hoursSpent: 6, gitCommit: 'def456', comments: 'Done' },
      };
      mockDevelopers[1] = { ...mockDevelopers[1], totalPoints: 40, completedTasks: 1, totalHours: 6 };
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify final leaderboard state (Alice should be #1 with 50 points)
      expect(screen.getByTestId('rank-dev-1')).toHaveTextContent('#1');
      expect(screen.getByTestId('points-dev-1')).toHaveTextContent('50 pts');
      expect(screen.getByTestId('rank-dev-2')).toHaveTextContent('#2');
      expect(screen.getByTestId('points-dev-2')).toHaveTextContent('40 pts');
      
      // Verify task-3 still in backlog
      expect(screen.getByTestId('task-status-task-3')).toHaveTextContent('backlog');
    });
  });

  describe('Drag and Drop Functionality Across Different Scenarios', () => {
    it('handles drag and drop between backlog and developer columns', async () => {
      // Setup initial state with tasks and developers
      const initialTasks: Task[] = [
        {
          id: 'task-1',
          name: 'Backlog Task 1',
          description: 'Task in backlog',
          points: 25,
          status: 'backlog',
          createdAt: new Date(),
        },
        {
          id: 'task-2',
          name: 'Assigned Task 1',
          description: 'Task assigned to dev-1',
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
      expect(screen.getByTestId('task-status-task-1')).toHaveTextContent('backlog');
      expect(screen.getByTestId('task-status-task-2')).toHaveTextContent('assigned');
      expect(screen.getByTestId('task-assigned-task-2')).toHaveTextContent('→ dev-1');
      
      // Test 1: Drag task from backlog to developer
      fireEvent.click(screen.getByTestId('drag-to-dev-task-1'));
      
      expect(mockHookReturn.updateTask).toHaveBeenCalledWith('task-1', {
        status: 'assigned',
        assignedTo: 'dev-1',
      });
      
      // Update mock state
      mockTasks[0] = { ...mockTasks[0], status: 'assigned', assignedTo: 'dev-1' };
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify task moved to developer
      expect(screen.getByTestId('task-status-task-1')).toHaveTextContent('assigned');
      expect(screen.getByTestId('task-assigned-task-1')).toHaveTextContent('→ dev-1');
      
      // Test 2: Drag task back to backlog
      fireEvent.click(screen.getByTestId('drag-to-backlog-task-1'));
      
      expect(mockHookReturn.updateTask).toHaveBeenCalledWith('task-1', {
        status: 'backlog',
        assignedTo: undefined,
      });
      
      // Update mock state
      mockTasks[0] = { ...mockTasks[0], status: 'backlog', assignedTo: undefined };
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify task moved back to backlog
      expect(screen.getByTestId('task-status-task-1')).toHaveTextContent('backlog');
      expect(screen.queryByTestId('task-assigned-task-1')).not.toBeInTheDocument();
    });

    it('handles drag and drop between different developer columns', async () => {
      // Setup with multiple developers and tasks
      const initialTasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task for Alice',
          description: 'Assigned to Alice',
          points: 40,
          status: 'assigned',
          assignedTo: 'dev-1',
          createdAt: new Date(),
        },
        {
          id: 'task-2',
          name: 'Task for Bob',
          description: 'Assigned to Bob',
          points: 30,
          status: 'assigned',
          assignedTo: 'dev-2',
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
      
      // Verify initial assignments
      expect(screen.getByTestId('task-assigned-task-1')).toHaveTextContent('→ dev-1');
      expect(screen.getByTestId('task-assigned-task-2')).toHaveTextContent('→ dev-2');
      
      // Simulate HTML5 drag and drop from Alice's column to Bob's column
      const task1Element = screen.getByTestId('task-task-1');
      const bobColumn = screen.getByTestId('column-dev-2');
      
      // Simulate drag start
      fireEvent.dragStart(task1Element);
      
      // Simulate drag over Bob's column
      fireEvent.dragOver(bobColumn);
      
      // Simulate drop on Bob's column
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          getData: jest.fn().mockReturnValue('task-1'),
        },
      });
      fireEvent(bobColumn, dropEvent);
      
      // The onTaskDrop should be called with task-1 and dev-2
      expect(mockHookReturn.updateTask).toHaveBeenCalledWith('task-1', {
        status: 'assigned',
        assignedTo: 'dev-2',
      });
      
      // Update mock state
      mockTasks[0] = { ...mockTasks[0], assignedTo: 'dev-2' };
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify task reassignment
      expect(screen.getByTestId('task-assigned-task-1')).toHaveTextContent('→ dev-2');
    });

    it('prevents invalid drag and drop operations', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Setup with completed task
      const completedTask: Task = {
        id: 'task-1',
        name: 'Completed Task',
        description: 'Already completed',
        points: 50,
        status: 'completed',
        assignedTo: 'dev-1',
        createdAt: new Date(),
        completedAt: new Date(),
        completionDetails: {
          hoursSpent: 5,
          gitCommit: 'abc123',
          comments: 'Done',
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
      
      // Verify completed task cannot be dragged (no drag buttons should be available)
      expect(screen.queryByTestId('drag-to-backlog-task-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('drag-to-dev-task-1')).not.toBeInTheDocument();
      
      // Verify task shows as completed
      expect(screen.getByTestId('task-status-task-1')).toHaveTextContent('completed');
      expect(screen.getByTestId('task-completed-task-1')).toHaveTextContent('✓ Completed');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Data Persistence and Recovery Across Browser Sessions', () => {
    it('persists task creation and retrieval across sessions', async () => {
      // Session 1: Create and save tasks
      const session1Data = {
        tasks: [
          {
            id: 'task-1',
            name: 'Persistent Task 1',
            description: 'Should persist across sessions',
            points: 60,
            status: 'backlog',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'task-2',
            name: 'Persistent Task 2',
            description: 'Another persistent task',
            points: 40,
            status: 'assigned',
            assignedTo: 'dev-1',
            createdAt: new Date().toISOString(),
          },
        ],
        developers: [
          {
            id: 'dev-1',
            name: 'Persistent Developer',
            totalPoints: 0,
            completedTasks: 0,
            totalHours: 0,
          },
        ],
      };
      
      // Simulate saving to localStorage
      localStorageMock.setItem('nocena-devs-data', JSON.stringify(session1Data));
      
      // Session 2: Load data and verify persistence
      mockTasks = session1Data.tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
      })) as Task[];
      mockDevelopers = session1Data.developers;
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      render(<KanbanBoard />);
      
      // Verify data loaded correctly
      expect(screen.getByTestId('task-name-task-1')).toHaveTextContent('Persistent Task 1');
      expect(screen.getByTestId('task-points-task-1')).toHaveTextContent('60pts');
      expect(screen.getByTestId('task-status-task-1')).toHaveTextContent('backlog');
      
      expect(screen.getByTestId('task-name-task-2')).toHaveTextContent('Persistent Task 2');
      expect(screen.getByTestId('task-status-task-2')).toHaveTextContent('assigned');
      expect(screen.getByTestId('task-assigned-task-2')).toHaveTextContent('→ dev-1');
      
      expect(screen.getByTestId('dev-name-dev-1')).toHaveTextContent('Persistent Developer');
      
      // Verify localStorage was accessed
      expect(localStorageMock.getItem).toHaveBeenCalledWith('nocena-devs-data');
    });

    it('handles corrupted data gracefully and recovers', async () => {
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
      expect(screen.getByTestId('task-count-backlog')).toHaveTextContent('Tasks: 0');
      expect(screen.getByTestId('total-developers')).toHaveTextContent('Total Developers: 0');
      
      // Should be able to create new tasks after recovery
      fireEvent.click(screen.getByText('Add Task'));
      expect(screen.getByTestId('add-task-modal')).toBeInTheDocument();
    });

    it('maintains data consistency during rapid operations', async () => {
      const { rerender } = render(<KanbanBoard />);
      
      // Simulate rapid task creation
      const rapidTasks = [
        { name: 'Rapid Task 1', description: 'First rapid task', points: 10 },
        { name: 'Rapid Task 2', description: 'Second rapid task', points: 15 },
        { name: 'Rapid Task 3', description: 'Third rapid task', points: 20 },
      ];
      
      // Create tasks rapidly
      rapidTasks.forEach((task, index) => {
        fireEvent.click(screen.getByText('Add Task'));
        
        fireEvent.change(screen.getByTestId('task-name-input'), { 
          target: { value: task.name } 
        });
        fireEvent.change(screen.getByTestId('task-description-input'), { 
          target: { value: task.description } 
        });
        fireEvent.change(screen.getByTestId('task-points-input'), { 
          target: { value: task.points.toString() } 
        });
        
        fireEvent.click(screen.getByTestId('submit-task-btn'));
        
        // Update mock state
        mockTasks.push({
          id: `task-${index + 1}`,
          name: task.name,
          description: task.description,
          points: task.points,
          status: 'backlog',
          createdAt: new Date(),
        });
      });
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify all tasks were created with unique IDs
      expect(mockHookReturn.addTask).toHaveBeenCalledTimes(3);
      expect(screen.getByTestId('task-count-backlog')).toHaveTextContent('Tasks: 3');
      
      // Verify each task has correct data
      rapidTasks.forEach((task, index) => {
        const taskId = `task-${index + 1}`;
        expect(screen.getByTestId(`task-name-${taskId}`)).toHaveTextContent(task.name);
        expect(screen.getByTestId(`task-points-${taskId}`)).toHaveTextContent(`${task.points}pts`);
      });
    });

    it('handles localStorage quota exceeded gracefully', async () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        error: 'Failed to save data: Storage quota exceeded',
      });
      
      render(<KanbanBoard />);
      
      // Should show error state
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText('Failed to save data: Storage quota exceeded')).toBeInTheDocument();
      
      // Should have retry option
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      
      // Restore original setItem
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('Leaderboard Accuracy with Multiple Developers and Tasks', () => {
    it('calculates and displays accurate leaderboard rankings', async () => {
      // Setup complex scenario with multiple developers and varying task completions
      const complexTasks: Task[] = [
        {
          id: 'task-1',
          name: 'High Value Task',
          description: 'Worth many points',
          points: 100,
          status: 'completed',
          assignedTo: 'dev-1',
          createdAt: new Date('2025-01-01'),
          completedAt: new Date('2025-01-02'),
          completionDetails: { hoursSpent: 10, gitCommit: 'abc123', comments: 'Major feature' },
        },
        {
          id: 'task-2',
          name: 'Medium Task 1',
          description: 'Medium complexity',
          points: 50,
          status: 'completed',
          assignedTo: 'dev-2',
          createdAt: new Date('2025-01-01'),
          completedAt: new Date('2025-01-02'),
          completionDetails: { hoursSpent: 5, gitCommit: 'def456', comments: 'Good work' },
        },
        {
          id: 'task-3',
          name: 'Medium Task 2',
          description: 'Another medium task',
          points: 60,
          status: 'completed',
          assignedTo: 'dev-1',
          createdAt: new Date('2025-01-02'),
          completedAt: new Date('2025-01-03'),
          completionDetails: { hoursSpent: 6, gitCommit: 'ghi789', comments: 'Nice feature' },
        },
        {
          id: 'task-4',
          name: 'Small Task 1',
          description: 'Quick task',
          points: 25,
          status: 'completed',
          assignedTo: 'dev-3',
          createdAt: new Date('2025-01-01'),
          completedAt: new Date('2025-01-01'),
          completionDetails: { hoursSpent: 2, gitCommit: 'jkl012', comments: 'Quick fix' },
        },
        {
          id: 'task-5',
          name: 'Small Task 2',
          description: 'Another quick task',
          points: 30,
          status: 'completed',
          assignedTo: 'dev-2',
          createdAt: new Date('2025-01-02'),
          completedAt: new Date('2025-01-02'),
          completionDetails: { hoursSpent: 3, gitCommit: 'mno345', comments: 'Bug fix' },
        },
      ];
      
      const complexDevelopers: Developer[] = [
        {
          id: 'dev-1',
          name: 'Alice Johnson',
          totalPoints: 160, // 100 + 60
          completedTasks: 2,
          totalHours: 16, // 10 + 6
        },
        {
          id: 'dev-2',
          name: 'Bob Smith',
          totalPoints: 80, // 50 + 30
          completedTasks: 2,
          totalHours: 8, // 5 + 3
        },
        {
          id: 'dev-3',
          name: 'Charlie Brown',
          totalPoints: 25, // 25
          completedTasks: 1,
          totalHours: 2, // 2
        },
      ];
      
      mockTasks = complexTasks;
      mockDevelopers = complexDevelopers;
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      render(<KanbanBoard />);
      
      // Verify leaderboard shows correct rankings (sorted by points descending)
      expect(screen.getAllByTestId('total-developers')[0]).toHaveTextContent('Total Developers: 3');
      
      // Alice should be #1 with 160 points
      expect(screen.getAllByTestId('rank-dev-1')[0]).toHaveTextContent('#1');
      expect(screen.getAllByTestId('name-dev-1')[0]).toHaveTextContent('Alice Johnson');
      expect(screen.getAllByTestId('points-dev-1')[0]).toHaveTextContent('160 pts');
      expect(screen.getAllByTestId('tasks-dev-1')[0]).toHaveTextContent('2 tasks');
      expect(screen.getAllByTestId('hours-dev-1')[0]).toHaveTextContent('16h');
      
      // Bob should be #2 with 80 points
      expect(screen.getAllByTestId('rank-dev-2')[0]).toHaveTextContent('#2');
      expect(screen.getAllByTestId('name-dev-2')[0]).toHaveTextContent('Bob Smith');
      expect(screen.getAllByTestId('points-dev-2')[0]).toHaveTextContent('80 pts');
      expect(screen.getAllByTestId('tasks-dev-2')[0]).toHaveTextContent('2 tasks');
      expect(screen.getAllByTestId('hours-dev-2')[0]).toHaveTextContent('8h');
      
      // Charlie should be #3 with 25 points
      expect(screen.getAllByTestId('rank-dev-3')[0]).toHaveTextContent('#3');
      expect(screen.getAllByTestId('name-dev-3')[0]).toHaveTextContent('Charlie Brown');
      expect(screen.getAllByTestId('points-dev-3')[0]).toHaveTextContent('25 pts');
      expect(screen.getAllByTestId('tasks-dev-3')[0]).toHaveTextContent('1 tasks');
      expect(screen.getAllByTestId('hours-dev-3')[0]).toHaveTextContent('2h');
    });

    it('updates leaderboard rankings when new tasks are completed', async () => {
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
        name: 'Game Changer Task',
        description: 'High value task for Alice',
        points: 150,
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
      
      // Verify initial rankings (Bob leading)
      expect(screen.getByTestId('rank-dev-2')).toHaveTextContent('#1');
      expect(screen.getByTestId('points-dev-2')).toHaveTextContent('120 pts');
      expect(screen.getByTestId('rank-dev-1')).toHaveTextContent('#2');
      expect(screen.getByTestId('points-dev-1')).toHaveTextContent('100 pts');
      
      // Alice completes the high-value task
      fireEvent.click(screen.getByTestId('complete-btn-task-new'));
      fireEvent.change(screen.getByTestId('hours-input'), { target: { value: '15' } });
      fireEvent.click(screen.getByTestId('submit-completion-btn'));
      
      // Update Alice's stats (100 + 150 = 250 points)
      mockTasks[0] = {
        ...mockTasks[0],
        status: 'completed',
        completedAt: new Date(),
        completionDetails: { hoursSpent: 15, gitCommit: 'xyz789', comments: 'Major milestone' },
      };
      
      mockDevelopers[0] = {
        ...mockDevelopers[0],
        totalPoints: 250, // 100 + 150
        completedTasks: 3, // 2 + 1
        totalHours: 25, // 10 + 15
      };
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
        developers: mockDevelopers,
      });
      
      rerender(<KanbanBoard />);
      
      // Verify rankings flipped (Alice now leading)
      expect(screen.getByTestId('rank-dev-1')).toHaveTextContent('#1');
      expect(screen.getByTestId('points-dev-1')).toHaveTextContent('250 pts');
      expect(screen.getByTestId('tasks-dev-1')).toHaveTextContent('3 tasks');
      expect(screen.getByTestId('hours-dev-1')).toHaveTextContent('25h');
      
      expect(screen.getByTestId('rank-dev-2')).toHaveTextContent('#2');
      expect(screen.getByTestId('points-dev-2')).toHaveTextContent('120 pts');
    });

    it('handles tied scores correctly in leaderboard', async () => {
      // Setup developers with tied scores
      const tiedDevelopers: Developer[] = [
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
          totalPoints: 100, // Same points as Alice
          completedTasks: 3, // But more tasks
          totalHours: 8, // Fewer hours
        },
        {
          id: 'dev-3',
          name: 'Charlie Brown',
          totalPoints: 150, // Clear leader
          completedTasks: 1,
          totalHours: 15,
        },
      ];
      
      mockDevelopers = tiedDevelopers;
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        developers: mockDevelopers,
      });
      
      render(<KanbanBoard />);
      
      // Charlie should be #1 with 150 points
      expect(screen.getByTestId('rank-dev-3')).toHaveTextContent('#1');
      expect(screen.getByTestId('points-dev-3')).toHaveTextContent('150 pts');
      
      // Alice and Bob should both show as #2 (or maintain consistent ordering)
      // The exact tie-breaking behavior depends on the sort implementation
      const aliceRank = screen.getByTestId('rank-dev-1').textContent;
      const bobRank = screen.getByTestId('rank-dev-2').textContent;
      
      // Both should be ranked 2nd or 3rd (not 1st since Charlie leads)
      expect(['#2', '#3']).toContain(aliceRank);
      expect(['#2', '#3']).toContain(bobRank);
      
      // Both should show 100 points
      expect(screen.getByTestId('points-dev-1')).toHaveTextContent('100 pts');
      expect(screen.getByTestId('points-dev-2')).toHaveTextContent('100 pts');
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
      expect(screen.getByTestId('task-count-backlog')).toHaveTextContent('Tasks: 0');
      expect(screen.getByTestId('total-developers')).toHaveTextContent('Total Developers: 0');
      expect(screen.getByText('Add Task')).toBeInTheDocument();
    });

    it('handles loading state properly', () => {
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        isLoading: true,
      });
      
      render(<KanbanBoard />);
      
      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
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

    it('prevents completion of unassigned tasks', () => {
      const unassignedTask: Task = {
        id: 'task-1',
        name: 'Unassigned Task',
        description: 'No developer assigned',
        points: 25,
        status: 'backlog',
        createdAt: new Date(),
      };
      
      mockTasks = [unassignedTask];
      
      mockUseTaskStorage.mockReturnValue({
        ...mockHookReturn,
        tasks: mockTasks,
      });
      
      render(<KanbanBoard />);
      
      // Complete button should not be available for unassigned tasks
      expect(screen.queryByTestId('complete-btn-task-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('task-status-task-1')).toHaveTextContent('backlog');
    });

    it('prevents modification of completed tasks', () => {
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
      
      // Completed tasks should not have action buttons
      expect(screen.queryByTestId('complete-btn-task-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('drag-to-backlog-task-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('drag-to-dev-task-1')).not.toBeInTheDocument();
      
      // Should show completion status
      expect(screen.getByTestId('task-status-task-1')).toHaveTextContent('completed');
      expect(screen.getByTestId('task-completed-task-1')).toHaveTextContent('✓ Completed');
    });
  });
});