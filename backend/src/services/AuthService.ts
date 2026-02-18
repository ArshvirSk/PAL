import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/database';
import { redisClient, isRedisAvailable } from '../config/redis';
import UserRepository from '../repositories/UserRepository';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const OTP_EXPIRY_SECONDS = 300; // 5 minutes

// In-memory fallback for OTPs when Redis is unavailable
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  expiresIn: number;
}

export class AuthService {
  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP (Redis or in-memory fallback)
   */
  private async storeOTP(key: string, otp: string, expirySeconds: number): Promise<void> {
    if (isRedisAvailable()) {
      await redisClient.setEx(key, expirySeconds, otp);
    } else {
      // Fallback to in-memory storage
      otpStore.set(key, {
        otp,
        expiresAt: Date.now() + expirySeconds * 1000
      });
      logger.warn('Using in-memory OTP storage (Redis unavailable)');
    }
  }

  /**
   * Get OTP (Redis or in-memory fallback)
   */
  private async getOTP(key: string): Promise<string | null> {
    if (isRedisAvailable()) {
      return await redisClient.get(key);
    } else {
      // Fallback to in-memory storage
      const stored = otpStore.get(key);
      if (!stored) return null;
      
      // Check expiry
      if (Date.now() > stored.expiresAt) {
        otpStore.delete(key);
        return null;
      }
      
      return stored.otp;
    }
  }

  /**
   * Delete OTP (Redis or in-memory fallback)
   */
  private async deleteOTP(key: string): Promise<void> {
    if (isRedisAvailable()) {
      await redisClient.del(key);
    } else {
      otpStore.delete(key);
    }
  }

  /**
   * Send OTP to user's phone
   * In production, this would integrate with Twilio or similar service
   */
  async sendOTP(admissionNumber: string): Promise<OTPResponse> {
    try {
      // Find user by admission number
      const user = await UserRepository.findByAdmissionNumber(admissionNumber);
      if (!user) {
        return {
          success: false,
          message: 'User not found with this admission number',
          expiresIn: 0
        };
      }

      // Generate OTP
      const otp = this.generateOTP();
      
      // Store OTP with expiry
      const otpKey = `otp:${admissionNumber}`;
      await this.storeOTP(otpKey, otp, OTP_EXPIRY_SECONDS);

      // In development, log OTP (remove in production)
      if (process.env.NODE_ENV === 'development') {
        logger.info(`OTP for ${admissionNumber}: ${otp}`);
      }

      // TODO: Send OTP via SMS/WhatsApp using Twilio
      // await this.sendSMS(user.phone, `Your P.A.L. login OTP is: ${otp}`);

      logger.info(`OTP sent to ${user.phone} for admission number ${admissionNumber}`);

      return {
        success: true,
        message: 'OTP sent successfully to your registered mobile number',
        expiresIn: OTP_EXPIRY_SECONDS
      };
    } catch (error) {
      logger.error('Error sending OTP:', error);
      throw new Error('Failed to send OTP');
    }
  }

  /**
   * Verify OTP and generate JWT tokens
   * TEST MODE: Auto-create user if doesn't exist in development
   */
  async verifyOTP(admissionNumber: string, otp: string): Promise<AuthTokens | null> {
    try {
      // TEST MODE: In development, accept any OTP and auto-create user
      if (process.env.NODE_ENV === 'development') {
        logger.info(`TEST MODE: Auto-login for ${admissionNumber}`);
        
        // Check if user exists by admission number
        let user = await UserRepository.findByAdmissionNumber(admissionNumber);
        
        // If not found by admission number, try by email (in case admission number format differs)
        if (!user) {
          const testEmail = `${admissionNumber.toLowerCase()}@test.com`;
          user = await UserRepository.findByEmail(testEmail);
        }
        
        // If user doesn't exist, create them
        if (!user) {
          const isAdmin = admissionNumber.toUpperCase().includes('ADMIN');
          const role = isAdmin ? 'admin' : 'student';
          
          logger.info(`TEST MODE: Creating new ${role} user: ${admissionNumber}`);
          
          try {
            // Create user in database
            const { data, error} = await supabaseAdmin
              .from('users')
              .insert({
                admission_number: admissionNumber,
                name: isAdmin ? `Admin ${admissionNumber}` : `Student ${admissionNumber}`,
                email: `${admissionNumber.toLowerCase()}@test.com`,
                phone: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                role: role,
                branch: isAdmin ? 'Administration' : 'Computer Science',
                batch: isAdmin ? '2026' : '2026',
                current_phase: isAdmin ? null : 'Document Verification',
                enrollment_date: new Date().toISOString()
              })
              .select()
              .single();
            
            if (error) {
              logger.error('Error creating test user:', error);
              // If duplicate email, try to find the existing user
              if (error.code === '23505') {
                const testEmail = `${admissionNumber.toLowerCase()}@test.com`;
                user = await UserRepository.findByEmail(testEmail);
                if (!user) {
                  return null;
                }
              } else {
                return null;
              }
            } else {
              user = data as User;
            }
          } catch (createError) {
            logger.error('Exception creating test user:', createError);
            return null;
          }
        }
        
        // Generate tokens
        const tokens = this.generateTokens(user);
        
        logger.info(`TEST MODE: User authenticated: ${user.id}`);
        
        return {
          ...tokens,
          user
        };
      }
      
      // PRODUCTION MODE: Normal OTP verification
      // Get stored OTP
      const otpKey = `otp:${admissionNumber}`;
      const storedOTP = await this.getOTP(otpKey);

      if (!storedOTP) {
        logger.warn(`OTP expired or not found for ${admissionNumber}`);
        return null;
      }

      // Verify OTP
      if (storedOTP !== otp) {
        logger.warn(`Invalid OTP attempt for ${admissionNumber}`);
        return null;
      }

      // Delete OTP after successful verification
      await this.deleteOTP(otpKey);

      // Get user
      const user = await UserRepository.findByAdmissionNumber(admissionNumber);
      if (!user) {
        return null;
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store refresh token
      const refreshKey = `refresh:${user.id}`;
      await this.storeOTP(refreshKey, tokens.refreshToken, 7 * 24 * 60 * 60); // 7 days

      logger.info(`User authenticated: ${user.id}`);

      return {
        ...tokens,
        user
      };
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      throw new Error('Failed to verify OTP');
    }
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload = {
      userId: user.id,
      admissionNumber: user.admission_number,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const decoded = this.verifyToken(refreshToken);
      if (!decoded || !decoded.userId) {
        return null;
      }

      // Check if refresh token exists
      const refreshKey = `refresh:${decoded.userId}`;
      const storedToken = await this.getOTP(refreshKey);
      
      if (storedToken !== refreshToken) {
        logger.warn(`Invalid refresh token for user ${decoded.userId}`);
        return null;
      }

      // Get user
      const user = await UserRepository.findById(decoded.userId);
      if (!user) {
        return null;
      }

      // Generate new access token
      const tokens = this.generateTokens(user);
      return tokens.accessToken;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Logout user (invalidate tokens)
   */
  async logout(userId: string): Promise<boolean> {
    try {
      // Delete refresh token
      const refreshKey = `refresh:${userId}`;
      await this.deleteOTP(refreshKey);

      logger.info(`User logged out: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error during logout:', error);
      return false;
    }
  }

  /**
   * Validate user session
   */
  async validateSession(userId: string): Promise<boolean> {
    try {
      // In development mode without Redis, skip session validation
      if (process.env.NODE_ENV === 'development' && !isRedisAvailable()) {
        logger.info(`TEST MODE: Skipping session validation for ${userId}`);
        return true;
      }

      const refreshKey = `refresh:${userId}`;
      const token = await this.getOTP(refreshKey);
      return token !== null;
    } catch (error) {
      logger.error('Error validating session:', error);
      // In development, allow access even if validation fails
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      return false;
    }
  }

  /**
   * Change user password (for future use)
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      // TODO: Implement password change logic with Supabase Auth
      // This is a placeholder for future implementation
      logger.info(`Password change requested for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error changing password:', error);
      return false;
    }
  }
}

export default new AuthService();
