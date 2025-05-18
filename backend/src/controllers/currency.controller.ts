import { Request, Response } from 'express';
import db from '../db/db';

// Define the currency interface
interface Currency {
  id?: number;
  currency: string;
  symbol: string;
  value: number;
  created_at?: Date;
  updated_at?: Date;
}

// Get all currencies
export const getCurrencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const currencies = await db('currencies').select('*');
    
    // If no currencies exist yet, return default currency set
    if (!currencies || currencies.length === 0) {
      const defaultCurrencies = [
        { currency: 'USD', symbol: '$', value: 1 },
        { currency: 'EUR', symbol: '€', value: 0.92 },
        { currency: 'GBP', symbol: '£', value: 0.81 }
      ];
      
      res.status(200).json(defaultCurrencies);
      return;
    }
    
    res.status(200).json(currencies);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({ message: 'Error fetching currencies', error: (error as Error).message });
  }
};

// Create a new currency
export const createCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currency, symbol, value }: Currency = req.body;
    
    // Validate required fields
    if (!currency || !symbol || value === undefined) {
      res.status(400).json({ message: 'Currency code, symbol, and value are required' });
      return;
    }
    
    // Check if currency already exists
    const existingCurrency = await db('currencies').where('currency', currency).first();
    if (existingCurrency) {
      res.status(409).json({ message: 'Currency already exists' });
      return;
    }
    
    // Create the currency
    const [newCurrencyId] = await db('currencies').insert({
      currency,
      symbol,
      value,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');
    
    const newCurrency = await db('currencies').where('id', newCurrencyId).first();
    
    res.status(201).json({ 
      message: 'Currency created successfully', 
      currency: newCurrency 
    });
  } catch (error) {
    console.error('Error creating currency:', error);
    res.status(500).json({ message: 'Error creating currency', error: (error as Error).message });
  }
};

// Update a currency
export const updateCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { currency, symbol, value }: Currency = req.body;
    
    // Check if currency exists
    const existingCurrency = await db('currencies').where('id', id).first();
    if (!existingCurrency) {
      res.status(404).json({ message: 'Currency not found' });
      return;
    }
    
    // Update the currency
    await db('currencies')
      .where('id', id)
      .update({
        currency: currency || existingCurrency.currency,
        symbol: symbol || existingCurrency.symbol,
        value: value !== undefined ? value : existingCurrency.value,
        updated_at: new Date()
      });
    
    const updatedCurrency = await db('currencies').where('id', id).first();
    
    res.status(200).json({
      message: 'Currency updated successfully',
      currency: updatedCurrency
    });
  } catch (error) {
    console.error('Error updating currency:', error);
    res.status(500).json({ message: 'Error updating currency', error: (error as Error).message });
  }
};

// Delete a currency
export const deleteCurrency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if currency exists
    const existingCurrency = await db('currencies').where('id', id).first();
    if (!existingCurrency) {
      res.status(404).json({ message: 'Currency not found' });
      return;
    }
    
    // Delete the currency
    await db('currencies').where('id', id).delete();
    
    res.status(200).json({
      message: 'Currency deleted successfully',
      id
    });
  } catch (error) {
    console.error('Error deleting currency:', error);
    res.status(500).json({ message: 'Error deleting currency', error: (error as Error).message });
  }
}; 