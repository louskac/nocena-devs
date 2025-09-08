import { render, screen } from '@testing-library/react';
import Leaderboard from '../Leaderboard';
import { Developer } from '../../lib/types';

describe('Leaderboard', () => {
  const mockDevelopers: Developer[] = [
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

  it('renders leaderboard with developers sorted by points', () => {
    render(<Leaderboard developers={mockDevelopers} />);
    
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    
    // Check that developers are displayed
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    
    // Check points are displayed
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('displays developer statistics correctly', () => {
    render(<Leaderboard developers={mockDevelopers} />);
    
    // Check task counts
    expect(screen.getByText('3 tasks')).toBeInTheDocument();
    expect(screen.getByText('2 tasks')).toBeInTheDocument();
    expect(screen.getByText('1 tasks')).toBeInTheDocument();
    
    // Check hours
    expect(screen.getByText('24.5 hours')).toBeInTheDocument();
    expect(screen.getByText('16.0 hours')).toBeInTheDocument();
    expect(screen.getByText('8.5 hours')).toBeInTheDocument();
  });

  it('sorts developers by total points in descending order', () => {
    const unsortedDevelopers: Developer[] = [
      {
        id: 'dev-1',
        name: 'Low Scorer',
        totalPoints: 25,
        completedTasks: 1,
        totalHours: 5.0,
      },
      {
        id: 'dev-2',
        name: 'High Scorer',
        totalPoints: 200,
        completedTasks: 4,
        totalHours: 32.0,
      },
      {
        id: 'dev-3',
        name: 'Medium Scorer',
        totalPoints: 100,
        completedTasks: 2,
        totalHours: 16.0,
      },
    ];

    render(<Leaderboard developers={unsortedDevelopers} />);
    
    const developerElements = screen.getAllByText(/Scorer/);
    expect(developerElements[0]).toHaveTextContent('High Scorer');
    expect(developerElements[1]).toHaveTextContent('Medium Scorer');
    expect(developerElements[2]).toHaveTextContent('Low Scorer');
  });

  it('highlights top performer with special styling', () => {
    render(<Leaderboard developers={mockDevelopers} />);
    
    // The first developer (Alice) should have the top performer styling
    // Find the main container div that has the styling classes
    const aliceElement = screen.getByText('Alice Johnson');
    const styledContainer = aliceElement.closest('.bg-yellow-50');
    expect(styledContainer).toBeInTheDocument();
    expect(styledContainer).toHaveClass('bg-yellow-50', 'border-yellow-200');
  });

  it('displays position badges correctly', () => {
    render(<Leaderboard developers={mockDevelopers} />);
    
    // Check for medal emojis for top 3
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('displays summary statistics', () => {
    render(<Leaderboard developers={mockDevelopers} />);
    
    // Total points: 150 + 100 + 75 = 325
    expect(screen.getByText('325')).toBeInTheDocument();
    expect(screen.getByText('Total Points')).toBeInTheDocument();
    
    // Total tasks: 3 + 2 + 1 = 6
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    
    // Total hours: 24.5 + 16.0 + 8.5 = 49.0
    expect(screen.getByText('49.0')).toBeInTheDocument();
    expect(screen.getByText('Total Hours')).toBeInTheDocument();
  });

  it('shows empty state when no developers', () => {
    render(<Leaderboard developers={[]} />);
    
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('No developers with completed tasks yet')).toBeInTheDocument();
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('handles developers with zero points', () => {
    const developersWithZeroPoints: Developer[] = [
      {
        id: 'dev-1',
        name: 'New Developer',
        totalPoints: 0,
        completedTasks: 0,
        totalHours: 0,
      },
    ];

    render(<Leaderboard developers={developersWithZeroPoints} />);
    
    expect(screen.getByText('New Developer')).toBeInTheDocument();
    expect(screen.getByText('0 tasks')).toBeInTheDocument();
    expect(screen.getByText('0.0 hours')).toBeInTheDocument();
    
    // Check for the specific points display (not just any "0")
    const pointsSection = screen.getByText('points').previousElementSibling;
    expect(pointsSection).toHaveTextContent('0');
    
    // Should not have top performer styling when points are 0
    const styledContainer = screen.getByText('New Developer').closest('.bg-yellow-50');
    expect(styledContainer).toBeNull();
  });

  it('displays correct position numbers for developers beyond top 3', () => {
    const manyDevelopers: Developer[] = [
      { id: 'dev-1', name: 'Dev 1', totalPoints: 100, completedTasks: 2, totalHours: 16 },
      { id: 'dev-2', name: 'Dev 2', totalPoints: 90, completedTasks: 2, totalHours: 15 },
      { id: 'dev-3', name: 'Dev 3', totalPoints: 80, completedTasks: 2, totalHours: 14 },
      { id: 'dev-4', name: 'Dev 4', totalPoints: 70, completedTasks: 1, totalHours: 12 },
      { id: 'dev-5', name: 'Dev 5', totalPoints: 60, completedTasks: 1, totalHours: 10 },
    ];

    render(<Leaderboard developers={manyDevelopers} />);
    
    // Check that position 4 and 5 show numbers instead of medals
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});