'use client';

import { useState } from 'react';
import { TaskFormData, FormValidationResult } from '../lib/types';
import { validateTaskForm } from '../lib/utils';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskFormData) => void;
}

export default function AddTaskModal({ isOpen, onClose, onSubmit }: AddTaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    points: 0,
  });
  
  const [validation, setValidation] = useState<FormValidationResult>({
    isValid: true,
    errors: [],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form field changes
  const handleInputChange = (field: keyof TaskFormData, value: string | number) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    
    // Clear validation errors for the field being edited
    if (validation.errors.length > 0) {
      const filteredErrors = validation.errors.filter(error => error.field !== field);
      setValidation({
        isValid: filteredErrors.length === 0,
        errors: filteredErrors,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validationResult = validateTaskForm(formData);
    setValidation(validationResult);
    
    if (!validationResult.isValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Submit the form data
      await onSubmit(formData);
      
      // Reset form and close modal on success
      handleClose();
    } catch (error) {
      console.error('Error submitting task:', error);
      setValidation({
        isValid: false,
        errors: [{ field: 'general', message: 'Failed to create task. Please try again.' }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({ name: '', description: '', points: 0 });
    setValidation({ isValid: true, errors: [] });
    setIsSubmitting(false);
    onClose();
  };

  // Get error message for a specific field
  const getFieldError = (field: string) => {
    return validation.errors.find(error => error.field === field)?.message;
  };

  // Get general error message
  const getGeneralError = () => {
    return validation.errors.find(error => error.field === 'general')?.message;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Add New Task
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* General Error */}
            {getGeneralError() && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-700">
                  {getGeneralError()}
                </p>
              </div>
            )}

            {/* Task Name Field */}
            <div className="mb-4">
              <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 mb-2">
                Task Name *
              </label>
              <input
                id="taskName"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${getFieldError('name') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="Enter task name"
                disabled={isSubmitting}
              />
              {getFieldError('name') && (
                <p className="mt-1 text-sm text-red-600">
                  {getFieldError('name')}
                </p>
              )}
            </div>

            {/* Task Description Field */}
            <div className="mb-4">
              <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="taskDescription"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
                  ${getFieldError('description') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="Describe the task requirements and objectives"
                disabled={isSubmitting}
              />
              {getFieldError('description') && (
                <p className="mt-1 text-sm text-red-600">
                  {getFieldError('description')}
                </p>
              )}
            </div>

            {/* Points Field */}
            <div className="mb-6">
              <label htmlFor="taskPoints" className="block text-sm font-medium text-gray-700 mb-2">
                Points *
              </label>
              <input
                id="taskPoints"
                type="number"
                min="1"
                step="1"
                value={formData.points === 0 ? '' : formData.points}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 0 : parseInt(value);
                  handleInputChange('points', isNaN(numValue) ? 0 : numValue);
                }}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${getFieldError('points') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="Enter points (e.g., 10, 25, 50)"
                disabled={isSubmitting}
              />
              {getFieldError('points') && (
                <p className="mt-1 text-sm text-red-600">
                  {getFieldError('points')}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Points represent the difficulty/value of this task
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Task'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}