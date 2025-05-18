import { Request, Response } from 'express';
import db from '../db/db';
import { MegaMenuCreateInput, MegaMenuSubcollectionCreateInput, MegaMenuUpdateInput } from '../models/MegaMenu';

// Get all mega menu collections in a tree structure
export const getMegaMenuTree = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all collections that are part of the mega menu with related collection data
    const megaMenuItems = await db('mega_menu_collections as mmc')
      .select(
        'mmc.*',
        'c.name as collection_name',
        'c.slug as collection_slug',
        'c.parent_id',
        'c.collection_type',
        'c.level as collection_level'
      )
      .join('collections as c', 'mmc.collection_id', 'c.id')
      .where(function() {
        if (req.query.include_inactive !== 'true') {
          this.where('mmc.is_active', true);
        }
      })
      .orderBy(['mmc.level', 'mmc.position']);

    // Also get all collections for the client to choose from
    const allCollections = await db('collections as c')
      .select(
        'c.*',
        db.raw('COALESCE(COUNT(pc.product_id), 0) as products_count')
      )
      .leftJoin('product_collections as pc', 'c.id', 'pc.collection_id')
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

    // Convert collections to tree structure
    const collectionsTree = buildCollectionTree(allCollections);
    
    // Identify which collections are selected in the mega menu
    const megaMenuCollectionIds = new Set(megaMenuItems.map(item => item.collection_id));
    
    // Add a selected flag to all collections
    const markSelectedCollections = (collections: any[]): any[] => {
      return collections.map(collection => ({
        ...collection,
        is_in_mega_menu: megaMenuCollectionIds.has(collection.id),
        children: markSelectedCollections(collection.children || [])
      }));
    };
    
    const markedCollections = markSelectedCollections(collectionsTree);

    // Function to build mega menu tree from flat array
    function buildMegaMenuTree(items: any[], parentMenuItemId: number | null = null): any[] {
      return items
        .filter(item => item.parent_menu_item_id === parentMenuItemId)
        .map(item => ({
          ...item,
          children: buildMegaMenuTree(items, item.id)
        }));
    }

    // Convert mega menu items to tree structure
    const megaMenuTree = buildMegaMenuTree(megaMenuItems);

    res.status(200).json({
      megaMenu: megaMenuTree,
      collectionsTree: markedCollections
    });
  } catch (error) {
    console.error('Error fetching mega menu items:', error);
    res.status(500).json({ message: 'Error fetching mega menu items', error: (error as Error).message });
  }
};

// Add a collection to the mega menu
export const addToMegaMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      collection_id, 
      position, 
      is_active = true, 
      parent_menu_item_id = null,
      display_subcollections = false,
      level = 0
    }: MegaMenuCreateInput = req.body;
    
    if (!collection_id) {
      res.status(400).json({ message: 'Collection ID is required' });
      return;
    }
    
    // Check if collection exists
    const collection = await db('collections').where('id', collection_id).first();
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }
    
    // Check if parent menu item exists (if specified)
    if (parent_menu_item_id !== null) {
      const parentMenuItem = await db('mega_menu_collections').where('id', parent_menu_item_id).first();
      if (!parentMenuItem) {
        res.status(404).json({ message: 'Parent menu item not found' });
        return;
      }
    }
    
    // Check if collection is already in the mega menu under the same parent
    const existing = await db('mega_menu_collections')
      .where({ 
        collection_id, 
        parent_menu_item_id: parent_menu_item_id === null ? null : parent_menu_item_id
      })
      .first();
      
    if (existing) {
      res.status(400).json({ 
        message: 'Collection is already in the mega menu under the specified parent' 
      });
      return;
    }
    
    // Get the max position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
      const maxPosResult = await db('mega_menu_collections')
        .where('parent_menu_item_id', parent_menu_item_id)
        .max('position as maxPos')
        .first();
      finalPosition = maxPosResult && maxPosResult.maxPos !== null 
        ? Number(maxPosResult.maxPos) + 1 
        : 0;
    }
    
    // Determine level based on parent
    let finalLevel = level;
    if (parent_menu_item_id !== null) {
      const parentLevel = await db('mega_menu_collections')
        .where('id', parent_menu_item_id)
        .select('level')
        .first();
      
      if (parentLevel) {
        finalLevel = parentLevel.level + 1;
      }
    }
    
    // Add collection to mega menu
    const [insertedId] = await db('mega_menu_collections').insert({
      collection_id,
      position: finalPosition,
      is_active,
      parent_menu_item_id,
      display_subcollections,
      level: finalLevel,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');
    
    // Get the newly inserted record with collection details
    const megaMenuItem = await db('mega_menu_collections as mmc')
      .select(
        'mmc.*',
        'c.name as collection_name',
        'c.slug as collection_slug',
        'c.parent_id',
        'c.collection_type',
        'c.level as collection_level'
      )
      .join('collections as c', 'mmc.collection_id', 'c.id')
      .where('mmc.id', insertedId.id || insertedId)
      .first();
    
    res.status(201).json({ 
      message: 'Collection added to mega menu successfully',
      megaMenuItem
    });
  } catch (error) {
    console.error('Error adding collection to mega menu:', error);
    res.status(500).json({ message: 'Error adding collection to mega menu', error: (error as Error).message });
  }
};

// Add subcollection to an existing mega menu item
export const addSubcollectionToMegaMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      collection_id, 
      parent_menu_item_id, 
      position, 
      is_active = true 
    }: MegaMenuSubcollectionCreateInput = req.body;
    
    if (!collection_id || !parent_menu_item_id) {
      res.status(400).json({ message: 'Collection ID and parent menu item ID are required' });
      return;
    }
    
    // Check if collection exists
    const collection = await db('collections').where('id', collection_id).first();
    if (!collection) {
      res.status(404).json({ message: 'Collection not found' });
      return;
    }
    
    // Check if parent menu item exists
    const parentMenuItem = await db('mega_menu_collections').where('id', parent_menu_item_id).first();
    if (!parentMenuItem) {
      res.status(404).json({ message: 'Parent menu item not found' });
      return;
    }
    
    // Check if collection is already a subcollection of this parent
    const existing = await db('mega_menu_collections')
      .where({ 
        collection_id, 
        parent_menu_item_id 
      })
      .first();
      
    if (existing) {
      res.status(400).json({ 
        message: 'Collection is already a subcollection of this menu item' 
      });
      return;
    }
    
    // Get the max position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
      const maxPosResult = await db('mega_menu_collections')
        .where('parent_menu_item_id', parent_menu_item_id)
        .max('position as maxPos')
        .first();
      finalPosition = maxPosResult && maxPosResult.maxPos !== null 
        ? Number(maxPosResult.maxPos) + 1 
        : 0;
    }
    
    // Calculate the level (parent's level + 1)
    const level = parentMenuItem.level + 1;
    
    // Add subcollection to mega menu
    const [insertedId] = await db('mega_menu_collections').insert({
      collection_id,
      position: finalPosition,
      is_active,
      parent_menu_item_id,
      display_subcollections: false, // Default for subcollection
      level,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('id');
    
    // Mark parent to display subcollections if not already set
    if (!parentMenuItem.display_subcollections) {
      await db('mega_menu_collections')
        .where('id', parent_menu_item_id)
        .update({
          display_subcollections: true,
          updated_at: new Date()
        });
    }
    
    // Get the newly inserted record with collection details
    const megaMenuItem = await db('mega_menu_collections as mmc')
      .select(
        'mmc.*',
        'c.name as collection_name',
        'c.slug as collection_slug',
        'c.parent_id',
        'c.collection_type',
        'c.level as collection_level'
      )
      .join('collections as c', 'mmc.collection_id', 'c.id')
      .where('mmc.id', insertedId.id || insertedId)
      .first();
    
    res.status(201).json({ 
      message: 'Subcollection added to mega menu successfully',
      megaMenuItem
    });
  } catch (error) {
    console.error('Error adding subcollection to mega menu:', error);
    res.status(500).json({ 
      message: 'Error adding subcollection to mega menu', 
      error: (error as Error).message 
    });
  }
};

// Update a mega menu item
export const updateMegaMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      position, 
      is_active, 
      parent_menu_item_id, 
      display_subcollections 
    }: MegaMenuUpdateInput = req.body;
    
    // Check if mega menu item exists
    const megaMenuItem = await db('mega_menu_collections').where('id', id).first();
    if (!megaMenuItem) {
      res.status(404).json({ message: 'Mega menu item not found' });
      return;
    }
    
    // Check if parent menu item exists (if updating parent)
    if (parent_menu_item_id !== undefined && parent_menu_item_id !== null) {
      const parentMenuItem = await db('mega_menu_collections').where('id', parent_menu_item_id).first();
      if (!parentMenuItem) {
        res.status(404).json({ message: 'Parent menu item not found' });
        return;
      }
      
      // Prevent circular references
      if (parent_menu_item_id.toString() === id.toString()) {
        res.status(400).json({ message: 'A menu item cannot be its own parent' });
        return;
      }
    }
    
    // Calculate level if changing parent
    let level = megaMenuItem.level;
    if (parent_menu_item_id !== undefined && parent_menu_item_id !== megaMenuItem.parent_menu_item_id) {
      if (parent_menu_item_id === null) {
        level = 0; // Top level
      } else {
        const parentLevel = await db('mega_menu_collections')
          .where('id', parent_menu_item_id)
          .select('level')
          .first();
        
        if (parentLevel) {
          level = parentLevel.level + 1;
        }
      }
    }
    
    // Update the mega menu item
    await db('mega_menu_collections')
      .where('id', id)
      .update({
        position: position !== undefined ? position : megaMenuItem.position,
        is_active: is_active !== undefined ? is_active : megaMenuItem.is_active,
        parent_menu_item_id: parent_menu_item_id !== undefined ? parent_menu_item_id : megaMenuItem.parent_menu_item_id,
        display_subcollections: display_subcollections !== undefined ? display_subcollections : megaMenuItem.display_subcollections,
        level: level,
        updated_at: new Date()
      });
    
    // Get the updated item with collection details
    const updatedItem = await db('mega_menu_collections as mmc')
      .select(
        'mmc.*',
        'c.name as collection_name',
        'c.slug as collection_slug',
        'c.parent_id',
        'c.collection_type',
        'c.level as collection_level'
      )
      .join('collections as c', 'mmc.collection_id', 'c.id')
      .where('mmc.id', id)
      .first();
      
    res.status(200).json({ 
      message: 'Mega menu item updated successfully',
      megaMenuItem: updatedItem
    });
  } catch (error) {
    console.error('Error updating mega menu item:', error);
    res.status(500).json({ message: 'Error updating mega menu item', error: (error as Error).message });
  }
};

// Remove a collection from the mega menu (and all its subcollections)
export const removeFromMegaMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if mega menu item exists
    const megaMenuItem = await db('mega_menu_collections').where('id', id).first();
    if (!megaMenuItem) {
      res.status(404).json({ message: 'Mega menu item not found' });
      return;
    }
    
    // Start a transaction to delete the item and its children
    await db.transaction(async (trx) => {
      // First, recursively delete all children (this works because of the CASCADE on the foreign key)
      await trx('mega_menu_collections').where('id', id).del();
    });
    
    res.status(200).json({ message: 'Collection removed from mega menu successfully' });
  } catch (error) {
    console.error('Error removing collection from mega menu:', error);
    res.status(500).json({ message: 'Error removing collection from mega menu', error: (error as Error).message });
  }
};

// Reorder mega menu items
export const reorderMegaMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Items array is required and must not be empty' });
      return;
    }
    
    // Start a transaction for the reordering
    await db.transaction(async (trx) => {
      for (const item of items) {
        if (!item.id || item.position === undefined) {
          throw new Error('Each item must have an id and position');
        }
        
        await trx('mega_menu_collections')
          .where('id', item.id)
          .update({
            position: item.position,
            updated_at: new Date()
          });
      }
    });
    
    // Fetch the updated mega menu items with hierarchy
    const allMegaMenuItems = await db('mega_menu_collections as mmc')
      .select(
        'mmc.*',
        'c.name as collection_name',
        'c.slug as collection_slug',
        'c.parent_id',
        'c.collection_type',
        'c.level as collection_level'
      )
      .join('collections as c', 'mmc.collection_id', 'c.id')
      .orderBy(['mmc.parent_menu_item_id', 'mmc.position']);
      
    // Convert to tree structure
    function buildMegaMenuTree(items: any[], parentMenuItemId: number | null = null): any[] {
      return items
        .filter(item => item.parent_menu_item_id === parentMenuItemId)
        .map(item => ({
          ...item,
          children: buildMegaMenuTree(items, item.id)
        }));
    }
    
    const megaMenuTree = buildMegaMenuTree(allMegaMenuItems);
    
    res.status(200).json({ 
      message: 'Mega menu reordered successfully',
      megaMenu: megaMenuTree
    });
  } catch (error) {
    console.error('Error reordering mega menu:', error);
    res.status(500).json({ message: 'Error reordering mega menu', error: (error as Error).message });
  }
};

/**
 * Get the mega menu structure with categories and featured brands
 */
export const getMegaMenu = async (_req: Request, res: Response): Promise<void> => {
  try {
    const megaMenuItems = await db('mega_menu_collections as mm')
      .select(
        'mm.id',
        'mm.position',
        'mm.level',
        'mm.display_subcollections',
        'mm.is_featured',
        'mm.parent_menu_item_id',
        'c.id as collection_id',
        'c.name',
        'c.slug',
        'c.description',
        'c.collection_type',
        'c.image_url'
      )
      .join('collections as c', 'mm.collection_id', 'c.id')
      .where('mm.is_active', true)
      .andWhere('c.is_active', true)
      .orderBy(['mm.level', 'mm.position']);

    // Build the tree structure
    const menuTree = buildTreeFromItems(megaMenuItems);

    // For each top-level category, mark which brands are featured
    menuTree.forEach(category => {
      if (category.children) {
        // Add a "featured" property to each brand child
        category.children.forEach((child: any) => {
          if (child.collection_type === 'brand') {
            child.is_featured = child.is_featured || false;
          }
        });

        // Add a featuredBrands array to the category
        category.featuredBrands = category.children
          .filter((child: any) => child.collection_type === 'brand' && child.is_featured)
          .map((brand: any) => ({
            id: brand.collection_id,
            name: brand.name,
            slug: brand.slug,
            image_url: brand.image_url
          }));
      }
    });

    res.json(menuTree);
  } catch (error) {
    console.error('Error getting mega menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Helper function to build the mega menu tree for frontend display
 */
function buildTreeFromItems(items: any[]): any[] {
  // First, find all top-level items (level 0)
  const topLevel = items.filter(item => item.level === 0);
  
  // For each top-level item, recursively build the tree
  return topLevel.map(item => {
    const node = {
      id: item.id,
      collection_id: item.collection_id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      collection_type: item.collection_type,
      display_subcollections: item.display_subcollections,
      is_featured: item.is_featured,
      image_url: item.image_url,
      level: item.level,
      position: item.position,
      children: getChildrenForDisplay(items, item.id)
    };
    
    return node;
  });
}

/**
 * Helper function to get children for a menu item for frontend display
 */
function getChildrenForDisplay(items: any[], parentId: number): any[] {
  return items
    .filter(item => item.parent_menu_item_id === parentId)
    .map(item => ({
      id: item.id,
      collection_id: item.collection_id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      collection_type: item.collection_type,
      display_subcollections: item.display_subcollections,
      is_featured: item.is_featured,
      image_url: item.image_url,
      level: item.level,
      position: item.position,
      children: getChildrenForDisplay(items, item.id)
    }))
    .sort((a, b) => a.position - b.position);
} 