import React from 'react';
import { HEALTH } from '../constants';

interface HealthBarProps {
  currentHealth: number; // 0-100
}

export const HealthBar: React.FC<HealthBarProps> = ({ currentHealth }) => {
  // Determine color zone
  const getHealthColor = () => {
    if (currentHealth >= HEALTH.GREEN_THRESHOLD) {
      return 'bg-green-500';
    } else if (currentHealth >= HEALTH.YELLOW_THRESHOLD) {
      return 'bg-amber-500';
    } else {
      return 'bg-red-500';
    }
  };

  const getHealthBgColor = () => {
    if (currentHealth >= HEALTH.GREEN_THRESHOLD) {
      return 'bg-green-100';
    } else if (currentHealth >= HEALTH.YELLOW_THRESHOLD) {
      return 'bg-amber-100';
    } else {
      return 'bg-red-100';
    }
  };

  const healthPercentage = Math.max(0, Math.min(100, currentHealth));
  const isLowHealth = currentHealth < HEALTH.YELLOW_THRESHOLD;

  return (
    <div className="w-full px-2 md:px-4 py-2 bg-white/90 backdrop-blur-sm">
      <div className="max-w-md mx-auto rounded-2xl p-3 shadow-lg border-2 border-white/50">
        {/* Health Label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Health</span>
          <span className={`text-sm font-black ${currentHealth >= HEALTH.GREEN_THRESHOLD ? 'text-green-600' : currentHealth >= HEALTH.YELLOW_THRESHOLD ? 'text-amber-600' : 'text-red-600'}`}>
            {Math.round(currentHealth)}/100
          </span>
        </div>
        
        {/* Health Bar Container - 3D game-like style similar to start button */}
        <div className={`relative h-6 rounded-xl ${getHealthBgColor()} border-2 border-white/30 shadow-inner overflow-hidden`}>
          {/* Health Fill - with 3D effect */}
          <div
            className={`absolute top-0 left-0 h-full ${getHealthColor()} transition-all duration-300 ease-out rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.2)] ${
              isLowHealth ? 'animate-pulse' : ''
            }`}
            style={{ width: `${healthPercentage}%` }}
          >
            {/* Shine effect for 3D look */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-lg"></div>
          </div>
          
          {/* Health percentage text overlay (optional, for better visibility) */}
          {healthPercentage < 50 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-white drop-shadow-md">
                {Math.round(healthPercentage)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

