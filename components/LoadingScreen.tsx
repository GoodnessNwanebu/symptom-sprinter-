import React from 'react';

interface LoadingScreenProps {
  message?: string;
  error?: string;
  retryCount?: number;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Consulting Medical Archives...",
  error,
  retryCount,
  onRetry,
  onGoHome
}) => {
  // Error state - show network error message
  if (error) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-medical-500 to-medical-900 text-white p-6">
        
        {/* Error Icon */}
        <div className="text-6xl mb-6">⚠️</div>

        <h2 className="text-2xl font-black tracking-tight mb-4 text-center">
          NETWORK ERROR
        </h2>
        
        <div className="max-w-md text-center mb-6 space-y-3">
          <p className="text-lg font-medium opacity-90">
            {error}
          </p>
          {retryCount !== undefined && retryCount > 0 && (
            <p className="text-sm opacity-75">
              Retry attempt {4 - retryCount} of 3. Please wait...
            </p>
          )}
          {retryCount === 0 && (
            <p className="text-sm opacity-75">
              All retry attempts failed. Please check your connection and try again.
            </p>
          )}
        </div>

        {onGoHome && (
          <button
            onClick={onGoHome}
            className="px-6 py-3 bg-white text-medical-600 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition-colors"
          >
            Return to Home
          </button>
        )}
      </div>
    );
  }

  // Normal loading state
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-medical-500 to-medical-900 text-white">
      
      {/* 3D Rotating Medical Cross */}
      <div className="relative w-24 h-24 perspective-1000 mb-12">
        <div className="w-full h-full transform-style-3d animate-spin-slow">
          {/* Vertical Bar */}
          <div className="absolute left-1/2 top-0 w-8 h-24 -ml-4 bg-white rounded-lg shadow-lg shadow-white/50"></div>
          {/* Horizontal Bar */}
          <div className="absolute top-1/2 left-0 h-8 w-24 -mt-4 bg-white/80 rounded-lg shadow-lg shadow-white/50"></div>
          
          {/* Center Glow */}
          <div className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 bg-white rounded-full blur-md opacity-70 animate-pulse"></div>
        </div>
      </div>

      <h2 className="text-2xl font-black tracking-tight mb-2 animate-pulse">
        GENERATING CASE
      </h2>
      <p className="text-sm opacity-80 font-medium uppercase tracking-widest">
        Powered by Gemini 2.5
      </p>
      
      {message && (
        <p className="mt-8 px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
            {message}
        </p>
      )}
    </div>
  );
};
