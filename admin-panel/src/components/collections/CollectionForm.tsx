'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { collectionsApi, productsApi } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { SafeImage } from '@/utils/imageHelpers';
import React from 'react';

type CollectionFormData = {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_featured: boolean;
  parent_id?: number | null;
  collection_type?: string;
  is_active?: boolean;
  remove_from_parents?: boolean;
};

type CollectionFormProps = {
  collectionId?: number;
  initialData?: Partial<CollectionFormData>;
};

type ProductType = {
  id: number;
  title: string;
  price: number;
  images?: Array<{ id: number; src: string; alt?: string }>;
  category?: string;
  type?: string;
  is_selected?: boolean;
};

export default function CollectionForm({ collectionId, initialData }: CollectionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);
  const [availableCollections, setAvailableCollections] = useState<any[]>([]);
  const [collectionTypes] = useState<string[]>(['category', 'brand', 'featured', 'custom', 'category_parent', 'brand_parent']);
  const [removeFromParents, setRemoveFromParents] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Define API endpoints
  const ENDPOINTS = {
    UPLOADS: 'http://localhost:3002/api/uploads'
  };
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch
  } = useForm<CollectionFormData>({
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_featured: false,
      parent_id: null,
      collection_type: 'custom',
      is_active: true,
      remove_from_parents: false,
      ...initialData
    }
  });
  
  // Watch name to generate slug
  const name = watch('name');
  const collectionType = watch('collection_type');
  const parentId = watch('parent_id');
  
  // Watch image_url to update preview
  const imageUrl = watch('image_url');
  React.useEffect(() => {
    if (imageUrl && !imagePreview) {
      // Make sure we're using a complete URL for the preview
      let fullImageUrl = imageUrl;
      
      // Handle URLs that don't include the server address
      if (imageUrl && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('http')) {
        // If the URL doesn't start with /uploads, add it
        if (!imageUrl.startsWith('/uploads')) {
          fullImageUrl = `/uploads${imageUrl}`;
        }
        // Add the server URL
        fullImageUrl = `http://localhost:3002${fullImageUrl}`;
      }
      
      setImagePreview(fullImageUrl);
    }
  }, [imageUrl, imagePreview]);
  
  // Generate slug from name
  useEffect(() => {
    if (name && !initialData?.slug) {
      const generatedSlug = name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-'); // Remove double hyphens
      setValue('slug', generatedSlug);
    }
  }, [name, setValue, initialData?.slug]);
  
  // Fetch products for the collection
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsProductsLoading(true);
        const data = await productsApi.getAllWithoutPagination();
        
        let productsList: ProductType[] = [];
        if (data && data.products && data.products.items) {
          productsList = data.products.items;
        } else if (data && Array.isArray(data)) {
          productsList = data;
        } else if (data && Array.isArray(data.products)) {
          productsList = data.products;
        }
        
        // Ensure all products have valid price as number
        productsList = productsList.map(product => ({
          ...product,
          price: typeof product.price === 'string' ? parseFloat(product.price) : product.price || 0
        }));
        
        console.log(`Loaded ${productsList.length} total products`);
        setProducts(productsList);
        setFilteredProducts(productsList);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsProductsLoading(false);
      }
    };
    
    const fetchCollectionData = async () => {
      if (!collectionId) return;
      
      try {
        setIsLoading(true);
        console.log(`Fetching collection data for ID: ${collectionId}, Slug: ${initialData?.slug}`);
        
        let collectionData;
        
        if (initialData?.slug) {
          // Fetch by slug if available
          collectionData = await collectionsApi.getBySlug(initialData.slug);
        } else {
          // Try to fetch all collections and find by ID
          const collections = await collectionsApi.getAll();
          const targetCollection = collections.find((c: any) => c.id === collectionId);
          
          if (targetCollection && targetCollection.slug) {
            collectionData = await collectionsApi.getBySlug(targetCollection.slug);
          }
        }
        
        if (collectionData) {
          console.log('Loaded collection data:', collectionData);
          
          // Determine if we're dealing with a nested response
          const collection = collectionData.collection || collectionData;
          
          // Set form values
          setValue('name', collection.name || '');
          setValue('slug', collection.slug || '');
          setValue('description', collection.description || '');
          
          // Handle image URL in a consistent way
          let imageUrl = collection.image_url || '';
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('blob:')) {
            // Ensure image URL has the correct format
            if (!imageUrl.startsWith('/uploads')) {
              imageUrl = `/uploads${imageUrl}`;
            }
          }
          setValue('image_url', imageUrl);
          
          setValue('is_featured', Boolean(collection.is_featured));
          setValue('parent_id', collection.parent_id || null);
          setValue('collection_type', collection.collection_type || 'custom');
          setValue('is_active', collection.is_active !== false); // Default to true if not specified
          
          // Set selected products
          const products = collectionData.products || collection.products || [];
          if (Array.isArray(products)) {
            // Make sure we have product IDs as numbers
            const productIds = products.map((p: any) => typeof p.id === 'string' ? parseInt(p.id, 10) : p.id);
            console.log(`Setting ${productIds.length} selected products for collection ${collectionId}:`, productIds);
            setSelectedProducts(productIds);
          } else {
            console.warn('No products array found in collection data');
          }
        } else {
          console.error('Failed to fetch collection data');
          toast.error('Collection data not found');
        }
      } catch (error) {
        console.error('Error fetching collection data:', error);
        toast.error('Failed to load collection data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
    fetchCollectionData();
  }, [collectionId, initialData, setValue]);
  
  // Filter products based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = products.filter(product => 
        product.title.toLowerCase().includes(lowercasedSearch) ||
        (product.category && product.category.toLowerCase().includes(lowercasedSearch)) ||
        (product.type && product.type.toLowerCase().includes(lowercasedSearch))
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);
  
  // Fetch available collections for parent selection
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const collections = await collectionsApi.getAll();
        // Filter out the current collection from the list of potential parents
        const filteredCollections = collections.filter((c: any) => 
          c.id !== collectionId
        );
        setAvailableCollections(filteredCollections);
      } catch (error) {
        console.error('Error fetching collections:', error);
      }
    };
    
    fetchCollections();
  }, [collectionId]);
  
  const toggleProductSelection = (productId: number) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };
  
  // Function to test adding a product to collection directly 
  const testAddProduct = async (productId: number) => {
    if (!collectionId) {
      toast.error('No collection ID available - save the collection first');
      return;
    }
    
    const toastId = toast.loading(`Testing: Adding product ${productId} to collection ${collectionId}...`);
    
    try {
      await collectionsApi.addProduct(collectionId, productId);
      toast.success(`Successfully added product ${productId} to collection`, { id: toastId });
    } catch (error) {
      console.error('Test add product error:', error);
      toast.error(`Failed to add product: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
    }
  };
  
  const onSubmit = async (data: CollectionFormData) => {
    try {
      setIsSubmitting(true);
      
      // Create an object with formData for API call - exclude product_ids which will be handled separately
      let apiData = { ...data };
      
      // Include the option to remove from parents
      if (removeFromParents) {
        apiData.remove_from_parents = true;
      }
      
      // Create the collection first without the image
      // Check if the image_url is a blob URL, meaning it's a local file
      const isLocalImage = data.image_url && data.image_url.startsWith('blob:');
      
      // If it's a local image, temporarily remove it from API data
      let localImageFile: File | null = null;
      if (isLocalImage) {
        // Find the corresponding file in the fileInput
        const fileInput = fileInputRef.current;
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          localImageFile = fileInput.files[0];
        }
        // Remove the blob URL from API data
        apiData.image_url = '';
      }
      
      // Create or update the collection
      const endpoint = collectionId
        ? `http://localhost:3002/api/collections/${collectionId}`
        : 'http://localhost:3002/api/collections';
      
      const method = collectionId ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${collectionId ? 'update' : 'create'} collection`);
      }

      const collection = await response.json();
      const newCollectionId = collection.id || collectionId;
      
      // If we have selected products and a valid collection ID, update the products
      if (newCollectionId && selectedProducts.length > 0) {
        try {
          console.log(`Updating products for collection ${newCollectionId}:`, selectedProducts);
          
          // Convert any string IDs to numbers to ensure consistency
          const productIds = selectedProducts.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
            .filter(id => !isNaN(id) && Number.isInteger(id));
          
          // Call the batch endpoint to update all products at once
          // Pass true to do a full update (replace all products instead of just adding)
          const result = await collectionsApi.addProducts(newCollectionId, productIds, true);
          console.log('Products updated successfully for collection:', result);
          
          if (result.products_count !== productIds.length) {
            console.warn(`Warning: Expected to set ${productIds.length} products, but collection now has ${result.products_count} products`);
          }
        } catch (productError) {
          console.error('Error updating collection products:', productError);
          toast.error('Collection was created/updated, but there was an error updating its products.');
        }
      } else if (newCollectionId && selectedProducts.length === 0) {
        // If user explicitly cleared all products
        console.log(`Clearing all products for collection ${newCollectionId}`);
        try {
          // Call with empty array to clear all products
          await collectionsApi.addProducts(newCollectionId, [], true);
          console.log('All products removed from collection');
        } catch (clearError) {
          console.error('Error clearing products from collection:', clearError);
          toast.error('Collection was updated, but there was an error removing its products.');
        }
      }
      
      // If we have a local image file and the collection was created successfully,
      // now upload the image
      if (localImageFile && newCollectionId) {
        try {
          const formData = new FormData();
          formData.append('image', localImageFile);
          
          const uploadResponse = await fetch(`${ENDPOINTS.UPLOADS}/collections/${newCollectionId}/images`, {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            toast.error("Collection created but failed to upload image");
            router.push('/collections');
            return;
          }
          
          // Success case is handled below
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          toast.error('Collection created, but there was an error uploading the image.');
          router.push('/collections');
          return;
        }
      }
      
      // Display success message and redirect for both paths
      toast.success(`Collection ${collectionId ? 'updated' : 'created'} successfully`);
      router.push('/collections');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(`${error instanceof Error ? error.message : 'Something went wrong'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle image file change
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Create a preview for immediate display
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // For existing collections, upload immediately
      if (collectionId) {
        // Create form data with the file
        const formData = new FormData();
        formData.append('image', file);
        
        // Upload the image
        const response = await fetch(`${ENDPOINTS.UPLOADS}/collections/${collectionId}/images`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed (${response.status})`);
        }
        
        const data = await response.json();
        console.log('Image upload successful:', data);
        
        // Update the form with the new image URL
        if (data.collection && data.collection.image_url) {
          // Revoke the blob URL since we now have a server URL
          URL.revokeObjectURL(previewUrl);
          
          // Use the full URL from the server including the backend URL
          const fullImageUrl = `http://localhost:3002${data.collection.image_url}`;
          setValue('image_url', fullImageUrl);
          setImagePreview(fullImageUrl);
          
          toast.success('Image uploaded successfully');
        }
      } else {
        // For new collections, just store the file and preview for later upload
        // We'll handle the actual upload when the collection is created
        setValue('image_url', previewUrl);
        toast.success('Image selected. It will be uploaded when the collection is saved.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Clear the preview on error
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle removing the image
  const removeImage = async () => {
    if (!imagePreview) return;
    
    if (imagePreview.startsWith('blob:')) {
      // Just revoke the blob URL for local previews
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setValue('image_url', '');
      return;
    }
    
    // For existing collections with saved images, we need to delete from the server
    if (collectionId) {
      try {
        setIsUploading(true);
        
        // Call the API to delete the image
        const response = await fetch(`${ENDPOINTS.UPLOADS}/collections/images/${collectionId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Delete failed (${response.status})`);
        }
        
        toast.success('Image removed successfully');
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
      }
    }
    
    // Clear the image URL and preview
    setImagePreview(null);
    setValue('image_url', '');
  };
  
  if (isLoading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-pulse">Loading collection data...</div>
        </div>
      </Card>
    );
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {collectionId ? 'Edit Collection' : 'Create New Collection'}
        </h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/collections')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Collection'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main Info */}
        <div className="col-span-2 space-y-6">
          <Card title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Name *
                </label>
                <input
                  id="name"
                  type="text"
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g. Summer Collection"
                  {...register('name', { required: 'Collection name is required' })}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div className="col-span-2 md:col-span-1">
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <div className="flex">
                  <input
                    id="slug"
                    type="text"
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.slug ? 'border-red-500' : ''}`}
                    placeholder="e.g. summer-collection"
                    {...register('slug', { required: 'Slug is required' })}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="ml-2 whitespace-nowrap"
                    onClick={() => {
                      if (name) {
                        const generatedSlug = name.toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^\w-]+/g, '')
                          .replace(/--+/g, '-');
                        setValue('slug', generatedSlug);
                      }
                    }}
                  >
                    Generate
                  </Button>
                </div>
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Used in URLs. Only letters, numbers, and hyphens.</p>
              </div>
              
              <div className="col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Describe this collection..."
                  {...register('description')}
                />
              </div>
            </div>
          </Card>
          
          <Card title="Collection Structure">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="collection_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Type
                </label>
                <select
                  id="collection_type"
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  {...register('collection_type')}
                >
                  {collectionTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-xs text-gray-500">
                  {collectionType === 'category' && 'Used for product categories, appears in category navigation.'}
                  {collectionType === 'brand' && 'Used for brand collections, appears in brand filters.'}
                  {collectionType === 'featured' && 'Special collections to highlight on the homepage or promotional areas.'}
                  {collectionType === 'custom' && 'General-purpose collection, can be used for any grouping.'}
                  {collectionType === 'category_parent' && 'Parent category that contains other subcategories.'}
                  {collectionType === 'brand_parent' && 'Parent brand collection that contains sub-brands.'}
                </div>
              </div>
              
              <div>
                <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Collection
                </label>
                <select
                  id="parent_id"
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  {...register('parent_id')}
                >
                  <option value="">No Parent (Root Collection)</option>
                  {availableCollections.map((collection: any) => (
                    <option 
                      key={collection.id} 
                      value={collection.id}
                      disabled={collection.id === collectionId}
                    >
                      {collection.name} 
                      {collection.collection_type ? ` (${collection.collection_type})` : ''}
                      {collection.level ? ` - Level ${collection.level}` : ''}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-xs text-gray-500">
                  Placing this collection under another creates a hierarchy. Child collections inherit parent products.
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="is_active"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    {...register('is_active')}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="is_active" className="font-medium text-gray-700">
                    Active
                  </label>
                  <p className="text-gray-500">
                    When active, this collection will be visible to customers.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="is_featured"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    {...register('is_featured')}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="is_featured" className="font-medium text-gray-700">
                    Featured
                  </label>
                  <p className="text-gray-500">
                    Featured collections appear in prominent locations on the site.
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card title="Products" subtitle="Manage products in this collection">
            {isProductsLoading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No products available to add to this collection.</p>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label htmlFor="product-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Products
                  </label>
                  <input
                    id="product-search"
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Search by product name, category, or type"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {selectedProducts.length} products selected
                    </div>
                    {collectionId && (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <input
                            id="remove-from-parents"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            checked={removeFromParents}
                            onChange={(e) => setRemoveFromParents(e.target.checked)}
                          />
                          <label htmlFor="remove-from-parents" className="ml-2 block text-sm text-gray-700">
                            Remove from parent collections
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 border border-gray-200 rounded-md max-h-80 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts(filteredProducts.map(p => p.id));
                              } else {
                                setSelectedProducts([]);
                              }
                            }}
                            checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.includes(p.id))}
                          />
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category/Type
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map(product => (
                        <tr 
                          key={product.id} 
                          className={`hover:bg-gray-50 ${selectedProducts.includes(product.id) ? 'bg-indigo-50' : ''}`}
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          <td className="py-2 px-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded">
                                {product.images && product.images.length > 0 ? (
                                  <img 
                                    src={product.images[0].src} 
                                    alt={product.images[0].alt || product.title}
                                    className="h-10 w-10 object-cover rounded"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "https://placehold.co/200x200?text=No+Image";
                                    }}
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                                    No Image
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{product.title}</div>
                                <div className="text-sm text-gray-500">ID: {product.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.category || '-'}</div>
                            <div className="text-sm text-gray-500">{product.type || '-'}</div>
                          </td>
                          <td className="py-2 px-4 whitespace-nowrap text-sm text-gray-500">
                            ₹{product.price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>
        
        {/* Right column - Image and status */}
        <div className="col-span-1 space-y-6">
          <Card title="Collection Image">
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-md overflow-hidden aspect-video bg-gray-100 flex items-center justify-center">
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={imagePreview} 
                      alt="Collection"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.error("Failed to load image:", imagePreview);
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/600x400?text=Image+Load+Error";
                      }}
                    />
                    <button 
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center p-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2">No image selected</p>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image
                </label>
                <div className="flex flex-col space-y-2">
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:cursor-pointer file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {isUploading && (
                    <div className="flex items-center text-sm text-indigo-600">
                      <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Upload an image for this collection. JPG, PNG, or WebP formats are recommended.
                </p>
              </div>
            </div>
          </Card>
          
          <Card title="Current Status">
            <div className="space-y-4">
              {collectionId ? (
                <div className="p-4 bg-green-50 rounded-md">
                  <p className="text-sm text-green-700">
                    You are editing an existing collection.
                  </p>
                  <p className="mt-1 text-sm text-green-600">
                    ID: {collectionId}
                  </p>
                  {parentId && (
                    <p className="mt-1 text-sm text-indigo-600">
                      Part of parent collection: {availableCollections.find((c: any) => c.id === Number(parentId))?.name || 'Loading...'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    You are creating a new collection.
                  </p>
                  {parentId && (
                    <p className="mt-1 text-sm text-indigo-600">
                      This will be added to: {availableCollections.find((c: any) => c.id === Number(parentId))?.name || 'Loading...'}
                    </p>
                  )}
                </div>
              )}
              
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Collection'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
} 