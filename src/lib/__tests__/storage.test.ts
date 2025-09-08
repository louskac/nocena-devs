/**
 * @jest-environment jsdom
 */

import { loadData, saveData, clearData, exportData, importData, isStorageAvailable } from '../storage';
import { AppState, Task } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Storage Functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isStorageAvailable()).toBe(true);
    });
  });

  describe('loadData', () => {
    it('should return default state when no data is stored', () => {
      const result = loadData();
      expect(result).toEqual({
        tasks: [],
        developers: []
      });
    });

    it('should load and deserialize stored data correctly', () => {
      const testData = {
        tasks: [{
          id: 'task-1',
          name: 'Test Task',
          description: 'Test Description',
          points: 10,
          status: 'backlog' as const,
          createdAt: '2025-01-15T10:00:00.000Z'
        }],
        developers: [{
          id: 'dev-1',
          name: 'Test Developer',
          totalPoints: 0,
          completedTasks: 0,
          totalHours: 0
        }],
        version: '1.0'
      };

      localStorage.setItem('nocena-devs-data', JSON.stringify(testData));
      
      const result = loadData();
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].createdAt).toBeInstanceOf(Date);
      expect(result.developers).toHaveLength(1);
    });

    it('should return default state for invalid data', () => {
      localStorage.setItem('nocena-devs-data', 'invalid json');
      
      const result = loadData();
      expect(result).toEqual({
        tasks: [],
        developers: []
      });
    });
  });

  describe('saveData', () => {
    it('should save data to localStorage successfully', () => {
      const testState: AppState = {
        tasks: [{
          id: 'task-1',
          name: 'Test Task',
          description: 'Test Description',
          points: 10,
          status: 'backlog',
          createdAt: new Date('2025-01-15T10:00:00.000Z')
        }],
        developers: [{
          id: 'dev-1',
          name: 'Test Developer',
          totalPoints: 0,
          completedTasks: 0,
          totalHours: 0
        }]
      };

      const result = saveData(testState);
      expect(result).toBe(true);
      
      const stored = localStorage.getItem('nocena-devs-data');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.tasks).toHaveLength(1);
      expect(parsed.developers).toHaveLength(1);
      expect(parsed.version).toBe('1.0');
    });
  });

  describe('clearData', () => {
    it('should clear stored data', () => {
      localStorage.setItem('nocena-devs-data', 'test data');
      
      const result = clearData();
      expect(result).toBe(true);
      expect(localStorage.getItem('nocena-devs-data')).toBeNull();
    });
  });

  describe('exportData', () => {
    it('should export data as JSON string', () => {
      const testState: AppState = {
        tasks: [],
        developers: []
      };

      const result = exportData(testState);
      const parsed = JSON.parse(result);
      
      expect(parsed.tasks).toEqual([]);
      expect(parsed.developers).toEqual([]);
      expect(parsed.version).toBe('1.0');
    });
  });

  describe('importData', () => {
    it('should import valid JSON data', () => {
      const testData = {
        tasks: [],
        developers: [],
        version: '1.0'
      };

      const result = importData(JSON.stringify(testData));
      expect(result).toEqual({
        tasks: [],
        developers: []
      });
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        importData('invalid json');
      }).toThrow('Failed to import data: Invalid JSON format');
    });

    it('should throw error for invalid data structure', () => {
      expect(() => {
        importData('{"invalid": "structure"}');
      }).toThrow('Failed to import data: Invalid JSON format');
    });
  });
});