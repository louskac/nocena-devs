'use client';

import { useState } from 'react';
import { CompletionFormData, FormValidationResult, Task } from '../lib/types';
import { validateCompletionForm } from '../lib/utils';

interface CompleteTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: (taskId: string, completionData: CompletionFormData) => void;
}

export default function CompleteTaskModal({ isOpen, task, onClose, onSubmit }: CompleteTaskModalProps) {
  const [formData, setFormData] = useState<CompletionFormData>({
    hoursSpent: 0,
    gitCommit: '',
    comments: '',
  });
  
  const [validation, setValidation] = useState<FormValidationResult>({
    isValid: true,
    errors: [],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form field changes
  const handleInputChange = (field: keyof CompletionFormData, value: string | number) => {
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
    
    if (!task) return;
    
    // Validate form data
    const validationResult = validateCompletionForm(formData);
    setValidation(validationResult);
    
    if (!validationResult.isValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Submit the completion data
      await onSubmit(task.id, formData);
      
      // Reset form and close modal on success
      handleClose();
    } catch (error) {
      console.error('Error completing task:', error);
      setValidation({
        isValid: false,
        errors: [{ field: 'general', message: 'Failed to complete task. Please try again.' }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({ hoursSpent: 0, gitCommit: '', comments: '' });
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

  if (!isOpen || !task) {
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Complete Task
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {task.name}
              </p>
            </div>
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

            {/* Task Info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Task Points</p>
                  <p className="text-lg font-bold text-blue-700">{task.points} points</p>
                </div>
                <div className="text-blue-600">
                  🏆
                </div>
              </div>
            </div>

            {/* Hours Spent Field */}
            <div className="mb-4">
              <label htmlFor="hoursSpent" className="block text-sm font-medium text-gray-700 mb-2">
                Hours Spent *
              </label>
              <input
                id="hoursSpent"
                type="number"
                min="0.1"
                step="0.1"
                value={formData.hoursSpent || ''}
                onChange={(e) => handleInputChange('hoursSpent', parseFloat(e.target.value) || 0)}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${getFieldError('hoursSpent') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="Enter hours spent (e.g., 2.5)"
                disabled={isSubmitting}
              />
              {getFieldError('hoursSpent') && (
                <p className="mt-1 text-sm text-red-600">
                  {getFieldError('hoursSpent')}
                </p>
              )}
            </div>

            {/* Git Commit Field */}
            <div className="mb-4">
              <label htmlFor="gitCommit" className="block text-sm font-medium text-gray-700 mb-2">
                Git Commit Hash *
              </label>
              <input
                id="gitCommit"
                type="text"
                value={formData.gitCommit}
                onChange={(e) => handleInputChange('gitCommit', e.target.value)}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm
                  ${getFieldError('gitCommit') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="Enter git commit hash (e.g., abc123def456)"
                disabled={isSubmitting}
              />
              {getFieldError('gitCommit') && (
                <p className="mt-1 text-sm text-red-600">
                  {getFieldError('gitCommit')}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Provide the commit hash that contains the completed work
              </p>
            </div>

            {/* Comments Field */}
            <div className="mb-6">
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                Completion Comments *
              </label>
              <textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
                rows={3}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none
                  ${getFieldError('comments') ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                placeholder="Describe what was accomplished, any challenges faced, or notes for future reference"
                disabled={isSubmitting}
              />
              {getFieldError('comments') && (
                <p className="mt-1 text-sm text-red-600">
                  {getFieldError('comments')}
                </p>
              )}
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
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Completing...
                  </span>
                ) : (
                  'Complete Task'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}