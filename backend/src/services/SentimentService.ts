import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

interface SentimentAnalysis {
  score: number; // -1 to 1 (negative to positive)
  magnitude: number; // 0 to 1 (intensity)
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    anxiety: number;
    confusion: number;
  };
  distressIndicators: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  needsIntervention: boolean;
}

interface SentimentRecord {
  id: string;
  user_id: string;
  message_id: string;
  sentiment_score: number;
  magnitude: number;
  emotions: Record<string, number>;
  distress_indicators: string[];
  severity: string;
  analyzed_at: Date;
}

class SentimentService {
  /**
   * Analyze sentiment of a message
   */
  async analyzeMessage(
    userId: string,
    messageId: string,
    messageContent: string
  ): Promise<SentimentAnalysis> {
    try {
      // Use Gemini for sentiment analysis
      const analysis = await this.analyzeWithGemini(messageContent);

      // Store sentiment record (not the message content)
      await this.storeSentimentRecord(userId, messageId, analysis);

      // Check if intervention is needed
      if (analysis.needsIntervention) {
        await this.triggerMentorAlert(userId, analysis);
      }

      // Update rolling average
      await this.updateRollingAverage(userId);

      return analysis;
    } catch (error) {
      logger.error('Error analyzing sentiment:', error);
      // Return neutral sentiment on error
      return this.getNeutralSentiment();
    }
  }

  /**
   * Analyze sentiment using Gemini
   */
  private async analyzeWithGemini(text: string): Promise<SentimentAnalysis> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const prompt = `Analyze the sentiment and emotional state of this student message. Return ONLY a JSON object with this exact structure:

{
  "score": <number between -1 and 1, where -1 is very negative, 0 is neutral, 1 is very positive>,
  "magnitude": <number between 0 and 1 indicating intensity>,
  "emotions": {
    "joy": <0 to 1>,
    "sadness": <0 to 1>,
    "anger": <0 to 1>,
    "fear": <0 to 1>,
    "anxiety": <0 to 1>,
    "confusion": <0 to 1>
  },
  "distressIndicators": [<array of specific phrases or patterns indicating distress>],
  "severity": "<low|medium|high|critical>",
  "needsIntervention": <true if student needs immediate support, false otherwise>
}

Message: "${text}"

Return ONLY the JSON, no other text.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    } catch (error) {
      logger.error('Error in Gemini sentiment analysis:', error);
      return this.getNeutralSentiment();
    }
  }

  /**
   * Store sentiment record (privacy-preserving)
   */
  private async storeSentimentRecord(
    userId: string,
    messageId: string,
    analysis: SentimentAnalysis
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('sentiment_records')
        .insert({
          user_id: userId,
          message_id: messageId,
          sentiment_score: analysis.score,
          magnitude: analysis.magnitude,
          emotions: analysis.emotions,
          distress_indicators: analysis.distressIndicators,
          severity: analysis.severity,
          analyzed_at: new Date()
        });
    } catch (error) {
      logger.error('Error storing sentiment record:', error);
    }
  }

  /**
   * Update 7-day rolling average
   */
  private async updateRollingAverage(userId: string): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: records } = await supabaseAdmin
        .from('sentiment_records')
        .select('sentiment_score, magnitude')
        .eq('user_id', userId)
        .gte('analyzed_at', sevenDaysAgo.toISOString());

      if (!records || records.length === 0) return;

      const avgScore = records.reduce((sum, r) => sum + r.sentiment_score, 0) / records.length;
      const avgMagnitude = records.reduce((sum, r) => sum + r.magnitude, 0) / records.length;

      // Update user's sentiment summary
      await supabaseAdmin
        .from('users')
        .update({
          sentiment_avg_7d: avgScore,
          sentiment_magnitude_7d: avgMagnitude,
          sentiment_updated_at: new Date()
        })
        .eq('id', userId);
    } catch (error) {
      logger.error('Error updating rolling average:', error);
    }
  }

  /**
   * Trigger mentor alert for high severity
   */
  private async triggerMentorAlert(
    userId: string,
    analysis: SentimentAnalysis
  ): Promise<void> {
    try {
      // Get user's assigned mentor
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('mentor_id, full_name')
        .eq('id', userId)
        .single();

      if (!user?.mentor_id) {
        logger.warn(`No mentor assigned for user ${userId}`);
        return;
      }

      // Create alert
      await supabaseAdmin
        .from('alerts')
        .insert({
          user_id: userId,
          mentor_id: user.mentor_id,
          type: 'sentiment',
          severity: analysis.severity,
          title: 'Student Distress Detected',
          description: `${user.full_name} may need support. Distress indicators: ${analysis.distressIndicators.join(', ')}`,
          metadata: {
            sentimentScore: analysis.score,
            emotions: analysis.emotions,
            distressIndicators: analysis.distressIndicators
          },
          status: 'pending',
          created_at: new Date()
        });

      logger.info(`Mentor alert created for user ${userId}, severity: ${analysis.severity}`);
    } catch (error) {
      logger.error('Error triggering mentor alert:', error);
    }
  }

  /**
   * Get neutral sentiment (fallback)
   */
  private getNeutralSentiment(): SentimentAnalysis {
    return {
      score: 0,
      magnitude: 0.5,
      emotions: {
        joy: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        anxiety: 0,
        confusion: 0
      },
      distressIndicators: [],
      severity: 'low',
      needsIntervention: false
    };
  }

  /**
   * Get user sentiment history
   */
  async getUserSentimentHistory(
    userId: string,
    days: number = 30
  ): Promise<SentimentRecord[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabaseAdmin
        .from('sentiment_records')
        .select('*')
        .eq('user_id', userId)
        .gte('analyzed_at', startDate.toISOString())
        .order('analyzed_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting sentiment history:', error);
      return [];
    }
  }

  /**
   * Get students needing intervention
   */
  async getStudentsNeedingIntervention(): Promise<any[]> {
    try {
      // Get users with recent high/critical severity
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: records } = await supabaseAdmin
        .from('sentiment_records')
        .select('user_id, severity, analyzed_at')
        .in('severity', ['high', 'critical'])
        .gte('analyzed_at', threeDaysAgo.toISOString());

      if (!records || records.length === 0) return [];

      // Group by user and get latest
      const userMap = new Map();
      records.forEach(record => {
        if (!userMap.has(record.user_id) || 
            new Date(record.analyzed_at) > new Date(userMap.get(record.user_id).analyzed_at)) {
          userMap.set(record.user_id, record);
        }
      });

      // Get user details
      const userIds = Array.from(userMap.keys());
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, full_name, admission_number, mentor_id')
        .in('id', userIds);

      return (users || []).map(user => ({
        ...user,
        latestSeverity: userMap.get(user.id).severity,
        lastAnalyzed: userMap.get(user.id).analyzed_at
      }));
    } catch (error) {
      logger.error('Error getting students needing intervention:', error);
      return [];
    }
  }

  /**
   * Get sentiment trends for analytics
   */
  async getSentimentTrends(days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: records } = await supabaseAdmin
        .from('sentiment_records')
        .select('sentiment_score, severity, analyzed_at')
        .gte('analyzed_at', startDate.toISOString());

      if (!records || records.length === 0) {
        return {
          averageScore: 0,
          severityCounts: { low: 0, medium: 0, high: 0, critical: 0 },
          trend: 'stable'
        };
      }

      const avgScore = records.reduce((sum, r) => sum + r.sentiment_score, 0) / records.length;
      
      const severityCounts = records.reduce((acc, r) => {
        acc[r.severity] = (acc[r.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate trend (comparing first half vs second half)
      const midpoint = Math.floor(records.length / 2);
      const firstHalf = records.slice(0, midpoint);
      const secondHalf = records.slice(midpoint);

      const firstAvg = firstHalf.reduce((sum, r) => sum + r.sentiment_score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, r) => sum + r.sentiment_score, 0) / secondHalf.length;

      let trend = 'stable';
      if (secondAvg > firstAvg + 0.1) trend = 'improving';
      else if (secondAvg < firstAvg - 0.1) trend = 'declining';

      return {
        averageScore: avgScore,
        severityCounts,
        trend,
        totalAnalyzed: records.length
      };
    } catch (error) {
      logger.error('Error getting sentiment trends:', error);
      return {
        averageScore: 0,
        severityCounts: { low: 0, medium: 0, high: 0, critical: 0 },
        trend: 'stable'
      };
    }
  }
}

export default new SentimentService();
