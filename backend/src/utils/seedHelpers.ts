import bcrypt from 'bcrypt';
import { ProductCollection } from '../models/Product';

export const generateRandomProducts = (count: number) => {
  const products = [];
  
  const categories = [
    'FASHION', 
    'ELECTRONICS', 
    'VEGETABLES', 
    'FURNITURE', 
    'JEWELLWEY', 
    'BEAUTY', 
    'FLOWER', 
    'TOOLS', 
    'WATCH', 
    'METRO'
  ];
  
  const brands = ['nike', 'adidas', 'puma', 'netplay', 'roadster', 'zara', 'h&m', 'levis', 'samsung', 'apple', 'sony', 'lg'];
  
  for (let i = 1; i <= count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    
    const isNew = Math.random() > 0.7;
    const isSale = !isNew && Math.random() > 0.5;
    const discount = isSale ? Math.floor(Math.random() * 50) + 10 : 0;
    
    const basePrice = Math.floor(Math.random() * 1000) + 50;
    
    const product = {
      title: `${brand.charAt(0).toUpperCase() + brand.slice(1)} ${category} Item ${i}`,
      description: `This is a premium ${category.toLowerCase()} product from ${brand}. Perfect for any occasion and designed with comfort and style in mind.`,
      type: category,
      brand: brand,
      category: category,
      price: basePrice,
      is_new: isNew,
      is_sale: isSale,
      discount: discount,
      stock: Math.floor(Math.random() * 100) + 10,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    products.push(product);
  }
  
  return products;
};

export const generateProductVariants = (productId: number) => {
  const variants = [];
  const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'purple', 'pink'];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  
  // Random number of variants between 1 and 6
  const variantCount = Math.floor(Math.random() * 6) + 1;
  
  for (let i = 0; i < variantCount; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    
    variants.push({
      product_id: productId,
      sku: `SKU-${productId}-${color}-${size}`,
      size: size,
      color: color,
      image_id: i + 1,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  return variants;
};

export const generateProductImages = (productId: number) => {
  const images = [];
  
  // Random number of images between 2 and 5
  const imageCount = Math.floor(Math.random() * 4) + 2;
  
  for (let i = 0; i < imageCount; i++) {
    const isPrimary = i === 0;
    
    // Use fashion/product images for proper display in the frontend
    // The frontend expects images in this format
    const imageNumber = Math.floor(Math.random() * 20) + 1;
    const category = Math.random() > 0.5 ? 'fashion' : 'electronic';
    
    images.push({
      product_id: productId,
      image_id: i + 1,
      alt: `Product ${productId} Image ${i + 1}`,
      src: `${category}/product/${imageNumber}.jpg`,
      is_primary: isPrimary,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  return images;
};

export const generateCollections = () => {
  return [
    { name: 'New Arrivals', slug: 'new-arrivals', description: 'Latest products added to our store', created_at: new Date(), updated_at: new Date() },
    { name: 'Featured', slug: 'featured', description: 'Our featured products', created_at: new Date(), updated_at: new Date() },
    { name: 'Best Sellers', slug: 'best-sellers', description: 'Our best selling products', created_at: new Date(), updated_at: new Date() },
    { name: 'Summer Collection', slug: 'summer-collection', description: 'Summer collection 2024', created_at: new Date(), updated_at: new Date() },
    { name: 'Winter Collection', slug: 'winter-collection', description: 'Winter collection 2024', created_at: new Date(), updated_at: new Date() }
  ];
};

export const generateProductCollections = (productCount: number): ProductCollection[] => {
  const productCollections: ProductCollection[] = [];
  
  // Assign each product to 1-3 random collections
  for (let productId = 1; productId <= productCount; productId++) {
    const collectionCount = Math.floor(Math.random() * 3) + 1;
    const collections = new Set<number>();
    
    while (collections.size < collectionCount) {
      const collectionId = Math.floor(Math.random() * 5) + 1;
      collections.add(collectionId);
    }
    
    collections.forEach(collectionId => {
      productCollections.push({
        product_id: productId,
        collection_id: collectionId
      });
    });
  }
  
  return productCollections;
};

export const generateUsers = () => {
  return [
    {
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@bigdeal.com',
      password_hash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password_hash: bcrypt.hashSync('test123', 10),
      role: 'customer',
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
}; 