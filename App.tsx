import React, { useState, useEffect, useRef } from 'react';
import { RoundData, GameStatus, TileData, TileState, ScoreLog } from './types';
import { GAME_CONSTANTS, SCORING, FALLBACK_ROUNDS } from './constants';
import { generateRoundData } from './services/geminiService';
import { Tile } from './components/Tile';
import { Header } from './components/Header';
import { LoadingScreen } from './components/LoadingScreen';
import { FloatingScore } from './components/FloatingScore';

// --- Icons ---
const TrophyIcon = () => (
  <svg className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 5.26A5.002 5.002 0 0 0 11 17v2H7v2h10v-2h-4v-2c2.34-.55 4.1-2.3 4.39-5.26C19.9 10.63 21 8.55 21 6v-1c0-1.1-.9-2-2-2zm-12 3V7h2v1H7zm10 0h-2V7h2v1z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);

const App: React.FC = () => {
  // -- State --
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.MENU);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(GAME_CONSTANTS.ROUND_DURATION);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pastScores, setPastScores] = useState<ScoreLog[]>([]);
  
  // Floating scores
  const [floatingScores, setFloatingScores] = useState<{id: number, val: number, x: number, y: number}[]>([]);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -- Effects --

  // Load high score / theme
  useEffect(() => {
    const savedHS = localStorage.getItem('symptom_sprinter_hs');
    if (savedHS) setHighScore(parseInt(savedHS));
    
    const savedTheme = localStorage.getItem('symptom_sprinter_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('symptom_sprinter_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('symptom_sprinter_theme', 'light');
    }
  };

  const startGame = async () => {
    setGameStatus(GameStatus.LOADING_ROUND);
    setScore(0);
    setCombo(0);
    try {
      const data = await generateRoundData();
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

      setScore((prev: number) => prev + points);
      triggerFloatingScore(points, x, y);

      // Check if round complete (all correct found)
      const relevantTiles = newTiles.filter(t => t.isRelevant);
      const foundTiles = relevantTiles.filter(t => t.state === TileState.CORRECT);
      
      if (foundTiles.length === relevantTiles.length) {
        // Perfect finish
        if (newCombo === relevantTiles.length) {
            setScore((prev: number) => prev + SCORING.PERFECT_ROUND_BONUS);
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
      setScore((prev: number) => prev + SCORING.INCORRECT_PICK); // Adding negative number
      triggerFloatingScore(SCORING.INCORRECT_PICK, x, y);
    }

    setTiles(newTiles);
  };

  const triggerFloatingScore = (val: number, x: number, y: number) => {
    const id = Date.now();
    setFloatingScores((prev: {id: number, val: number, x: number, y: number}[]) => [...prev, { id, val, x, y }]);
  };

  const removeFloatingScore = (id: number) => {
    setFloatingScores((prev: {id: number, val: number, x: number, y: number}[]) => prev.filter((fs: {id: number, val: number, x: number, y: number}) => fs.id !== id));
  };

  const handleRoundOver = (_earlyWin: boolean = false, currentTiles?: TileData[]) => {
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

    // Save score
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('symptom_sprinter_hs', score.toString());
    }
    
    const newLog: ScoreLog = {
        score,
        diagnosis: roundData?.diagnosis || "Unknown",
        date: Date.now()
    };
    setPastScores((prev: ScoreLog[]) => [newLog, ...prev].slice(0, 10)); // Keep last 10
  };

  const nextRound = async () => {
     // Keep score, new round
     setGameStatus(GameStatus.LOADING_ROUND);
     try {
         const data = await generateRoundData();
         // Reset time but keep score
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
      <div className="min-h-screen bg-gradient-to-br from-medical-500 to-medical-900 dark:from-slate-900 dark:to-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Background Decor */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-urgent-500/20 rounded-full blur-3xl"></div>

        <div className="z-10 flex flex-col items-center w-full max-w-md">
            <div className="mb-8 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <TrophyIcon />
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

            {pastScores.length > 0 && (
                <div className="w-full bg-black/20 rounded-xl p-4 backdrop-blur-sm mt-4">
                    <h3 className="text-white/60 text-xs font-bold uppercase mb-2">Recent Diagnoses</h3>
                    {pastScores.slice(0,3).map((log: ScoreLog, i: number) => (
                        <div key={i} className="flex justify-between text-white text-sm py-1 border-b border-white/10 last:border-0">
                            <span className="truncate pr-2">{log.diagnosis}</span>
                            <span className="font-bold">{log.score}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <button 
            onClick={toggleTheme}
            className="absolute top-6 right-6 p-3 bg-white/10 rounded-full backdrop-blur-md text-white hover:bg-white/20 transition"
        >
            <SettingsIcon />
        </button>
      </div>
    );
  }

  // 2. Loading
  if (gameStatus === GameStatus.LOADING_ROUND) {
    return <LoadingScreen />;
  }

  // 3. Playing or Round Over
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-slate-900 transition-colors">
      <Header 
        diagnosis={roundData?.diagnosis || "Loading..."} 
        score={score}
        timeRemaining={timeRemaining}
        combo={combo}
        onPause={() => { /* Simple pause not fully implemented for brevity */ }}
      />

      <main className="flex-1 p-4 md:p-6 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-md grid grid-cols-3 gap-3 md:gap-4 auto-rows-fr">
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
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border-t-4 border-medical-500 transform animate-bounce-slight">
                <h2 className="text-3xl font-black text-center mb-2 text-slate-800 dark:text-white">
                    TIME'S UP!
                </h2>
                
                <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-4 mb-6 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Final Score</p>
                        <p className="text-4xl font-black text-medical-600 dark:text-medical-400">{score}</p>
                    </div>
                    {score > (highScore - score) && score > 0 && ( // Just a visual logic for "good job"
                        <div className="text-5xl">🎉</div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={returnToMenu}
                        className="py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
