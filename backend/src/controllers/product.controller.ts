import { Request, Response } from 'express';
import db from '../db/db';
import { ProductCreateInput, ProductQueryOptions, ProductUpdateInput } from '../models/Product';

// Transform product data to match GraphQL structure
const transformProductForGraphQL = (product: any) => {
  if (!product) return null;
  
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    type: product.type,
    brand: product.brand,
    category: product.category,
    price: product.price,
    new: product.is_new, // Convert is_new to new
    sale: product.is_sale, // Convert is_sale to sale
    featured: product.is_featured, // Convert is_featured to featured
    discount: product.discount,
    stock: product.stock,
    slug: product.slug,
    meta_title: product.meta_title,
    meta_description: product.meta_description,
    meta_keywords: product.meta_keywords,
    meta_image: product.meta_image,
    // Format images to match GraphQL structure
    images: Array.isArray(product.images) 
      ? product.images
          .filter((img: any) => img && img.id !== null)
          .map((img: any) => {
            // Format the image src path
            let src = img.src;
            
            // Check if it's a database-stored path (product-images) or a seed path (fashion/product)
            if (src && src.startsWith('/product-images/')) {
              // For real uploaded images, ensure they use the /uploads prefix
              src = `/uploads${src}`;
            } else if (src && !src.startsWith('/')) {
              // For seed images, keep the relative path as is
              src = src;
            }
            
            return {
              alt: img.alt,
              src: src
            };
          })
      : [],
    // Format variants to match GraphQL structure
    variants: Array.isArray(product.variants) 
      ? product.variants
          .filter((v: any) => v && v.id !== null)
          .map((v: any) => ({
            id: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            image_id: v.image_id,
            image_url: v.image_url
          }))
      : [],
    // Format collections to match GraphQL structure
    collection: Array.isArray(product.collections) 
      ? product.collections
          .filter((c: any) => c && c.id !== null)
          .map((c: any) => ({
            collectionName: c.name
          }))
      : []
  };
};

// Get all products with pagination
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract query parameters with defaults
    const {
      page = '1',
      limit = '10',
      sort = 'id',
      direction = 'asc',
      min_price,
      max_price,
      category,
      brand,
      colors,
      sizes,
      is_new,
      is_sale,
      collection,
      search,
      all = 'false'
    } = req.query;
    
    // Convert string query parameters to appropriate types
    const pageValue = parseInt(page as string, 10) || 1;
    const limitValue = parseInt(limit as string, 10) || 10;
    const allFlag = all === 'true';
    const minPrice = min_price ? parseFloat(min_price as string) : undefined;
    const maxPrice = max_price ? parseFloat(max_price as string) : undefined;
    const directionValue = (direction as string) === 'desc' ? 'desc' : 'asc';
    
    console.log(`
    *** Product Query Parameters ***
    Page: ${pageValue}
    Limit: ${limitValue}
    Sort: ${sort} ${directionValue}
    Category: ${category || 'ALL'}
    All flag: ${allFlag}
    `);

    // Track applied filters for debugging
    const appliedFilters: Record<string, any> = {};

    // Start building the query
    let query = db('products as p')
      .select(
        'p.*',
        db.raw('json_agg(distinct jsonb_build_object(\'id\', pi.id, \'image_id\', pi.image_id, \'alt\', pi.alt, \'src\', pi.src, \'is_primary\', pi.is_primary)) as images'),
        db.raw('json_agg(distinct jsonb_build_object(\'id\', pv.id, \'sku\', pv.sku, \'size\', pv.size, \'color\', pv.color, \'image_id\', pv.image_id, \'image_url\', pv.image_url, \'price\', pv.price)) as variants'),
        db.raw('json_agg(distinct jsonb_build_object(\'id\', c.id, \'name\', c.name, \'slug\', c.slug)) as collections')
      )
      .leftJoin('product_images as pi', 'p.id', 'pi.product_id')
      .leftJoin('product_variants as pv', 'p.id', 'pv.product_id')
      .leftJoin('product_collections as pc', 'p.id', 'pc.product_id')
      .leftJoin('collections as c', 'pc.collection_id', 'c.id')
      .groupBy('p.id');

    // Apply filters based on GraphQL parameters
    // Map 'type' filter from GraphQL to 'category' in REST
    if (category && category !== 'ALL' && category !== 'all') {
      console.log(`Filtering by category: "${category}"`);
      query = query.whereRaw(`(UPPER(p.type) = UPPER(?) OR UPPER(p.category) = UPPER(?))`, [category, category]);
      appliedFilters.category = category;
      
      // Debug the SQL query being generated
      const queryString = query.toSQL();
      console.log('SQL Query:', queryString.sql);
      console.log('Query Bindings:', queryString.bindings);
    }

    // Apply other filters
    if (search) {
      query = query.whereRaw('(p.title ILIKE ? OR p.description ILIKE ?)', [`%${search}%`, `%${search}%`]);
      appliedFilters.search = search;
    }

    if (brand) {
      console.log('Applying brand filter:', brand);
      appliedFilters.brand = brand;
      
      if (Array.isArray(brand)) {
        if (brand.length === 1) {
          // If only one brand, use equality operator for better index usage
          query = query.where('p.brand', brand[0]);
          console.log(`Filtering for single brand: "${brand[0]}"`);
        } else {
          // Multiple brands
          query = query.whereIn('p.brand', brand);
          console.log(`Filtering for multiple brands: ${brand.join(', ')}`);
        }
      } else {
        // Single brand passed as string
        query = query.where('p.brand', brand);
        console.log(`Filtering for brand: "${brand}"`);
      }
      
      // Debug query
      const brandQueryString = query.toSQL();
      console.log('Brand filter SQL:', brandQueryString.sql);
      console.log('Brand filter bindings:', brandQueryString.bindings);
    }

    if (minPrice) {
      query = query.where('p.price', '>=', minPrice);
      appliedFilters.priceMin = minPrice;
    }

    if (maxPrice) {
      query = query.where('p.price', '<=', maxPrice);
      appliedFilters.priceMax = maxPrice;
    }

    if (is_new !== undefined) {
      const isNewFlag = is_new === 'true';
      query = query.where('p.is_new', isNewFlag);
      appliedFilters.is_new = isNewFlag;
    }

    if (is_sale !== undefined) {
      const isSaleFlag = is_sale === 'true';
      query = query.where('p.is_sale', isSaleFlag);
      appliedFilters.is_sale = isSaleFlag;
    }

    if (collection) {
      query = query.whereExists(function() {
        this.select('*')
          .from('product_collections as pc2')
          .join('collections as c2', 'pc2.collection_id', 'c2.id')
          .whereRaw('pc2.product_id = p.id')
          .where('c2.slug', collection);
      });
      appliedFilters.collection = collection;
    }

    if (colors && Array.isArray(colors)) {
      query = query.whereExists(function() {
        this.select('*')
          .from('product_variants as pv2')
          .whereRaw('pv2.product_id = p.id')
          .whereIn('pv2.color', colors);
      });
      appliedFilters.colors = colors;
    }

    if (sizes && Array.isArray(sizes)) {
      query = query.whereExists(function() {
        this.select('*')
          .from('product_variants as pv3')
          .whereRaw('pv3.product_id = p.id')
          .whereIn('pv3.size', sizes);
      });
      appliedFilters.sizes = sizes;
    }

    // Count total before applying pagination
    const countQuery = query.clone();
    const countResult = await countQuery
      .clearSelect()
      .clearGroup()
      .countDistinct('p.id as count')
      .first();
    
    const count = countResult ? parseInt((countResult as any).count) : 0;

    // Validate and normalize parameters
    const totalPages = Math.max(1, Math.ceil(count / limitValue));
    
    // Calculate the actual page to use (don't exceed total pages)
    const effectivePage = Math.min(pageValue, Math.max(1, totalPages));
    
    // Apply sorting
    query = query.orderBy(`p.${sort}`, directionValue);

    // Skip pagination if 'all' parameter is true
    if (!allFlag) {
      // Calculate offset for pagination
      const offset = (effectivePage - 1) * limitValue;
      query = query.limit(limitValue).offset(offset);
    }

    // Execute the query
    const products = await query;
    
    // Check if we have fewer products than expected - if we apply color, size, or category filters
    // This is a workaround for the issue with whereExists and other complex filters not being properly accounted for in count queries
    if ((colors && Array.isArray(colors) && colors.length > 0) || 
        (sizes && Array.isArray(sizes) && sizes.length > 0) ||
        (category && category !== 'ALL' && category !== 'all')) {
      console.log(`
        *** FILTER CORRECTION ***
        Actual products returned: ${products.length}
        Original count from DB: ${count}
        Applied category filter: ${category || 'none'}
        Applied color filters: ${colors ? JSON.stringify(colors) : 'none'}
        Applied size filters: ${sizes ? JSON.stringify(sizes) : 'none'}
      `);
      
      // For these filters, if we get an inconsistent count, update our counts to match reality
      // Also check if products.length is significantly different from count (more than 50% difference)
      if (products.length < count && 
          (products.length < limitValue || (products.length / count) < 0.5)) {
        // Update count to match actual results or make a better approximation
        // If we have fewer products than limit, we can use products.length directly
        // Otherwise, estimate based on the proportion of results we got
        const adjustedCount = products.length < limitValue ? 
                              products.length : 
                              Math.ceil(products.length * 1.2); // Add 20% buffer to avoid underestimation
        
        const adjustedTotalPages = Math.max(1, Math.ceil(adjustedCount / limitValue));
        
        console.log(`
          ADJUSTING COUNTS:
          - Adjusted total: ${adjustedCount} (was ${count})
          - Adjusted pages: ${adjustedTotalPages} (was ${Math.ceil(count / limitValue)})
        `);
        
        // Use these adjusted values
        res.status(200).json({
          products: {
            items: products.map(transformProductForGraphQL),
            total: adjustedCount,
            totalPages: adjustedTotalPages,
            hasMore: products.length >= limitValue, // There might be more only if we filled the page
            currentPage: effectivePage
          }
        });
        return; // Add explicit return to prevent further execution
      }
    }
    
    // Double-check our calculations - calculate totalPages directly from the count
    const recalculatedTotalPages = Math.ceil(count / limitValue) || 1;
    
    // More detailed logging for pagination debugging
    console.log(`
      Pagination Details:
      ------------------
      Total products found: ${count}
      Items per page: ${limitValue}
      Current page requested: ${pageValue} (using: ${effectivePage})
      Total pages calculated: ${totalPages} (re-checked: ${recalculatedTotalPages})
      Products returned in this page: ${products.length}
      Offset used: ${(effectivePage - 1) * limitValue}
      
      Applied Filters:
      --------------
      ${JSON.stringify(appliedFilters, null, 2)}
      
      Resulting Query:
      --------------
      ${query.toString()}
    `);

    // Transform products to match GraphQL response structure
    const transformedProducts = products.map(transformProductForGraphQL);

    // Format the response to match GraphQL structure
    res.status(200).json({
      products: {
        items: transformedProducts,
        total: count,
        totalPages: recalculatedTotalPages,
        hasMore: (effectivePage * limitValue) < count,
        currentPage: effectivePage
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: (error as Error).message });
  }
};

// Get a single product by ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log(`Fetching product details for ID: ${id}`);

    // First, fetch the product with its basic relationships
    const product = await db('products as p')
      .select(
        'p.*',
        db.raw('json_agg(distinct jsonb_build_object(\'id\', pi.id, \'image_id\', pi.image_id, \'alt\', pi.alt, \'src\', pi.src, \'is_primary\', pi.is_primary)) as images'),
        db.raw('json_agg(distinct jsonb_build_object(\'id\', pv.id, \'sku\', pv.sku, \'size\', pv.size, \'color\', pv.color, \'image_id\', pv.image_id, \'image_url\', pv.image_url, \'price\', pv.price)) as variants'),
        db.raw('json_agg(distinct jsonb_build_object(\'id\', c.id, \'name\', c.name, \'slug\', c.slug, \'collection_type\', c.collection_type)) as collections')
      )
      .leftJoin('product_images as pi', 'p.id', 'pi.product_id')
      .leftJoin('product_variants as pv', 'p.id', 'pv.product_id')
      .leftJoin('product_collections as pc', 'p.id', 'pc.product_id')
      .leftJoin('collections as c', 'pc.collection_id', 'c.id')
      .where('p.id', id)
      .groupBy('p.id')
      .first();

    if (!product) {
      console.log(`Product not found for ID: ${id}`);
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Ensure collections are properly formatted
    let productCollections = [];
    if (product.collections && Array.isArray(product.collections)) {
      productCollections = product.collections.filter((c: any) => c && c.id !== null);
      console.log(`Product ${id} has ${productCollections.length} collections:`, 
        productCollections.map((c: any) => `${c.id}:${c.name}`).join(', ') || 'none'
      );
    } else {
      console.log(`No collections found for product ${id}`);
    }

    // Explicitly fetch collections as a backup if none were found
    if (productCollections.length === 0) {
      console.log(`Attempting to explicitly fetch collections for product ${id}`);
      const collectionResults = await db('collections as c')
        .select('c.id', 'c.name', 'c.slug', 'c.collection_type')
        .join('product_collections as pc', 'c.id', 'pc.collection_id')
        .where('pc.product_id', id);
      
      if (collectionResults && collectionResults.length > 0) {
        productCollections = collectionResults;
        product.collections = productCollections;
        console.log(`Found ${productCollections.length} collections through backup query:`, 
          productCollections.map(c => `${c.id}:${c.name}`).join(', ')
        );
      }
    }

    // Get all collections for the frontend to use when editing
    const allCollections = await db('collections')
      .select('id', 'name', 'slug', 'collection_type', 'parent_id')
      .orderBy('name');
    
    console.log(`Retrieved ${allCollections.length} total collections for selection`);

    // Update the product with enhanced collections data
    const enhancedProduct = {
      ...product,
      collections: productCollections
    };

    // Transform to match GraphQL response structure
    const transformedProduct = transformProductForGraphQL(enhancedProduct);

    res.status(200).json({ 
      product: transformedProduct,
      productCollections: productCollections,
      allCollections: allCollections
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: (error as Error).message });
  }
};

// Helper function to generate a slug from title
const generateSlug = (title: string, id?: number | string): string => {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')   // Remove special chars
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
    .trim();                     // Trim hyphens from start and end
  
  return id ? `${baseSlug}-${id}` : baseSlug;
};

// Create a new product
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      title, description, type, brand, category, price, 
      is_new, is_sale, is_featured, discount, stock, 
      slug, meta_title, meta_description, meta_image, meta_keywords,
      variants, images, collections 
    }: ProductCreateInput = req.body;

    console.log('Create product input:', JSON.stringify({
      title, type, brand, category, price,
      images: images ? images.length : 0,
      collections: collections || []
    }));

    // Start a transaction
    const result = await db.transaction(async trx => {
      // Generate slug if not provided
      const productSlug = slug || generateSlug(title);
      
      // Set meta title to product title if not provided
      const productMetaTitle = meta_title || title;
      
      // Create the product
      const [productId] = await trx('products').insert({
        title,
        description,
        brand,
        category,
        price,
        is_new: is_new || false,
        is_sale: is_sale || false,
        is_featured: is_featured || false, // Use is_featured from request or default to false
        discount: discount || 0,
        stock: stock || 0,
        slug: productSlug,
        meta_title: productMetaTitle,
        meta_description,
        meta_image,
        meta_keywords,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('id');

      // Extract the numeric ID value from the result
      const numericProductId = typeof productId === 'object' ? (productId.id || productId) : productId;
      
      // Update slug with ID if it was auto-generated
      if (!slug) {
        await trx('products')
          .where('id', numericProductId)
          .update({ slug: `${productSlug}-${numericProductId}` });
      }

      console.log(`Created product with ID: ${numericProductId}`);

      // Add collections with high priority if provided
      if (collections && collections.length > 0) {
        console.log(`Adding product ${numericProductId} to collections:`, collections);
        
        // Check if the collections exist
        const existingCollections = await trx('collections')
          .whereIn('id', collections)
          .select('id');
        
        const validCollectionIds = existingCollections.map(c => c.id);
        console.log(`Valid collection IDs: ${validCollectionIds.join(', ')}`);
        
        if (validCollectionIds.length > 0) {
          const productCollections = validCollectionIds.map(collectionId => ({
            product_id: numericProductId,
            collection_id: collectionId
          }));
          
          await trx('product_collections').insert(productCollections);
          console.log(`Added product ${numericProductId} to ${validCollectionIds.length} collections`);
        }
      }

      // Add variants if provided
      if (variants && variants.length > 0) {
        const productVariants = variants.map(variant => ({
          product_id: numericProductId,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          image_id: variant.image_id,
          image_url: variant.image_url,
          price: variant.price,
          created_at: new Date(),
          updated_at: new Date()
        }));
        await trx('product_variants').insert(productVariants);
      }

      // Add images if provided
      if (images && images.length > 0) {
        // Filter out any invalid images or those with just 'id' and no 'src'
        const validImages = images.filter(image => 
          image && image.src && typeof image.src === 'string' && !image.src.startsWith('blob:')
        );
        
        if (validImages.length > 0) {
          const productImages = validImages.map(image => ({
            product_id: numericProductId,
            image_id: image.image_id || null,
            alt: image.alt || `Image for ${title}`,
            src: image.src,
            is_primary: image.is_primary || false,
            created_at: new Date(),
            updated_at: new Date()
          }));
          
          console.log('Inserting images:', JSON.stringify(productImages));
          await trx('product_images').insert(productImages);
        }
      }

      return numericProductId;
    });

    // Make sure we have a valid product ID (not an object)
    let productId;
    if (typeof result === 'object') {
      if (result.id) {
        productId = result.id;
      } else if (result[0]) {
        productId = result[0];
      } else {
        console.error('Unexpected result format:', result);
        throw new Error('Could not determine product ID from transaction result');
      }
    } else {
      productId = result;
    }
    
    console.log('Created product with ID:', productId);
    
    // Fetch the newly created product to return, including collections
    const newProduct = await db('products as p')
      .select(
        'p.*',
        db.raw('COALESCE(json_agg(DISTINCT c) FILTER (WHERE c.id IS NOT NULL), \'[]\'::json) as collections')
      )
      .leftJoin('product_collections as pc', 'p.id', 'pc.product_id')
      .leftJoin('collections as c', 'pc.collection_id', 'c.id')
      .where('p.id', productId)
      .groupBy('p.id')
      .first();
    
    res.status(201).json({ 
      message: 'Product created successfully', 
      product: newProduct,
      collections: newProduct.collections 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: (error as Error).message });
  }
};

// Update a product
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { variants, images, collections, title, slug, ...updateData } = req.body;

    console.log(`Updating product ${id} with data:`, JSON.stringify({
      ...updateData,
      title: title || 'not changing',
      slug: slug || 'not changing', 
      collections: collections || 'not provided',
      variants: variants ? `${variants.length} variants` : 'not provided',
      images: images ? `${images.length} images` : 'not provided'
    }));

    // Start a transaction for atomic updates
    await db.transaction(async trx => {
      // Check if product exists
      const product = await trx('products').where('id', id).first();
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }

      // If title is changing and slug is not provided, generate a new slug
      let updatedSlug = slug;
      if (title && !slug) {
        updatedSlug = generateSlug(title, id);
      }

      // Update basic product info
      await trx('products')
        .where('id', id)
        .update({
          ...updateData,
          title: title || product.title,  // Keep original title if not changing
          slug: updatedSlug,
          updated_at: new Date()
        });

      // Handle collections with high priority if provided
      if (collections !== undefined) {
        console.log(`Updating collections for product ${id}:`, collections);
        
        // Delete existing collection associations
        await trx('product_collections')
          .where('product_id', id)
          .del();
          
        console.log(`Deleted existing collection associations for product ${id}`);

        // Add new collection associations if any
        if (collections && collections.length > 0) {
          // Verify the collections exist
          const existingCollections = await trx('collections')
            .whereIn('id', collections)
            .select('id');
            
          const validCollectionIds = existingCollections.map(c => c.id);
          console.log(`Valid collection IDs: ${validCollectionIds.join(', ')}`);
          
          if (validCollectionIds.length > 0) {
            const productCollections = validCollectionIds.map(collectionId => ({
              product_id: id,
              collection_id: collectionId
            }));
            
            await trx('product_collections').insert(productCollections);
            console.log(`Added product ${id} to ${validCollectionIds.length} collections`);
          }
        }
      }

      // Handle variants
      if (variants !== undefined) {
        // Delete existing variants
        await trx('product_variants').where('product_id', id).del();

        // Insert new variants if any
        if (variants && variants.length > 0) {
          const productVariants = variants.map((variant: { 
            sku?: string; 
            size?: string; 
            color?: string; 
            image_id?: string;
            image_url?: string;
            price?: number;
          }) => ({
            product_id: id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            image_id: variant.image_id,
            image_url: variant.image_url,
            price: variant.price,
            created_at: new Date(),
            updated_at: new Date()
          }));
          await trx('product_variants').insert(productVariants);
        }
      }

      // Handle images
      if (images !== undefined) {
        // Get existing images
        const existingImages = await trx('product_images')
          .where('product_id', id)
          .select('id', 'src');

        // Delete images that are not in the new set
        const newImageIds = new Set(images.filter((img: { id?: number }) => img.id).map((img: { id: number }) => img.id));
        const imagesToDelete = existingImages.filter(img => !newImageIds.has(img.id));

        if (imagesToDelete.length > 0) {
          await trx('product_images')
            .whereIn('id', imagesToDelete.map(img => img.id))
            .del();
        }

        // Add new images
        const newImages = images
          .filter((img: { id?: number; src?: string }) => !img.id && img.src && !img.src.startsWith('blob:'))
          .map((img: { 
            image_id?: string; 
            alt?: string; 
            src: string; 
            is_primary?: boolean;
          }) => ({
            product_id: id,
            image_id: img.image_id || null,
            alt: img.alt || `Image for ${updateData.title || product.title}`,
            src: img.src,
            is_primary: img.is_primary || false,
            created_at: new Date(),
            updated_at: new Date()
          }));

        if (newImages.length > 0) {
          await trx('product_images').insert(newImages);
        }
      }
    });

    // Fetch the updated product with all its relations
    const updatedProduct = await db('products as p')
      .select(
        'p.*',
        db.raw('COALESCE(json_agg(DISTINCT pi) FILTER (WHERE pi.id IS NOT NULL), \'[]\'::json) as images'),
        db.raw('COALESCE(json_agg(DISTINCT pv) FILTER (WHERE pv.id IS NOT NULL), \'[]\'::json) as variants'),
        db.raw('COALESCE(json_agg(DISTINCT c) FILTER (WHERE c.id IS NOT NULL), \'[]\'::json) as collections')
      )
      .leftJoin('product_images as pi', 'p.id', 'pi.product_id')
      .leftJoin('product_variants as pv', 'p.id', 'pv.product_id')
      .leftJoin('product_collections as pc', 'p.id', 'pc.product_id')
      .leftJoin('collections as c', 'pc.collection_id', 'c.id')
      .where('p.id', id)
      .groupBy('p.id')
      .first();

    if (!updatedProduct) {
      res.status(404).json({ message: 'Product not found after update' });
      return;
    }

    // Log the collections in the updated product
    console.log(`Updated product ${id} collections:`, 
      updatedProduct.collections ? 
      updatedProduct.collections.map((c: any) => `${c.id}:${c.name}`).join(', ') : 
      'none'
    );

    res.status(200).json({
      message: 'Product updated successfully',
      product: transformProductForGraphQL(updatedProduct),
      collections: updatedProduct.collections
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product', error: (error as Error).message });
  }
};

// Delete a product
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await db('products').where('id', id).first();
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Delete product (cascade deletes will handle related records)
    await db('products').where('id', id).del();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: (error as Error).message });
  }
};

// Get product categories
export const getProductCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await db('products')
      .distinct('category')
      .whereNotNull('category')
      .orderBy('category');

    res.status(200).json(categories.map(c => c.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: (error as Error).message });
  }
};

// Get product brands
export const getProductBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const brands = await db('products')
      .distinct('brand')
      .whereNotNull('brand')
      .orderBy('brand');

    res.status(200).json(brands.map(b => b.brand));
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Error fetching brands', error: (error as Error).message });
  }
};

// Get product colors
export const getProductColors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    
    let query = db('product_variants')
      .distinct('color')
      .whereNotNull('color')
      .join('products', 'product_variants.product_id', 'products.id');
    
    // Filter by product type if specified
    if (type && type !== 'all') {
      query = query.where('products.type', type);
    }
    
    const colors = await query.orderBy('color');
    
    res.status(200).json({ colors: colors.map(c => c.color) });
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({ message: 'Error fetching colors', error: (error as Error).message });
  }
};

// Add variants to a product
export const addVariants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const variants = req.body;

    // Check if product exists
    const product = await db('products').where('id', id).first();
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Format variants with product_id and timestamps
    const formattedVariants = variants.map((variant: any) => ({
      product_id: id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      image_id: variant.image_id,
      image_url: variant.image_url,
      price: variant.price,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Insert variants
    const result = await db('product_variants').insert(formattedVariants).returning('*');

    res.status(201).json({ 
      message: 'Variants added successfully', 
      variants: result 
    });
  } catch (error) {
    console.error('Error adding variants:', error);
    res.status(500).json({ 
      message: 'Error adding variants', 
      error: (error as Error).message 
    });
  }
};

// Update product collections
export const updateProductCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { collections } = req.body;

    // Validate input
    if (!collections || !Array.isArray(collections)) {
      res.status(400).json({ message: 'Collections must be provided as an array of collection IDs' });
      return;
    }

    console.log(`Updating collections for product ${id}:`, collections);

    // Check if product exists
    const product = await db('products').where('id', id).first();
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Start a transaction
    await db.transaction(async trx => {
      // Get current collections for logging
      const currentCollections = await trx('product_collections')
        .where('product_id', id)
        .join('collections', 'product_collections.collection_id', 'collections.id')
        .select('collections.id', 'collections.name');
      
      console.log(`Current collections for product ${id}:`, 
        currentCollections.map(c => `${c.id}:${c.name}`).join(', ') || 'none'
      );

      // Delete existing collection associations
      await trx('product_collections').where('product_id', id).del();
      console.log(`Deleted existing collection associations for product ${id}`);

      // Verify collections exist
      const existingCollections = await trx('collections')
        .whereIn('id', collections)
        .select('id', 'name', 'parent_id');
        
      const validCollectionIds = existingCollections.map(c => c.id);
      console.log(`Valid collection IDs: ${validCollectionIds.join(', ')}`);
      
      // Add new collection associations if any
      if (validCollectionIds.length > 0) {
        const productCollections = validCollectionIds.map(collectionId => ({
          product_id: id,
          collection_id: collectionId
        }));
        
        await trx('product_collections').insert(productCollections);
        console.log(`Added product ${id} to ${validCollectionIds.length} collections`);
        
        // Also ensure product is in parent collections
        const collectionsWithParents = existingCollections.filter(c => c.parent_id);
        const parentIds = [...new Set(collectionsWithParents.map(c => c.parent_id))];
        
        if (parentIds.length > 0) {
          console.log(`Checking if product needs to be added to parent collections: ${parentIds.join(', ')}`);
          
          for (const parentId of parentIds) {
            // Check if product is already in parent collection
            const existingParentRelation = productCollections.find(pc => pc.collection_id === parentId);
            
            if (!existingParentRelation) {
              console.log(`Adding product ${id} to parent collection ${parentId}`);
              
              await trx('product_collections').insert({
                product_id: id,
                collection_id: parentId
              });
            }
          }
        }
      }
    });

    // Fetch the updated product collections
    const updatedCollections = await db('collections as c')
      .select('c.id', 'c.name', 'c.slug')
      .join('product_collections as pc', 'c.id', 'pc.collection_id')
      .where('pc.product_id', id);
    
    console.log(`Updated collections for product ${id}:`, 
      updatedCollections.map(c => `${c.id}:${c.name}`).join(', ') || 'none'
    );

    res.status(200).json({
      message: 'Product collections updated successfully',
      product_id: id,
      collections_count: updatedCollections.length,
      collections: updatedCollections
    });
  } catch (error) {
    console.error('Error updating product collections:', error);
    res.status(500).json({ 
      message: 'Error updating product collections', 
      error: (error as Error).message 
    });
  }
}; 