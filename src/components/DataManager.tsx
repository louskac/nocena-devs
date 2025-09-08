'use client';

import { useState } from 'react';
import { exportData, importData } from '../lib/apiStorage';
import { useTaskStorage } from '../lib/hooks/useTaskStorage';

export function DataManager() {
  const { tasks, developers, reloadData } = useTaskStorage();
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    try {
      const jsonData = exportData({ tasks, developers });
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `nocena-devs-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data: ' + (error as Error).message);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const jsonString = e.target?.result as string;
        const importedData = importData(jsonString);
        
        // Save the imported data to API
        const response = await fetch('/api/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(importedData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to save imported data');
        }
        
        // Reload the data in the app
        await reloadData();
        alert(`Successfully imported ${importedData.tasks.length} tasks and ${importedData.developers.length} developers!`);
      } catch (error) {
        alert('Failed to import data: ' + (error as Error).message);
      } finally {
        setImporting(false);
        // Reset the input
        event.target.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
      <button
        onClick={handleExport}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        disabled={tasks.length === 0 && developers.length === 0}
      >
        Export Data
      </button>
      
      <label className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer">
        {importing ? 'Importing...' : 'Import Data'}
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          disabled={importing}
          className="hidden"
        />
      </label>
      
      <div className="text-sm text-gray-600 flex items-center">
        Current: {tasks.length} tasks, {developers.length} developers
      </div>
    </div>
  );
}