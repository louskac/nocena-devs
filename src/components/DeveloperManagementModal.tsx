'use client';

import { useState, useEffect } from 'react';
import { Developer, ValidationError } from '../lib/types';
import { generateId } from '../lib/utils';

interface DeveloperManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  developers: Developer[];
  onAddDeveloper: (developer: Developer) => void;
  onUpdateDeveloper: (developer: Developer) => void;
  onDeleteDeveloper: (developerId: string) => void;
}

interface DeveloperFormData {
  name: string;
}

export default function DeveloperManagementModal({
  isOpen,
  onClose,
  developers,
  onAddDeveloper,
  onUpdateDeveloper,
  onDeleteDeveloper,
}: DeveloperManagementModalProps) {
  const [formData, setFormData] = useState<DeveloperFormData>({ name: '' });
  const [editingDeveloper, setEditingDeveloper] = useState<Developer | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '' });
      setEditingDeveloper(null);
      setErrors([]);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Validate form data
  const validateForm = (data: DeveloperFormData): ValidationError[] => {
    const validationErrors: ValidationError[] = [];

    if (!data.name.trim()) {
      validationErrors.push({ field: 'name', message: 'Developer name is required' });
    } else if (data.name.trim().length < 2) {
      validationErrors.push({ field: 'name', message: 'Developer name must be at least 2 characters' });
    } else if (data.name.trim().length > 50) {
      validationErrors.push({ field: 'name', message: 'Developer name must be less than 50 characters' });
    }

    // Check for duplicate names (excluding current developer if editing)
    const existingDeveloper = developers.find(dev => 
      dev.name.toLowerCase() === data.name.trim().toLowerCase() &&
      dev.id !== editingDeveloper?.id
    );
    if (existingDeveloper) {
      validationErrors.push({ field: 'name', message: 'A developer with this name already exists' });
    }

    return validationErrors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      if (editingDeveloper) {
        // Update existing developer
        const updatedDeveloper: Developer = {
          ...editingDeveloper,
          name: formData.name.trim(),
        };
        onUpdateDeveloper(updatedDeveloper);
      } else {
        // Add new developer
        const newDeveloper: Developer = {
          id: generateId('dev-'),
          name: formData.name.trim(),
          totalPoints: 0,
          completedTasks: 0,
          totalHours: 0,
        };
        onAddDeveloper(newDeveloper);
      }

      // Reset form and close modal
      setFormData({ name: '' });
      setEditingDeveloper(null);
      onClose();
    } catch (error) {
      console.error('Error saving developer:', error);
      setErrors([{ field: 'general', message: 'Failed to save developer. Please try again.' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof DeveloperFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors when user starts typing
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  // Start editing a developer
  const handleEditDeveloper = (developer: Developer) => {
    setEditingDeveloper(developer);
    setFormData({ name: developer.name });
    setErrors([]);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingDeveloper(null);
    setFormData({ name: '' });
    setErrors([]);
  };

  // Handle developer deletion
  const handleDeleteDeveloper = (developerId: string) => {
    if (window.confirm('Are you sure you want to delete this developer? This action cannot be undone.')) {
      onDeleteDeveloper(developerId);
    }
  };

  // Get error for specific field
  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Developers
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Add/Edit Developer Form */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDeveloper ? 'Edit Developer' : 'Add New Developer'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="developerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Developer Name *
                  </label>
                  <input
                    type="text"
                    id="developerName"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`
                      w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${getFieldError('name') ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="Enter developer name"
                    disabled={isSubmitting}
                  />
                  {getFieldError('name') && (
                    <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
                  )}
                </div>

                {/* General error */}
                {getFieldError('general') && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{getFieldError('general')}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  {editingDeveloper && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Saving...' : editingDeveloper ? 'Update Developer' : 'Add Developer'}
                  </button>
                </div>
              </form>
            </div>

            {/* Developers List */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Current Developers ({developers.length})
              </h3>
              
              {developers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No developers added yet.</p>
                  <p className="text-sm mt-1">Add a developer above or assign a task to automatically create one.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {developers.map((developer) => (
                    <div
                      key={developer.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{developer.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>{developer.totalPoints} points</span>
                          <span>{developer.completedTasks} tasks completed</span>
                          <span>{developer.totalHours} hours</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditDeveloper(developer)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          disabled={isSubmitting}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDeveloper(developer.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          disabled={isSubmitting}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}