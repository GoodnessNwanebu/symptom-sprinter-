import { supabase, LeaderboardEntry } from './supabase';

/**
 * Submit a score to the leaderboard
 * Now primarily uses high_score (best run score) as the main metric
 */
export const submitScore = async (
  username: string,
  highScore: number
): Promise<LeaderboardEntry | null> => {
  try {
    // First, check if user already exists
    const { data: existingUser } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('username', username)
      .single();

    if (existingUser) {
      // Update existing user's high_score (only if new score is higher)
      const { data, error } = await supabase
        .from('leaderboard')
        .update({
          high_score: Math.max(existingUser.high_score, highScore),
          updated_at: new Date().toISOString(),
        })
        .eq('username', username)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new user
      const { data, error } = await supabase
        .from('leaderboard')
        .insert({
          username,
          total_score: 0, // Legacy field, kept for compatibility
          high_score: highScore,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error submitting score to leaderboard:', error);
    return null;
  }
};

/**
 * Get top N leaderboard entries
 * Ordered by high_score (best run score)
 */
export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('high_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};

/**
 * Get user's rank in the leaderboard
 * Based on high_score (best run score)
 */
export const getUserRank = async (username: string): Promise<number | null> => {
  try {
    // Get user's high_score
    const { data: user } = await supabase
      .from('leaderboard')
      .select('high_score')
      .eq('username', username)
      .single();

    if (!user) return null;

    // Count how many users have higher high_scores
    const { count, error } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt('high_score', user.high_score);

    if (error) throw error;
    // Rank is count + 1 (1-indexed)
    return (count || 0) + 1;
  } catch (error) {
    console.error('Error getting user rank:', error);
    return null;
  }
};

