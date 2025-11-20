import { RoundData, TileData, TileState } from "../types";
import { GAME_CONSTANTS } from "../constants";
import { supabase } from "./supabase";

export const generateRoundData = async (recentDiagnoses: string[] = []): Promise<RoundData> => {
  try {
    // Check if Supabase is configured (use any to access env vars)
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
    }

    // Call Supabase Edge Function to proxy Gemini API (hides API key)
    const { data, error } = await supabase.functions.invoke('generate-round', {
      body: {
        recentDiagnoses,
        correctCountTarget: GAME_CONSTANTS.CORRECT_COUNT_TARGET
      }
    });

    if (error) {
      console.error('Supabase Edge Function error:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error("No response from generate-round function");
    }

    // If the function returns an error, throw it
    if (data.error) {
      console.error('Edge Function returned error:', data.error);
      throw new Error(data.error);
    }

    const rawData = data;
    
    // Transform tiles from Edge Function response to internal format
    const finalTiles: TileData[] = rawData.tiles.map((tile: any) => ({
      id: tile.id,
      text: tile.text,
      isRelevant: tile.isRelevant,
      state: TileState.IDLE
    }));

    return {
      diagnosis: rawData.diagnosis,
      category: rawData.category,
      difficulty: rawData.difficulty || "Medium",
      tiles: finalTiles
    };

  } catch (error: any) {
    console.error("Failed to generate round:", error);
    
    // Provide helpful error message
    if (error?.message?.includes('Supabase is not configured')) {
      console.warn('⚠️ Supabase not configured. Using fallback data.');
    } else if (error?.status === 401 || error?.code === '401') {
      console.warn('⚠️ 401 Unauthorized - Check your VITE_SUPABASE_ANON_KEY in .env.local');
    }
    
    throw error;
  }
};
