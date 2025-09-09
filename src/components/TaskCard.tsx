'use client';

import { useState } from 'react';
import { Task, DragData } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  isDragging?: boolean;
}

export default function TaskCard({ task, onComplete, isDragging = false }: TaskCardProps) {
  const [dragOver, setDragOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const dragData: DragData = {
      taskId: task.id,
      sourceColumn: task.assignedTo || 'backlog'
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDragOver(false);
  };

  // Get status badge color
  const getStatusColor = () => {
    switch (task.status) {
      case 'backlog':
        return 'bg-gray-100 text-gray-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color based on points
  const getPriorityColor = () => {
    if (task.points >= 50) return 'text-red-600 bg-red-50';
    if (task.points >= 20) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div
      draggable={task.status !== 'completed'}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-2 sm:mb-3 
        transition-all duration-200 hover:shadow-md hover:border-gray-300 active:scale-95
        touch-manipulation select-none hover-lift
        ${task.status !== 'completed' ? 'cursor-move' : 'cursor-default opacity-75'}
        ${isDragging ? 'opacity-50 transform rotate-2 drag-preview' : ''}
        ${dragOver ? 'ring-2 ring-blue-400' : ''}
        ${task.status === 'completed' ? 'animate-bounce-in' : ''}
      `}
    >
      {/* Header with title and points */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight flex-1 mr-2 break-words overflow-hidden">
          {task.name}
        </h3>
        <div className={`
          px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0
          ${getPriorityColor()}
        `}>
          <span className="text-xs">🏆</span>
          <span>{task.points}</span>
        </div>
      </div>

      {/* Description */}
      <div className={`text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 ${isExpanded ? '' : 'line-clamp-2'} break-words overflow-hidden`}>
        {task.description}
      </div>

      {/* Status and metadata */}
      <div className="flex items-center justify-between">
        <span className={`
          px-2 py-1 rounded-full text-xs font-medium capitalize flex-shrink-0
          ${getStatusColor()}
        `}>
          {task.status}
        </span>
        
        <div className="text-xs text-gray-500 truncate ml-2">
          {formatDate(task.createdAt)}
        </div>
      </div>

      {/* Assigned developer info */}
      {task.assignedTo && task.status === 'assigned' && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-600 truncate flex-1">
              Assigned to: <span className="font-medium">{task.assignedTo}</span>
            </span>
            {onComplete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(task.id);
                }}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation flex-shrink-0 button-press hover-lift"
              >
                ✓
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completion details */}
      {task.status === 'completed' && task.completionDetails && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Hours: {task.completionDetails.hoursSpent}h</span>
              <span>Commit: {task.completionDetails.gitCommit.substring(0, 7)}</span>
            </div>
            {task.completionDetails.comments && (
              <p className="text-gray-500 italic">
                &ldquo;{task.completionDetails.comments}&rdquo;
              </p>
            )}
            {task.completedAt && (
              <div className="text-gray-400">
                Completed: {formatDate(task.completedAt)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expand/Collapse button */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
        >
          <span>{isExpanded ? '▲' : '▼'}</span>
          <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
        </button>
      </div>

      {/* Drag handle indicator */}
      {task.status !== 'completed' && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col gap-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}