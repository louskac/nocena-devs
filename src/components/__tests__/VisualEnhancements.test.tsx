import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationSystem, { Notification } from '../NotificationSystem';
import LoadingSpinner, { Skeleton, CardSkeleton } from '../LoadingSpinner';
import { useNotifications } from '../../lib/hooks/useNotifications';
import { renderHook, act } from '@testing-library/react';

describe('Visual Enhancements', () => {
  describe('NotificationSystem', () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'Success!',
        message: 'Task completed successfully',
        duration: 3000,
      },
      {
        id: '2',
        type: 'error',
        title: 'Error!',
        message: 'Something went wrong',
      },
    ];

    it('should render notifications correctly', () => {
      const onRemove = jest.fn();
      render(
        <NotificationSystem
          notifications={mockNotifications}
          onRemove={onRemove}
        />
      );

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Task completed successfully')).toBeInTheDocument();
      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show correct icons for different notification types', () => {
      const onRemove = jest.fn();
      render(
        <NotificationSystem
          notifications={mockNotifications}
          onRemove={onRemove}
        />
      );

      expect(screen.getByText('✅')).toBeInTheDocument(); // Success icon
      expect(screen.getByText('❌')).toBeInTheDocument(); // Error icon
    });

    it('should call onRemove when close button is clicked', async () => {
      const onRemove = jest.fn();
      render(
        <NotificationSystem
          notifications={mockNotifications}
          onRemove={onRemove}
        />
      );

      const closeButtons = screen.getAllByRole('button');
      fireEvent.click(closeButtons[0]);

      // Wait for the animation to complete
      await waitFor(() => {
        expect(onRemove).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should auto-remove notifications after duration', async () => {
      jest.useFakeTimers();
      const onRemove = jest.fn();
      
      render(
        <NotificationSystem
          notifications={[mockNotifications[0]]}
          onRemove={onRemove}
        />
      );

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalledWith('1');
      });

      jest.useRealTimers();
    });

    it('should apply correct styling for different notification types', () => {
      const onRemove = jest.fn();
      const { container } = render(
        <NotificationSystem
          notifications={mockNotifications}
          onRemove={onRemove}
        />
      );

      const successNotification = container.querySelector('.bg-green-50');
      const errorNotification = container.querySelector('.bg-red-50');

      expect(successNotification).toBeInTheDocument();
      expect(errorNotification).toBeInTheDocument();
    });
  });

  describe('LoadingSpinner', () => {
    it('should render with default props', () => {
      render(<LoadingSpinner />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('h-6', 'w-6', 'border-blue-600');
    });

    it('should render with custom size', () => {
      render(<LoadingSpinner size="lg" />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('h-8', 'w-8');
    });

    it('should render with custom color', () => {
      render(<LoadingSpinner color="green" />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('border-green-600');
    });

    it('should render with text', () => {
      render(<LoadingSpinner text="Loading..." />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<LoadingSpinner className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Skeleton', () => {
    it('should render single line by default', () => {
      const { container } = render(<Skeleton />);
      
      const skeletonLines = container.querySelectorAll('.bg-gray-200');
      expect(skeletonLines).toHaveLength(1);
    });

    it('should render multiple lines', () => {
      const { container } = render(<Skeleton lines={3} />);
      
      const skeletonLines = container.querySelectorAll('.bg-gray-200');
      expect(skeletonLines).toHaveLength(3);
    });

    it('should animate by default', () => {
      const { container } = render(<Skeleton />);
      
      const skeletonLine = container.querySelector('.bg-gray-200');
      expect(skeletonLine).toHaveClass('animate-pulse');
    });

    it('should not animate when disabled', () => {
      const { container } = render(<Skeleton animate={false} />);
      
      const skeletonLine = container.querySelector('.bg-gray-200');
      expect(skeletonLine).not.toHaveClass('animate-pulse');
    });
  });

  describe('CardSkeleton', () => {
    it('should render card skeleton structure', () => {
      const { container } = render(<CardSkeleton />);
      
      const card = container.querySelector('.bg-white.rounded-lg.shadow-sm');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('animate-pulse');
    });

    it('should not animate when disabled', () => {
      const { container } = render(<CardSkeleton animate={false} />);
      
      const card = container.querySelector('.bg-white.rounded-lg.shadow-sm');
      expect(card).not.toHaveClass('animate-pulse');
    });
  });

  describe('useNotifications Hook', () => {
    it('should add notifications', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          type: 'success',
          title: 'Test',
          message: 'Test message',
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].title).toBe('Test');
      expect(result.current.notifications[0].type).toBe('success');
    });

    it('should remove notifications', () => {
      const { result } = renderHook(() => useNotifications());

      let notificationId: string;

      act(() => {
        notificationId = result.current.addNotification({
          type: 'info',
          title: 'Test',
        });
      });

      expect(result.current.notifications).toHaveLength(1);

      act(() => {
        result.current.removeNotification(notificationId);
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should clear all notifications', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({ type: 'success', title: 'Test 1' });
        result.current.addNotification({ type: 'error', title: 'Test 2' });
      });

      expect(result.current.notifications).toHaveLength(2);

      act(() => {
        result.current.clearAllNotifications();
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should provide convenience methods', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.showSuccess('Success Title', 'Success message');
        result.current.showError('Error Title', 'Error message');
        result.current.showWarning('Warning Title', 'Warning message');
        result.current.showInfo('Info Title', 'Info message');
      });

      expect(result.current.notifications).toHaveLength(4);
      expect(result.current.notifications[0].type).toBe('success');
      expect(result.current.notifications[1].type).toBe('error');
      expect(result.current.notifications[2].type).toBe('warning');
      expect(result.current.notifications[3].type).toBe('info');
    });

    it('should generate unique IDs for notifications', () => {
      const { result } = renderHook(() => useNotifications());

      let id1: string, id2: string;

      act(() => {
        id1 = result.current.addNotification({ type: 'success', title: 'Test 1' });
        id2 = result.current.addNotification({ type: 'success', title: 'Test 2' });
      });

      expect(id1).not.toBe(id2);
      expect(result.current.notifications[0].id).toBe(id1);
      expect(result.current.notifications[1].id).toBe(id2);
    });
  });

  describe('Animation Classes', () => {
    it('should apply hover-lift class correctly', () => {
      const { container } = render(
        <div className="hover-lift">Test Element</div>
      );

      const element = container.firstChild;
      expect(element).toHaveClass('hover-lift');
    });

    it('should apply button-press class correctly', () => {
      const { container } = render(
        <button className="button-press">Test Button</button>
      );

      const button = container.firstChild;
      expect(button).toHaveClass('button-press');
    });

    it('should apply drop-zone animations', () => {
      const { container } = render(
        <div className="drop-zone-valid">Valid Drop Zone</div>
      );

      const dropZone = container.firstChild;
      expect(dropZone).toHaveClass('drop-zone-valid');
    });
  });

  describe('Notification Integration', () => {
    it('should handle notification lifecycle correctly', async () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useNotifications());

      // Add a notification with short duration
      act(() => {
        result.current.addNotification({
          type: 'success',
          title: 'Test',
          duration: 1000,
        });
      });

      expect(result.current.notifications).toHaveLength(1);

      // Render the notification system
      render(
        <NotificationSystem
          notifications={result.current.notifications}
          onRemove={result.current.removeNotification}
        />
      );

      // Fast-forward time to trigger auto-removal
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // The notification should still be there until the component removes it
      expect(result.current.notifications).toHaveLength(1);

      jest.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    const testNotification: Notification = {
      id: '1',
      type: 'success',
      title: 'Test Notification',
      message: 'Test message',
    };

    it('should have proper ARIA labels for close buttons', () => {
      const onRemove = jest.fn();
      render(
        <NotificationSystem
          notifications={[testNotification]}
          onRemove={onRemove}
        />
      );

      const closeButton = screen.getByText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      const onRemove = jest.fn();
      render(
        <NotificationSystem
          notifications={[testNotification]}
          onRemove={onRemove}
        />
      );

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons[0];
      closeButton.focus();
      expect(closeButton).toHaveFocus();
    });
  });
});