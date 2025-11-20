import React from 'react';

// LEADERBOARD DISABLED - Currently showing "Coming Soon!" message
// To re-enable: Uncomment the imports and full implementation below, then uncomment submitScore in App.tsx

// import { useState, useEffect } from 'react';
// import { getLeaderboard, getUserRank, LeaderboardEntry } from '../services/leaderboardService';

interface LeaderboardModalProps {
  onClose: () => void;
  currentUsername?: string;
  currentTotalScore?: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  // Simple "Coming Soon!" modal - replace with real leaderboard when ready
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl border-t-4 border-medical-500 transform animate-bounce-slight">
        <div className="flex flex-col items-center">
          {/* Trophy Icon */}
          <div className="text-6xl mb-4">🏆</div>
          
          <h2 className="text-3xl font-black text-center mb-2 text-slate-800">
            Leaderboard
          </h2>
          
          <p className="text-lg text-center text-slate-600 mb-6 font-medium">
            Coming Soon!
          </p>
          
          <p className="text-sm text-center text-slate-500 mb-6">
            Compete with players worldwide and see how you rank.
          </p>
          
          <button 
            onClick={onClose}
            className="w-full py-3 bg-medical-500 text-white rounded-xl font-bold shadow-lg shadow-medical-500/30 hover:bg-medical-600 transition-colors active:scale-95"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );

  /* LEADERBOARD ENABLED - Uncomment below when ready to enable leaderboard
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(10);
      setLeaderboard(data);
      
      if (currentUsername) {
        const rank = await getUserRank(currentUsername);
        setUserRank(rank);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-t-4 border-medical-500 transform animate-bounce-slight max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex flex-col items-center mb-4 flex-shrink-0">
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-2xl font-black text-center mb-1 text-slate-800">
            World Leaderboard
          </h2>
          {userRank && (
            <p className="text-sm text-center text-slate-600">
              Your Rank: <span className="font-black text-medical-600">#{userRank}</span>
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-slate-500">
              Loading leaderboard...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No scores yet. Be the first!
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const isCurrentUser = entry.username === currentUsername;
              return (
                <div
                  key={entry.id || index}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    isCurrentUser 
                      ? 'bg-medical-50 border-2 border-medical-400' 
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-300 text-orange-800' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`font-bold truncate ${isCurrentUser ? 'text-medical-700' : 'text-slate-700'}`}>
                      {entry.username}
                      {isCurrentUser && <span className="text-xs ml-1 text-medical-600">(You)</span>}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-black text-medical-600">{formatScore(entry.total_score)}</div>
                    <div className="text-xs text-slate-500">Best: {formatScore(entry.high_score)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-medical-500 text-white rounded-xl font-bold shadow-lg shadow-medical-500/30 hover:bg-medical-600 transition-colors active:scale-95 flex-shrink-0"
        >
          Close
        </button>
      </div>
    </div>
  );
  */
};
