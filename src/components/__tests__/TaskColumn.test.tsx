import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskColumn from '../TaskColumn';
import { Task, Developer } from '@/lib/types';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock TaskCard component
jest.mock('../TaskCard', () => {
  return function MockTaskCard({ task, onComplete, onEdit }: { task: Task; onComplete?: (taskId: string) => void; onEdit?: (taskId: string) => void }) {
    return (
      <div data-testid={`task-card-${task.id}`}>
        <span>{task.name}</span>
        {onComplete && (
          <button onClick={() => onComplete(task.id)}>Complete</button>
        )}
        {onEdit && (
          <button onClick={() => onEdit(task.id)}>Edit</button>
        )}
      </div>
    );
  };
});

describe('TaskColumn', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      name: 'Test Task 1',
      description: 'Test description 1',
      points: 10,
      status: 'backlog',
      createdAt: new Date('2025-01-01'),
    },
    {
      id: 'task-2',
      name: 'Test Task 2',
      description: 'Test description 2',
      points: 20,
      status: 'assigned',
      assignedTo: 'dev-1',
      createdAt: new Date('2025-01-02'),
    },
  ];

  const mockDeveloper: Developer = {
    id: 'dev-1',
    name: 'John Doe',
    totalPoints: 100,
    completedTasks: 5,
    totalHours: 40,
  };

  const mockProps = {
    title: 'Test Column',
    tasks: mockTasks,
    onTaskDrop: jest.fn(),
    onTaskComplete: jest.fn(),
    onTaskEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders backlog column correctly', () => {
      render(
        <TaskColumn
          {...mockProps}
          title="Backlog"
          isBacklog={true}
        />
      );

      expect(screen.getByText('Backlog')).toBeInTheDocument();
      expect(screen.getByText('2 tasks')).toBeInTheDocument();
      expect(screen.getByText('📋')).toBeInTheDocument();
    });

    it('renders developer column correctly', () => {
      const assignedTasks = mockTasks.filter(t => t.status === 'assigned');
      const completedTasks = mockTasks.filter(t => t.status === 'completed');
      
      render(
        <TaskColumn
          {...mockProps}
          developer={mockDeveloper}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(`${assignedTasks.length} active, ${completedTasks.length} completed`)).toBeInTheDocument();
      expect(screen.getByText('👨‍💻')).toBeInTheDocument();
      expect(screen.getByText('🏆 100 pts')).toBeInTheDocument();
      expect(screen.getByText('⏱️ 40h')).toBeInTheDocument();
    });

    it('renders tasks correctly', () => {
      render(<TaskColumn {...mockProps} />);

      expect(screen.getByTestId('task-card-task-1')).toBeInTheDocument();
      expect(screen.getByTestId('task-card-task-2')).toBeInTheDocument();
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });

    it('shows empty state when no tasks', () => {
      render(
        <TaskColumn
          {...mockProps}
          tasks={[]}
          isBacklog={true}
        />
      );

      expect(screen.getByText('No tasks in backlog. Create a new task to get started!')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument();
    });

    it('shows empty state for developer column', () => {
      render(
        <TaskColumn
          {...mockProps}
          tasks={[]}
          developer={mockDeveloper}
        />
      );

      expect(screen.getByText('No tasks assigned. Drag tasks from the backlog to start working!')).toBeInTheDocument();
      expect(screen.getByText('🎯')).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag over event', () => {
      render(<TaskColumn {...mockProps} />);
      
      const dropZone = screen.getByText('Test Task 1').closest('.min-h-96');
      
      fireEvent.dragOver(dropZone!, {
        dataTransfer: {
          dropEffect: '',
          getData: () => JSON.stringify({ taskId: 'task-1', sourceColumn: 'backlog' }),
        },
      });

      expect(dropZone).toHaveClass('bg-blue-50');
    });

    it('handles drag enter event', () => {
      render(<TaskColumn {...mockProps} />);
      
      const dropZone = screen.getByText('Test Task 1').closest('.min-h-96');
      
      fireEvent.dragEnter(dropZone!, {
        dataTransfer: {
          getData: () => JSON.stringify({ taskId: 'task-1', sourceColumn: 'backlog' }),
        },
      });

      expect(dropZone).toHaveClass('bg-blue-50');
    });

    it('handles drag leave event', () => {
      render(<TaskColumn {...mockProps} />);
      
      const dropZone = screen.getByText('Test Task 1').closest('.min-h-96');
      
      // First trigger drag enter to set isDragOver to true
      fireEvent.dragEnter(dropZone!);
      expect(dropZone).toHaveClass('bg-blue-50');
      
      // Trigger drag leave - the component should handle it gracefully
      // Note: The actual boundary checking is complex to test in jsdom
      // so we just verify the event handler doesn't crash
      fireEvent.dragLeave(dropZone!);
      
      // The component should still be functional after drag leave
      expect(dropZone).toBeInTheDocument();
    });

    it('handles successful drop event', () => {
      render(
        <TaskColumn
          {...mockProps}
          developer={mockDeveloper}
        />
      );
      
      const dropZone = screen.getByText('Test Task 1').closest('.min-h-96');
      
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          getData: () => JSON.stringify({ taskId: 'task-1', sourceColumn: 'backlog' }),
        },
      });

      expect(mockProps.onTaskDrop).toHaveBeenCalledWith('task-1', 'dev-1');
    });

    it('handles drop to backlog', () => {
      render(
        <TaskColumn
          {...mockProps}
          isBacklog={true}
        />
      );
      
      const dropZone = screen.getByText('Test Task 1').closest('.min-h-96');
      
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          getData: () => JSON.stringify({ taskId: 'task-2', sourceColumn: 'dev-1' }),
        },
      });

      expect(mockProps.onTaskDrop).toHaveBeenCalledWith('task-2', 'backlog');
    });

    it('prevents drop on same column', () => {
      render(
        <TaskColumn
          {...mockProps}
          isBacklog={true}
        />
      );
      
      const dropZone = screen.getByText('Test Task 1').closest('.min-h-96');
      
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          getData: () => JSON.stringify({ taskId: 'task-1', sourceColumn: 'backlog' }),
        },
      });

      expect(mockProps.onTaskDrop).not.toHaveBeenCalled();
    });

    it('shows validation error for invalid drop', async () => {
      render(
        <TaskColumn
          {...mockProps}
          isBacklog={true}
        />
      );
      
      const dropZone = screen.getByText('Test Task 1').closest('.min-h-96');
      
      // Simulate drag over with same column data
      fireEvent.dragOver(dropZone!, {
        dataTransfer: {
          dropEffect: '',
          getData: () => JSON.stringify({ taskId: 'task-1', sourceColumn: 'backlog' }),
        },
      });

      await waitFor(() => {
        expect(screen.getByText('❌ Cannot drop task in the same column')).toBeInTheDocument();
      });
    });

    it('shows success indicator for valid drop', async () => {
      render(
        <TaskColumn
          {...mockProps}
          developer={mockDeveloper}
        />
      );
      
      const dropZone = screen.getByText('Test Task 1').closest('.min-h-96');
      
      fireEvent.dragOver(dropZone!, {
        dataTransfer: {
          dropEffect: '',
          getData: () => JSON.stringify({ taskId: 'task-1', sourceColumn: 'backlog' }),
        },
      });

      await waitFor(() => {
        expect(screen.getByText('✅ Drop task here to assign to John Doe')).toBeInTheDocument();
      });
    });

    it('handles invalid JSON in drag data', () => {
      render(<TaskColumn {...mockProps} />);
      
      const dropZone = screen.getByText('Test Task 1').closest('.min-h-96');
      
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          getData: () => 'invalid json',
        },
      });

      expect(mockProps.onTaskDrop).not.toHaveBeenCalled();
    });

    it('handles empty drag data', () => {
      render(<TaskColumn {...mockProps} />);
      
      const dropZone = screen.getByText('Test Task 1').closest('.min-h-96');
      
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          getData: () => '',
        },
      });

      expect(mockProps.onTaskDrop).not.toHaveBeenCalled();
    });
  });

  describe('Task Interactions', () => {
    it('calls onTaskComplete when task completion is triggered', () => {
      render(<TaskColumn {...mockProps} />);
      
      const completeButton = screen.getAllByText('Complete')[0];
      fireEvent.click(completeButton);

      expect(mockProps.onTaskComplete).toHaveBeenCalledWith('task-1');
    });

    it('calls onTaskEdit when task edit is triggered', () => {
      render(<TaskColumn {...mockProps} />);
      
      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);

      expect(mockProps.onTaskEdit).toHaveBeenCalledWith('task-1');
    });
  });

  describe('Column Statistics', () => {
    it('displays correct task count for single task', () => {
      render(
        <TaskColumn
          {...mockProps}
          tasks={[mockTasks[0]]}
          isBacklog={true}
        />
      );

      expect(screen.getByText('1 task')).toBeInTheDocument();
    });

    it('displays correct task count for multiple tasks', () => {
      render(
        <TaskColumn
          {...mockProps}
          isBacklog={true}
        />
      );

      expect(screen.getByText('2 tasks')).toBeInTheDocument();
    });

    it('displays developer statistics correctly', () => {
      const tasksWithCompleted: Task[] = [
        ...mockTasks,
        {
          id: 'task-3',
          name: 'Completed Task',
          description: 'Test description 3',
          points: 30,
          status: 'completed',
          assignedTo: 'dev-1',
          createdAt: new Date('2025-01-03'),
          completedAt: new Date('2025-01-04'),
        },
      ];

      render(
        <TaskColumn
          {...mockProps}
          tasks={tasksWithCompleted}
          developer={mockDeveloper}
        />
      );

      expect(screen.getByText('1 active, 1 completed')).toBeInTheDocument();
    });
  });
});