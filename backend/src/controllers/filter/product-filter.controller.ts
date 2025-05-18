import { Request, Response } from 'express';
import db from '../../db/db';

/**
 * Comprehensive filtering endpoint that works with the frontend filter UI
 * Standardized to match the frontend terminology
 */
export const filterProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Product Filter Query Params:', req.query);
    
    // Extract query parameters with defaults
    const {
      page = '1',
      limit = '8', // Match frontend default
      sort_by = 'ASC_ORDER', // Match frontend sort parameter
      product_category, // Frontend param: selectedCategory
      category, // Direct category parameter
      brand, // Frontend param: selectedBrands (comma-separated)
      color, // Frontend param: selectedColor
      min_price, // Frontend param: selectedPrice.min
      max_price, // Frontend param: selectedPrice.max
      is_new, // Frontend param: isNewFilter
      is_sale, // Frontend param: isSaleFilter
      is_featured, // Frontend param: isFeaturedFilter
    } = req.query;
    
    // Handle URL-encoded category names with special characters
    let categoryFilter = category || product_category;
    if (categoryFilter) {
      try {
        // Decode '+' to spaces and other URL-encoded characters
        categoryFilter = decodeURIComponent(categoryFilter.toString().replace(/\+/g, ' '));
        console.log(`Decoded category filter: "${categoryFilter}"`);
      } catch (err) {
        console.error(`Error decoding category filter:`, err);
      }
    }
    
    // Log the detected category filter
    console.log(`Category filter detected: ${categoryFilter || 'ALL'}`);
    
    // Convert parameters to appropriate types
    const pageValue = parseInt(page as string, 10) || 1;
    const limitValue = parseInt(limit as string, 10) || 8;
    const minPriceValue = min_price ? parseFloat(min_price as string) : undefined;
    const maxPriceValue = max_price ? parseFloat(max_price as string) : undefined;
    
    // Parse brand parameter (can be comma-separated string or array)
    let brandValues: string[] = [];
    if (typeof brand === 'string') {
      brandValues = brand.split(',').map(b => b.trim()).filter(b => b);
    } else if (Array.isArray(brand)) {
      brandValues = brand as string[];
    }
    
    // Build SQL direction and sort column based on frontend sort_by value
    let sortDirection = 'asc';
    let sortColumn = 'p.title';
    
    switch (sort_by) {
      case 'HIGH_TO_LOW':
        sortColumn = 'p.price';
        sortDirection = 'desc';
        break;
      case 'LOW_TO_HIGH':
        sortColumn = 'p.price';
        sortDirection = 'asc';
        break;
      case 'NEWEST':
        sortColumn = 'p.created_at';
        sortDirection = 'desc';
        break;
      case 'ASC_ORDER':
        sortColumn = 'p.title';
        sortDirection = 'asc';
        break;
      case 'DESC_ORDER':
        sortColumn = 'p.title';
        sortDirection = 'desc';
        break;
      default:
        sortColumn = 'p.title';
        sortDirection = 'asc';
    }
    
    // Log applied filters for debugging
    console.log(`
    *** Applied Product Filters ***
    Page: ${pageValue}
    Limit: ${limitValue}
    Sort: ${sortColumn} ${sortDirection}
    Category: ${categoryFilter || 'ALL'}
    Brands: ${brandValues.length ? brandValues.join(', ') : 'None'}
    Color: ${color || 'None'}
    Price Range: ${minPriceValue || 0} - ${maxPriceValue || 'unlimited'}
    Is New: ${is_new || 'not specified'}
    Is Sale: ${is_sale || 'not specified'}
    Is Featured: ${is_featured || 'not specified'}
    `);
    
    // Start building query
    let productsQuery = db('products as p')
      .select(
        'p.*',
        db.raw('json_agg(distinct jsonb_build_object(\'id\', pi.id, \'image_id\', pi.image_id, \'alt\', pi.alt, \'src\', pi.src, \'is_primary\', pi.is_primary)) FILTER (WHERE pi.id IS NOT NULL) as images'),
        db.raw('json_agg(distinct jsonb_build_object(\'id\', pv.id, \'sku\', pv.sku, \'size\', pv.size, \'color\', pv.color, \'image_id\', pv.image_id, \'image_url\', pv.image_url, \'price\', pv.price)) FILTER (WHERE pv.id IS NOT NULL) as variants'),
        db.raw('json_agg(distinct jsonb_build_object(\'id\', c.id, \'name\', c.name, \'slug\', c.slug)) FILTER (WHERE c.id IS NOT NULL) as collections')
      )
      .leftJoin('product_images as pi', 'p.id', 'pi.product_id')
      .leftJoin('product_variants as pv', 'p.id', 'pv.product_id')
      .leftJoin('product_collections as pc', 'p.id', 'pc.product_id')
      .leftJoin('collections as c', 'pc.collection_id', 'c.id')
      .groupBy('p.id');
    
    // Create a separate count query that preserves all filters but simplifies the query
    // This fixes the issue with incorrect counts
    const countQuery = db('products as p')
      .count('p.id as count')
      .first();
    
    // Apply category filter - allow ALL or no filter
    if (categoryFilter && categoryFilter !== 'ALL' && categoryFilter !== 'all') {
      console.log(`Filtering by category: "${categoryFilter}"`);
      
      // Diagnostic query: Check what collections match this name
      try {
        const matchingCollections = await db('collections')
          .select('id', 'name', 'slug', 'parent_id', 'collection_type')
          .whereRaw('LOWER(TRIM(name)) = LOWER(TRIM(?))', [categoryFilter])
          .orWhereRaw('LOWER(TRIM(name)) LIKE LOWER(TRIM(?))', [`%${categoryFilter}%`]);
          
        console.log(`Found ${matchingCollections.length} collections matching or containing "${categoryFilter}":`, 
          matchingCollections.map(c => `${c.id}:${c.name} (${c.collection_type})`).join(', '));
      } catch (err) {
        console.error('Error in diagnostic collection query:', err);
      }
      
      // Enhanced approach to get products from a category:
      // 1. Direct match on product.category field
      // 2. Matching through collections with same name
      // 3. Matching through child collections of the category
      
      productsQuery = productsQuery.where(function() {
        // Direct category match (older approach)
        this.whereRaw('UPPER(p.category) = UPPER(?)', [categoryFilter])
        // OR match through collections (direct match or starts with)
        .orWhereExists(function() {
          this.select('pc.product_id')
            .from('product_collections as pc')
            .join('collections as c', 'pc.collection_id', 'c.id')
            .whereRaw('pc.product_id = p.id')
            .where(function() {
              // Exact match after trimming and case normalization
              this.whereRaw('LOWER(TRIM(c.name)) = LOWER(TRIM(?))', [categoryFilter])
              // OR category name starts with the filter (for partial matches)
              .orWhereRaw('LOWER(TRIM(c.name)) LIKE LOWER(TRIM(?))', [`${categoryFilter}%`])
              // OR filter starts with category name (for partial matches)
              .orWhereRaw('LOWER(TRIM(?)) LIKE LOWER(TRIM(c.name)) || \'%\'', [categoryFilter]);
            });
        })
        // OR match through child collections (hierarchical)
        .orWhereExists(function() {
          this.select('pc.product_id')
            .from('product_collections as pc')
            .join('collections as child', 'pc.collection_id', 'child.id')
            .join('collections as parent', 'child.parent_id', 'parent.id')
            .whereRaw('pc.product_id = p.id')
            .where(function() {
              // Exact match after trimming and case normalization
              this.whereRaw('LOWER(TRIM(parent.name)) = LOWER(TRIM(?))', [categoryFilter])
              // OR parent category name starts with the filter (for partial matches)
              .orWhereRaw('LOWER(TRIM(parent.name)) LIKE LOWER(TRIM(?))', [`${categoryFilter}%`])
              // OR filter starts with parent category name (for partial matches)
              .orWhereRaw('LOWER(TRIM(?)) LIKE LOWER(TRIM(parent.name)) || \'%\'', [categoryFilter]);
            });
        });
      });
    }
    
    // Apply brand filter - support multiple brands
    if (brandValues.length > 0) {
      console.log(`Filtering by brands: ${brandValues.join(', ')}`);
      if (brandValues.length === 1) {
        productsQuery = productsQuery.whereRaw('UPPER(p.brand) = UPPER(?)', [brandValues[0]]);
      } else {
        // Create placeholders for each brand value
        const placeholders = brandValues.map(() => 'UPPER(?)').join(', ');
        productsQuery = productsQuery.whereRaw(`UPPER(p.brand) IN (${placeholders})`, brandValues);
      }
    }
    
    // Apply color filter
    if (color) {
      console.log(`Filtering by color: "${color}"`);
      // Look in product_variants for color match
      productsQuery = productsQuery.whereExists(function() {
        this.select('*')
          .from('product_variants as pv_color')
          .whereRaw('pv_color.product_id = p.id')
          .whereRaw('UPPER(pv_color.color) = UPPER(?)', [color]);
      });
    }
    
    // Apply price range filters
    if (minPriceValue !== undefined) {
      productsQuery = productsQuery.where('p.price', '>=', minPriceValue);
    }
    
    if (maxPriceValue !== undefined) {
      productsQuery = productsQuery.where('p.price', '<=', maxPriceValue);
    }
    
    // Apply new/sale/featured filters
    if (is_new !== undefined) {
      const isNewValue = is_new === 'true';
      productsQuery = productsQuery.where('p.is_new', isNewValue);
    }
    
    if (is_sale !== undefined) {
      const isSaleValue = is_sale === 'true';
      productsQuery = productsQuery.where('p.is_sale', isSaleValue);
    }
    
    if (is_featured !== undefined) {
      const isFeaturedValue = is_featured === 'true';
      productsQuery = productsQuery.where('p.is_featured', isFeaturedValue);
    }
    
    // Apply sorting
    productsQuery = productsQuery.orderBy(sortColumn, sortDirection);
    
    // Apply all the same filters to the count query
    if (categoryFilter && categoryFilter !== 'ALL' && categoryFilter !== 'all') {
      countQuery.where(function() {
        // Direct category match (older approach)
        this.whereRaw('UPPER(p.category) = UPPER(?)', [categoryFilter])
        // OR match through collections (direct match or starts with)
        .orWhereExists(function() {
          this.select('pc.product_id')
            .from('product_collections as pc')
            .join('collections as c', 'pc.collection_id', 'c.id')
            .whereRaw('pc.product_id = p.id')
            .where(function() {
              // Exact match after trimming and case normalization
              this.whereRaw('LOWER(TRIM(c.name)) = LOWER(TRIM(?))', [categoryFilter])
              // OR category name starts with the filter (for partial matches)
              .orWhereRaw('LOWER(TRIM(c.name)) LIKE LOWER(TRIM(?))', [`${categoryFilter}%`])
              // OR filter starts with category name (for partial matches)
              .orWhereRaw('LOWER(TRIM(?)) LIKE LOWER(TRIM(c.name)) || \'%\'', [categoryFilter]);
            });
        })
        // OR match through child collections (hierarchical)
        .orWhereExists(function() {
          this.select('pc.product_id')
            .from('product_collections as pc')
            .join('collections as child', 'pc.collection_id', 'child.id')
            .join('collections as parent', 'child.parent_id', 'parent.id')
            .whereRaw('pc.product_id = p.id')
            .where(function() {
              // Exact match after trimming and case normalization
              this.whereRaw('LOWER(TRIM(parent.name)) = LOWER(TRIM(?))', [categoryFilter])
              // OR parent category name starts with the filter (for partial matches)
              .orWhereRaw('LOWER(TRIM(parent.name)) LIKE LOWER(TRIM(?))', [`${categoryFilter}%`])
              // OR filter starts with parent category name (for partial matches)
              .orWhereRaw('LOWER(TRIM(?)) LIKE LOWER(TRIM(parent.name)) || \'%\'', [categoryFilter]);
            });
        });
      });
    }
    
    // Apply brand filter to count query
    if (brandValues.length > 0) {
      if (brandValues.length === 1) {
        countQuery.whereRaw('UPPER(p.brand) = UPPER(?)', [brandValues[0]]);
      } else {
        const placeholders = brandValues.map(() => 'UPPER(?)').join(', ');
        countQuery.whereRaw(`UPPER(p.brand) IN (${placeholders})`, brandValues);
      }
    }
    
    // Apply color filter to count query
    if (color) {
      countQuery.whereExists(function() {
        this.select('*')
          .from('product_variants as pv_color')
          .whereRaw('pv_color.product_id = p.id')
          .whereRaw('UPPER(pv_color.color) = UPPER(?)', [color]);
      });
    }
    
    // Apply price range filters to count query
    if (minPriceValue !== undefined) {
      countQuery.where('p.price', '>=', minPriceValue);
    }
    
    if (maxPriceValue !== undefined) {
      countQuery.where('p.price', '<=', maxPriceValue);
    }
    
    // Apply new/sale/featured filters to count query
    if (is_new !== undefined) {
      const isNewValue = is_new === 'true';
      countQuery.where('p.is_new', isNewValue);
    }
    
    if (is_sale !== undefined) {
      const isSaleValue = is_sale === 'true';
      countQuery.where('p.is_sale', isSaleValue);
    }
    
    if (is_featured !== undefined) {
      const isFeaturedValue = is_featured === 'true';
      countQuery.where('p.is_featured', isFeaturedValue);
    }
    
    // Log the count query SQL for debugging
    const countSql = countQuery.toSQL();
    console.log('Count SQL Query:', countSql.sql);
    console.log('Count Query Bindings:', countSql.bindings);
    
    // Calculate proper offset
    const offset = Math.max(0, (pageValue - 1) * limitValue);
    console.log(`Pagination: page=${pageValue}, limit=${limitValue}, offset=${offset}`);
    
    // Apply pagination to product query only
    productsQuery = productsQuery
      .offset(offset)
      .limit(limitValue);
    
    // Debug SQL
    const sqlString = productsQuery.toSQL();
    console.log('Filter SQL Query:', sqlString.sql);
    console.log('Filter Query Bindings:', sqlString.bindings);
    
    try {
      // Execute both queries in parallel
      const [products, countResult] = await Promise.all([
        productsQuery,
        countQuery
      ]);
      
      // Extract count from result with better error handling
      let totalCount = 0;
      if (countResult && typeof countResult === 'object') {
        totalCount = parseInt(String(countResult.count || '0'), 10);
      } else {
        // Fallback: if count query fails, use the length of products or run a simple count query
        console.log('Count query returned invalid result, using fallback count method');
        const fallbackCount = await db('products as p').count('* as count').first();
        totalCount = fallbackCount && fallbackCount.count ? parseInt(String(fallbackCount.count), 10) : products.length;
      }
      
      // Log the totalCount for debugging
      console.log(`Filtered products count: ${totalCount}`);
      
      // Calculate total pages with proper handling of zero results
      const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / limitValue);
      
      // Log pagination details for debugging
      console.log(`Pagination results: totalCount=${totalCount}, totalPages=${totalPages}, currentPage=${pageValue}`);
      
      // Process products to ensure valid JSON structures
      const processedProducts = Array.isArray(products) ? products.map(product => {
        // Ensure arrays are valid JSON arrays, not SQL NULL
        return {
          ...product,
          images: product.images || [],
          variants: product.variants || [],
          collections: product.collections || [],
          // Match frontend expectations
          new: product.is_new,
          sale: product.is_sale,
          featured: product.is_featured
        };
      }) : [];
      
      // Return response with metadata
      res.json({
        products: processedProducts,
        totalCount,
        totalPages,
        currentPage: pageValue,
        pageSize: limitValue,
        filters: {
          category: categoryFilter || 'ALL',
          brands: brandValues,
          color: color || '',
          priceRange: {
            min: minPriceValue || 0,
            max: maxPriceValue || null
          },
          isNew: is_new === 'true',
          isSale: is_sale === 'true',
          isFeatured: is_featured === 'true'
        }
      });
    } catch (innerError) {
      console.error('Error in query execution:', innerError);
      
      // Fallback response with empty products
      res.json({
        products: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: pageValue,
        pageSize: limitValue,
        error: 'Unable to process filter query',
        filters: {
          category: categoryFilter || 'ALL',
          brands: brandValues,
          color: color || '',
          priceRange: {
            min: minPriceValue || 0,
            max: maxPriceValue || null
          },
          isNew: is_new === 'true',
          isSale: is_sale === 'true',
          isFeatured: is_featured === 'true'
        }
      });
    }
  } catch (error: any) {
    console.error('Error filtering products:', error);
    res.status(500).json({
      message: 'Error filtering products',
      error: error.message
    });
  }
};

// Get all available product categories
export const getFilterableCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    // Query unique categories from products
    const categories = await db('products')
      .distinct('category')
      .whereNotNull('category')
      .orderBy('category', 'asc');
    
    // Extract category values from results
    const categoryList = categories.map(c => c.category);
    
    // Add ALL option
    const result = ['ALL', ...categoryList];
    
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      message: 'Error fetching product categories',
      error: error.message
    });
  }
};

// Get all available product brands
export const getFilterableBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract category parameter if provided for filtering
    const { category, brand } = req.query;
    
    // Handle URL-encoded category names with special characters
    let categoryFilter = category as string;
    if (categoryFilter) {
      try {
        // Decode '+' to spaces and other URL-encoded characters
        categoryFilter = decodeURIComponent(categoryFilter.toString().replace(/\+/g, ' '));
        console.log(`Decoded category filter for brands API: "${categoryFilter}"`);
      } catch (err) {
        console.error(`Error decoding category filter in brands API:`, err);
      }
    }
    
    let brandQuery = db('products as p')
      .distinct('p.brand')
      .whereNotNull('p.brand')
      .orderBy('p.brand', 'asc');
    
    // If category provided, apply enhanced filtering similar to main products endpoint
    if (categoryFilter && categoryFilter !== 'ALL' && categoryFilter !== 'all') {
      console.log(`Filtering brands by category: "${categoryFilter}"`);
      
      // Use the same advanced matching approach as in products filter
      brandQuery = brandQuery.where(function() {
        // Direct category match 
        this.whereRaw('LOWER(TRIM(p.category)) = LOWER(TRIM(?))', [categoryFilter])
        // OR match through collections (direct match or partial match)
        .orWhereExists(function() {
          this.select('pc.product_id')
            .from('product_collections as pc')
            .join('collections as c', 'pc.collection_id', 'c.id')
            .whereRaw('pc.product_id = p.id')
            .where(function() {
              // Exact match after trimming and case normalization
              this.whereRaw('LOWER(TRIM(c.name)) = LOWER(TRIM(?))', [categoryFilter])
              // OR category name starts with the filter
              .orWhereRaw('LOWER(TRIM(c.name)) LIKE LOWER(TRIM(?))', [`${categoryFilter}%`])
              // OR filter starts with category name
              .orWhereRaw('LOWER(TRIM(?)) LIKE LOWER(TRIM(c.name)) || \'%\'', [categoryFilter]);
            });
        })
        // OR match through child collections (hierarchical)
        .orWhereExists(function() {
          this.select('pc.product_id')
            .from('product_collections as pc')
            .join('collections as child', 'pc.collection_id', 'child.id')
            .join('collections as parent', 'child.parent_id', 'parent.id')
            .whereRaw('pc.product_id = p.id')
            .where(function() {
              // Exact match after trimming and case normalization
              this.whereRaw('LOWER(TRIM(parent.name)) = LOWER(TRIM(?))', [categoryFilter])
              // OR parent category name starts with the filter
              .orWhereRaw('LOWER(TRIM(parent.name)) LIKE LOWER(TRIM(?))', [`${categoryFilter}%`])
              // OR filter starts with parent category name
              .orWhereRaw('LOWER(TRIM(?)) LIKE LOWER(TRIM(parent.name)) || \'%\'', [categoryFilter]);
            });
        });
      });
    }
    
    const brands = await brandQuery;
    
    // Extract brand values
    const brandList = brands.map(b => b.brand);
    
    res.json(brandList);
  } catch (error: any) {
    console.error('Error fetching brands:', error);
    res.status(500).json({
      message: 'Error fetching product brands',
      error: error.message
    });
  }
};

// Get all available product colors
export const getFilterableColors = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract category parameter if provided for filtering
    const { category, brand } = req.query;
    
    // Handle URL-encoded category names with special characters
    let categoryFilter = category as string;
    if (categoryFilter) {
      try {
        // Decode '+' to spaces and other URL-encoded characters
        categoryFilter = decodeURIComponent(categoryFilter.toString().replace(/\+/g, ' '));
        console.log(`Decoded category filter for colors API: "${categoryFilter}"`);
      } catch (err) {
        console.error(`Error decoding category filter in colors API:`, err);
      }
    }
    
    // Handle URL-encoded brand names with special characters
    let brandFilter = brand as string;
    if (brandFilter) {
      try {
        // Decode '+' to spaces and other URL-encoded characters
        brandFilter = decodeURIComponent(brandFilter.toString().replace(/\+/g, ' '));
        console.log(`Decoded brand filter for colors API: "${brandFilter}"`);
      } catch (err) {
        console.error(`Error decoding brand filter in colors API:`, err);
      }
    }
    
    // We need to get colors from product_variants
    let colorQuery = db('product_variants as pv')
      .join('products as p', 'pv.product_id', 'p.id')
      .distinct('pv.color')
      .whereNotNull('pv.color')
      .orderBy('pv.color', 'asc');
    
    // If category provided, apply enhanced filtering similar to main products endpoint
    if (categoryFilter && categoryFilter !== 'ALL' && categoryFilter !== 'all') {
      console.log(`Filtering colors by category: "${categoryFilter}"`);
      
      // Use the same advanced matching approach as in products filter
      colorQuery = colorQuery.where(function() {
        // Direct category match 
        this.whereRaw('LOWER(TRIM(p.category)) = LOWER(TRIM(?))', [categoryFilter])
        // OR match through collections (direct match or partial match)
        .orWhereExists(function() {
          this.select('pc.product_id')
            .from('product_collections as pc')
            .join('collections as c', 'pc.collection_id', 'c.id')
            .whereRaw('pc.product_id = p.id')
            .where(function() {
              // Exact match after trimming and case normalization
              this.whereRaw('LOWER(TRIM(c.name)) = LOWER(TRIM(?))', [categoryFilter])
              // OR category name starts with the filter
              .orWhereRaw('LOWER(TRIM(c.name)) LIKE LOWER(TRIM(?))', [`${categoryFilter}%`])
              // OR filter starts with category name
              .orWhereRaw('LOWER(TRIM(?)) LIKE LOWER(TRIM(c.name)) || \'%\'', [categoryFilter]);
            });
        })
        // OR match through child collections (hierarchical)
        .orWhereExists(function() {
          this.select('pc.product_id')
            .from('product_collections as pc')
            .join('collections as child', 'pc.collection_id', 'child.id')
            .join('collections as parent', 'child.parent_id', 'parent.id')
            .whereRaw('pc.product_id = p.id')
            .where(function() {
              // Exact match after trimming and case normalization
              this.whereRaw('LOWER(TRIM(parent.name)) = LOWER(TRIM(?))', [categoryFilter])
              // OR parent category name starts with the filter
              .orWhereRaw('LOWER(TRIM(parent.name)) LIKE LOWER(TRIM(?))', [`${categoryFilter}%`])
              // OR filter starts with parent category name
              .orWhereRaw('LOWER(TRIM(?)) LIKE LOWER(TRIM(parent.name)) || \'%\'', [categoryFilter]);
            });
        });
      });
    }
    
    // If brand provided, filter colors for that brand with enhanced handling
    if (brandFilter) {
      console.log(`Filtering colors by brand: "${brandFilter}"`);
      colorQuery = colorQuery.whereRaw('LOWER(TRIM(p.brand)) = LOWER(TRIM(?))', [brandFilter]);
    }
    
    const colors = await colorQuery;
    
    // Extract color values
    const colorList = colors.map(c => c.color);
    
    res.json(colorList);
  } catch (error: any) {
    console.error('Error fetching colors:', error);
    res.status(500).json({
      message: 'Error fetching product colors',
      error: error.message
    });
  }
};
