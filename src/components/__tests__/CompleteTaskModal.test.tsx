import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CompleteTaskModal from '../CompleteTaskModal';
import { Task } from '../../lib/types';

// Mock the utils module
jest.mock('../../lib/utils', () => ({
  validateCompletionForm: jest.fn(),
}));

import { validateCompletionForm } from '../../lib/utils';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
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
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
const mockValidateCompletionForm = validateCompletionForm as jest.MockedFunction<typeof validateCompletionForm>;

describe('CompleteTaskModal', () => {
  const mockTask: Task = {
    id: 'task-1',
    name: 'Test Task',
    description: 'Test task description',
    points: 25,
    status: 'assigned',
    assignedTo: 'dev-1',
    createdAt: new Date('2025-01-01'),
  };

  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  const defaultProps = {
    isOpen: true,
    task: mockTask,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateCompletionForm.mockReturnValue({ isValid: true, errors: [] });
  });

  describe('Rendering', () => {
    it('renders modal when isOpen is true and task is provided', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: 'Complete Task' })).toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByLabelText('Hours Spent *')).toBeInTheDocument();
      expect(screen.getByLabelText('Git Commit Hash *')).toBeInTheDocument();
      expect(screen.getByLabelText('Completion Comments *')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /complete task/i })).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(<CompleteTaskModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Complete Task')).not.toBeInTheDocument();
    });

    it('does not render modal when task is null', () => {
      render(<CompleteTaskModal {...defaultProps} task={null} />);
      
      expect(screen.queryByText('Complete Task')).not.toBeInTheDocument();
    });

    it('displays task information correctly', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('25 points')).toBeInTheDocument();
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('renders form fields with correct attributes', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      const hoursInput = screen.getByLabelText('Hours Spent *');
      expect(hoursInput).toHaveAttribute('type', 'number');
      expect(hoursInput).toHaveAttribute('min', '0.1');
      expect(hoursInput).toHaveAttribute('step', '0.1');
      expect(hoursInput).toHaveAttribute('placeholder', 'Enter hours spent (e.g., 2.5)');
      
      const commitInput = screen.getByLabelText('Git Commit Hash *');
      expect(commitInput).toHaveAttribute('type', 'text');
      expect(commitInput).toHaveAttribute('placeholder', 'Enter git commit hash (e.g., abc123def456)');
      expect(commitInput).toHaveClass('font-mono');
      
      const commentsInput = screen.getByLabelText('Completion Comments *');
      expect(commentsInput).toHaveAttribute('rows', '3');
      expect(commentsInput).toHaveAttribute('placeholder', 'Describe what was accomplished, any challenges faced, or notes for future reference');
    });

    it('shows helper text for git commit field', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      expect(screen.getByText('Provide the commit hash that contains the completed work')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('updates form data when inputs change', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      const hoursInput = screen.getByLabelText('Hours Spent *');
      const commitInput = screen.getByLabelText('Git Commit Hash *');
      const commentsInput = screen.getByLabelText('Completion Comments *');
      
      fireEvent.change(hoursInput, { target: { value: '2.5' } });
      fireEvent.change(commitInput, { target: { value: 'abc123def456' } });
      fireEvent.change(commentsInput, { target: { value: 'Task completed successfully' } });
      
      expect(hoursInput).toHaveValue(2.5);
      expect(commitInput).toHaveValue('abc123def456');
      expect(commentsInput).toHaveValue('Task completed successfully');
    });

    it('handles numeric input for hours field', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      const hoursInput = screen.getByLabelText('Hours Spent *');
      
      fireEvent.change(hoursInput, { target: { value: 'abc' } });
      expect(hoursInput).toHaveValue(null);
      
      fireEvent.change(hoursInput, { target: { value: '3.5' } });
      expect(hoursInput).toHaveValue(3.5);
    });

    it('clears field errors when user starts typing', () => {
      mockValidateCompletionForm.mockReturnValue({
        isValid: false,
        errors: [{ field: 'hoursSpent', message: 'Hours spent must be greater than 0' }],
      });

      render(<CompleteTaskModal {...defaultProps} />);
      
      // Submit form to trigger validation
      fireEvent.click(screen.getByRole('button', { name: /complete task/i }));
      
      expect(screen.getByText('Hours spent must be greater than 0')).toBeInTheDocument();
      
      // Start typing in hours field
      const hoursInput = screen.getByLabelText('Hours Spent *');
      fireEvent.change(hoursInput, { target: { value: '2' } });
      
      expect(screen.queryByText('Hours spent must be greater than 0')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('displays validation errors for invalid form', async () => {
      mockValidateCompletionForm.mockReturnValue({
        isValid: false,
        errors: [
          { field: 'hoursSpent', message: 'Hours spent must be greater than 0' },
          { field: 'gitCommit', message: 'Git commit reference is required' },
          { field: 'comments', message: 'Completion comments are required' },
        ],
      });

      render(<CompleteTaskModal {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /complete task/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Hours spent must be greater than 0')).toBeInTheDocument();
        expect(screen.getByText('Git commit reference is required')).toBeInTheDocument();
        expect(screen.getByText('Completion comments are required')).toBeInTheDocument();
      });
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('applies error styling to invalid fields', async () => {
      mockValidateCompletionForm.mockReturnValue({
        isValid: false,
        errors: [{ field: 'hoursSpent', message: 'Hours spent must be greater than 0' }],
      });

      render(<CompleteTaskModal {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /complete task/i }));
      
      await waitFor(() => {
        const hoursInput = screen.getByLabelText('Hours Spent *');
        expect(hoursInput).toHaveClass('border-red-300', 'bg-red-50');
      });
    });

    it('calls validateCompletionForm with correct data', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText('Hours Spent *'), { target: { value: '2.5' } });
      fireEvent.change(screen.getByLabelText('Git Commit Hash *'), { target: { value: 'abc123def456' } });
      fireEvent.change(screen.getByLabelText('Completion Comments *'), { target: { value: 'Task completed' } });
      
      fireEvent.click(screen.getByRole('button', { name: /complete task/i }));
      
      expect(mockValidateCompletionForm).toHaveBeenCalledWith({
        hoursSpent: 2.5,
        gitCommit: 'abc123def456',
        comments: 'Task completed',
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<CompleteTaskModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText('Hours Spent *'), { target: { value: '2.5' } });
      fireEvent.change(screen.getByLabelText('Git Commit Hash *'), { target: { value: 'abc123def456' } });
      fireEvent.change(screen.getByLabelText('Completion Comments *'), { target: { value: 'Task completed successfully' } });
      
      fireEvent.click(screen.getByRole('button', { name: /complete task/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('task-1', {
          hoursSpent: 2.5,
          gitCommit: 'abc123def456',
          comments: 'Task completed successfully',
        });
      });
    });

    it('shows loading state during submission', async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);
      
      render(<CompleteTaskModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText('Hours Spent *'), { target: { value: '2.5' } });
      fireEvent.change(screen.getByLabelText('Git Commit Hash *'), { target: { value: 'abc123def456' } });
      fireEvent.change(screen.getByLabelText('Completion Comments *'), { target: { value: 'Task completed' } });
      
      fireEvent.click(screen.getByRole('button', { name: /complete task/i }));
      
      expect(screen.getByText('Completing...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /completing/i })).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
      
      resolveSubmit!();
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles submission errors', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Network error'));
      
      render(<CompleteTaskModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText('Hours Spent *'), { target: { value: '2.5' } });
      fireEvent.change(screen.getByLabelText('Git Commit Hash *'), { target: { value: 'abc123def456' } });
      fireEvent.change(screen.getByLabelText('Completion Comments *'), { target: { value: 'Task completed' } });
      
      fireEvent.click(screen.getByRole('button', { name: /complete task/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to complete task. Please try again.')).toBeInTheDocument();
      });
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('resets form after successful submission', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<CompleteTaskModal {...defaultProps} />);
      
      const hoursInput = screen.getByLabelText('Hours Spent *');
      const commitInput = screen.getByLabelText('Git Commit Hash *');
      const commentsInput = screen.getByLabelText('Completion Comments *');
      
      fireEvent.change(hoursInput, { target: { value: '2.5' } });
      fireEvent.change(commitInput, { target: { value: 'abc123def456' } });
      fireEvent.change(commentsInput, { target: { value: 'Task completed' } });
      
      fireEvent.click(screen.getByRole('button', { name: /complete task/i }));
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('does not submit when task is null', () => {
      render(<CompleteTaskModal {...defaultProps} task={null} isOpen={true} />);
      
      // Modal should not render, so no form to submit
      expect(screen.queryByRole('button', { name: /complete task/i })).not.toBeInTheDocument();
    });
  });

  describe('Modal Controls', () => {
    it('closes modal when close button is clicked', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes modal when cancel button is clicked', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes modal when backdrop is clicked', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      const backdrop = document.querySelector('.bg-black.bg-opacity-50');
      fireEvent.click(backdrop!);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets form when modal is closed', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      // Fill form
      fireEvent.change(screen.getByLabelText('Hours Spent *'), { target: { value: '2.5' } });
      fireEvent.change(screen.getByLabelText('Git Commit Hash *'), { target: { value: 'abc123def456' } });
      fireEvent.change(screen.getByLabelText('Completion Comments *'), { target: { value: 'Task completed' } });
      
      // Close modal
      fireEvent.click(screen.getByText('Cancel'));
      
      // Reopen modal
      const { rerender } = render(<CompleteTaskModal {...defaultProps} isOpen={false} />);
      rerender(<CompleteTaskModal {...defaultProps} isOpen={true} />);
      
      // Check form is reset
      expect(screen.getByLabelText('Hours Spent *')).toHaveValue(null);
      expect(screen.getByLabelText('Git Commit Hash *')).toHaveValue('');
      expect(screen.getByLabelText('Completion Comments *')).toHaveValue('');
    });

    it('prevents closing during submission', () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);
      
      render(<CompleteTaskModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText('Hours Spent *'), { target: { value: '2.5' } });
      fireEvent.change(screen.getByLabelText('Git Commit Hash *'), { target: { value: 'abc123def456' } });
      fireEvent.change(screen.getByLabelText('Completion Comments *'), { target: { value: 'Task completed' } });
      
      fireEvent.click(screen.getByRole('button', { name: /complete task/i }));
      
      // Try to close during submission
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.getByText('Cancel')).toBeDisabled();
      
      resolveSubmit!();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and associations', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      expect(screen.getByLabelText('Hours Spent *')).toBeInTheDocument();
      expect(screen.getByLabelText('Git Commit Hash *')).toBeInTheDocument();
      expect(screen.getByLabelText('Completion Comments *')).toBeInTheDocument();
    });

    it('has proper button roles and text', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /complete task/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
    });

    it('manages focus properly', () => {
      render(<CompleteTaskModal {...defaultProps} />);
      
      const hoursInput = screen.getByLabelText('Hours Spent *');
      hoursInput.focus();
      
      expect(document.activeElement).toBe(hoursInput);
    });
  });

  describe('Task Information Display', () => {
    it('displays different task information correctly', () => {
      const differentTask: Task = {
        id: 'task-2',
        name: 'Different Task',
        description: 'Different description',
        points: 50,
        status: 'assigned',
        assignedTo: 'dev-2',
        createdAt: new Date('2025-01-02'),
      };

      render(<CompleteTaskModal {...defaultProps} task={differentTask} />);
      
      expect(screen.getByText('Different Task')).toBeInTheDocument();
      expect(screen.getByText('50 points')).toBeInTheDocument();
    });

    it('handles tasks with zero points', () => {
      const zeroPointTask: Task = {
        ...mockTask,
        points: 0,
      };

      render(<CompleteTaskModal {...defaultProps} task={zeroPointTask} />);
      
      expect(screen.getByText('0 points')).toBeInTheDocument();
    });
  });
});