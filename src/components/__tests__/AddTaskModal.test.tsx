import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddTaskModal from '../AddTaskModal';
// import { TaskFormData } from '../../lib/types';

// Mock the utils module
jest.mock('../../lib/utils', () => ({
  validateTaskForm: jest.fn(),
}));

import { validateTaskForm } from '../../lib/utils';
const mockValidateTaskForm = validateTaskForm as jest.MockedFunction<typeof validateTaskForm>;

describe('AddTaskModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateTaskForm.mockReturnValue({ isValid: true, errors: [] });
  });

  describe('Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      expect(screen.getByText('Add New Task')).toBeInTheDocument();
      expect(screen.getByLabelText('Task Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description *')).toBeInTheDocument();
      expect(screen.getByLabelText('Points *')).toBeInTheDocument();
      expect(screen.getByText('Create Task')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(<AddTaskModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Add New Task')).not.toBeInTheDocument();
    });

    it('renders form fields with correct attributes', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Task Name *');
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('placeholder', 'Enter task name');
      
      const descriptionInput = screen.getByLabelText('Description *');
      expect(descriptionInput).toHaveAttribute('rows', '3');
      expect(descriptionInput).toHaveAttribute('placeholder', 'Describe the task requirements and objectives');
      
      const pointsInput = screen.getByLabelText('Points *');
      expect(pointsInput).toHaveAttribute('type', 'number');
      expect(pointsInput).toHaveAttribute('min', '1');
      expect(pointsInput).toHaveAttribute('step', '1');
    });

    it('shows helper text for points field', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      expect(screen.getByText('Points represent the difficulty/value of this task')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('updates form data when inputs change', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Task Name *');
      const descriptionInput = screen.getByLabelText('Description *');
      const pointsInput = screen.getByLabelText('Points *');
      
      fireEvent.change(nameInput, { target: { value: 'Test Task' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
      fireEvent.change(pointsInput, { target: { value: '25' } });
      
      expect(nameInput).toHaveValue('Test Task');
      expect(descriptionInput).toHaveValue('Test Description');
      expect(pointsInput).toHaveValue(25);
    });

    it('handles numeric input for points field', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      const pointsInput = screen.getByLabelText('Points *');
      
      fireEvent.change(pointsInput, { target: { value: 'abc' } });
      expect(pointsInput).toHaveValue(null); // Empty value shows as null
      
      fireEvent.change(pointsInput, { target: { value: '50' } });
      expect(pointsInput).toHaveValue(50);
    });

    it('clears field errors when user starts typing', () => {
      mockValidateTaskForm.mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Task name is required' }],
      });

      render(<AddTaskModal {...defaultProps} />);
      
      // Submit form to trigger validation
      fireEvent.click(screen.getByText('Create Task'));
      
      expect(screen.getByText('Task name is required')).toBeInTheDocument();
      
      // Start typing in name field
      const nameInput = screen.getByLabelText('Task Name *');
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      
      expect(screen.queryByText('Task name is required')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('displays validation errors for invalid form', async () => {
      mockValidateTaskForm.mockReturnValue({
        isValid: false,
        errors: [
          { field: 'name', message: 'Task name is required' },
          { field: 'description', message: 'Task description is required' },
          { field: 'points', message: 'Points must be greater than 0' },
        ],
      });

      render(<AddTaskModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Create Task'));
      
      await waitFor(() => {
        expect(screen.getByText('Task name is required')).toBeInTheDocument();
        expect(screen.getByText('Task description is required')).toBeInTheDocument();
        expect(screen.getByText('Points must be greater than 0')).toBeInTheDocument();
      });
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('applies error styling to invalid fields', async () => {
      mockValidateTaskForm.mockReturnValue({
        isValid: false,
        errors: [{ field: 'name', message: 'Task name is required' }],
      });

      render(<AddTaskModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Create Task'));
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Task Name *');
        expect(nameInput).toHaveClass('border-red-300', 'bg-red-50');
      });
    });

    it('calls validateTaskForm with correct data', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText('Task Name *'), { target: { value: 'Test Task' } });
      fireEvent.change(screen.getByLabelText('Description *'), { target: { value: 'Test Description' } });
      fireEvent.change(screen.getByLabelText('Points *'), { target: { value: '25' } });
      
      fireEvent.click(screen.getByText('Create Task'));
      
      expect(mockValidateTaskForm).toHaveBeenCalledWith({
        name: 'Test Task',
        description: 'Test Description',
        points: 25,
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<AddTaskModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText('Task Name *'), { target: { value: 'Test Task' } });
      fireEvent.change(screen.getByLabelText('Description *'), { target: { value: 'Test Description' } });
      fireEvent.change(screen.getByLabelText('Points *'), { target: { value: '25' } });
      
      fireEvent.click(screen.getByText('Create Task'));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Test Task',
          description: 'Test Description',
          points: 25,
        });
      });
    });

    it('shows loading state during submission', async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);
      
      render(<AddTaskModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText('Task Name *'), { target: { value: 'Test Task' } });
      fireEvent.change(screen.getByLabelText('Description *'), { target: { value: 'Test Description' } });
      fireEvent.change(screen.getByLabelText('Points *'), { target: { value: '25' } });
      
      fireEvent.click(screen.getByText('Create Task'));
      
      expect(screen.getByText('Creating...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
      
      resolveSubmit!();
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('handles submission errors', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Network error'));
      
      render(<AddTaskModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText('Task Name *'), { target: { value: 'Test Task' } });
      fireEvent.change(screen.getByLabelText('Description *'), { target: { value: 'Test Description' } });
      fireEvent.change(screen.getByLabelText('Points *'), { target: { value: '25' } });
      
      fireEvent.click(screen.getByText('Create Task'));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to create task. Please try again.')).toBeInTheDocument();
      });
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('resets form after successful submission', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<AddTaskModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Task Name *');
      const descriptionInput = screen.getByLabelText('Description *');
      const pointsInput = screen.getByLabelText('Points *');
      
      fireEvent.change(nameInput, { target: { value: 'Test Task' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
      fireEvent.change(pointsInput, { target: { value: '25' } });
      
      fireEvent.click(screen.getByText('Create Task'));
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Controls', () => {
    it('closes modal when close button is clicked', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes modal when cancel button is clicked', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes modal when backdrop is clicked', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      const backdrop = document.querySelector('.bg-black.bg-opacity-50');
      fireEvent.click(backdrop!);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets form when modal is closed', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      // Fill form
      fireEvent.change(screen.getByLabelText('Task Name *'), { target: { value: 'Test Task' } });
      fireEvent.change(screen.getByLabelText('Description *'), { target: { value: 'Test Description' } });
      fireEvent.change(screen.getByLabelText('Points *'), { target: { value: '25' } });
      
      // Close modal
      fireEvent.click(screen.getByText('Cancel'));
      
      // Reopen modal
      const { rerender } = render(<AddTaskModal {...defaultProps} isOpen={false} />);
      rerender(<AddTaskModal {...defaultProps} isOpen={true} />);
      
      // Check form is reset
      expect(screen.getByLabelText('Task Name *')).toHaveValue('');
      expect(screen.getByLabelText('Description *')).toHaveValue('');
      expect(screen.getByLabelText('Points *')).toHaveValue(null);
    });

    it('prevents closing during submission', () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);
      
      render(<AddTaskModal {...defaultProps} />);
      
      fireEvent.change(screen.getByLabelText('Task Name *'), { target: { value: 'Test Task' } });
      fireEvent.change(screen.getByLabelText('Description *'), { target: { value: 'Test Description' } });
      fireEvent.change(screen.getByLabelText('Points *'), { target: { value: '25' } });
      
      fireEvent.click(screen.getByText('Create Task'));
      
      // Try to close during submission
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.getByText('Cancel')).toBeDisabled();
      
      resolveSubmit!();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and associations', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      expect(screen.getByLabelText('Task Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description *')).toBeInTheDocument();
      expect(screen.getByLabelText('Points *')).toBeInTheDocument();
    });

    it('has proper button roles and text', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('manages focus properly', () => {
      render(<AddTaskModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText('Task Name *');
      nameInput.focus();
      
      expect(document.activeElement).toBe(nameInput);
    });
  });
});