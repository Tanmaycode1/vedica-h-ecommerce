import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import admin from '../config/firebase';
import db from '../db/db';
import { User } from '../models/User';

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: number;
    }
  }
}

// JWT Authentication Middleware
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication token missing or invalid' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    // Find the user
    const user = await db('users').where({ id: decoded.userId }).first();
    
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: (error as Error).message });
  }
};

// Firebase Authentication Middleware
export const authenticateFirebase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: true, message: 'No token provided' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      res.status(401).json({ error: true, message: 'Invalid token format' });
      return;
    }

    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Find or create user in database
      const firebaseUser = await admin.auth().getUser(decodedToken.uid);
      
      let user = await db('users').where('firebase_uid', firebaseUser.uid).first();
      
      if (!user) {
        // Create new user if not exists
        const [userId] = await db('users').insert({
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          firebase_uid: firebaseUser.uid,
          role: 'customer', // Default role
          created_at: new Date(),
          updated_at: new Date()
        }).returning('id');
        
        user = {
          id: userId,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          firebase_uid: firebaseUser.uid,
          role: 'customer'
        };
      }
      
      // Set authenticated user in request
      req.user = user;
      next();
    } catch (verifyError: any) {
      console.error('Firebase token verification error:', verifyError);
      
      // Handle specific Firebase errors
      if (verifyError.code === 'auth/id-token-expired') {
        res.status(401).json({ error: true, message: 'Token expired' });
      } else if (verifyError.code === 'auth/argument-error') {
        // Just move on without authentication for development convenience
        console.warn('Invalid Firebase token. Continuing without authentication.');
        next();
      } else {
        res.status(401).json({ error: true, message: 'Invalid token' });
      }
    }
  } catch (error: any) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: true, message: 'Authentication failed' });
  }
};

// Role-based authorization middleware
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'You do not have permission to perform this action' });
      return;
    }
    
    next();
  };
}; 