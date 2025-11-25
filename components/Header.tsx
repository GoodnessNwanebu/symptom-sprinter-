import React from 'react';
import { GAME_CONSTANTS, HEALTH } from '../constants';
import { UsernameEditor } from './UsernameEditor';
import { CircularTimer } from './CircularTimer';

interface HeaderProps {
  username: string;
  onUsernameSave: (username: string) => void;
  timeRemaining: number;
  score: number;
  highScore: number;
  combo: number;
  health: number; // 0-100
  onPause: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  username, 
  onUsernameSave, 
  timeRemaining, 
  score, 
  highScore,
  combo,
  health}) => {
  
  // Health bar color logic
  const getHealthColor = () => {
    if (health >= HEALTH.GREEN_THRESHOLD) {
      return 'bg-green-500';
    } else if (health >= HEALTH.YELLOW_THRESHOLD) {
      return 'bg-amber-500';
    } else {
      return 'bg-red-500';
    }
  };

  const getHealthBgColor = () => {
    if (health >= HEALTH.GREEN_THRESHOLD) {
      return 'bg-green-100';
    } else if (health >= HEALTH.YELLOW_THRESHOLD) {
      return 'bg-amber-100';
    } else {
      return 'bg-red-100';
    }
  };

  const healthPercentage = Math.max(0, Math.min(100, health));
  const isLowHealth = health < HEALTH.YELLOW_THRESHOLD;

  return (
    <div className="w-full bg-white/90 backdrop-blur-sm shadow-lg px-2 md:px-4 py-2 md:py-3 flex-shrink-0">
      
      {/* Mobile Layout: Single row, more compact */}
      <div className="flex md:hidden items-center justify-between gap-1.5">
        
        {/* Left: Username (compact) */}
        <div className="flex-shrink-0 max-w-[90px]">
          <UsernameEditor 
            initialUsername={username} 
            onSave={onUsernameSave}
          />
        </div>

        {/* Center: Scores (horizontal, compact) */}
        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
          {/* Run Score */}
          <div className="bg-medical-50 rounded-lg px-2 py-1 border-2 border-medical-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5 leading-none">Score</p>
            <p className="text-lg font-black text-medical-600 leading-none">{score}</p>
          </div>
          
          {/* High Score */}
          <div className="bg-yellow-50 rounded-lg px-2 py-1 border-2 border-yellow-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5 leading-none">Best</p>
            <p className="text-lg font-black text-yellow-600 leading-none">{highScore}</p>
          </div>
        </div>

        {/* Right: Timer and Pause */}
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {/* Combo Indicator (mobile: very small, only when active) */}
          {combo > 1 && (
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-orange-500 uppercase leading-none">C</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-1 h-1 rounded-full ${i < combo ? 'bg-orange-500' : 'bg-slate-300'}`} />
                ))}
              </div>
            </div>
          )}
          
          {/* Circular Timer (smaller on mobile) */}
          <CircularTimer 
            timeRemaining={timeRemaining} 
            totalTime={GAME_CONSTANTS.ROUND_DURATION}
            size={50}
          />
          
          {/* Pause Button (smaller on mobile) */}
         
        </div>
      </div>

      {/* Desktop Layout: Spacious single row */}
      <div className="hidden md:flex items-center justify-between gap-3">
        
        {/* Left: Username */}
        <div className="flex-shrink-0">
          <UsernameEditor 
            initialUsername={username} 
            onSave={onUsernameSave}
          />
        </div>

        {/* Center: Scores (stacked) */}
        <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
          {/* Run Score */}
          <div className="bg-medical-50 rounded-2xl px-3 py-2 border-2 border-medical-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Score</p>
            <p className="text-xl font-black text-medical-600 leading-none">{score}</p>
          </div>
          
          {/* High Score */}
          <div className="bg-yellow-50 rounded-2xl px-3 py-2 border-2 border-yellow-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Best</p>
            <p className="text-xl font-black text-yellow-600 leading-none">{highScore}</p>
          </div>
        </div>

        {/* Right: Timer and Pause */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {/* Combo Indicator (desktop: normal size) */}
          {combo > 1 && (
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-orange-500 uppercase tracking-wider">Combo</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < combo ? 'bg-orange-500' : 'bg-slate-300'}`} />
                ))}
              </div>
            </div>
          )}
          
          {/* Circular Timer */}
          <CircularTimer 
            timeRemaining={timeRemaining} 
            totalTime={GAME_CONSTANTS.ROUND_DURATION}
            size={56}
          />
          
          {/* Pause Button */}
        
        </div>
      </div>

      {/* Health Bar - Below header content, inside same container */}
      <div className="mt-3 pt-3 border-t border-slate-200/50">
        <div className="max-w-md mx-auto">
          {/* Health Label */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Health</span>
            <span className={`text-sm font-black ${health >= HEALTH.GREEN_THRESHOLD ? 'text-green-600' : health >= HEALTH.YELLOW_THRESHOLD ? 'text-amber-600' : 'text-red-600'}`}>
              {Math.round(health)}/100
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
    </div>
  );
};
