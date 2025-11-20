import { supabase, LeaderboardEntry } from './supabase';

/**
 * Submit a score to the leaderboard
 */
export const submitScore = async (
  username: string,
  totalScore: number,
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
      // Update existing user's score (only if new scores are higher)
      const { data, error } = await supabase
        .from('leaderboard')
        .update({
          total_score: Math.max(existingUser.total_score, totalScore),
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
          total_score: totalScore,
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
 */
export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('total_score', { ascending: false })
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
 */
export const getUserRank = async (username: string): Promise<number | null> => {
  try {
    // Get user's score
    const { data: user } = await supabase
      .from('leaderboard')
      .select('total_score')
      .eq('username', username)
      .single();

    if (!user) return null;

    // Count how many users have higher scores
    const { count, error } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt('total_score', user.total_score);

    if (error) throw error;
    // Rank is count + 1 (1-indexed)
    return (count || 0) + 1;
  } catch (error) {
    console.error('Error getting user rank:', error);
    return null;
  }
};

