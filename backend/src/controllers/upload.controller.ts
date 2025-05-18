import { Request, Response } from 'express';
import db from '../db/db';
import fs from 'fs';
import path from 'path';

export const uploadProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse productId as integer to ensure it's a valid number
    const productId = parseInt(req.params.productId, 10);
    
    // Check if product ID is valid
    if (isNaN(productId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }
    
    // Check if files exist
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    
    // Check if product exists
    const product = await db('products').where({ id: productId }).first();
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    
    // For debug log the file info
    console.log('Uploading image for product:', productId, req.file);
    
    // Fix the file URL generation to avoid double /uploads/
    // Make sure it's just /product-images/filename without double uploads prefix
    const fileUrl = `/product-images/${req.file.filename}`;
    console.log(`Generated file URL: ${fileUrl}`);
    
    try {
      // Insert a new product image record into the database and get the raw ID
      const insertResult = await db('product_images').insert({
        product_id: productId,
        image_id: null,
        alt: `Image for ${product.title}`,
        src: fileUrl,
        is_primary: false,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('id');
      
      // Extract the image ID as a number
      let imageId: number;
      if (Array.isArray(insertResult) && insertResult.length > 0) {
        // Handle array result
        const firstResult = insertResult[0];
        // Check if the result is a raw number or an object with an id property
        if (typeof firstResult === 'number') {
          imageId = firstResult;
        } else if (typeof firstResult === 'object' && firstResult !== null && 'id' in firstResult) {
          imageId = Number(firstResult.id);
        } else {
          throw new Error(`Unexpected insert result format: ${JSON.stringify(insertResult)}`);
        }
      } else if (typeof insertResult === 'number') {
        // Handle direct number result
        imageId = insertResult;
      } else {
        throw new Error(`No ID returned from insert operation: ${JSON.stringify(insertResult)}`);
      }
      
      console.log(`Image inserted with ID: ${imageId} (${typeof imageId})`);
      
      // Fetch the newly created image record
      const image = await db('product_images').where('id', '=', imageId).first();
      
      if (!image) {
        throw new Error(`Could not find inserted image with ID ${imageId}`);
      }
      
      res.status(201).json({ 
        message: 'Image uploaded successfully',
        image
      });
    } catch (dbError) {
      console.error('Database error during image upload:', dbError);
      res.status(500).json({ 
        message: 'Error saving image to database', 
        error: (dbError as Error).message 
      });
    }
  } catch (error) {
    console.error('Error uploading product image:', error);
    res.status(500).json({ 
      message: 'Error uploading image', 
      error: (error as Error).message 
    });
  }
};

export const deleteProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse id as integer to ensure it's a valid number
    const id = parseInt(req.params.id, 10);
    
    // Check if ID is valid
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid image ID' });
      return;
    }
    
    // Check if image exists
    const image = await db('product_images').where('id', '=', id).first();
    if (!image) {
      res.status(404).json({ message: 'Image not found' });
      return;
    }

    console.log(`Deleting image with ID: ${id}, path: ${image.src}`);
    
    try {
      // Delete image record from database
      await db('product_images').where('id', '=', id).del();
      
      // Try to delete the actual file if it exists (but don't throw error if file doesn't exist)
      if (image.src && !image.src.startsWith('http') && typeof image.src === 'string') {
        try {
          // Fix the path construction to handle the new URL format
          // We need to prepend 'uploads' since we're storing just /product-images in the database
          const filePath = path.join(
            __dirname, 
            '../../', 
            'uploads',
            image.src.replace(/^\//, '')
          );
          
          console.log(`Checking if file exists at path: ${filePath}`);
          
          if (fs.existsSync(filePath)) {
            console.log(`File exists, deleting: ${filePath}`);
            fs.unlinkSync(filePath);
            console.log(`File deleted successfully: ${filePath}`);
          } else {
            console.log(`File does not exist, skipping deletion: ${filePath}`);
          }
        } catch (fileError) {
          // Log the error but don't fail the request if file deletion fails
          console.error('Error deleting image file (continuing anyway):', fileError);
        }
      }
      
      res.status(200).json({ 
        message: 'Image deleted successfully',
        id
      });
    } catch (dbError) {
      console.error('Database error during image deletion:', dbError);
      res.status(500).json({ 
        message: 'Error deleting image from database', 
        error: (dbError as Error).message 
      });
    }
  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({ 
      message: 'Error deleting image', 
      error: (error as Error).message 
    });
  }
};

export const uploadCollectionImage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse collectionId as integer to ensure it's a valid number
    const collectionId = parseInt(req.params.collectionId, 10);
    
    // Check if collection ID is valid
    if (isNaN(collectionId)) {
      res.status(400).json({ message: 'Invalid collection ID' });
      return;
    }
    
    // Check if files exist
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    
    // Check if collection exists
    const collection = await db('collections').where({ id: collectionId }).first();
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }
    
    // For debug, log the file info
    console.log('Uploading image for collection:', collectionId, req.file);
    
    // Create collection-images directory if it doesn't exist
    const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
    const collectionImagesDir = path.join(uploadsDir, 'collection-images');
    if (!fs.existsSync(collectionImagesDir)) {
      fs.mkdirSync(collectionImagesDir, { recursive: true });
    }
    
    // Move the file from product-images to collection-images
    const oldPath = path.join(uploadsDir, 'product-images', req.file.filename);
    const newFileName = req.file.filename;
    const newPath = path.join(collectionImagesDir, newFileName);
    
    // Check if the file exists and move it
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`File moved from ${oldPath} to ${newPath}`);
    }
    
    // Fix the file URL generation
    const fileUrl = `/collection-images/${newFileName}`;
    console.log(`Generated file URL: ${fileUrl}`);
    
    try {
      // Update the collection record with the new image URL
      await db('collections')
        .where({ id: collectionId })
        .update({
          image_url: `/uploads${fileUrl}`,
          updated_at: new Date()
        });
      
      // Fetch the updated collection
      const updatedCollection = await db('collections').where({ id: collectionId }).first();
      
      res.status(201).json({ 
        message: 'Collection image uploaded successfully',
        collection: updatedCollection
      });
    } catch (dbError) {
      console.error('Database error during collection image update:', dbError);
      res.status(500).json({ 
        message: 'Error updating collection image in database', 
        error: (dbError as Error).message 
      });
    }
  } catch (error) {
    console.error('Error uploading collection image:', error);
    res.status(500).json({ 
      message: 'Error uploading collection image', 
      error: (error as Error).message 
    });
  }
};

export const deleteCollectionImage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parse id as integer to ensure it's a valid number
    const id = parseInt(req.params.id, 10);
    
    // Check if ID is valid
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid collection ID' });
      return;
    }
    
    // Check if collection exists and has an image
    const collection = await db('collections').where({ id }).first();
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }
    
    if (!collection.image_url) {
      res.status(404).json({ message: 'Collection has no image to delete' });
      return;
    }
    
    console.log(`Deleting image for collection ID: ${id}, path: ${collection.image_url}`);
    
    try {
      // Try to delete the actual file if it exists (but don't throw error if file doesn't exist)
      if (collection.image_url && !collection.image_url.startsWith('http') && typeof collection.image_url === 'string') {
        try {
          const filePath = path.join(
            __dirname, 
            '../../', 
            'uploads',
            collection.image_url.replace(/^\//, '')
          );
          
          console.log(`Checking if file exists at path: ${filePath}`);
          
          if (fs.existsSync(filePath)) {
            console.log(`File exists, deleting: ${filePath}`);
            fs.unlinkSync(filePath);
            console.log(`File deleted successfully: ${filePath}`);
          } else {
            console.log(`File does not exist, skipping deletion: ${filePath}`);
          }
        } catch (fileError) {
          // Log the error but don't fail the request if file deletion fails
          console.error('Error deleting collection image file (continuing anyway):', fileError);
        }
      }
      
      // Update the collection record to remove the image URL
      await db('collections')
        .where({ id })
        .update({
          image_url: null,
          updated_at: new Date()
        });
      
      res.status(200).json({ 
        message: 'Collection image deleted successfully',
        id
      });
    } catch (dbError) {
      console.error('Database error during collection image deletion:', dbError);
      res.status(500).json({ 
        message: 'Error removing collection image from database', 
        error: (dbError as Error).message 
      });
    }
  } catch (error) {
    console.error('Error deleting collection image:', error);
    res.status(500).json({ 
      message: 'Error deleting collection image', 
      error: (error as Error).message 
    });
  }
}; 