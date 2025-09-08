/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../TaskCard';
import { Task } from '@/lib/types';

// Mock the utils module
jest.mock('@/lib/utils', () => ({
  formatDate: (date: Date) => date.toLocaleDateString()
}));

describe('TaskCard', () => {
  const mockTask: Task = {
    id: 'task-1',
    name: 'Test Task',
    description: 'This is a test task description',
    points: 25,
    status: 'backlog',
    createdAt: new Date('2025-01-15T10:00:00Z')
  };

  const mockOnComplete = jest.fn();
  const mockOnEdit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task information correctly', () => {
    render(<TaskCard task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('backlog')).toBeInTheDocument();
  });

  it('shows edit button for backlog tasks', () => {
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} />);
    
    const editButton = screen.getByText('Edit Task');
    expect(editButton).toBeInTheDocument();
    
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith('task-1');
  });

  it('shows complete button for assigned tasks', () => {
    const assignedTask: Task = {
      ...mockTask,
      status: 'assigned',
      assignedTo: 'dev-1'
    };

    render(<TaskCard task={assignedTask} onComplete={mockOnComplete} />);
    
    expect(screen.getByText('Assigned to:')).toBeInTheDocument();
    expect(screen.getByText('dev-1')).toBeInTheDocument();
    
    const completeButton = screen.getByText('Complete');
    expect(completeButton).toBeInTheDocument();
    
    fireEvent.click(completeButton);
    expect(mockOnComplete).toHaveBeenCalledWith('task-1');
  });

  it('shows completion details for completed tasks', () => {
    const completedTask: Task = {
      ...mockTask,
      status: 'completed',
      assignedTo: 'dev-1',
      completedAt: new Date('2025-01-16T15:30:00Z'),
      completionDetails: {
        hoursSpent: 8,
        gitCommit: 'abc123def456',
        comments: 'Task completed successfully'
      }
    };

    render(<TaskCard task={completedTask} />);
    
    expect(screen.getByText('Hours: 8h')).toBeInTheDocument();
    expect(screen.getByText('Commit: abc123d')).toBeInTheDocument();
    expect(screen.getByText('"Task completed successfully"')).toBeInTheDocument();
    expect(screen.getByText(/Completed:/)).toBeInTheDocument();
  });

  it('handles drag start event', () => {
    const { container } = render(<TaskCard task={mockTask} />);
    const taskCard = container.firstChild as HTMLElement;
    
    const dragStartEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: {
        setData: jest.fn(),
        effectAllowed: '',
        setDragImage: jest.fn()
      }
    });
    
    fireEvent(taskCard, dragStartEvent);
    
    expect(dragStartEvent.dataTransfer.setData).toHaveBeenCalled();
  });

  it('is not draggable when completed', () => {
    const completedTask: Task = {
      ...mockTask,
      status: 'completed'
    };

    const { container } = render(<TaskCard task={completedTask} />);
    const taskCard = container.firstChild as HTMLElement;
    
    expect(taskCard.getAttribute('draggable')).toBe('false');
  });

  it('applies correct priority colors based on points', () => {
    // High priority (50+ points)
    const highPriorityTask = { ...mockTask, points: 60 };
    const { rerender } = render(<TaskCard task={highPriorityTask} />);
    expect(screen.getByText('60').parentElement).toHaveClass('text-red-600');
    
    // Medium priority (20-49 points)
    const mediumPriorityTask = { ...mockTask, points: 30 };
    rerender(<TaskCard task={mediumPriorityTask} />);
    expect(screen.getByText('30').parentElement).toHaveClass('text-orange-600');
    
    // Low priority (<20 points)
    const lowPriorityTask = { ...mockTask, points: 10 };
    rerender(<TaskCard task={lowPriorityTask} />);
    expect(screen.getByText('10').parentElement).toHaveClass('text-green-600');
  });

  it('applies correct status colors', () => {
    // Backlog status
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('backlog')).toHaveClass('bg-gray-100', 'text-gray-800');
    
    // Assigned status
    const assignedTask = { ...mockTask, status: 'assigned' as const };
    const { rerender } = render(<TaskCard task={assignedTask} />);
    rerender(<TaskCard task={assignedTask} />);
    expect(screen.getByText('assigned')).toHaveClass('bg-blue-100', 'text-blue-800');
    
    // Completed status
    const completedTask = { ...mockTask, status: 'completed' as const };
    rerender(<TaskCard task={completedTask} />);
    expect(screen.getByText('completed')).toHaveClass('bg-green-100', 'text-green-800');
  });
});