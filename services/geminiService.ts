import { GoogleGenAI, Type } from "@google/genai";
import { RoundData, TileData, TileState } from "../types";
import { GAME_CONSTANTS } from "../constants";

const modelId = 'gemini-flash-lite-latest';

// Lazy initialization to avoid crashing if API key is missing
let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please add it to your .env.local file.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const generateRoundData = async (): Promise<RoundData> => {
  const prompt = `
    Create a round for a medical trivia game called "Symptom Sprinter".
    
    1. Pick a specific medical diagnosis (Disease).
    2. Provide exactly 12 short phrases (1-4 words each) that could appear on game tiles.
    3. Approximately ${GAME_CONSTANTS.CORRECT_COUNT_TARGET} phrases must be CORRECT (relevant symptoms, signs, risk factors, or investigations for the diagnosis).
    4. The remaining phrases must be INCORRECT (distractors, irrelevant to this specific diagnosis).
    5. Ensure the distractors are medically plausible but clearly wrong for this specific condition.
    
    Output JSON.
  `;

  try {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            category: { type: Type.STRING, description: "e.g. Cardiology, Neurology" },
            difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  isRelevant: { type: Type.BOOLEAN }
                },
                required: ["text", "isRelevant"]
              }
            }
          },
          required: ["diagnosis", "items", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const rawData = JSON.parse(text);
    
    // Transform to internal format
    const tiles: TileData[] = rawData.items.map((item: any, index: number) => ({
      id: `tile-${Date.now()}-${index}`,
      text: item.text,
      isRelevant: item.isRelevant,
      state: TileState.IDLE
    }));

    // Ensure exactly 12 tiles by slicing or padding (though schema should handle it)
    const finalTiles = tiles.slice(0, 12).sort(() => Math.random() - 0.5);

    return {
      diagnosis: rawData.diagnosis,
      category: rawData.category,
      difficulty: rawData.difficulty || "Medium",
      tiles: finalTiles
    };

  } catch (error) {
    console.error("Failed to generate round:", error);
    throw error;
  }
};
