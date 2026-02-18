import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

interface Interest {
  id: string;
  user_id: string;
  category: string;
  tags: string[];
  description?: string;
  created_at: Date;
}

interface Match {
  id: string;
  user_id: string;
  matched_user_id: string;
  match_score: number;
  common_interests: string[];
  status: 'pending' | 'accepted' | 'declined' | 'maybe_later';
  icebreaker?: string;
  created_at: Date;
  responded_at?: Date;
}

interface MatchSuggestion {
  user: {
    id: string;
    full_name: string;
    branch: string;
    hostel?: string;
    batch: string;
  };
  matchScore: number;
  commonInterests: string[];
  proximityScore: number;
  icebreaker: string;
}

class SocialService {
  /**
   * Submit user interests
   */
  async submitInterests(
    userId: string,
    interests: Array<{ category: string; tags: string[]; description?: string }>
  ): Promise<void> {
    try {
      // Delete existing interests
      await supabaseAdmin
        .from('interests')
        .delete()
        .eq('user_id', userId);

      // Insert new interests
      const interestRecords = interests.map(interest => ({
        user_id: userId,
        category: interest.category,
        tags: interest.tags,
        description: interest.description,
        created_at: new Date()
      }));

      await supabaseAdmin
        .from('interests')
        .insert(interestRecords);

      logger.info(`Interests submitted for user ${userId}`);

      // Trigger matching
      await this.findMatches(userId);
    } catch (error) {
      logger.error('Error submitting interests:', error);
      throw error;
    }
  }

  /**
   * Find matches for a user
   */
  async findMatches(userId: string): Promise<MatchSuggestion[]> {
    try {
      // Get user details and interests
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*, interests(*)')
        .eq('id', userId)
        .single();

      if (!user || !user.interests || user.interests.length === 0) {
        return [];
      }

      // Get all other users with interests in same batch/hostel
      const { data: potentialMatches } = await supabaseAdmin
        .from('users')
        .select('*, interests(*)')
        .eq('batch', user.batch)
        .neq('id', userId);

      if (!potentialMatches || potentialMatches.length === 0) {
        return [];
      }

      // Calculate match scores
      const matches: MatchSuggestion[] = [];

      for (const candidate of potentialMatches) {
        if (!candidate.interests || candidate.interests.length === 0) continue;

        // Calculate interest similarity (Jaccard)
        const userTags = new Set(user.interests.flatMap((i: any) => i.tags));
        const candidateTags = new Set(candidate.interests.flatMap((i: any) => i.tags));
        
        const intersection = new Set([...userTags].filter(x => candidateTags.has(x)));
        const union = new Set([...userTags, ...candidateTags]);
        
        const interestScore = intersection.size / union.size;

        // Must have at least 2 common interests
        if (intersection.size < 2) continue;

        // Calculate proximity score
        let proximityScore = 0;
        if (user.hostel && candidate.hostel === user.hostel) proximityScore += 0.4;
        if (candidate.branch === user.branch) proximityScore += 0.3;
        proximityScore += 0.3; // Same batch (already filtered)

        // Calculate engagement score (placeholder)
        const engagementScore = 0.3;

        // Weighted match score
        const matchScore = (
          interestScore * 0.4 +
          proximityScore * 0.3 +
          engagementScore * 0.3
        );

        // Only suggest if score is above threshold
        if (matchScore < 0.4) continue;

        // Generate icebreaker
        const icebreaker = await this.generateIcebreaker(
          Array.from(intersection)
        );

        matches.push({
          user: {
            id: candidate.id,
            full_name: candidate.full_name,
            branch: candidate.branch,
            hostel: candidate.hostel,
            batch: candidate.batch
          },
          matchScore: Math.round(matchScore * 100) / 100,
          commonInterests: Array.from(intersection),
          proximityScore: Math.round(proximityScore * 100) / 100,
          icebreaker
        });
      }

      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      // Store top matches
      await this.storeMatches(userId, matches.slice(0, 10));

      return matches.slice(0, 10);
    } catch (error) {
      logger.error('Error finding matches:', error);
      return [];
    }
  }

  /**
   * Generate icebreaker message using LLM
   */
  private async generateIcebreaker(commonInterests: string[]): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const prompt = `Generate a friendly, casual icebreaker message for two college students who share these interests: ${commonInterests.join(', ')}. 

The message should:
- Be 1-2 sentences
- Be casual and friendly
- Reference one of the common interests
- Encourage conversation
- Be appropriate for college students

Return ONLY the icebreaker message, nothing else.`;

      const result = await model.generateContent(prompt);
      const icebreaker = result.response.text().trim();

      return icebreaker;
    } catch (error) {
      logger.error('Error generating icebreaker:', error);
      return `Hey! I noticed we both like ${commonInterests[0]}. Would love to connect!`;
    }
  }

  /**
   * Store match suggestions
   */
  private async storeMatches(
    userId: string,
    suggestions: MatchSuggestion[]
  ): Promise<void> {
    try {
      // Check for existing matches to avoid duplicates
      const { data: existing } = await supabaseAdmin
        .from('matches')
        .select('matched_user_id')
        .eq('user_id', userId);

      const existingIds = new Set(existing?.map(m => m.matched_user_id) || []);

      const newMatches = suggestions
        .filter(s => !existingIds.has(s.user.id))
        .map(suggestion => ({
          user_id: userId,
          matched_user_id: suggestion.user.id,
          match_score: suggestion.matchScore,
          common_interests: suggestion.commonInterests,
          icebreaker: suggestion.icebreaker,
          status: 'pending',
          created_at: new Date()
        }));

      if (newMatches.length > 0) {
        await supabaseAdmin
          .from('matches')
          .insert(newMatches);
      }
    } catch (error) {
      logger.error('Error storing matches:', error);
    }
  }

  /**
   * Get match suggestions for user
   */
  async getMatchSuggestions(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data: matches } = await supabaseAdmin
        .from('matches')
        .select(`
          *,
          matched_user:users!matches_matched_user_id_fkey(
            id,
            full_name,
            branch,
            hostel,
            batch
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('match_score', { ascending: false })
        .limit(limit);

      return matches || [];
    } catch (error) {
      logger.error('Error getting match suggestions:', error);
      return [];
    }
  }

  /**
   * Respond to a match
   */
  async respondToMatch(
    matchId: string,
    response: 'accepted' | 'declined' | 'maybe_later'
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('matches')
        .update({
          status: response,
          responded_at: new Date()
        })
        .eq('id', matchId);

      // If accepted, create reverse match and share contact info
      if (response === 'accepted') {
        const { data: match } = await supabaseAdmin
          .from('matches')
          .select('user_id, matched_user_id')
          .eq('id', matchId)
          .single();

        if (match) {
          // Check if other user also accepted
          const { data: reverseMatch } = await supabaseAdmin
            .from('matches')
            .select('status')
            .eq('user_id', match.matched_user_id)
            .eq('matched_user_id', match.user_id)
            .single();

          if (reverseMatch?.status === 'accepted') {
            // Both accepted - create connection
            await this.createConnection(match.user_id, match.matched_user_id);
          }
        }
      }

      logger.info(`Match ${matchId} responded with: ${response}`);
    } catch (error) {
      logger.error('Error responding to match:', error);
      throw error;
    }
  }

  /**
   * Create mutual connection
   */
  private async createConnection(userId1: string, userId2: string): Promise<void> {
    try {
      await supabaseAdmin
        .from('connections')
        .insert([
          {
            user_id: userId1,
            connected_user_id: userId2,
            status: 'active',
            connected_at: new Date()
          },
          {
            user_id: userId2,
            connected_user_id: userId1,
            status: 'active',
            connected_at: new Date()
          }
        ]);

      logger.info(`Connection created between ${userId1} and ${userId2}`);
    } catch (error) {
      logger.error('Error creating connection:', error);
    }
  }

  /**
   * Get user connections
   */
  async getUserConnections(userId: string): Promise<any[]> {
    try {
      const { data: connections } = await supabaseAdmin
        .from('connections')
        .select(`
          *,
          connected_user:users!connections_connected_user_id_fkey(
            id,
            full_name,
            branch,
            hostel,
            batch,
            email,
            phone
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      return connections || [];
    } catch (error) {
      logger.error('Error getting connections:', error);
      return [];
    }
  }

  /**
   * Get interest categories and popular tags
   */
  async getInterestCategories(): Promise<any> {
    return {
      categories: [
        {
          name: 'Technology',
          tags: ['Coding', 'AI/ML', 'Web Dev', 'Mobile Apps', 'Cybersecurity', 'Blockchain', 'IoT', 'Robotics']
        },
        {
          name: 'Gaming',
          tags: ['PC Gaming', 'Mobile Gaming', 'E-sports', 'Game Dev', 'Streaming', 'Board Games']
        },
        {
          name: 'Music',
          tags: ['Playing Instruments', 'Singing', 'Music Production', 'DJing', 'Classical', 'Rock', 'Hip Hop', 'EDM']
        },
        {
          name: 'Sports',
          tags: ['Cricket', 'Football', 'Basketball', 'Badminton', 'Tennis', 'Gym', 'Running', 'Cycling']
        },
        {
          name: 'Arts & Creativity',
          tags: ['Drawing', 'Painting', 'Photography', 'Videography', 'Design', 'Writing', 'Poetry']
        },
        {
          name: 'Entertainment',
          tags: ['Movies', 'TV Shows', 'Anime', 'Stand-up Comedy', 'Theater', 'Dance']
        },
        {
          name: 'Learning',
          tags: ['Reading', 'Languages', 'Philosophy', 'Science', 'History', 'Podcasts']
        },
        {
          name: 'Social',
          tags: ['Volunteering', 'Debate', 'Public Speaking', 'Networking', 'Events']
        }
      ]
    };
  }
}

export default new SocialService();
