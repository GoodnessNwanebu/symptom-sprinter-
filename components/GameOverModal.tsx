import React from 'react';

interface GameOverModalProps {
  runScore: number;
  highScore: number;
  isNewHighScore: boolean;
  previousHighScore?: number; // Previous high score before update (for display)
  onTryAgain: () => void;
  onMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  runScore,
  highScore,
  isNewHighScore,
  previousHighScore = 0,
  onTryAgain,
  onMenu,
}) => {
  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border-t-4 border-medical-500 transform animate-bounce-slight">
        <div className="flex flex-col items-center">
          {/* Game Over Icon */}
          <div className="text-6xl mb-4">💀</div>
          
          <h2 className="text-3xl font-black text-center mb-2 text-slate-800">
            GAME OVER!
          </h2>
          
          {/* Score Display */}
          <div className="bg-slate-100 rounded-2xl p-4 mb-6 w-full">
            {isNewHighScore ? (
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">New High Score!</p>
                <p className="text-4xl font-black text-medical-600">{formatScore(runScore)}</p>
                {previousHighScore > 0 && (
                  <p className="text-sm text-slate-500 mt-2">Previous Best: {formatScore(previousHighScore)}</p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Run Score</p>
                <p className="text-4xl font-black text-medical-600">{formatScore(runScore)}</p>
                <p className="text-sm text-slate-500 mt-2">Best: {formatScore(highScore)}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button 
              onClick={onMenu}
              className="py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Menu
            </button>
            <button 
              onClick={onTryAgain}
              className="py-3 bg-medical-500 text-white rounded-xl font-bold shadow-lg shadow-medical-500/30 hover:bg-medical-600 transition-colors active:scale-95"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

