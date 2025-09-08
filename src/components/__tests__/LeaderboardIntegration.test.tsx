import { render, screen } from '@testing-library/react';
import Leaderboard from '../Leaderboard';
import { Developer } from '../../lib/types';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';

describe('Leaderboard Integration Tests', () => {
  it('displays leaderboard with real-time developer statistics', async () => {
    // Test with initial developer data
    const initialDevelopers: Developer[] = [
      {
        id: 'dev-1',
        name: 'Alice Johnson',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      },
      {
        id: 'dev-2',
        name: 'Bob Smith',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      }
    ];

    const { rerender } = render(<Leaderboard developers={initialDevelopers} />);

    // Verify initial state
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getAllByText('0 tasks')).toHaveLength(2);
    expect(screen.getAllByText('0.0h')).toHaveLength(2);

    // Simulate Alice completing a task (50 points, 8 hours)
    const updatedDevelopers1: Developer[] = [
      {
        id: 'dev-1',
        name: 'Alice Johnson',
        totalPoints: 50,
        completedTasks: 1,
        totalHours: 8,
      },
      {
        id: 'dev-2',
        name: 'Bob Smith',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      }
    ];

    rerender(<Leaderboard developers={updatedDevelopers1} />);

    // Verify Alice's stats updated
    expect(screen.getAllByText('50').length).toBeGreaterThan(0);
    expect(screen.getByText('1 tasks')).toBeInTheDocument();
    expect(screen.getByText('8.0h')).toBeInTheDocument();

    // Simulate Bob completing a higher-value task (75 points, 10 hours)
    const updatedDevelopers2: Developer[] = [
      {
        id: 'dev-1',
        name: 'Alice Johnson',
        totalPoints: 50,
        completedTasks: 1,
        totalHours: 8,
      },
      {
        id: 'dev-2',
        name: 'Bob Smith',
        totalPoints: 75,
        completedTasks: 1,
        totalHours: 10,
      }
    ];

    rerender(<Leaderboard developers={updatedDevelopers2} />);

    // Verify both developers' stats and ranking (Bob should be first now)
    expect(screen.getAllByText('75').length).toBeGreaterThan(0); // Bob's points
    expect(screen.getAllByText('50').length).toBeGreaterThan(0); // Alice's points
    
    // Check that Bob is ranked first (has top performer styling)
    const bobContainer = screen.getByText('Bob Smith').closest('.bg-yellow-50');
    expect(bobContainer).toBeInTheDocument();

    // Simulate Alice completing another task (cumulative: 85 points, 2 tasks, 13 hours)
    const updatedDevelopers3: Developer[] = [
      {
        id: 'dev-1',
        name: 'Alice Johnson',
        totalPoints: 85, // 50 + 35
        completedTasks: 2, // 1 + 1
        totalHours: 13, // 8 + 5
      },
      {
        id: 'dev-2',
        name: 'Bob Smith',
        totalPoints: 75,
        completedTasks: 1,
        totalHours: 10,
      }
    ];

    rerender(<Leaderboard developers={updatedDevelopers3} />);

    // Verify Alice is now back on top with cumulative stats
    expect(screen.getAllByText('85').length).toBeGreaterThan(0); // Alice's updated points
    expect(screen.getByText('2 tasks')).toBeInTheDocument(); // Alice's task count
    expect(screen.getByText('13.0h')).toBeInTheDocument(); // Alice's total hours
    
    // Check that Alice is now ranked first
    const aliceContainer = screen.getByText('Alice Johnson').closest('.bg-yellow-50');
    expect(aliceContainer).toBeInTheDocument();
  });

  it('calculates and displays summary statistics correctly', () => {
    const developers: Developer[] = [
      {
        id: 'dev-1',
        name: 'Alice Johnson',
        totalPoints: 150,
        completedTasks: 3,
        totalHours: 24.5,
      },
      {
        id: 'dev-2',
        name: 'Bob Smith',
        totalPoints: 100,
        completedTasks: 2,
        totalHours: 16.0,
      },
      {
        id: 'dev-3',
        name: 'Charlie Brown',
        totalPoints: 75,
        completedTasks: 1,
        totalHours: 8.5,
      },
    ];

    render(<Leaderboard developers={developers} />);

    // Verify summary statistics are calculated correctly
    expect(screen.getByText('325')).toBeInTheDocument(); // Total points: 150 + 100 + 75
    expect(screen.getByText('6')).toBeInTheDocument(); // Total tasks: 3 + 2 + 1
    expect(screen.getByText('49.0')).toBeInTheDocument(); // Total hours: 24.5 + 16.0 + 8.5
  });

  it('handles dynamic developer additions and updates', () => {
    // Start with empty leaderboard
    const { rerender } = render(<Leaderboard developers={[]} />);
    
    expect(screen.getByText('No developers with completed tasks yet')).toBeInTheDocument();

    // Add first developer
    const developersWithOne: Developer[] = [
      {
        id: 'dev-1',
        name: 'New Developer',
        totalPoints: 25,
        completedTasks: 1,
        totalHours: 3,
      }
    ];

    rerender(<Leaderboard developers={developersWithOne} />);

    expect(screen.getByText('New Developer')).toBeInTheDocument();
    expect(screen.getAllByText('25').length).toBeGreaterThan(0);
    expect(screen.getByText('1 tasks')).toBeInTheDocument();
    expect(screen.getByText('3.0h')).toBeInTheDocument();

    // Add second developer with higher stats
    const developersWithTwo: Developer[] = [
      {
        id: 'dev-1',
        name: 'New Developer',
        totalPoints: 25,
        completedTasks: 1,
        totalHours: 3,
      },
      {
        id: 'dev-2',
        name: 'Another Developer',
        totalPoints: 60,
        completedTasks: 2,
        totalHours: 8,
      }
    ];

    rerender(<Leaderboard developers={developersWithTwo} />);

    // Verify both developers are shown and ranked correctly
    expect(screen.getByText('New Developer')).toBeInTheDocument();
    expect(screen.getByText('Another Developer')).toBeInTheDocument();
    expect(screen.getAllByText('25').length).toBeGreaterThan(0);
    expect(screen.getAllByText('60').length).toBeGreaterThan(0);
    
    // Check that "Another Developer" is ranked first (top performer styling)
    const topPerformerContainer = screen.getByText('Another Developer').closest('.bg-yellow-50');
    expect(topPerformerContainer).toBeInTheDocument();
  });
});