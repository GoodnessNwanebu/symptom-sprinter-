import React, { useState, useEffect, useRef } from 'react';
import { RoundData, GameStatus, TileData, TileState } from './types';
import { GAME_CONSTANTS, SCORING, FALLBACK_ROUNDS } from './constants';
import { generateRoundData } from './services/geminiService';
import { Tile } from './components/Tile';
import { Header } from './components/Header';
import { LoadingScreen } from './components/LoadingScreen';
import { FloatingScore } from './components/FloatingScore';
import { LeaderboardModal } from './components/LeaderboardModal';
import { DiagnosisBanner } from './components/DiagnosisBanner';
// LEADERBOARD DISABLED - Uncomment when ready to enable leaderboard
// import { submitScore } from './services/leaderboardService';

// --- Icons ---
// Leaderboard Icon (Simple SVG)
const LeaderboardIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const App: React.FC = () => {
  // -- State --
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.MENU);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [score, setScore] = useState(0); // Current total score (persistent across sessions)
  const [highScore, setHighScore] = useState(0); // Best single session score
  const [sessionStartScore, setSessionStartScore] = useState(0); // Track score at session start for high score calculation
  const [combo, setCombo] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(GAME_CONSTANTS.ROUND_DURATION);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Username with random number generation
  const generatePlayerName = (): string => {
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    return `Player#${randomNum}`;
  };
  
  const [username, setUsername] = useState<string>('Player#1234'); // Temporary initial value
  
  // Floating scores
  const [floatingScores, setFloatingScores] = useState<{id: number, val: number, x: number, y: number}[]>([]);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -- Effects --

  // Load total score and high score from localStorage
  useEffect(() => {
    // Load persistent total score
    const savedTotalScore = localStorage.getItem('symptom_sprinter_total_score');
    if (savedTotalScore) {
      const totalScore = parseInt(savedTotalScore);
      setScore(totalScore);
      setSessionStartScore(totalScore);
    }
    
    // Load high score (best single session)
    const savedHS = localStorage.getItem('symptom_sprinter_hs');
    if (savedHS) setHighScore(parseInt(savedHS));
    
    // Load username (if doesn't exist, generate new one)
    const savedUsername = localStorage.getItem('symptom_sprinter_username');
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      // Generate and save new username
      const generated = generatePlayerName();
      setUsername(generated);
      localStorage.setItem('symptom_sprinter_username', generated);
    }
  }, []);
  
  // Handle username save
  const handleUsernameSave = (newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem('symptom_sprinter_username', newUsername);
  };

  // Timer Logic
  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev: number) => {
          if (prev <= 0.1) {
            handleRoundOver();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus]);

  // -- Handlers --

  // Helper to get recent diagnoses from localStorage for variety
  const getRecentDiagnoses = (): string[] => {
    try {
      const saved = localStorage.getItem('symptom_sprinter_recent_diagnoses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  // Helper to save a new diagnosis to recent list (keep last 10)
  const saveRecentDiagnosis = (diagnosis: string) => {
    try {
      const recent = getRecentDiagnoses();
      const updated = [diagnosis, ...recent.filter(d => d !== diagnosis)].slice(0, 10);
      localStorage.setItem('symptom_sprinter_recent_diagnoses', JSON.stringify(updated));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  };

  const startGame = async () => {
    setGameStatus(GameStatus.LOADING_ROUND);
    // Load total score from localStorage (persists across sessions)
    const savedTotalScore = localStorage.getItem('symptom_sprinter_total_score');
    const currentTotalScore = savedTotalScore ? parseInt(savedTotalScore) : 0;
    setScore(currentTotalScore);
    setSessionStartScore(currentTotalScore); // Track session start for high score calculation
    setCombo(0);
    try {
      // Get recent diagnoses to avoid repetition
      const recentDiagnoses = getRecentDiagnoses();
      const data = await generateRoundData(recentDiagnoses);
      saveRecentDiagnosis(data.diagnosis); // Save for future rounds
      startRound(data);
    } catch (e) {
      console.warn("Using fallback data due to API error");
      startRound(FALLBACK_ROUNDS[0]);
    }
  };

  const startRound = (data: RoundData) => {
    setRoundData(data);
    setTiles(data.tiles);
    setTimeRemaining(GAME_CONSTANTS.ROUND_DURATION);
    setGameStatus(GameStatus.PLAYING);
  };

  const handleTileClick = (id: string) => {
    if (gameStatus !== GameStatus.PLAYING) return;

    const tileIndex = tiles.findIndex((t: TileData) => t.id === id);
    if (tileIndex === -1) return;
    const tile = tiles[tileIndex];

    // Calculate center of tile for floating score
    // We can't easily get exact DOM coordinates without ref refs, 
    // so we'll just randomize slightly around center screen or use mouse event if we passed it.
    // Ideally, we pass the event. But simpler here:
    const x = window.innerWidth / 2 + (Math.random() * 100 - 50);
    const y = window.innerHeight / 2 + (Math.random() * 100 - 50);

    const newTiles = [...tiles];

    if (tile.isRelevant) {
      // Correct!
      newTiles[tileIndex] = { ...tile, state: TileState.CORRECT };
      
      let points = SCORING.CORRECT_PICK;
      const newCombo = combo + 1;
      setCombo(newCombo);

      // Combo Bonus
      if (newCombo === 5) {
        points += SCORING.COMBO_BONUS;
        triggerFloatingScore(SCORING.COMBO_BONUS, x, y - 50);
      }

      setScore((prev: number) => {
        const newScore = prev + points;
        // Save total score to localStorage whenever it changes
        localStorage.setItem('symptom_sprinter_total_score', newScore.toString());
        return newScore;
      });
      triggerFloatingScore(points, x, y);

      // Check if round complete (all correct found)
      const relevantTiles = newTiles.filter(t => t.isRelevant);
      const foundTiles = relevantTiles.filter(t => t.state === TileState.CORRECT);
      
      if (foundTiles.length === relevantTiles.length) {
        // Perfect finish
        if (newCombo === relevantTiles.length) {
            setScore((prev: number) => {
              const newScore = prev + SCORING.PERFECT_ROUND_BONUS;
              localStorage.setItem('symptom_sprinter_total_score', newScore.toString());
              return newScore;
            });
            triggerFloatingScore(SCORING.PERFECT_ROUND_BONUS, window.innerWidth/2, window.innerHeight/3);
        }
        setTiles(newTiles);
        handleRoundOver(true, newTiles); // Pass newTiles to avoid stale state
        return;
      }

    } else {
      // Incorrect!
      newTiles[tileIndex] = { ...tile, state: TileState.INCORRECT };
      setCombo(0);
      setScore((prev: number) => {
        const newScore = prev + SCORING.INCORRECT_PICK; // Adding negative number
        // Save total score to localStorage whenever it changes
        localStorage.setItem('symptom_sprinter_total_score', newScore.toString());
        return newScore;
      });
      triggerFloatingScore(SCORING.INCORRECT_PICK, x, y);
    }

    setTiles(newTiles);
  };

  const triggerFloatingScore = (val: number, x: number, y: number) => {
    // Use performance.now() + random for unique IDs to prevent duplicate keys
    const id = performance.now() + Math.random();
    setFloatingScores((prev: {id: number, val: number, x: number, y: number}[]) => [...prev, { id, val, x, y }]);
  };

  const removeFloatingScore = (id: number) => {
    setFloatingScores((prev: {id: number, val: number, x: number, y: number}[]) => prev.filter((fs: {id: number, val: number, x: number, y: number}) => fs.id !== id));
  };

  const handleRoundOver = async (_earlyWin: boolean = false, currentTiles?: TileData[]) => {
    setGameStatus(GameStatus.ROUND_OVER);
    
    // Reveal missed items
    const tilesToCheck = currentTiles || tiles;
    const revealedTiles = tilesToCheck.map((t: TileData) => {
      if (t.isRelevant && t.state === TileState.IDLE) {
        return { ...t, state: TileState.MISSED };
      }
      return t;
    });
    setTiles(revealedTiles);

    // Calculate session score (change in score during this session) for high score tracking
    const sessionScore = score - sessionStartScore;
    
    if (sessionScore > highScore) {
      setHighScore(sessionScore);
      localStorage.setItem('symptom_sprinter_hs', sessionScore.toString());
    }

    // LEADERBOARD DISABLED - Score submission commented out
    // To re-enable: Uncomment the LeaderboardModal implementation and this code
    /*
    const newHighScore = sessionScore > highScore ? sessionScore : highScore;
    if (username && score > 0) {
      submitScore(username, score, newHighScore).catch(error => {
        console.error('Failed to submit score to leaderboard:', error);
        // Don't show error to user, just log it
      });
    }
    */
  };

  const nextRound = async () => {
     // Keep total score, new round
     setGameStatus(GameStatus.LOADING_ROUND);
     try {
         // Get recent diagnoses to avoid repetition
         const recentDiagnoses = getRecentDiagnoses();
         const data = await generateRoundData(recentDiagnoses);
         saveRecentDiagnosis(data.diagnosis); // Save for future rounds
         // Reset time but keep total score (persists across rounds)
         setRoundData(data);
         setTiles(data.tiles);
         setTimeRemaining(GAME_CONSTANTS.ROUND_DURATION);
         setCombo(0);
         setGameStatus(GameStatus.PLAYING);
     } catch(e) {
         // If API fails mid-game, just end it or reuse fallback
         console.error(e);
         startRound(FALLBACK_ROUNDS[0]); // simplistic fallback
     }
  };

  const returnToMenu = () => {
    setGameStatus(GameStatus.MENU);
  };

  // --- Render Components ---

  // 1. Menu
  if (gameStatus === GameStatus.MENU) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-500 to-medical-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Background Decor */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-urgent-500/20 rounded-full blur-3xl"></div>

        {/* Total Score Bubble - Top Left */}
        <div className="absolute top-6 left-6 z-10">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg border-2 border-white/50">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Score</p>
            <p className="text-2xl font-black text-medical-600">{score}</p>
          </div>
        </div>

        <div className="z-10 flex flex-col items-center w-full max-w-md">
            <div className="mb-8 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="text-6xl">🏆</div>
            </div>
            
            <h1 className="text-5xl font-black text-white mb-2 tracking-tighter drop-shadow-md text-center">
              SYMPTOM<br/>SPRINTER
            </h1>
            <p className="text-medical-100 mb-12 font-medium tracking-wide">DIAGNOSE OR LOSE</p>

            <button 
              onClick={startGame}
              className="w-full bg-white text-medical-600 text-xl font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(203,213,225)] active:shadow-none active:translate-y-[6px] transition-all mb-4 hover:bg-gray-50"
            >
              START GAME
            </button>
        </div>

        {/* Leaderboard Button */}
        <button 
            onClick={() => setShowLeaderboard(true)}
            className="absolute top-6 right-6 p-3 bg-white/10 rounded-full backdrop-blur-md text-white hover:bg-white/20 transition z-10"
        >
            <LeaderboardIcon />
        </button>

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <LeaderboardModal 
            onClose={() => setShowLeaderboard(false)}
            currentUsername={username}
            currentTotalScore={score}
          />
        )}
      </div>
    );
  }

  // 2. Loading
  if (gameStatus === GameStatus.LOADING_ROUND) {
    return <LoadingScreen />;
  }

  // 3. Playing or Round Over
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-medical-500 to-medical-900">
      {/* Header */}
      <Header 
        username={username}
        onUsernameSave={handleUsernameSave}
        score={score}
        highScore={highScore}
        timeRemaining={timeRemaining}
        combo={combo}
        onPause={() => { /* Simple pause not fully implemented for brevity */ }}
      />

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-3 gap-3 min-h-0 overflow-hidden">
        {/* Diagnosis Banner */}
        {roundData && (
          <DiagnosisBanner diagnosis={roundData.diagnosis} />
        )}

        {/* Game Grid - Responsive sizing to fit screen */}
        <div className="w-full max-w-md grid grid-cols-3 gap-2 md:gap-3 auto-rows-fr flex-shrink-0" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {tiles.map((tile: TileData) => (
                <Tile 
                    key={tile.id} 
                    data={tile} 
                    onClick={handleTileClick}
                    disabled={gameStatus !== GameStatus.PLAYING}
                />
            ))}
        </div>
      </main>

      {/* Round Over Modal */}
      {gameStatus === GameStatus.ROUND_OVER && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border-t-4 border-medical-500 transform animate-bounce-slight">
                <h2 className="text-3xl font-black text-center mb-2 text-slate-800">
                    TIME'S UP!
                </h2>
                
                <div className="bg-slate-100 rounded-2xl p-4 mb-6 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Total Score</p>
                        <p className="text-4xl font-black text-medical-600">{score}</p>
                    </div>
                    {(() => {
                        const sessionScore = score - sessionStartScore;
                        return sessionScore > highScore && sessionScore > 0 && (
                        <div className="text-5xl">🎉</div>
                        );
                    })()}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={returnToMenu}
                        className="py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        Menu
                    </button>
                    <button 
                        onClick={nextRound}
                        className="py-3 bg-medical-500 text-white rounded-xl font-bold shadow-lg shadow-medical-500/30 hover:bg-medical-600 transition-colors active:scale-95"
                    >
                        Next Case
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Floating Scores Layer */}
      {floatingScores.map((fs: {id: number, val: number, x: number, y: number}) => (
        <FloatingScore 
            key={fs.id} 
            val={fs.val} 
            x={fs.x} 
            y={fs.y} 
            onComplete={() => removeFloatingScore(fs.id)} 
        />
      ))}
    </div>
  );
};

export default App;
