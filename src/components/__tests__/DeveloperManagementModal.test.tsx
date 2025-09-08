import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeveloperManagementModal from '../DeveloperManagementModal';
import { Developer } from '../../lib/types';

describe('DeveloperManagementModal', () => {
  const mockDevelopers: Developer[] = [
    {
      id: 'dev-1',
      name: 'Alice Johnson',
      totalPoints: 150,
      completedTasks: 3,
      totalHours: 24,
    },
    {
      id: 'dev-2',
      name: 'Bob Smith',
      totalPoints: 100,
      completedTasks: 2,
      totalHours: 16,
    },
  ];

  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    developers: mockDevelopers,
    onAddDeveloper: jest.fn(),
    onUpdateDeveloper: jest.fn(),
    onDeleteDeveloper: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<DeveloperManagementModal {...mockProps} />);
      
      expect(screen.getByText('Manage Developers')).toBeInTheDocument();
      expect(screen.getByText('Add New Developer')).toBeInTheDocument();
      expect(screen.getByText('Current Developers (2)')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<DeveloperManagementModal {...mockProps} isOpen={false} />);
      
      expect(screen.queryByText('Manage Developers')).not.toBeInTheDocument();
    });

    it('should display existing developers', () => {
      render(<DeveloperManagementModal {...mockProps} />);
      
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('150 points')).toBeInTheDocument();
      expect(screen.getByText('3 tasks completed')).toBeInTheDocument();
      expect(screen.getByText('24 hours')).toBeInTheDocument();
    });

    it('should show empty state when no developers exist', () => {
      render(<DeveloperManagementModal {...mockProps} developers={[]} />);
      
      expect(screen.getByText('No developers added yet.')).toBeInTheDocument();
      expect(screen.getByText('Current Developers (0)')).toBeInTheDocument();
    });
  });

  describe('Adding Developers', () => {
    it('should add a new developer with valid input', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const nameInput = screen.getByLabelText('Developer Name *');
      const addButton = screen.getByText('Add Developer');
      
      await user.type(nameInput, 'Charlie Brown');
      await user.click(addButton);
      
      expect(mockProps.onAddDeveloper).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Charlie Brown',
          totalPoints: 0,
          completedTasks: 0,
          totalHours: 0,
        })
      );
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should show validation error for empty name', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const addButton = screen.getByText('Add Developer');
      await user.click(addButton);
      
      expect(screen.getByText('Developer name is required')).toBeInTheDocument();
      expect(mockProps.onAddDeveloper).not.toHaveBeenCalled();
    });

    it('should show validation error for short name', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const nameInput = screen.getByLabelText('Developer Name *');
      const addButton = screen.getByText('Add Developer');
      
      await user.type(nameInput, 'A');
      await user.click(addButton);
      
      expect(screen.getByText('Developer name must be at least 2 characters')).toBeInTheDocument();
      expect(mockProps.onAddDeveloper).not.toHaveBeenCalled();
    });

    it('should show validation error for duplicate name', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const nameInput = screen.getByLabelText('Developer Name *');
      const addButton = screen.getByText('Add Developer');
      
      await user.type(nameInput, 'Alice Johnson'); // Existing name
      await user.click(addButton);
      
      expect(screen.getByText('A developer with this name already exists')).toBeInTheDocument();
      expect(mockProps.onAddDeveloper).not.toHaveBeenCalled();
    });

    it('should clear validation errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const nameInput = screen.getByLabelText('Developer Name *');
      const addButton = screen.getByText('Add Developer');
      
      // Trigger validation error
      await user.click(addButton);
      expect(screen.getByText('Developer name is required')).toBeInTheDocument();
      
      // Start typing to clear error
      await user.type(nameInput, 'New Developer');
      expect(screen.queryByText('Developer name is required')).not.toBeInTheDocument();
    });
  });

  describe('Editing Developers', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      expect(screen.getByText('Edit Developer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Update Developer')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should update developer with valid changes', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      const nameInput = screen.getByDisplayValue('Alice Johnson');
      const updateButton = screen.getByText('Update Developer');
      
      await user.clear(nameInput);
      await user.type(nameInput, 'Alice Johnson Updated');
      await user.click(updateButton);
      
      expect(mockProps.onUpdateDeveloper).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'dev-1',
          name: 'Alice Johnson Updated',
          totalPoints: 150,
          completedTasks: 3,
          totalHours: 24,
        })
      );
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should cancel edit mode when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      expect(screen.getByText('Edit Developer')).toBeInTheDocument();
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(screen.getByText('Add New Developer')).toBeInTheDocument();
      expect(screen.queryByText('Edit Developer')).not.toBeInTheDocument();
    });

    it('should allow same name when editing current developer', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      const updateButton = screen.getByText('Update Developer');
      await user.click(updateButton);
      
      // Should not show duplicate name error for same developer
      expect(screen.queryByText('A developer with this name already exists')).not.toBeInTheDocument();
      expect(mockProps.onUpdateDeveloper).toHaveBeenCalled();
    });
  });

  describe('Deleting Developers', () => {
    it('should delete developer when confirmed', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm to return true
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(<DeveloperManagementModal {...mockProps} />);
      
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this developer? This action cannot be undone.'
      );
      expect(mockProps.onDeleteDeveloper).toHaveBeenCalledWith('dev-1');
      
      confirmSpy.mockRestore();
    });

    it('should not delete developer when cancelled', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm to return false
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(<DeveloperManagementModal {...mockProps} />);
      
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);
      
      expect(confirmSpy).toHaveBeenCalled();
      expect(mockProps.onDeleteDeveloper).not.toHaveBeenCalled();
      
      confirmSpy.mockRestore();
    });
  });

  describe('Modal Controls', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);
      
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should close modal when backdrop is clicked', async () => {
      render(<DeveloperManagementModal {...mockProps} />);
      
      const backdrop = document.querySelector('.fixed.inset-0.bg-black');
      expect(backdrop).toBeInTheDocument();
      
      fireEvent.click(backdrop!);
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should reset form when modal is closed and reopened', () => {
      const { rerender } = render(<DeveloperManagementModal {...mockProps} isOpen={false} />);
      
      // Open modal and enter edit mode
      rerender(<DeveloperManagementModal {...mockProps} isOpen={true} />);
      
      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);
      
      expect(screen.getByText('Edit Developer')).toBeInTheDocument();
      
      // Close and reopen modal
      rerender(<DeveloperManagementModal {...mockProps} isOpen={false} />);
      rerender(<DeveloperManagementModal {...mockProps} isOpen={true} />);
      
      // Should be back to add mode
      expect(screen.getByText('Add New Developer')).toBeInTheDocument();
      expect(screen.queryByText('Edit Developer')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate name length limits', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const nameInput = screen.getByLabelText('Developer Name *');
      const addButton = screen.getByText('Add Developer');
      
      // Test maximum length
      const longName = 'A'.repeat(51);
      await user.type(nameInput, longName);
      await user.click(addButton);
      
      expect(screen.getByText('Developer name must be less than 50 characters')).toBeInTheDocument();
      expect(mockProps.onAddDeveloper).not.toHaveBeenCalled();
    });

    it('should trim whitespace from developer names', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const nameInput = screen.getByLabelText('Developer Name *');
      const addButton = screen.getByText('Add Developer');
      
      await user.type(nameInput, '  Charlie Brown  ');
      await user.click(addButton);
      
      expect(mockProps.onAddDeveloper).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Charlie Brown', // Trimmed
        })
      );
    });

    it('should handle case-insensitive duplicate name checking', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const nameInput = screen.getByLabelText('Developer Name *');
      const addButton = screen.getByText('Add Developer');
      
      await user.type(nameInput, 'ALICE JOHNSON'); // Different case
      await user.click(addButton);
      
      expect(screen.getByText('A developer with this name already exists')).toBeInTheDocument();
      expect(mockProps.onAddDeveloper).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      
      // Mock onAddDeveloper to be slow
      const slowAddDeveloper = jest.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 100));
      });
      
      render(<DeveloperManagementModal {...mockProps} onAddDeveloper={slowAddDeveloper} />);
      
      const nameInput = screen.getByLabelText('Developer Name *');
      const addButton = screen.getByText('Add Developer');
      
      await user.type(nameInput, 'New Developer');
      await user.click(addButton);
      
      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(addButton).toBeDisabled();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });

    it('should disable buttons during submission', async () => {
      const user = userEvent.setup();
      render(<DeveloperManagementModal {...mockProps} />);
      
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      
      const nameInput = screen.getByDisplayValue('Alice Johnson');
      const updateButton = screen.getByText('Update Developer');
      const cancelButton = screen.getByText('Cancel');
      
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      
      // Start submission
      fireEvent.click(updateButton);
      
      // Buttons should be disabled during submission
      expect(updateButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });
});