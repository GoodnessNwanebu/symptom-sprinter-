/**
 * User Tracking Service
 * Tracks unique players in the database for analytics
 */

import { supabase } from './supabase';

/**
 * Tracks a user visit (creates new user or updates last_seen)
 * This is called automatically when a player ID is first generated
 * @param playerId - The player's UUID
 */
export const trackUserVisit = async (playerId: string): Promise<void> => {
  try {
    // Check if Supabase is configured
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      // Silently fail if Supabase is not configured
      return;
    }

    // Use the database function to upsert user tracking
    const { error } = await supabase.rpc('track_user_visit', {
      p_player_id: playerId
    });

    if (error) {
      console.error('Failed to track user visit:', error);
      // Don't throw - tracking failures shouldn't break the app
    }
  } catch (error) {
    console.error('Error in trackUserVisit:', error);
    // Silently fail - tracking is non-critical
  }
};

/**
 * Increments the rounds played counter for a user
 * Call this when a round starts
 * @param playerId - The player's UUID
 */
export const incrementUserRounds = async (playerId: string): Promise<void> => {
  try {
    // Check if Supabase is configured
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return;
    }

    const { error } = await supabase.rpc('increment_user_rounds', {
      p_player_id: playerId
    });

    if (error) {
      console.error('Failed to increment user rounds:', error);
    }
  } catch (error) {
    console.error('Error in incrementUserRounds:', error);
    // Silently fail - tracking is non-critical
  }
};

/**
 * Get total unique users count
 * Note: This requires a database function with SECURITY DEFINER or service role key
 * For now, this is commented out as RLS blocks public reads
 * To use this, you'd need to create a database function or use service role key
 * 
 * Example SQL function you could create:
 * CREATE OR REPLACE FUNCTION get_total_users()
 * RETURNS INTEGER AS $$
 * BEGIN
 *   RETURN (SELECT COUNT(*) FROM users);
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 */
// export const getTotalUsers = async (): Promise<number | null> => {
//   try {
//     const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
//     if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
//       return null;
//     }
//
//     // Would need to call a database function or use service role
//     const { data, error } = await supabase.rpc('get_total_users');
//     if (error) throw error;
//     return data;
//   } catch (error) {
//     console.error('Error getting total users:', error);
//     return null;
//   }
// };

