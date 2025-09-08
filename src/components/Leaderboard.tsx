'use client';

import { Developer } from '../lib/types';

interface LeaderboardProps {
  developers: Developer[];
  isMobile?: boolean;
}

export default function Leaderboard({ developers, isMobile = false }: LeaderboardProps) {
  // Sort developers by total points in descending order
  const sortedDevelopers = [...developers].sort((a, b) => b.totalPoints - a.totalPoints);

  if (developers.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isMobile ? 'p-4' : 'p-6'}`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-4`}>Leaderboard</h2>
        <div className={`text-center ${isMobile ? 'py-4' : 'py-8'}`}>
          <div className={`text-gray-400 ${isMobile ? 'text-2xl' : 'text-4xl'} mb-2`}>🏆</div>
          <p className={`text-gray-500 ${isMobile ? 'text-sm' : ''}`}>No developers with completed tasks yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isMobile ? 'p-4' : 'p-6'}`}>
      <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-4 flex items-center gap-2`}>
        <span>🏆</span>
        Leaderboard
      </h2>
      
      <div className={`${isMobile ? 'space-y-2' : 'space-y-3'} ${isMobile ? 'max-h-40 overflow-y-auto' : ''}`}>
        {sortedDevelopers.map((developer, index) => {
          const isTopPerformer = index === 0 && developer.totalPoints > 0;
          const position = index + 1;
          
          return (
            <div
              key={developer.id}
              className={`
                flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'} rounded-lg border
                ${isTopPerformer 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-gray-50 border-gray-200'
                }
              `}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                {/* Position Badge */}
                <div className={`
                  flex items-center justify-center ${isMobile ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full font-bold flex-shrink-0
                  ${position === 1 
                    ? 'bg-yellow-500 text-white' 
                    : position === 2 
                    ? 'bg-gray-400 text-white'
                    : position === 3
                    ? 'bg-orange-400 text-white'
                    : 'bg-gray-300 text-gray-700'
                  }
                `}>
                  {position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : position}
                </div>
                
                {/* Developer Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-gray-900 truncate ${isMobile ? 'text-sm' : ''}`}>{developer.name}</h3>
                  <div className={`flex items-center gap-2 sm:gap-4 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                    <span>{developer.completedTasks} tasks</span>
                    <span>{developer.totalHours.toFixed(1)}h</span>
                  </div>
                </div>
              </div>
              
              {/* Points */}
              <div className="text-right flex-shrink-0">
                <div className={`
                  ${isMobile ? 'text-base' : 'text-lg'} font-bold
                  ${isTopPerformer ? 'text-yellow-600' : 'text-gray-900'}
                `}>
                  {developer.totalPoints}
                </div>
                <div className="text-xs text-gray-500">pts</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary Stats */}
      {!isMobile && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {sortedDevelopers.reduce((sum, dev) => sum + dev.totalPoints, 0)}
              </div>
              <div className="text-xs text-gray-500">Total Points</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {sortedDevelopers.reduce((sum, dev) => sum + dev.completedTasks, 0)}
              </div>
              <div className="text-xs text-gray-500">Total Tasks</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {sortedDevelopers.reduce((sum, dev) => sum + dev.totalHours, 0).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Total Hours</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}