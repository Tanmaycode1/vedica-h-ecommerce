import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import db from '../db/db';
import { UserLoginInput, UserRegistrationInput } from '../models/User';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, email, password }: UserRegistrationInput = req.body;

    // Check if user already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const [userId] = await db('users').insert({
      name: `${first_name} ${last_name}`,
      email,
      password: hashedPassword,
      role: 'customer',
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');

    // Generate JWT token
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    // Return user (without password) and token
    const user = await db('users')
      .select('id', 'name', 'email', 'role', 'email_verified')
      .where({ id: userId })
      .first();

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: UserLoginInput = req.body;

    // Find user by email
    const user = await db('users').where({ email }).first();
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Check password
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }
    } else {
      res.status(401).json({ message: 'Password login not available for this account. Try Firebase login.' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    // Return user (without password) and token
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified
    };

    res.status(200).json({
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: (error as Error).message });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Remove sensitive information
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      first_name: user.first_name,
      last_name: user.last_name,
      bio: user.bio
    };

    res.status(200).json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Error getting user profile', error: (error as Error).message });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const { first_name, last_name, phone, bio, address } = req.body;
    
    // Update basic user information
    const updateData: any = {
      first_name,
      last_name,
      name: `${first_name} ${last_name}`.trim(),
      phone,
      bio,
      updated_at: new Date()
    };
    
    // Handle address as JSON
    if (address) {
      updateData.address = JSON.stringify(address);
    }
    
    // Update user record
    await db('users')
      .where({ id: userId })
      .update(updateData);
    
    // Fetch updated user data
    const updatedUser = await db('users')
      .where({ id: userId })
      .first();
    
    if (!updatedUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    
    // Parse address JSON if it exists
    let parsedAddress = null;
    if (updatedUser.address && typeof updatedUser.address === 'string') {
      try {
        parsedAddress = JSON.parse(updatedUser.address);
      } catch (e) {
        console.error('Error parsing address:', e);
        parsedAddress = {};
      }
    }
    
    // Prepare response
    const userResponse = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      address: parsedAddress || updatedUser.address,
      avatar: updatedUser.avatar,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      bio: updatedUser.bio
    };
    
    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: userResponse 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating user profile', 
      error: (error as Error).message 
    });
  }
}; 