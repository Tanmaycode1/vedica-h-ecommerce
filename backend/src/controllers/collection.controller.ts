import { Request, Response } from 'express';
import db from '../db/db';

// Get all collections
export const getCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    // Query collections and count products in each collection
    const collections = await db('collections as c')
      .select(
        'c.*',
        db.raw('COALESCE(COUNT(DISTINCT pc.product_id), 0) as products_count')
      )
      .leftJoin('product_collections as pc', 'c.id', 'pc.collection_id')
      .groupBy('c.id');

    // Get hierarchical relationship information
    const collectionsMap = new Map();
    collections.forEach(collection => {
      collectionsMap.set(collection.id, collection);
      collection.products = [];
    });

    // Build parent-child relationships
    collections.forEach(collection => {
      if (collection.parent_id && collectionsMap.has(collection.parent_id)) {
        const parent = collectionsMap.get(collection.parent_id);
        if (!parent.children) parent.children = [];
        parent.children.push(collection);
      }
    });

    // For each collection, get a sample of products to return
    for (const collection of collections) {
      // Get up to 5 products from each collection for preview
      const products = await db('products as p')
        .select(
          'p.id',
          'p.title',
          'p.price',
          'p.category'
        )
        .join('product_collections as pc', 'p.id', 'pc.product_id')
        .where('pc.collection_id', collection.id)
        .limit(5);

      collection.products = products;
    }

    // Calculate products_count including child collections
    const updateProductsCount = (collection: any): number => {
      let totalCount = Number(collection.products_count || 0);
      
      if (collection.children && collection.children.length > 0) {
        for (const child of collection.children) {
          totalCount += updateProductsCount(child);
        }
      }
      
      collection.total_products_count = totalCount;
      return totalCount;
    };

    // Apply the update to root collections
    const rootCollections = collections.filter(c => !c.parent_id);
    rootCollections.forEach(updateProductsCount);

    res.status(200).json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ message: 'Error fetching collections', error: (error as Error).message });
  }
};

// Get collections as a hierarchical tree
export const getCollectionsTree = async (req: Request, res: Response): Promise<void> => {
  try {
    // Query all collections
    const collections = await db('collections as c')
      .select(
        'c.*',
        db.raw('COALESCE(COUNT(DISTINCT pc.product_id), 0) as products_count')
      )
      .leftJoin('product_collections as pc', 'c.id', 'pc.collection_id')
      .where(function() {
        // Apply filters if provided
        if (req.query.collection_type) {
          this.where('c.collection_type', req.query.collection_type as string);
        }
        
        if (req.query.include_inactive !== 'true') {
          this.where('c.is_active', true);
        }
      })
      .groupBy('c.id')
      .orderBy(['c.level', 'c.name']);

    // Function to build tree from flat array
    function buildCollectionTree(items: any[], parentId: number | null = null): any[] {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildCollectionTree(items, item.id)
        }));
    }

    // Convert flat list to tree structure
    const collectionTree = buildCollectionTree(collections);

    // Function to calculate total products count including child collections
    const updateProductsCount = (collection: any): number => {
      let totalCount = Number(collection.products_count || 0);
      
      if (collection.children && collection.children.length > 0) {
        for (const child of collection.children) {
          totalCount += updateProductsCount(child);
        }
      }
      
      collection.total_products_count = totalCount;
      return totalCount;
    };

    // Apply the calculation to each root collection
    collectionTree.forEach(updateProductsCount);

    res.status(200).json(collectionTree);
  } catch (error) {
    console.error('Error fetching collections tree:', error);
    res.status(500).json({ message: 'Error fetching collections tree', error: (error as Error).message });
  }
};

// Get a collection by slug
export const getCollectionBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    // Get collection with product count
    const collection = await db('collections as c')
      .select('c.*', db.raw('COALESCE(COUNT(pc.product_id), 0) as products_count'))
      .leftJoin('product_collections as pc', 'c.id', 'pc.collection_id')
      .where('c.slug', slug)
      .groupBy('c.id')
      .first();

    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }

    // Get products in this collection
    const products = await db('products as p')
      .select(
        'p.*',
        db.raw('json_agg(distinct jsonb_build_object(\'id\', pi.id, \'image_id\', pi.image_id, \'alt\', pi.alt, \'src\', pi.src, \'is_primary\', pi.is_primary)) as images'),
        db.raw('json_agg(distinct jsonb_build_object(\'id\', pv.id, \'sku\', pv.sku, \'size\', pv.size, \'color\', pv.color, \'image_id\', pv.image_id, \'price\', pv.price)) as variants')
      )
      .join('product_collections as pc', 'p.id', 'pc.product_id')
      .join('collections as c', 'pc.collection_id', 'c.id')
      .leftJoin('product_images as pi', 'p.id', 'pi.product_id')
      .leftJoin('product_variants as pv', 'p.id', 'pv.product_id')
      .where('c.id', collection.id)
      .groupBy('p.id');

    // Format the response
    const formattedProducts = products.map(product => ({
      ...product,
      images: product.images.filter((img: any) => img !== null && img.id !== null),
      variants: product.variants.filter((v: any) => v !== null && v.id !== null),
    }));

    res.status(200).json({
      collection,
      products: formattedProducts,
      products_count: collection.products_count || formattedProducts.length
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ message: 'Error fetching collection', error: (error as Error).message });
  }
};

// Create a new collection
export const createCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Creating collection with request body:', JSON.stringify(req.body));
    
    const { 
      name, 
      slug, 
      description, 
      parent_id, 
      collection_type, 
      is_active,
      image_url 
    } = req.body;
    
    // Validate required fields
    if (!name) {
      console.log('Collection name is missing');
      res.status(400).json({ message: 'Collection name is required' });
      return;
    }
    
    // Generate a slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
      
      console.log('Generated slug from name:', finalSlug);
    }

    // Check if slug already exists and make it unique if needed
    const slugExists = await db('collections').where('slug', finalSlug).first();
    if (slugExists) {
      console.log('Slug already exists, making it unique:', finalSlug);
      // Add a timestamp to make it unique
      const timestamp = new Date().getTime();
      finalSlug = `${finalSlug}-${timestamp}`;
      console.log('New unique slug:', finalSlug);
    }

    // Calculate level based on parent
    let level = 0;
    // Ensure parent_id is properly parsed as an integer or set to null
    console.log('Parent ID before parsing:', parent_id, typeof parent_id);
    const parsedParentId = parent_id ? parseInt(String(parent_id), 10) : null;
    console.log('Parent ID after parsing:', parsedParentId);
    
    if (parsedParentId) {
      try {
        const parentCollection = await db('collections').where('id', parsedParentId).first();
        if (parentCollection) {
          level = (parentCollection.level || 0) + 1;
          console.log('Found parent collection, level set to:', level);
        } else {
          console.log('Parent collection not found for ID:', parsedParentId);
          res.status(400).json({ message: 'Parent collection not found' });
          return;
        }
      } catch (err) {
        console.error('Error getting parent collection:', err);
        res.status(400).json({ message: 'Invalid parent collection ID format' });
        return;
      }
    }

    console.log('Inserting collection with data:', {
      name,
      slug: finalSlug,
      description,
      parent_id: parsedParentId,
      collection_type: collection_type || 'custom',
      is_active: is_active !== undefined ? is_active : true,
      level,
      image_url
    });

    // Insert the new collection and get the ID
    const result = await db('collections').insert({
      name,
      slug: finalSlug,
      description,
      parent_id: parsedParentId,
      collection_type: collection_type || 'custom',
      is_active: is_active !== undefined ? is_active : true,
      level,
      image_url,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');

    console.log('Insert result:', result);

    // Extract the ID from the result (handle both object format and direct value)
    let collectionId;
    if (typeof result[0] === 'object' && result[0] !== null) {
      collectionId = result[0].id;
    } else {
      collectionId = result[0];
    }
    
    console.log('Extracted collection ID:', collectionId);

    // Get the newly created collection
    const newCollection = await db('collections').where('id', collectionId).first();
    console.log('New collection:', newCollection);
    res.status(201).json({ message: 'Collection created successfully', collection: newCollection });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ message: 'Error creating collection', error: (error as Error).message });
  }
};

// Update a collection
export const updateCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      name, 
      slug, 
      description, 
      parent_id, 
      collection_type, 
      is_active,
      image_url 
    } = req.body;

    // Parse the ID as an integer
    const collectionId = parseInt(id, 10);
    if (isNaN(collectionId)) {
      res.status(400).json({ message: 'Invalid collection ID format' });
      return;
    }

    // Check if collection exists
    const collection = await db('collections').where('id', collectionId).first();
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }

    // Check if slug is being changed and if it already exists
    if (slug && slug !== collection.slug) {
      const existingCollection = await db('collections').where('slug', slug).first();
      if (existingCollection && existingCollection.id !== collectionId) {
        res.status(400).json({ message: 'Collection with this slug already exists' });
        return;
      }
    }

    // Ensure parent_id is properly parsed as an integer or set to null
    const parsedParentId = parent_id !== undefined ? (parent_id ? parseInt(String(parent_id), 10) : null) : collection.parent_id;

    // Check for circular references if parent_id is changing
    if (parsedParentId !== collection.parent_id) {
      // Can't set parent to self
      if (parsedParentId === collectionId) {
        res.status(400).json({ message: 'Collection cannot be its own parent' });
        return;
      }

      // Check if the new parent exists
      if (parsedParentId) {
        const parentCollection = await db('collections').where('id', parsedParentId).first();
        if (!parentCollection) {
          res.status(400).json({ message: 'Parent collection not found' });
          return;
        }

        // Don't allow setting a child as a parent (circular reference)
        // Get all children of current collection
        const checkCircular = async (parentId: number, childId: number): Promise<boolean> => {
          const children = await db('collections').where('parent_id', childId).select('id');
          if (children.some(child => child.id === parentId)) {
            return true;
          }
          
          for (const child of children) {
            if (await checkCircular(parentId, child.id)) {
              return true;
            }
          }
          
          return false;
        };

        if (await checkCircular(collectionId, parsedParentId)) {
          res.status(400).json({ message: 'Circular reference detected in collection hierarchy' });
          return;
        }
      }
    }

    // Calculate new level if parent is changing
    let level = collection.level || 0;
    if (parsedParentId !== collection.parent_id) {
      if (!parsedParentId) {
        level = 0; // Root level
      } else {
        const parentCollection = await db('collections').where('id', parsedParentId).first();
        level = (parentCollection.level || 0) + 1;
      }
    }

    await db('collections')
      .where('id', collectionId)
      .update({
        name: name !== undefined ? name : collection.name,
        slug: slug !== undefined ? slug : collection.slug,
        description: description !== undefined ? description : collection.description,
        parent_id: parsedParentId,
        collection_type: collection_type !== undefined ? collection_type : collection.collection_type,
        is_active: is_active !== undefined ? is_active : collection.is_active,
        level,
        image_url: image_url !== undefined ? image_url : collection.image_url,
        updated_at: new Date()
      });

    const updatedCollection = await db('collections').where('id', collectionId).first();
    res.status(200).json({ message: 'Collection updated successfully', collection: updatedCollection });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ message: 'Error updating collection', error: (error as Error).message });
  }
};

// Delete a collection
export const deleteCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Parse the ID as an integer
    const collectionId = parseInt(id, 10);
    if (isNaN(collectionId)) {
      res.status(400).json({ message: 'Invalid collection ID format' });
      return;
    }

    // Check if collection exists
    const collection = await db('collections').where('id', collectionId).first();
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }

    // Delete collection (cascade deletes will handle related records)
    await db('collections').where('id', collectionId).del();

    res.status(200).json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ message: 'Error deleting collection', error: (error as Error).message });
  }
};

// Add a product to a collection
export const addProductToCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { productId } = req.body;
    
    // Parse IDs as integers
    const collectionId = parseInt(id, 10);
    if (isNaN(collectionId)) {
      res.status(400).json({ message: 'Invalid collection ID format' });
      return;
    }
    
    if (!productId) {
      res.status(400).json({ message: 'Product ID is required' });
      return;
    }
    
    const parsedProductId = parseInt(String(productId), 10);
    if (isNaN(parsedProductId)) {
      res.status(400).json({ message: 'Invalid product ID format' });
      return;
    }
    
    // Check if collection exists
    const collection = await db('collections').where('id', collectionId).first();
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }
    
    // Check if product exists
    const product = await db('products').where('id', parsedProductId).first();
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    
    // Check if product is already in the collection
    const existingEntry = await db('product_collections')
      .where({ collection_id: collectionId, product_id: parsedProductId })
      .first();
    
    if (existingEntry) {
      // Product already in collection
      res.status(200).json({ 
        message: 'Product is already in this collection', 
        product_collection: existingEntry 
      });
      return;
    }
    
    // Add product to collection
    const result = await db('product_collections').insert({
      collection_id: collectionId,
      product_id: parsedProductId,
      created_at: new Date()
    }).returning('id');
    
    // Extract the ID from the result (handle both object format and direct value)
    let productCollectionId;
    if (typeof result[0] === 'object' && result[0] !== null) {
      productCollectionId = result[0].id;
    } else {
      productCollectionId = result[0];
    }
    
    const newProductCollection = await db('product_collections')
      .where('id', productCollectionId)
      .first();
    
    res.status(201).json({ 
      message: 'Product added to collection', 
      product_collection: newProductCollection 
    });
  } catch (error) {
    console.error('Error adding product to collection:', error);
    res.status(500).json({ message: 'Error adding product to collection', error: (error as Error).message });
  }
};

// Remove a product from a collection
export const removeProductFromCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, productId } = req.params;
    const { removeFromParents } = req.query;
    
    // Check if collection exists
    const collection = await db('collections').where('id', id).first();
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }
    
    // Check if product exists
    const product = await db('products').where('id', productId).first();
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    
    // Check if the relation exists
    const existingRelation = await db('product_collections')
      .where({
        product_id: productId,
        collection_id: id
      })
      .first();
      
    if (!existingRelation) {
      res.status(404).json({ message: 'Product is not in this collection' });
      return;
    }

    await db.transaction(async (trx) => {
      // Remove product from the specified collection
      await trx('product_collections')
        .where({
          product_id: productId,
          collection_id: id
        })
        .del();
      
      // Check if we need to remove from parent collections too
      if (removeFromParents === 'true') {
        // Find all parent collections up the hierarchy
        let currentParentId = collection.parent_id;
        const parentIds = [];
        
        while (currentParentId) {
          parentIds.push(currentParentId);
          
          // Get the next parent up the chain
          const parentCollection = await trx('collections')
            .where('id', currentParentId)
            .first();
            
          currentParentId = parentCollection?.parent_id || null;
        }
        
        // Remove product from all parent collections
        if (parentIds.length > 0) {
          await trx('product_collections')
            .whereIn('collection_id', parentIds)
            .where('product_id', productId)
            .del();
        }
      }
    });
    
    const message = removeFromParents === 'true' 
      ? 'Product removed from collection and parent collections successfully'
      : 'Product removed from collection successfully';
    
    res.status(200).json({ message });
  } catch (error) {
    console.error('Error removing product from collection:', error);
    res.status(500).json({ message: 'Error removing product from collection', error: (error as Error).message });
  }
};

/**
 * Toggle whether a brand is featured in the mega menu
 */
export const toggleBrandFeatured = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isFeatured } = req.body;

  try {
    // Get the collection to ensure it exists and is a brand
    const collection = await db('collections')
      .where({ id, collection_type: 'brand' })
      .first();
    
    if (!collection) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    // Update the featured status in both collections and mega_menu_collections tables
    await db.transaction(async (trx) => {
      // Update the collection
      await trx('collections')
        .where({ id })
        .update({ 
          is_featured: isFeatured,
          updated_at: new Date()
        });
      
      // Also update any corresponding mega menu items
      await trx('mega_menu_collections')
        .where({ collection_id: id })
        .update({ 
          is_featured: isFeatured,
          updated_at: new Date()
        });
    });

    res.status(200).json({ 
      message: `Brand ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
      id
    });
  } catch (error) {
    console.error('Error toggling brand featured status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all featured brands
 */
export const getFeaturedBrands = async (_req: Request, res: Response): Promise<void> => {
  try {
    const featuredBrands = await db('collections')
      .select('collections.*')
      .where({ 
        collection_type: 'brand',
        is_featured: true,
        is_active: true
      })
      .orderBy('name');
    
    res.status(200).json(featuredBrands);
  } catch (error) {
    console.error('Error getting featured brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add multiple products to a collection
export const addProductsToCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({ message: 'Product IDs array is required' });
      return;
    }
    
    // Make sure all product IDs are integers
    const validProductIds = productIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      .filter(id => !isNaN(id) && Number.isInteger(id));
    
    if (validProductIds.length === 0) {
      res.status(400).json({ message: 'No valid product IDs provided' });
      return;
    }
    
    console.log(`Processing request to add ${validProductIds.length} products to collection ${id}`);
    
    // Check if collection exists
    const collection = await db('collections').where('id', id).first();
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }
    
    // Check if products exist
    const products = await db('products').whereIn('id', validProductIds);
    if (products.length !== validProductIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = validProductIds.filter(id => !foundIds.includes(id));
      console.log(`Some product IDs are invalid: [${missingIds.join(', ')}]`);
      
      // Decide if we want to fail or continue with valid IDs
      // For now, we'll continue with valid IDs
      // res.status(400).json({ message: 'Some product IDs are invalid', missingIds });
      // return;
    }
    
    // Use a transaction to ensure all operations succeed or fail together
    await db.transaction(async (trx) => {
      // Get existing product-collection relationships to avoid duplicates
      const existingRelations = await trx('product_collections')
        .where('collection_id', id)
        .whereIn('product_id', validProductIds);
      
      const existingProductIds = existingRelations.map(rel => rel.product_id);
      
      // Get all current products in this collection
      const allExistingRelations = await trx('product_collections')
        .where('collection_id', id)
        .select('product_id');
      
      const allExistingProductIds = allExistingRelations.map(rel => rel.product_id);
      
      // For updates, we might be replacing the entire product set
      // So we need to determine which products to add and which to remove
      const productsToKeep = validProductIds.filter(id => allExistingProductIds.includes(id));
      const productsToAdd = validProductIds.filter(id => !existingProductIds.includes(id));
      const productsToRemove = allExistingProductIds.filter(id => !validProductIds.includes(id));
      
      console.log(`Collection ${id} products: keep: ${productsToKeep.length}, add: ${productsToAdd.length}, remove: ${productsToRemove.length}`);
      
      // Add new products if any
      if (productsToAdd.length > 0) {
        const productCollections = productsToAdd.map(productId => ({
          product_id: productId,
          collection_id: id
        }));
        
        await trx('product_collections').insert(productCollections);
        console.log(`Added ${productsToAdd.length} products to collection ${id}`);
      }
      
      // Remove products if needed (only if we are explicitly updating the full list)
      if (req.query.fullUpdate === 'true' && productsToRemove.length > 0) {
        await trx('product_collections')
          .whereIn('product_id', productsToRemove)
          .where('collection_id', id)
          .del();
        console.log(`Removed ${productsToRemove.length} products from collection ${id}`);
      }
      
      // If this is a child collection, identify all parent collections
      let currentParentId = collection.parent_id;
      const parentIds = [];
      
      while (currentParentId) {
        parentIds.push(currentParentId);
        
        // Get the next parent up the chain
        const parentCollection = await trx('collections')
          .where('id', currentParentId)
          .first();
          
        currentParentId = parentCollection?.parent_id || null;
      }
      
      // Add products to all parent collections (if not already present)
      if (parentIds.length > 0 && productsToAdd.length > 0) {
        console.log(`Checking parent collections for propagation: ${parentIds.join(', ')}`);
        
        for (const parentId of parentIds) {
          // Check which products are already in this parent collection
          const parentRelations = await trx('product_collections')
            .where('collection_id', parentId)
            .whereIn('product_id', productsToAdd);
            
          const productsInParent = parentRelations.map(rel => rel.product_id);
          
          // Filter to find products that need to be added to the parent
          const productsToAddToParent = productsToAdd.filter(productId => 
            !productsInParent.includes(productId)
          );
          
          if (productsToAddToParent.length > 0) {
            const parentProductCollections = productsToAddToParent.map(productId => ({
              product_id: productId,
              collection_id: parentId
            }));
            
            await trx('product_collections').insert(parentProductCollections);
            console.log(`Added ${productsToAddToParent.length} products to parent collection ${parentId}`);
          }
        }
      }
    });
    
    // Get updated product list for response
    const updatedProducts = await db('products as p')
      .select(
        'p.id',
        'p.title',
        'p.price'
      )
      .join('product_collections as pc', 'p.id', 'pc.product_id')
      .where('pc.collection_id', id);
    
    res.status(200).json({ 
      success: true,
      message: 'Products updated for collection successfully',
      collection_id: id,
      products_count: updatedProducts.length,
      products: updatedProducts.slice(0, 10) // Send only first 10 to avoid large response
    });
  } catch (error) {
    console.error('Error adding products to collection:', error);
    res.status(500).json({ success: false, message: 'Error adding products to collection', error: (error as Error).message });
  }
}; 