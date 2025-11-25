import React, { useState, useEffect, useRef } from 'react';
import { RoundData, GameStatus, TileData, TileState } from './types';
import { GAME_CONSTANTS, SCORING, FALLBACK_ROUNDS, HEALTH } from './constants';
import { generateRoundData } from './services/geminiService';
import { getPlayerRecentDiagnoses, savePlayerDiagnosis } from './services/playerService';
import { Tile } from './components/Tile';
import { Header } from './components/Header';
import { LoadingScreen } from './components/LoadingScreen';
import { FloatingScore } from './components/FloatingScore';
import { FloatingHealth } from './components/FloatingHealth';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GameOverModal } from './components/GameOverModal';
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
  const [runScore, setRunScore] = useState(0); // Current run score (resets each run)
  const [highScore, setHighScore] = useState(0); // Best run score (persisted)
  const [previousHighScore, setPreviousHighScore] = useState(0); // Previous high score before update (for game over modal)
  const [health, setHealth] = useState(HEALTH.STARTING_HEALTH); // Current health (0-100)
  const [combo, setCombo] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(GAME_CONSTANTS.ROUND_DURATION);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Error handling state
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(3); // Number of retries remaining
  
  // Username with random number generation
  const generatePlayerName = (): string => {
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    return `Player#${randomNum}`;
  };
  
  const [username, setUsername] = useState<string>('Player#1234'); // Temporary initial value
  
  // Floating scores and health
  const [floatingScores, setFloatingScores] = useState<{id: number, val: number, x: number, y: number}[]>([]);
  const [floatingHealth, setFloatingHealth] = useState<{id: number, val: number, x: number, y: number}[]>([]);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // -- Effects --

  // Prevent body scrolling on menu screen
  useEffect(() => {
    if (gameStatus === GameStatus.MENU) {
      // Disable scrolling on menu
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // Enable scrolling on game screen
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    // Cleanup: restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [gameStatus]);

  // Load high score and handle migration
  useEffect(() => {
    // Automatic score reset migration (one-time)
    const migrationFlag = localStorage.getItem('symptom_sprinter_migrated_v2');
    if (!migrationFlag) {
      // Clear old total score
      localStorage.removeItem('symptom_sprinter_total_score');
      // Set migration flag
      localStorage.setItem('symptom_sprinter_migrated_v2', 'true');
    }
    
    // Load high score (best run score)
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

  // Note: Using player-specific diagnosis tracking via playerService
  // Each player has their own history of last 20 diagnoses

  // Retry wrapper for generateRoundData with error handling
  const generateRoundDataWithRetry = async (recentDiagnoses: string[], maxRetries: number = 3): Promise<RoundData> => {
    let lastError: any = null;
    let attemptsRemaining = maxRetries;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attemptsRemaining - 1);
        setLoadingError(null); // Clear error on retry
        
        const data = await generateRoundData(recentDiagnoses);
        // Success - reset error state
        setLoadingError(null);
        setRetryCount(3);
        return data;
      } catch (error: any) {
        lastError = error;
        attemptsRemaining--;
        
        // Check if it's a 500 error or network/server error
        const errorStatus = error?.status || error?.statusCode || error?.code;
        const isServerError = errorStatus >= 500 || 
                             error?.isNetworkError ||
                             error?.message?.toLowerCase().includes('network') ||
                             error?.message?.toLowerCase().includes('connection') ||
                             error?.message?.toLowerCase().includes('timeout') ||
                             !errorStatus; // Treat unknown errors as network errors
        
        if (isServerError && attemptsRemaining > 0) {
          // Show error message on loading screen
          setLoadingError("Network error detected. Please check your connection.");
          setRetryCount(attemptsRemaining);
          
          // Wait before retrying (exponential backoff: 1s, 2s, 3s)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue; // Try again
        } else {
          // Either not a server error, or out of retries
          if (isServerError) {
            setLoadingError("Network error. Please check your internet connection and try again.");
            setRetryCount(0);
          }
          throw error; // Re-throw to be handled by caller
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError;
  };

  const startGame = async () => {
    setGameStatus(GameStatus.LOADING_ROUND);
    // Reset run-specific state
    setRunScore(0);
    setHealth(HEALTH.STARTING_HEALTH);
    setCombo(0);
    setLoadingError(null);
    setRetryCount(3);
    
    try {
      // Get player-specific recent diagnoses to avoid repetition
      const recentDiagnoses = getPlayerRecentDiagnoses();
      const data = await generateRoundDataWithRetry(recentDiagnoses);
      savePlayerDiagnosis(data.diagnosis); // Save to player's history
      startRound(data);
    } catch (e: any) {
      // Check if it's a server error after all retries
      const errorStatus = e?.status || e?.statusCode || e?.code;
      const isServerError = errorStatus >= 500 || 
                           e?.isNetworkError ||
                           e?.message?.toLowerCase().includes('network') ||
                           e?.message?.toLowerCase().includes('connection') ||
                           e?.message?.toLowerCase().includes('timeout') ||
                           !errorStatus;
      
      if (isServerError) {
        // Keep showing error on loading screen, user can go back to home
        setLoadingError("Unable to connect. Please check your internet connection and try again.");
        setRetryCount(0);
        // Don't automatically go to fallback - let user see error and go home
        return;
      }
      
      // For other errors, use fallback
      console.warn("Using fallback data due to API error");
      setLoadingError(null);
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

    // Calculate health bar position for floating health (now integrated in header)
    // Header top section is ~72px (mobile) or ~80px (desktop), health bar is below it
    const headerTopHeight = window.innerWidth >= 768 ? 80 : 72;
    const healthBarX = window.innerWidth / 2;
    const healthBarY = headerTopHeight + 60; // Center of health bar section (approximately)

    const newTiles = [...tiles];

    if (tile.isRelevant) {
      // Correct!
      newTiles[tileIndex] = { ...tile, state: TileState.CORRECT };
      
      let points = SCORING.CORRECT_PICK;
      const newCombo = combo + 1;
      setCombo(newCombo);

      // Combo Bonus (score)
      if (newCombo === 5) {
        points += SCORING.COMBO_BONUS;
        triggerFloatingScore(SCORING.COMBO_BONUS, x, y - 50);
        
        // Combo Health Bonus
        setHealth((prev: number) => {
          const newHealth = Math.min(HEALTH.MAX_HEALTH, prev + HEALTH.COMBO_HEALTH_BONUS);
          return newHealth;
        });
        triggerFloatingHealth(HEALTH.COMBO_HEALTH_BONUS, healthBarX, healthBarY);
      }

      setRunScore((prev: number) => prev + points);
      triggerFloatingScore(points, x, y);

      // Check if round complete (all correct found)
      const relevantTiles = newTiles.filter(t => t.isRelevant);
      const foundTiles = relevantTiles.filter(t => t.state === TileState.CORRECT);
      
      if (foundTiles.length === relevantTiles.length) {
        // Perfect finish
        if (newCombo === relevantTiles.length) {
            setRunScore((prev: number) => prev + SCORING.PERFECT_ROUND_BONUS);
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
      
      // Health penalty
      setHealth((prev: number) => {
        const newHealth = Math.max(0, prev + HEALTH.WRONG_CLICK_PENALTY);
        
        // Check for game over
        if (newHealth <= 0) {
          // Delay game over slightly to show the health animation
          setTimeout(() => {
            handleGameOver();
          }, 100);
        }
        
        return newHealth;
      });
      
      triggerFloatingHealth(HEALTH.WRONG_CLICK_PENALTY, healthBarX, healthBarY);
      
      setRunScore((prev: number) => prev + SCORING.INCORRECT_PICK); // Adding negative number
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

  const triggerFloatingHealth = (val: number, x: number, y: number) => {
    const id = performance.now() + Math.random();
    setFloatingHealth((prev: {id: number, val: number, x: number, y: number}[]) => [...prev, { id, val, x, y }]);
  };

  const removeFloatingHealth = (id: number) => {
    setFloatingHealth((prev: {id: number, val: number, x: number, y: number}[]) => prev.filter((fh: {id: number, val: number, x: number, y: number}) => fh.id !== id));
  };

  const handleRoundOver = async (_earlyWin: boolean = false, currentTiles?: TileData[]) => {
    // Timer running out doesn't reduce health - just end the round
    setGameStatus(GameStatus.ROUND_OVER);
    
    // Reveal missed items (for round over modal display)
    const tilesToCheck = currentTiles || tiles;
    const revealedTiles = tilesToCheck.map((t: TileData) => {
      if (t.isRelevant && t.state === TileState.IDLE) {
        return { ...t, state: TileState.MISSED };
      }
      return t;
    });
    setTiles(revealedTiles);
    
    // Note: High score is updated on game over, not round over
  };

  const handleReveal = () => {
    // Show all correct tiles for learning
    const revealedTiles = tiles.map((t: TileData) => {
      if (t.isRelevant) {
        // Mark all relevant tiles as correct for the reveal view
        return { ...t, state: TileState.CORRECT };
      }
      // Keep incorrect tiles as incorrect
      return t;
    });
    setTiles(revealedTiles);
    setGameStatus(GameStatus.REVEAL);
  };

  const handleGameOver = () => {
    // Store previous high score before updating (for modal display)
    const oldHighScore = highScore;
    setPreviousHighScore(oldHighScore);
    
    // Update high score if this run was better
    if (runScore > oldHighScore) {
      setHighScore(runScore);
      localStorage.setItem('symptom_sprinter_hs', runScore.toString());
    }
    
    setGameStatus(GameStatus.GAME_OVER);

    // LEADERBOARD DISABLED - Score submission commented out
    // To re-enable: Uncomment the LeaderboardModal implementation and this code
    /*
    // Submit to leaderboard (only if it's a new high score or first submission)
    if (username && newHighScore > 0) {
      submitScore(username, newHighScore).catch(error => {
        console.error('Failed to submit score to leaderboard:', error);
        // Don't show error to user, just log it
      });
    }
    */
  };

  const handleTryAgain = () => {
    // Start a new run
    startGame();
  };

  const nextRound = async () => {
     // Continue run - keep health and runScore
     setGameStatus(GameStatus.LOADING_ROUND);
     setLoadingError(null);
     setRetryCount(3);
     
     try {
         // Get player-specific recent diagnoses to avoid repetition
         const recentDiagnoses = getPlayerRecentDiagnoses();
         const data = await generateRoundDataWithRetry(recentDiagnoses);
         savePlayerDiagnosis(data.diagnosis); // Save to player's history
         // Reset time but keep health and runScore (persists across rounds in same run)
         setRoundData(data);
         setTiles(data.tiles);
         setTimeRemaining(GAME_CONSTANTS.ROUND_DURATION);
         setCombo(0);
         setGameStatus(GameStatus.PLAYING);
     } catch(e: any) {
         // Check if it's a server error after all retries
         const errorStatus = e?.status || e?.statusCode || e?.code;
         const isServerError = errorStatus >= 500 || 
                              e?.isNetworkError ||
                              e?.message?.toLowerCase().includes('network') ||
                              e?.message?.toLowerCase().includes('connection') ||
                              e?.message?.toLowerCase().includes('timeout') ||
                              !errorStatus;
         
         if (isServerError) {
           // Keep showing error on loading screen, user can go back to home
           setLoadingError("Unable to connect. Please check your internet connection and try again.");
           setRetryCount(0);
           return;
         }
         
         // For other errors, use fallback
         console.error(e);
         setLoadingError(null);
         startRound(FALLBACK_ROUNDS[0]); // simplistic fallback
     }
  };

  const returnToMenu = () => {
    setGameStatus(GameStatus.MENU);
    setLoadingError(null);
    setRetryCount(3);
  };

  // --- Render Components ---

  // 1. Menu
  if (gameStatus === GameStatus.MENU) {
    return (
      <div className="h-screen bg-gradient-to-br from-medical-500 to-medical-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Background Decor */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-urgent-500/20 rounded-full blur-3xl"></div>

        {/* High Score Bubble - Top Left */}
        <div className="absolute top-6 left-6 z-10">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg border-2 border-white/50">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">High Score</p>
            <p className="text-2xl font-black text-medical-600">{highScore}</p>
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
            currentHighScore={highScore}
          />
        )}
      </div>
    );
  }

  // 2. Loading
  if (gameStatus === GameStatus.LOADING_ROUND) {
    return (
      <LoadingScreen 
        error={loadingError || undefined}
        retryCount={retryCount}
        onGoHome={loadingError && retryCount === 0 ? returnToMenu : undefined}
      />
    );
  }

  // 3. Reveal View - Shows all correct tiles for learning
  if (gameStatus === GameStatus.REVEAL) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-medical-500 to-medical-900">
        {/* Fixed Header Container - Contains Header with integrated Health Bar */}
        <div className="fixed top-0 left-0 right-0 w-full z-20 rounded-b-2xl md:rounded-b-3xl shadow-lg">
          <Header 
            username={username}
            onUsernameSave={handleUsernameSave}
            score={runScore}
            highScore={highScore}
            timeRemaining={0}
            combo={0}
            health={health}
            onPause={() => {}}
          />
        </div>

        {/* Main Reveal Area - Scrollable content below fixed header */}
        <main className="flex-1 flex flex-col items-center px-4 py-3 gap-3 overflow-y-auto pt-[180px] md:pt-[200px] pb-24">
          {/* Diagnosis Banner */}
          {roundData && (
            <DiagnosisBanner diagnosis={roundData.diagnosis} />
          )}

          {/* Educational Message */}
          <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20">
            <p className="text-center text-white font-bold text-lg mb-1">📚 Study Time!</p>
            <p className="text-center text-white/90 text-sm">
              All correct symptoms are highlighted below. Take a moment to review and learn!
            </p>
          </div>

          {/* Game Grid - All correct tiles revealed */}
          <div className="w-full max-w-md grid grid-cols-3 gap-2 md:gap-3 auto-rows-fr flex-shrink-0 pb-4">
              {tiles.map((tile: TileData) => (
                  <Tile 
                      key={tile.id} 
                      data={tile} 
                      onClick={() => {}} // Disabled in reveal mode
                      disabled={true}
                  />
              ))}
          </div>
        </main>

        {/* Bouncy Next Case Button - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-medical-900/95 to-transparent z-30">
          <div className="max-w-md mx-auto">
            <button 
              onClick={nextRound}
              className="w-full bg-white text-medical-600 text-xl font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(203,213,225)] active:shadow-none active:translate-y-[6px] transition-all hover:bg-gray-50 transform animate-bounce-slight"
            >
              Next Case
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Playing or Round Over
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-medical-500 to-medical-900">
      {/* Fixed Header Container - Contains Header with integrated Health Bar */}
      <div className="fixed top-0 left-0 right-0 w-full z-20 rounded-b-2xl md:rounded-b-3xl shadow-lg">
        <Header 
          username={username}
          onUsernameSave={handleUsernameSave}
          score={runScore}
          highScore={highScore}
          timeRemaining={timeRemaining}
          combo={combo}
          health={health}
          onPause={() => { /* Simple pause not fully implemented for brevity */ }}
        />
      </div>

      {/* Main Game Area - Scrollable content below fixed header */}
      {/* Padding accounts for header (~72-80px) + health bar (~90-100px) + margin (20px) = ~180-200px total */}
      <main className="flex-1 flex flex-col items-center px-4 py-3 gap-3 overflow-y-auto pt-[180px] md:pt-[200px]">
        {/* Diagnosis Banner */}
        {roundData && (
          <DiagnosisBanner diagnosis={roundData.diagnosis} />
        )}

        {/* Game Grid - Responsive sizing to fit screen */}
        <div className="w-full max-w-md grid grid-cols-3 gap-2 md:gap-3 auto-rows-fr flex-shrink-0 pb-4">
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

      {/* Reveal Button - Top Right (shown when round is over) */}
      {gameStatus === GameStatus.ROUND_OVER && (
        <button
          onClick={handleReveal}
          className="fixed top-[30px] right-4 md:right-6 z-50 bg-white text-medical-600 text-lg font-black py-3 px-6 rounded-2xl shadow-[0_6px_0_rgb(203,213,225)] active:shadow-none active:translate-y-[6px] transition-all hover:bg-gray-50"
          title="Reveal all correct answers to learn"
        >
          Reveal   📚 
        </button>
      )}

      {/* Round Over Modal */}
      {gameStatus === GameStatus.ROUND_OVER && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border-t-4 border-medical-500 transform animate-bounce-slight">
                <h2 className="text-3xl font-black text-center mb-2 text-slate-800">
                    TIME'S UP!
                </h2>
                
                <div className="bg-slate-100 rounded-2xl p-4 mb-6 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Run Score</p>
                        <p className="text-4xl font-black text-medical-600">{runScore}</p>
                    </div>
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

      {/* Game Over Modal */}
      {gameStatus === GameStatus.GAME_OVER && (
        <GameOverModal
          runScore={runScore}
          highScore={runScore > previousHighScore ? runScore : highScore}
          isNewHighScore={runScore > previousHighScore}
          previousHighScore={previousHighScore}
          onTryAgain={handleTryAgain}
          onMenu={returnToMenu}
        />
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

      {/* Floating Health Layer */}
      {floatingHealth.map((fh: {id: number, val: number, x: number, y: number}) => (
        <FloatingHealth 
            key={fh.id} 
            val={fh.val} 
            x={fh.x} 
            y={fh.y} 
            onComplete={() => removeFloatingHealth(fh.id)} 
        />
      ))}
    </div>
  );
};

export default App;
