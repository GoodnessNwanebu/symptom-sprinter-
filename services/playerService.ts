/**
 * Player Service
 * Handles player identification and per-player data storage
 */

const PLAYER_ID_KEY = 'symptom_sprinter_player_id';
const PLAYER_DIAGNOSES_KEY_PREFIX = 'symptom_sprinter_player_';
const MAX_RECENT_DIAGNOSES = 20;

/**
 * Gets or creates a unique player ID
 * @returns Player UUID string
 */
export const getPlayerId = (): string => {
  try {
    let playerId = localStorage.getItem(PLAYER_ID_KEY);
    
    if (!playerId) {
      // Generate a new UUID v4
      playerId = crypto.randomUUID();
      localStorage.setItem(PLAYER_ID_KEY, playerId);
    }
    
    return playerId;
  } catch (error) {
    console.error('Failed to get/create player ID:', error);
    // Fallback: generate a temporary ID (won't persist)
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Gets the storage key for a player's recent diagnoses
 */
const getPlayerDiagnosesKey = (playerId: string): string => {
  return `${PLAYER_DIAGNOSES_KEY_PREFIX}${playerId}_diagnoses`;
};

/**
 * Gets recent diagnoses for the current player
 * @returns Array of diagnosis strings (last 20)
 */
export const getPlayerRecentDiagnoses = (): string[] => {
  try {
    const playerId = getPlayerId();
    const key = getPlayerDiagnosesKey(playerId);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to get player recent diagnoses:', error);
    return [];
  }
};

/**
 * Saves a diagnosis to the current player's history
 * Keeps only the last MAX_RECENT_DIAGNOSES diagnoses
 * @param diagnosis - The diagnosis string to save
 */
export const savePlayerDiagnosis = (diagnosis: string): void => {
  try {
    const playerId = getPlayerId();
    const key = getPlayerDiagnosesKey(playerId);
    const recent = getPlayerRecentDiagnoses();
    
    // Remove duplicate and add to front, keep last MAX_RECENT_DIAGNOSES
    const updated = [
      diagnosis,
      ...recent.filter(d => d !== diagnosis)
    ].slice(0, MAX_RECENT_DIAGNOSES);
    
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save player diagnosis:', error);
    // Silently fail if localStorage is unavailable
  }
};

/**
 * Clears the current player's diagnosis history
 * Useful for testing or reset functionality
 */
export const clearPlayerDiagnosisHistory = (): void => {
  try {
    const playerId = getPlayerId();
    const key = getPlayerDiagnosesKey(playerId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear player diagnosis history:', error);
  }
};

