import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/AuthService';
import { UserRole } from '../models/types';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        admissionNumber: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Validate session
    const isValid = await AuthService.validateSession(decoded.userId);
    if (!isValid) {
      res.status(401).json({ error: 'Session expired. Please login again.' });
      return;
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      admissionNumber: decoded.admissionNumber,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = AuthService.verifyToken(token);
      
      if (decoded) {
        req.user = {
          userId: decoded.userId,
          admissionNumber: decoded.admissionNumber,
          email: decoded.email,
          role: decoded.role
        };
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
