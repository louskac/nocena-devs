'use client';

import { useState } from 'react';
import { Task, Developer, DragData } from '@/lib/types';
import TaskCard from './TaskCard';

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  developer?: Developer;
  isBacklog?: boolean;
  onTaskDrop: (taskId: string, targetColumn: string) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskEdit?: (taskId: string) => void;
}

export default function TaskColumn({
  title,
  tasks,
  developer,
  isBacklog = false,
  onTaskDrop,
  onTaskComplete,
  onTaskEdit
}: TaskColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragValidation, setDragValidation] = useState<{
    isValid: boolean;
    message?: string;
  }>({ isValid: true });

  // Handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!isDragOver) {
      setIsDragOver(true);
      
      // Validate the drag operation
      try {
        const dragDataStr = e.dataTransfer.getData('application/json');
        if (dragDataStr) {
          const dragData: DragData = JSON.parse(dragDataStr);
          const validation = validateDrop(dragData);
          setDragValidation(validation);
        }
      } catch {
        // If we can't parse drag data during dragover, assume it's valid
        // The actual validation will happen on drop
        setDragValidation({ isValid: true });
      }
    }
  };

  // Handle drag enter event
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  // Handle drag leave event
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only set drag over to false if we're leaving the column entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
      setDragValidation({ isValid: true });
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragValidation({ isValid: true });

    try {
      const dragDataStr = e.dataTransfer.getData('application/json');
      if (!dragDataStr) {
        console.warn('No drag data found');
        return;
      }

      const dragData: DragData = JSON.parse(dragDataStr);
      const validation = validateDrop(dragData);
      
      if (!validation.isValid) {
        console.warn('Invalid drop operation:', validation.message);
        return;
      }

      const targetColumn = isBacklog ? 'backlog' : developer?.id || '';
      
      // Don't drop if it's the same column
      if (dragData.sourceColumn === targetColumn) {
        return;
      }

      onTaskDrop(dragData.taskId, targetColumn);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Validate drop operation
  const validateDrop = (dragData: DragData): { isValid: boolean; message?: string } => {
    const targetColumn = isBacklog ? 'backlog' : developer?.id || '';
    
    // Can't drop on the same column
    if (dragData.sourceColumn === targetColumn) {
      return { isValid: false, message: 'Cannot drop task in the same column' };
    }

    // Can't drop completed tasks
    const task = tasks.find(t => t.id === dragData.taskId);
    if (task && task.status === 'completed') {
      return { isValid: false, message: 'Cannot move completed tasks' };
    }

    // Can only drop backlog tasks or tasks assigned to other developers
    if (!isBacklog && dragData.sourceColumn !== 'backlog' && dragData.sourceColumn !== developer?.id) {
      // This is a task from another developer - allow it
      return { isValid: true };
    }

    return { isValid: true };
  };

  // Get column header info
  const getColumnInfo = () => {
    if (isBacklog) {
      return {
        title: 'Backlog',
        subtitle: `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`,
        icon: '📋'
      };
    }

    if (developer) {
      const assignedTasks = tasks.filter(t => t.status === 'assigned').length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      
      return {
        title: developer.name,
        subtitle: `${assignedTasks} active, ${completedTasks} completed`,
        icon: '👨‍💻'
      };
    }

    return {
      title: title,
      subtitle: `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`,
      icon: '📁'
    };
  };

  const columnInfo = getColumnInfo();

  return (
    <div className="flex flex-col h-full min-w-72 sm:min-w-80 max-w-72 sm:max-w-80 flex-shrink-0">
      {/* Column Header */}
      <div className="flex-shrink-0 p-3 sm:p-4 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base sm:text-lg">{columnInfo.icon}</span>
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{columnInfo.title}</h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-600">{columnInfo.subtitle}</p>
        
        {/* Developer stats */}
        {developer && (
          <div className="mt-2 flex gap-2 sm:gap-4 text-xs text-gray-500">
            <span>🏆 {developer.totalPoints}</span>
            <span>⏱️ {developer.totalHours}h</span>
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        className={`
          flex-1 p-3 sm:p-4 transition-all duration-200 min-h-80 sm:min-h-96 bg-white rounded-b-lg
          ${isDragOver ? (
            dragValidation.isValid 
              ? 'drop-zone-valid border-2' 
              : 'drop-zone-invalid border-2'
          ) : 'bg-white border border-gray-200'}
          touch-manipulation
        `}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drop validation message */}
        {isDragOver && !dragValidation.isValid && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-xs sm:text-sm text-red-700">
              ❌ {dragValidation.message}
            </p>
          </div>
        )}

        {/* Drop zone indicator */}
        {isDragOver && dragValidation.isValid && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-700">
              ✅ Drop task here to {isBacklog ? 'return to backlog' : `assign to ${developer?.name}`}
            </p>
          </div>
        )}

        {/* Tasks */}
        <div className="space-y-2 sm:space-y-3">
          {tasks.length === 0 && !isDragOver ? (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <div className="text-3xl sm:text-4xl mb-2">
                {isBacklog ? '📝' : '🎯'}
              </div>
              <p className="text-xs sm:text-sm px-2">
                {isBacklog 
                  ? 'No tasks in backlog. Create a new task to get started!' 
                  : 'No tasks assigned. Drag tasks from the backlog to start working!'
                }
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={onTaskComplete}
                onEdit={onTaskEdit}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}