import { RoundData, TileState } from './types';

export const GAME_CONSTANTS = {
  ROUND_DURATION: 15, // Seconds
  TOTAL_TILES: 12,
  CORRECT_COUNT_TARGET: 7, // Aim for 7 correct, 5 incorrect
};

export const SCORING = {
  CORRECT_PICK: 5,
  INCORRECT_PICK: -10,
  COMBO_BONUS: 25, // 5 in a row
  PERFECT_ROUND_BONUS: 100, // All correct consecutively (or just all correct found without errors)
};

export const HEALTH = {
  STARTING_HEALTH: 100,
  WRONG_CLICK_PENALTY: -15,
  COMBO_HEALTH_BONUS: 15,
  MAX_HEALTH: 100,
  // Color zones
  GREEN_THRESHOLD: 60, // 60-100: Green
  YELLOW_THRESHOLD: 30, // 30-59: Yellow/Amber
  // 0-29: Red
};

// Used for initial loading or fallback
export const FALLBACK_ROUNDS: RoundData[] = [
  {
    diagnosis: "Acute Appendicitis",
    category: "General Surgery",
    difficulty: "Easy",
    tiles: [
      { id: '1', text: "RLQ Pain", isRelevant: true, state: TileState.IDLE },
      { id: '2', text: "McBurney's Point", isRelevant: true, state: TileState.IDLE },
      { id: '3', text: "Anorexia", isRelevant: true, state: TileState.IDLE },
      { id: '4', text: "Nausea", isRelevant: true, state: TileState.IDLE },
      { id: '5', text: "Fever", isRelevant: true, state: TileState.IDLE },
      { id: '6', text: "Leukocytosis", isRelevant: true, state: TileState.IDLE },
      { id: '7', text: "Rebound Tenderness", isRelevant: true, state: TileState.IDLE },
      { id: '8', text: "Left Arm Pain", isRelevant: false, state: TileState.IDLE },
      { id: '9', text: "Visual Aura", isRelevant: false, state: TileState.IDLE },
      { id: '10', text: "Productive Cough", isRelevant: false, state: TileState.IDLE },
      { id: '11', text: "Jaundice", isRelevant: false, state: TileState.IDLE },
      { id: '12', text: "Bradycardia", isRelevant: false, state: TileState.IDLE },
    ]
  }
];
