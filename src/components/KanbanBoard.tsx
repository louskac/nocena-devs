'use client';

import { useState } from 'react';
import { useTaskStorage } from '../lib/hooks/useTaskStorage';
import { useNotifications } from '../lib/hooks/useNotifications';
import { TaskFormData, CompletionFormData, Task } from '../lib/types';
import { generateId } from '../lib/utils';
import AddTaskModal from './AddTaskModal';
import CompleteTaskModal from './CompleteTaskModal';
import DeveloperManagementModal from './DeveloperManagementModal';
import TaskColumn from './TaskColumn';
import Leaderboard from './Leaderboard';
import NotificationSystem from './NotificationSystem';
import LoadingSpinner from './LoadingSpinner';
import { DataManager } from './DataManager';

export default function KanbanBoard() {
  const {
    tasks,
    developers,
    isLoading,
    isSaving,
    error,
    lastSaved,
    addTask,
    updateTask,
    addDeveloper,
    updateDeveloper,
    deleteDeveloper,
    getTasksByStatus,
    getTasksByDeveloper,
    clearError,
    forceSave,
    reloadData
  } = useTaskStorage();

  const {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showInfo
  } = useNotifications();

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isDeveloperManagementModalOpen, setIsDeveloperManagementModalOpen] = useState(false);
  const [completeTaskModalState, setCompleteTaskModalState] = useState<{
    isOpen: boolean;
    task: Task | null;
  }>({
    isOpen: false,
    task: null,
  });

  // Handle task creation
  const handleCreateTask = async (taskData: TaskFormData) => {
    try {
      const newTask = {
        id: generateId('task-'),
        name: taskData.name,
        description: taskData.description,
        points: taskData.points,
        status: 'backlog' as const,
        createdAt: new Date(),
      };

      addTask(newTask);
      showSuccess('Task Created', `"${taskData.name}" has been added to the backlog`);
    } catch {
      showError('Failed to Create Task', 'There was an error creating the task. Please try again.');
    }
  };

  // Handle task drag and drop
  const handleTaskDrop = (taskId: string, targetColumn: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (targetColumn === 'backlog') {
        // Moving back to backlog
        updateTask(taskId, {
          status: 'backlog',
          assignedTo: undefined,
        });
        showInfo('Task Moved', `"${task.name}" moved back to backlog`);
      } else {
        // Assigning to a developer
        const developer = developers.find(d => d.id === targetColumn);
        updateTask(taskId, {
          status: 'assigned',
          assignedTo: targetColumn,
        });
        showInfo('Task Assigned', `"${task.name}" assigned to ${developer?.name || targetColumn}`);
      }
    } catch {
      showError('Failed to Move Task', 'There was an error moving the task. Please try again.');
    }
  };

  // Handle task completion - open modal
  const handleTaskComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCompleteTaskModalState({
        isOpen: true,
        task: task,
      });
    }
  };

  // Handle task completion submission
  const handleTaskCompletionSubmit = async (taskId: string, completionData: CompletionFormData) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.assignedTo) {
      showError('Cannot Complete Task', 'Task not found or not assigned to a developer');
      return;
    }

    try {
      // Update task with completion details
      updateTask(taskId, {
        status: 'completed',
        completedAt: new Date(),
        completionDetails: completionData,
      });

      // Close the completion modal
      setCompleteTaskModalState({
        isOpen: false,
        task: null,
      });

      showSuccess('Task Completed! 🎉', `"${task.name}" completed and ${task.points} points awarded!`);
    } catch {
      showError('Failed to Complete Task', 'There was an error completing the task. Please try again.');
    }
  };

  // Handle complete task modal close
  const handleCompleteTaskModalClose = () => {
    setCompleteTaskModalState({
      isOpen: false,
      task: null,
    });
  };

  // Handle task editing
  const handleTaskEdit = (taskId: string) => {
    // For now, just log - this will be implemented later
    console.log('Edit task:', taskId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" text="Loading your workspace..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={clearError}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get tasks for different columns
  const backlogTasks = getTasksByStatus('backlog');
  const allDevelopers = developers.length > 0 ? developers : [
    // Default developer for demo purposes
    {
      id: 'dev-1',
      name: 'Ondra',
      totalPoints: 0,
      completedTasks: 0,
      totalHours: 0,
    },
    {
      id: 'dev-2',
      name: 'Matija',
      totalPoints: 0,
      completedTasks: 0,
      totalHours: 0,
    },
    {
      id: 'dev-3',
      name: 'Caden',
      totalPoints: 0,
      completedTasks: 0,
      totalHours: 0,
    },
    {
      id: 'dev-4',
      name: 'Oleh',
      totalPoints: 0,
      completedTasks: 0,
      totalHours: 0,
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Developer Task Tracker</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                <span className="whitespace-nowrap">
                  {tasks.length} tasks
                </span>
                <span className="whitespace-nowrap">
                  {backlogTasks.length} backlog
                </span>
                <span className="whitespace-nowrap">
                  {developers.length} devs
                </span>
                {isSaving && (
                  <span className="flex items-center gap-1 text-blue-600 whitespace-nowrap">
                    <LoadingSpinner size="sm" color="blue" />
                    <span className="hidden sm:inline">Saving...</span>
                  </span>
                )}
                {lastSaved && !isSaving && (
                  <span className="text-green-600 whitespace-nowrap hidden sm:inline">
                    Last saved: {new Date(lastSaved).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={reloadData}
                disabled={isLoading}
                className="p-2 sm:px-3 sm:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 touch-manipulation button-press hover-lift"
                title="Reload data"
              >
                🔄
              </button>
              <button
                onClick={forceSave}
                disabled={isSaving}
                className="p-2 sm:px-3 sm:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 touch-manipulation button-press hover-lift"
                title="Force save"
              >
                💾
              </button>
              <button
                onClick={() => setIsDeveloperManagementModalOpen(true)}
                className="p-2 sm:px-3 sm:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation button-press hover-lift"
                title="Manage developers"
              >
                👥
              </button>
              <button
                onClick={() => setIsAddTaskModalOpen(true)}
                className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base touch-manipulation button-press hover-lift"
              >
                <span className="hidden sm:inline">Add Task</span>
                <span className="sm:hidden">+</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <DataManager />
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Leaderboard - Mobile First */}
          <div className="lg:hidden">
            <Leaderboard developers={developers} isMobile={true} />
          </div>

          {/* Kanban Board */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory kanban-scroll">
              {/* Backlog Column */}
              <div className="snap-start">
                <TaskColumn
                  title="Backlog"
                  tasks={backlogTasks}
                  isBacklog={true}
                  onTaskDrop={handleTaskDrop}
                  onTaskEdit={handleTaskEdit}
                />
              </div>

              {/* Developer Columns */}
              {allDevelopers.map(developer => {
                const developerTasks = getTasksByDeveloper(developer.id);
                return (
                  <div key={developer.id} className="snap-start">
                    <TaskColumn
                      title={developer.name}
                      tasks={developerTasks}
                      developer={developer}
                      onTaskDrop={handleTaskDrop}
                      onTaskComplete={handleTaskComplete}
                      onTaskEdit={handleTaskEdit}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard - Desktop */}
          <div className="hidden lg:block lg:col-span-1 order-1 lg:order-2">
            <Leaderboard developers={developers} />
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSubmit={handleCreateTask}
      />

      {/* Complete Task Modal */}
      <CompleteTaskModal
        isOpen={completeTaskModalState.isOpen}
        task={completeTaskModalState.task}
        onClose={handleCompleteTaskModalClose}
        onSubmit={handleTaskCompletionSubmit}
      />

      {/* Developer Management Modal */}
      <DeveloperManagementModal
        isOpen={isDeveloperManagementModalOpen}
        onClose={() => setIsDeveloperManagementModalOpen(false)}
        developers={developers}
        onAddDeveloper={addDeveloper}
        onUpdateDeveloper={updateDeveloper}
        onDeleteDeveloper={deleteDeveloper}
      />

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}
