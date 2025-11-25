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
      // Check error status/code - Supabase errors can have status or statusCode
      const errorStatus = (error as any)?.status || (error as any)?.statusCode || (error as any)?.code;
      
      // Create error object with status code for better handling
      const errorWithStatus = error as any;
      errorWithStatus.status = errorStatus || 500;
      errorWithStatus.isNetworkError = errorStatus >= 500 || !errorStatus; // Treat unknown errors as network errors
      throw errorWithStatus;
    }
    
    if (!data) {
      const noDataError: any = new Error("No response from generate-round function");
      noDataError.status = 500;
      noDataError.isNetworkError = true;
      throw noDataError;
    }

    // If the function returns an error, check if it includes status
    if (data.error) {
      console.error('Edge Function returned error:', data.error);
      const errorMessage = typeof data.error === 'string' ? data.error : data.error.message || 'Unknown error';
      const errorStatus = data.error?.status || data.status || 500;
      const functionError: any = new Error(errorMessage);
      functionError.status = errorStatus;
      functionError.isNetworkError = errorStatus >= 500;
      throw functionError;
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
    
    // Handle network-level errors (TypeError from fetch failures)
    if (error instanceof TypeError) {
      const networkError: any = new Error("Network error. Please check your internet connection.");
      networkError.status = 500;
      networkError.isNetworkError = true;
      networkError.originalError = error;
      throw networkError;
    }
    
    // Ensure error has status and isNetworkError flag
    if (error) {
      const errorStatus = error.status || error.statusCode || error.code;
      error.status = errorStatus || 500;
      error.isNetworkError = errorStatus >= 500 || !errorStatus || 
                            error.message?.toLowerCase().includes('network') ||
                            error.message?.toLowerCase().includes('connection') ||
                            error.message?.toLowerCase().includes('timeout');
    }
    
    // Provide helpful error message
    if (error?.message?.includes('Supabase is not configured')) {
      console.warn('⚠️ Supabase not configured. Using fallback data.');
    } else if (error?.status === 401 || error?.code === '401') {
      console.warn('⚠️ 401 Unauthorized - Check your VITE_SUPABASE_ANON_KEY in .env.local');
    }
    
    throw error;
  }
};
