import React from 'react';

interface CircularTimerProps {
  timeRemaining: number;
  totalTime: number;
  size?: number;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({ 
  timeRemaining, 
  totalTime,
  size = 60 
}) => {
  // Calculate progress percentage (0-100)
  const progress = (timeRemaining / totalTime) * 100;
  
  // Adjust stroke width and radius based on size (mobile vs desktop)
  const strokeWidth = size <= 48 ? 5 : 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke-dasharray (how much of the circle is filled)
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Color transitions: green → yellow → red
  let strokeColor = '#22c55e'; // success-500 (green)
  if (timeRemaining < 3) {
    strokeColor = '#ef4444'; // urgent-500 (red)
  } else if (timeRemaining < 5) {
    // Interpolate between green and red
    const ratio = (timeRemaining - 3) / 2; // 0 to 1
    strokeColor = `rgb(${Math.round(34 + (239 - 34) * (1 - ratio))}, ${Math.round(197 + (68 - 197) * (1 - ratio))}, ${Math.round(92 + (68 - 92) * (1 - ratio))})`;
  }

  // Font size based on size (mobile vs desktop)
  const fontSize = size <= 48 ? 'text-xs' : 'text-sm';

  return (
    <div className="relative flex flex-col items-center flex-shrink-0">
      {/* Timer Label - Hide on very small mobile */}
      <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase mb-0.5 leading-none hidden sm:block">Time</span>
      
      {/* Circular SVG Timer */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle (gray) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            className="opacity-30"
          />
          
          {/* Progress circle (green → red) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-100 ease-linear"
            style={{
              filter: size > 48 ? 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.4))' : 'none',
            }}
          />
        </svg>
        
        {/* Time Text in Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-black leading-none`} style={{ color: strokeColor }}>
            {timeRemaining.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};
