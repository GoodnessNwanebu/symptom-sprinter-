import React from 'react';
import { GAME_CONSTANTS } from '../constants';

interface HeaderProps {
  diagnosis: string;
  timeRemaining: number;
  score: number;
  combo: number;
  onPause: () => void;
}

export const Header: React.FC<HeaderProps> = ({ diagnosis, timeRemaining, score, combo, onPause }) => {
  const progressPercent = (timeRemaining / GAME_CONSTANTS.ROUND_DURATION) * 100;
  
  // Color shifts based on urgency
  const timerColor = timeRemaining < 3 ? 'bg-urgent-500' : 'bg-medical-500';

  return (
    <div className="w-full flex flex-col gap-4 p-4 pt-6 md:pt-8 pb-2 bg-white dark:bg-slate-800 shadow-lg z-20 rounded-b-3xl transition-colors">
      
      {/* Top Row: Title & Pause */}
      <div className="flex justify-between items-start">
        <div className="flex-1 text-center">
            <h1 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Diagnosis</h1>
            <div className="text-xl md:text-3xl font-black text-slate-800 dark:text-white leading-tight px-2">
            {diagnosis}
            </div>
        </div>
      </div>

      {/* Score & Combo Row */}
      <div className="flex items-center justify-between px-4">
         <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Score</span>
            <span className="text-2xl font-black text-medical-600 dark:text-medical-400">{score}</span>
         </div>
         
         {/* Combo Indicator */}
         <div className={`flex flex-col items-center transition-opacity duration-300 ${combo > 1 ? 'opacity-100' : 'opacity-0'}`}>
             <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Combo</span>
             <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < combo ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                ))}
             </div>
         </div>

         <div className="flex flex-col items-center">
             <button 
                onClick={onPause}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
             >
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
             </button>
         </div>
      </div>

      {/* Timer Bar */}
      <div className="relative w-full h-4 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
        <div 
            className={`absolute top-0 left-0 h-full ${timerColor} transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(14,165,233,0.5)]`}
            style={{ width: `${progressPercent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-500 mix-blend-difference">
            {timeRemaining.toFixed(1)}s
        </div>
      </div>
    </div>
  );
};
