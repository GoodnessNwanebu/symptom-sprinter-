export enum TileState {
  IDLE = 'IDLE',
  CORRECT = 'CORRECT',
  INCORRECT = 'INCORRECT',
  MISSED = 'MISSED', // For revealing answers at the end
}

export interface TileData {
  id: string;
  text: string;
  isRelevant: boolean;
  state: TileState;
}

export interface RoundData {
  diagnosis: string;
  category: string; // e.g., "Cardiology", "Neurology"
  difficulty: string;
  tiles: TileData[];
}

export enum GameStatus {
  MENU = 'MENU',
  LOADING_ROUND = 'LOADING_ROUND',
  PLAYING = 'PLAYING',
  ROUND_OVER = 'ROUND_OVER',
  REVEAL = 'REVEAL', // Shows all correct tiles for learning
  GAME_OVER = 'GAME_OVER',
}

export interface GameConfig {
  roundDuration: number; // seconds
}

export interface ScoreLog {
  score: number;
  diagnosis: string;
  date: number;
}
