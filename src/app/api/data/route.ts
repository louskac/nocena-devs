import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { AppState, StorageData } from '../../../lib/types';

const STORAGE_KEY = 'nocena-devs-data';
const STORAGE_VERSION = '1.0';

// Default empty state
const DEFAULT_STATE: AppState = {
  tasks: [],
  developers: []
};

// GET - Load data
export async function GET() {
  try {
    const stored = await kv.get<StorageData>(STORAGE_KEY);
    
    if (!stored) {
      console.log('No stored data found, returning default state');
      return NextResponse.json(DEFAULT_STATE);
    }
    
    // Convert date strings back to Date objects
    const deserializedData = deserializeDates(stored) as StorageData;
    
    return NextResponse.json({
      tasks: deserializedData.tasks || [],
      developers: deserializedData.developers || []
    });
    
  } catch (error) {
    console.error('Error loading data from KV:', error);
    return NextResponse.json(DEFAULT_STATE);
  }
}

// POST - Save data
export async function POST(request: NextRequest) {
  try {
    const state: AppState = await request.json();
    
    // Validate data before saving
    if (!state || !Array.isArray(state.tasks) || !Array.isArray(state.developers)) {
      return NextResponse.json({ success: false, error: 'Invalid state structure' }, { status: 400 });
    }
    
    const storageData: StorageData = {
      tasks: state.tasks,
      developers: state.developers,
      version: STORAGE_VERSION
    };
    
    await kv.set(STORAGE_KEY, storageData);
    
    console.log('Data saved successfully', {
      tasks: state.tasks.length,
      developers: state.developers.length
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error saving data to KV:', error);
    return NextResponse.json({ success: false, error: 'Failed to save data' }, { status: 500 });
  }
}

// DELETE - Clear all data
export async function DELETE() {
  try {
    await kv.del(STORAGE_KEY);
    console.log('Data cleared successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear data' }, { status: 500 });
  }
}

// Helper function to convert date strings back to Date objects
function deserializeDates(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(deserializeDates);
  }
  
  if (data && typeof data === 'object' && data.constructor === Object) {
    const result = { ...data } as Record<string, unknown>;
    
    // Convert date strings back to Date objects
    if (result.createdAt && typeof result.createdAt === 'string') {
      result.createdAt = new Date(result.createdAt);
    }
    if (result.completedAt && typeof result.completedAt === 'string') {
      result.completedAt = new Date(result.completedAt);
    }
    
    // Recursively process nested objects
    Object.keys(result).forEach(key => {
      if (result[key] && typeof result[key] === 'object' && !(result[key] instanceof Date)) {
        result[key] = deserializeDates(result[key]);
      }
    });
    
    return result;
  }
  
  return data;
}