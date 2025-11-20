import React from 'react';
import { TileData, TileState } from '../types';

interface TileProps {
  data: TileData;
  onClick: (id: string) => void;
  disabled: boolean;
}

export const Tile: React.FC<TileProps> = ({ data, onClick, disabled }) => {
  const baseClasses = "relative w-full aspect-square rounded-xl flex items-center justify-center p-2 text-center text-sm md:text-base font-bold transition-all duration-100 select-none touch-manipulation";
  
  // 3D Effect Logic:
  // Idle: Border-b-4, translate-y-0
  // Active/Pressed: Border-b-0, translate-y-1
  
  let colorClasses = "";
  let transformClasses = "";

  switch (data.state) {
    case TileState.IDLE:
      colorClasses = "bg-white text-slate-700 border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 shadow-sm";
      if (!disabled) {
        colorClasses += " hover:brightness-95 active:brightness-90 cursor-pointer";
      } else {
        colorClasses += " opacity-50 cursor-not-allowed active:border-b-4 active:translate-y-0";
      }
      break;

    case TileState.CORRECT:
      // Green success state
      colorClasses = "bg-medical-500 text-white border-b-0 translate-y-1 shadow-inner ring-4 ring-medical-200";
      transformClasses = "animate-bounce-slight";
      break;

    case TileState.INCORRECT:
      // Red error state
      colorClasses = "bg-urgent-500 text-white border-b-0 translate-y-1 shadow-inner opacity-60";
      transformClasses = "animate-pulse";
      break;

    case TileState.MISSED:
        // Show what they missed
        colorClasses = "bg-medical-100 text-medical-600 border-2 border-dashed border-medical-400";
        break;
  }

  return (
    <button
      onClick={() => !disabled && onClick(data.id)}
      className={`${baseClasses} ${colorClasses} ${transformClasses}`}
      disabled={disabled || data.state !== TileState.IDLE}
    >
      <span className="drop-shadow-sm leading-tight break-words min-w-0 w-full px-1" style={{ overflowWrap: 'break-word', wordBreak: 'break-word', hyphens: 'auto' }}>
        {data.text}
      </span>
      
      {/* Icon overlay for feedback */}
      {data.state === TileState.CORRECT && (
        <div className="absolute inset-0 flex items-center justify-center bg-medical-500/20 rounded-xl">
          <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
        </div>
      )}
      {data.state === TileState.INCORRECT && (
        <div className="absolute inset-0 flex items-center justify-center bg-urgent-500/20 rounded-xl">
           <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
      )}
    </button>
  );
};
