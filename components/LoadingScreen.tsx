import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Consulting Medical Archives..." }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-medical-50 text-slate-800 dark:bg-slate-900 dark:text-white transition-colors">
      
      {/* 3D Rotating Medical Cross */}
      <div className="relative w-24 h-24 perspective-1000 mb-12">
        <div className="w-full h-full transform-style-3d animate-spin-slow">
          {/* Vertical Bar */}
          <div className="absolute left-1/2 top-0 w-8 h-24 -ml-4 bg-medical-500 rounded-lg shadow-lg shadow-medical-500/50"></div>
          {/* Horizontal Bar */}
          <div className="absolute top-1/2 left-0 h-8 w-24 -mt-4 bg-medical-400 rounded-lg shadow-lg shadow-medical-400/50"></div>
          
          {/* Center Glow */}
          <div className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 bg-white rounded-full blur-md opacity-70 animate-pulse"></div>
        </div>
      </div>

      <h2 className="text-2xl font-black tracking-tight mb-2 animate-pulse">
        GENERATING CASE
      </h2>
      <p className="text-sm opacity-60 font-medium uppercase tracking-widest">
        Powered by Gemini 2.5
      </p>
      
      {message && (
        <p className="mt-8 px-6 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full text-sm font-medium">
            {message}
        </p>
      )}
    </div>
  );
};
