'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { XMarkIcon, PlusIcon, PhotoIcon, TagIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { productsApi, collectionsApi } from '@/lib/api';
import { SafeImage, getImageUrl } from '@/utils/imageHelpers';
import { ENDPOINTS, API_URL } from '@/utils/config';
import React from 'react';
import { Input } from '@/components/ui/input';
import axios from 'axios';

type ProductFormData = {
  title: string;
  description: string;
  price: number;
  is_new: boolean;
  is_sale: boolean;
  is_featured: boolean;
  discount: number;
  stock: number;
  slug: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  meta_image: string;
};

type ImageType = {
  id?: number;
  src: string;
  alt: string;
  file?: File;
  is_primary?: boolean;
};

type VariantType = {
  id?: number;
  size: string;
  color: string;
  price?: number;
  image_url?: string;
};

type ProductFormProps = {
  productId?: number;
  initialData?: Partial<ProductFormData>;
};

type CollectionType = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  collection_type?: string;
  level?: number;
  is_active?: boolean;
  children?: CollectionType[];
  parent?: CollectionType;
};

// Basic input styles - replace existing input styles with these enhanced ones
const inputClasses = "block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 sm:text-sm transition-all duration-200 bg-white px-4 py-2.5";
const errorInputClasses = "block w-full rounded-md border-red-300 shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20 sm:text-sm transition-all duration-200 bg-white px-4 py-2.5";
const labelClasses = "block text-sm font-medium text-gray-700 mb-1.5";
const requiredFieldMark = <span className="text-indigo-600 ml-1">*</span>;
const helperTextClasses = "mt-1.5 text-xs text-gray-500";
const errorTextClasses = "mt-1.5 text-xs text-red-600";

export default function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [images, setImages] = useState<ImageType[]>([]);
  const [variants, setVariants] = useState<VariantType[]>([]);
  const [collections, setCollections] = useState<CollectionType[]>([]);
  const [allCollections, setAllCollections] = useState<CollectionType[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [initialSelectedCollections, setInitialSelectedCollections] = useState<number[]>([]);
  const [isEditingCollections, setIsEditingCollections] = useState(!productId);
  const [collectionSearchTerm, setCollectionSearchTerm] = useState('');
  const [collectionTypeFilter, setCollectionTypeFilter] = useState<string>('all');
  const [imageUploading, setImageUploading] = useState<Record<string, boolean>>({});
  const [bulkUploadInProgress, setBulkUploadInProgress] = useState(false);
  const [isSlugManuallySet, setIsSlugManuallySet] = useState(false);
  
  // Refs
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const variantFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Fetch product data on component mount
  useEffect(() => {
    if (productId) {
      fetchProductData();
    }
  }, [productId]);
  
  // Default form values
  const defaultValues = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    is_new: initialData?.is_new || false,
    is_sale: initialData?.is_sale || false,
    is_featured: initialData?.is_featured || false,
    discount: initialData?.discount || 0,
    stock: initialData?.stock || 0,
    slug: initialData?.slug || '',
    meta_title: initialData?.meta_title || '',
    meta_description: initialData?.meta_description || '',
    meta_keywords: initialData?.meta_keywords || '',
    meta_image: initialData?.meta_image || '',
  };
  
  const { 
    register, 
    handleSubmit, 
    control,
    formState: { errors },
    setValue,
    watch
  } = useForm<ProductFormData>({
    defaultValues
  });
  
  const isSale = watch('is_sale');
  const titleValue = watch('title');
  
  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')   // Remove special chars
      .replace(/\s+/g, '-')       // Replace spaces with hyphens
      .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
      .trim();                     // Trim hyphens from start and end
  };

  // Auto-generate slug when title changes
  useEffect(() => {
    const currentSlug = watch('slug');
    // Only update slug if it's empty or was auto-generated (not manually set)
    if (titleValue && (!currentSlug || !isSlugManuallySet)) {
      setValue('slug', generateSlug(titleValue));
    }
  }, [titleValue, watch, setValue, isSlugManuallySet]);
  
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallySet(true);
  };

  // Add a useEffect hook to update meta_title from title if it's empty
  useEffect(() => {
    const currentMetaTitle = watch('meta_title');
    if (titleValue && !currentMetaTitle) {
      setValue('meta_title', titleValue);
    }
  }, [titleValue, watch, setValue]);
  
  // Add a default variant when the form loads
  useEffect(() => {
    if (variants.length === 0 && !productId) {
      setVariants([{ size: 'M', color: 'Black', price: undefined, image_url: undefined }]);
    }
  }, []);
  
  // Fetch product data for editing
  const fetchProductData = async () => {
    if (!productId) return;
    
    try {
      setIsLoading(true);
      
      // Get the full response directly from the API endpoint
      const fullResponse = await axios.get(`${API_URL}/products/${productId}`);
      const responseData = fullResponse.data;
      console.log('API full response:', responseData);
      
      // The product data is in responseData.product
      const productData = responseData.product;
      
      if (productData) {
        console.log('Setting form values with product data');
        setValue('title', productData.title || '');
        setValue('description', productData.description || '');
        setValue('price', productData.price || 0);
        setValue('stock', productData.stock || 0);
        setValue('is_new', productData.new === true || productData.is_new === true);
        setValue('is_sale', productData.sale === true || productData.is_sale === true);
        setValue('is_featured', productData.featured === true || productData.is_featured === true);
        setValue('discount', productData.discount || 0);
        
        // Set SEO fields
        setValue('slug', productData.slug || '');
        setValue('meta_title', productData.meta_title || '');
        setValue('meta_description', productData.meta_description || '');
        setValue('meta_keywords', productData.meta_keywords || '');
        setValue('meta_image', productData.meta_image || '');
        
        // If slug is already set, mark it as manually set to prevent auto-generation
        if (productData.slug) {
          setIsSlugManuallySet(true);
        }
        
        // Handle images
        if (productData.images && Array.isArray(productData.images)) {
          const formattedImages = productData.images.map((img: any) => ({
            id: img.id,
            src: img.src || img.url,
            alt: img.alt || img.alt_text || '',
            is_primary: img.is_primary === true || img.is_thumbnail === true
          }));
          setImages(formattedImages);
        }
        
        // Handle variants
        if (productData.variants && Array.isArray(productData.variants)) {
          const formattedVariants = productData.variants.map((variant: any) => ({
            id: variant.id,
            size: variant.size || '',
            color: variant.color || '',
            price: variant.price || undefined,
            image_url: variant.image_url || undefined
          }));
          setVariants(formattedVariants);
        }
        
        // Handle collections - allCollections is directly in the responseData
        console.log('Collections from API:', responseData.productCollections, responseData.allCollections);
        
        // Set all available collections for editing
        if (responseData.allCollections && Array.isArray(responseData.allCollections)) {
          setAllCollections(responseData.allCollections);
          setCollections(responseData.allCollections);
        }
        
        // Set selected collections - productCollections is directly in the responseData
        if (responseData.productCollections && Array.isArray(responseData.productCollections)) {
          const collectionIds = responseData.productCollections.map((c: any) => c.id);
          console.log('Setting selected collections from productCollections:', collectionIds);
          setSelectedCollections(collectionIds);
          setInitialSelectedCollections(collectionIds);
        }
        // If not found, check for collection array in the product
        else if (productData.collection && Array.isArray(productData.collection)) {
          // Try to find collection IDs by matching names from allCollections
          const collectionNames = productData.collection.map((c: any) => c.collectionName);
          console.log('Trying to match collection names:', collectionNames);
          
          // Match collection names to IDs using allCollections
          const matchedIds: number[] = [];
          
          if (responseData.allCollections && Array.isArray(responseData.allCollections)) {
            collectionNames.forEach((name: string) => {
              const match = responseData.allCollections.find((c: any) => c.name === name);
              if (match && match.id) {
                matchedIds.push(match.id);
              }
            });
          }
          
          console.log('Matched collection IDs:', matchedIds);
          if (matchedIds.length > 0) {
            setSelectedCollections(matchedIds);
            setInitialSelectedCollections(matchedIds);
          }
          }
        }
      } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch collections for the product
  useEffect(() => {
    const fetchCollections = async () => {
      // Only fetch collections for new products
      // For existing products, collections are already loaded in fetchProductData
      if (!productId) {
        try {
          setIsLoadingCollections(true);
          
          // For new products, fetch all collections
          const response = await collectionsApi.getAll();
          
          // Process collections to create a complete hierarchy
          let collectionsData: CollectionType[] = [];
          
          // Use type assertion to handle the response
          const data = response as any;
          
          if (data && Array.isArray(data)) {
            collectionsData = data;
          } else if (data && data.collections && Array.isArray(data.collections)) {
            collectionsData = data.collections;
          }
          
          // Build a map of collections by ID for quick reference
          const collectionsMap = new Map<number, CollectionType>();
          collectionsData.forEach(collection => {
            collectionsMap.set(collection.id, { ...collection, children: [] });
          });
          
          // Build parent-child relationships
          collectionsData.forEach(collection => {
            if (collection.parent_id && collectionsMap.has(collection.parent_id)) {
              const parent = collectionsMap.get(collection.parent_id)!;
              
              // Set parent reference
              collection.parent = parent;
              
              // Add this collection as a child to its parent
              if (!parent.children) parent.children = [];
              parent.children.push(collection);
            }
          });
          
          setAllCollections(collectionsData);
          setCollections(collectionsData);
        } catch (error) {
          console.error('Error fetching collections:', error);
          toast.error('Failed to load collections');
        } finally {
          setIsLoadingCollections(false);
        }
      }
    };
    
    fetchCollections();
  }, [productId]);
  
  // If we're in edit mode, ensure collections are properly filtered
  useEffect(() => {
    if (isEditingCollections && allCollections.length > 0) {
      if (collectionSearchTerm.trim() === '') {
        setCollections(allCollections);
        } else {
        const lowercasedSearch = collectionSearchTerm.toLowerCase();
        const filtered = allCollections.filter(collection => 
          collection.name.toLowerCase().includes(lowercasedSearch) ||
          collection.slug.toLowerCase().includes(lowercasedSearch) ||
          (collection.description && collection.description.toLowerCase().includes(lowercasedSearch))
        );
        setCollections(filtered);
      }
    }
  }, [isEditingCollections, collectionSearchTerm, allCollections]);
  
  // Function to find all parent collections recursively
  const getAllParentIds = (collectionId: number): number[] => {
    const collection = allCollections.find(c => c.id === collectionId);
    if (!collection || !collection.parent_id) return [];
    
    const parentIds = [collection.parent_id];
    const grandparentIds = getAllParentIds(collection.parent_id);
    return [...parentIds, ...grandparentIds];
  };
  
  // Function to toggle collection selection with automatic parent collection handling
  const toggleCollection = (collectionId: number) => {
    setSelectedCollections(prev => {
      // If this collection is already selected, remove it
      if (prev.includes(collectionId)) {
        return prev.filter(id => id !== collectionId);
      } else {
        // When selecting a collection, also select all parent collections
        const parentIds = getAllParentIds(collectionId);
        const newSelectedIds = [...new Set([...prev, collectionId, ...parentIds])];
        return newSelectedIds;
      }
    });
  };
  
  // Function to handle tag click for toggling collection selection
  const handleTagClick = (collectionId: number) => {
    toggleCollection(collectionId);
  };
  
  // Function to check if all parents of a collection are selected
  const areAllParentsSelected = (collectionId: number): boolean => {
    const parentIds = getAllParentIds(collectionId);
    return parentIds.every(id => selectedCollections.includes(id));
  };
  
  // Add a filtered collections getter based on type filter
  const filteredCollectionsByType = React.useMemo(() => {
    if (collectionTypeFilter === 'all') {
      return collections;
    }
    return collections.filter(collection => 
      collection.collection_type === collectionTypeFilter
    );
  }, [collections, collectionTypeFilter]);
  
  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    
    try {
      // Format variants: ensure id and price are numbers, keep image_url as is
      const formattedVariants = variants.map(variant => {
        const formatted = {
          ...variant,
          id: variant.id ? Number(variant.id) : undefined,
          price: variant.price ? Number(variant.price) : undefined,
        };
        // Remove any undefined properties
        Object.keys(formatted).forEach(key => 
          formatted[key as keyof typeof formatted] === undefined && delete formatted[key as keyof typeof formatted]
        );
        return formatted;
      });
      
      if (!productId) {
        // Creating a new product
        try {
          const createToastId = toast.loading('Creating product...');
          
          const createData = {
            title: data.title,
            description: data.description,
            price: Number(data.price),
            is_new: data.is_new,
            is_sale: data.is_sale,
            is_featured: data.is_featured,
            discount: Number(data.discount),
            stock: Number(data.stock),
            slug: data.slug,
            meta_title: data.meta_title || data.title, // Use title if meta_title is empty
            meta_description: data.meta_description,
            meta_keywords: data.meta_keywords,
            meta_image: data.meta_image,
            variants: formattedVariants,
            collections: selectedCollections
          };
          
          const response = await productsApi.create(createData);
          // Fix the issue by looking for product.id in the response data structure
          const newProductId = response.product?.id;
          
          if (!newProductId) {
            throw new Error('No product ID returned from create API');
          }
          
          toast.success('Product created', { id: createToastId });
          
          // Handle images for the new product
          if (images.length > 0) {
            const imagesLoadingId = toast.loading('Uploading images...');
            try {
              const success = await handleImagesForProduct(newProductId, images);
              if (success) {
                toast.success('Images uploaded successfully', { id: imagesLoadingId });
              } else {
                toast.error('Some images failed to upload', { id: imagesLoadingId });
              }
            } catch (imageError) {
              console.error('Error uploading images:', imageError);
              toast.error('Failed to upload some images, but product was created', { id: imagesLoadingId });
            }
          }
          
          toast.success('Product created successfully!');
          router.push('/products');
        } catch (error) {
          console.error('Error creating product:', error);
          toast.error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // Editing an existing product
        try {
          // First update the collections if they've changed
          const currentSelectedIds = new Set(selectedCollections);
          const prevSelectedIds = new Set(initialSelectedCollections);
          
          // Check if collections have changed - compare sets
          const collectionsChanged = 
            currentSelectedIds.size !== prevSelectedIds.size || 
            ![...currentSelectedIds].every(id => prevSelectedIds.has(id));
          
          if (collectionsChanged) {
            const collectionsToastId = toast.loading('Updating collections...');
            console.log('Collections changed. Updating to:', selectedCollections);
            
            // Try the direct endpoint first for debugging
            try {
              const debugUrl = `${API_URL}/products/${productId}/collections`;
              console.log(`Trying direct debug endpoint: ${debugUrl}`);
              
              const debugResponse = await fetch(debugUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ collections: selectedCollections }),
              });
              
              const debugData = await debugResponse.json();
              console.log('Debug endpoint response:', debugData);
              
              if (debugData.message && debugData.message.includes('success')) {
                toast.success(`Collections updated via debug endpoint`, { id: collectionsToastId });
              } else {
                // Try our regular method as fallback
                await productsApi.updateCollections(productId, selectedCollections);
                toast.success('Collections updated via API', { id: collectionsToastId });
              }
            } catch (debugError) {
              console.error('Error with debug endpoint:', debugError);
              // Fall back to our regular method
              await productsApi.updateCollections(productId, selectedCollections);
              toast.success('Collections updated via API', { id: collectionsToastId });
            }
          }

          // Update the product data
          const updateToastId = toast.loading('Updating product...');
          const updateData = {
            title: data.title,
            description: data.description,
            price: Number(data.price),
            is_new: data.is_new,
            is_sale: data.is_sale,
            is_featured: data.is_featured,
            discount: Number(data.discount),
            stock: Number(data.stock),
            slug: data.slug,
            meta_title: data.meta_title || data.title, // Use title if meta_title is empty
            meta_description: data.meta_description,
            meta_keywords: data.meta_keywords,
            meta_image: data.meta_image,
            variants: formattedVariants,
            collections: selectedCollections // Include collections in main update too
          };
          
          await productsApi.update(productId, updateData);
          toast.success('Product updated', { id: updateToastId });
          
          // Handle images for the product
          if (images.length > 0) {
            const imagesLoadingId = toast.loading('Updating images...');
            await handleImagesForProduct(productId, images);
            toast.success('Images updated', { id: imagesLoadingId });
          }
          
          toast.success('Product updated successfully!');
          router.push('/products');
        } catch (error) {
          console.error('Error updating product:', error);
          toast.error('Failed to update product');
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Error saving product');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addVariant = () => {
    setVariants([...variants, { size: '', color: '', image_url: undefined }]);
  };
  
  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };
  
  // Helper to determine if a value is a temporary image ID
  const isTempImageId = (value: string | undefined): boolean => {
    if (typeof value !== 'string') return false;
    return value.startsWith('blob:') || value.startsWith('temp-');
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    const updatedVariants = [...variants];
    
    // Handle numeric fields
    if (field === 'price') {
      // Parse as number if not empty, otherwise leave as undefined
      const numValue = typeof value === 'string' ? (value ? parseFloat(value) : undefined) : value;
      updatedVariants[index] = { ...updatedVariants[index], [field]: numValue };
    } else {
      updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    }
    
    setVariants(updatedVariants);
  };
  
  const addImage = () => {
    setImages([...images, { src: '', alt: '' }]);
  };
  
  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    
    if (imageToRemove.id && productId) {
      // If it's an existing image that's being removed from an existing product,
      // we should call the API to delete it from the server
      const imageId = imageToRemove.id;
      if (confirm("Are you sure you want to delete this image? This cannot be undone.")) {
        fetch(`${ENDPOINTS.UPLOADS}/images/${imageId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then(async response => {
          if (!response.ok) {
            let errorMessage = 'Delete failed';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (parseError) {
              // If response is not JSON, try to get text
              const errorText = await response.text();
              if (errorText) errorMessage = errorText;
            }
            throw new Error(`Delete failed (${response.status}): ${errorMessage}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Image deleted successfully:', data);
          toast.success('Image deleted successfully');
          
          // Remove from state only after successful server deletion
          setImages(images.filter((_, i) => i !== index));
        })
        .catch(error => {
          console.error('Error deleting image:', error);
          toast.error(`Failed to delete image: ${error.message}`);
        });
      }
    } else {
      // For new images or images on a new product, just remove from state
      
      // If it's a blob URL, revoke it to free up memory
      if (imageToRemove.src && imageToRemove.src.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.src);
      }
      
      // Remove from state
      setImages(images.filter((_, i) => i !== index));
    }
  };
  
  const updateImage = (index: number, field: string, value: string) => {
    const updatedImages = [...images];
    updatedImages[index] = { ...updatedImages[index], [field]: value };
    setImages(updatedImages);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Generate a blob URL for immediate display
    const blobUrl = URL.createObjectURL(file);
    
    // Update the image in state with the file and a preview
    const updatedImages = [...images];
    
    // Update the specific image with the blob URL for preview
    updatedImages[index] = { 
      ...updatedImages[index], 
      src: blobUrl,  // This is only for preview, not for server upload
      file, // Store the actual file for upload
      alt: updatedImages[index].alt || file.name.split('.')[0] // Use filename as default alt text
    };
    
    setImages(updatedImages);
    
    // For existing products, upload the image immediately
    if (productId) {
      uploadImageForProduct(file, productId, index);
    } else {
      // For new products, show a toast message
      toast.success(`Image "${file.name}" selected. It will be uploaded when you save the product.`, {
        duration: 3000,
        icon: '🖼️',
      });
    }
  };
  
  // Simple function to upload an image for a product
  const uploadImageForProduct = async (file: File, productId: number, index: number) => {
    try {
      // Show loading state for this image
      setImageUploading((prev) => ({ ...prev, [index.toString()]: true }));
      
      // Create form data with the file
      const formData = new FormData();
      formData.append('image', file);
      
      console.log(`Uploading image for product ${productId}: ${file.name} (${file.size} bytes)`);
      
      // Upload the image using the config URL
      const response = await fetch(`${ENDPOINTS.UPLOADS}/products/${productId}/images`, {
        method: 'POST',
        body: formData,
      });
      
      // Handle error responses with more detailed messages
      if (!response.ok) {
        let errorMessage = `Upload failed (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.message || errorData.error) {
            errorMessage = `${errorMessage}: ${errorData.message || errorData.error}`;
          }
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) errorMessage = `${errorMessage}: ${errorText}`;
          } catch (textError) {
            // Fallback if we can't get error details
            console.error('Failed to parse error response', parseError);
          }
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Image upload successful:', data);
      
      // Revoke the blob URL since we now have a server URL
      if (images[index]?.src?.startsWith('blob:')) {
        URL.revokeObjectURL(images[index].src);
      }
      
      // Update the image in state with the server URL
      const updatedImages = [...images];
      updatedImages[index] = {
        id: data.image.id,
        src: getImageUrl(data.image.src),
        alt: data.image.alt || updatedImages[index].alt || '',
      };
      
      setImages(updatedImages);
      toast.success(`Image "${file.name}" uploaded successfully`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Hide loading state for this image
      setImageUploading((prev) => ({ ...prev, [index.toString()]: false }));
    }
  };
  
  // Function to handle multiple files selection and upload
  const handleMultipleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // If we're creating a new product (no productId) just add the files to the images array for later upload
    if (!productId) {
      const newImages = [...images];
      
      Array.from(files).forEach(file => {
        const blobUrl = URL.createObjectURL(file);
        newImages.push({
          src: blobUrl,
          alt: file.name.split('.')[0],
          file
        });
      });
      
      setImages(newImages);
      
      // Reset the file input
      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = '';
      }
      
      // Show a toast to inform the user
      toast.success(`${files.length} images selected. They will be uploaded when you save the product.`, {
        duration: 3000,
        icon: '🖼️',
      });
      
      return;
    }
    
    // For existing products, upload all files immediately
    try {
      setBulkUploadInProgress(true);
      
      const uploadedImages: ImageType[] = [];
      let hasError = false;
      
      // Store temporary image indexes to remove them later
      const tempImageIndexes: number[] = [];
      const originalImageCount = images.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // Create a temporary preview
          const blobUrl = URL.createObjectURL(file);
          const newImageIndex = originalImageCount + i;
          
          // Track this index for later cleanup
          tempImageIndexes.push(newImageIndex);
          
          // Add a temporary entry to the images array
          setImages(prevImages => [
            ...prevImages, 
            {
              src: blobUrl,
              alt: file.name.split('.')[0],
              file
            }
          ]);
          
          // Upload the file
          const formData = new FormData();
          formData.append('image', file);
          
          const response = await fetch(`${ENDPOINTS.UPLOADS}/products/${productId}/images`, {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Upload failed (${response.status})`);
          }
          
          const data = await response.json();
          
          // Revoke the blob URL
          URL.revokeObjectURL(blobUrl);
          
          // Add the uploaded image to our results
          uploadedImages.push({
            id: data.image.id,
            src: getImageUrl(data.image.src),
            alt: data.image.alt || file.name.split('.')[0],
          });
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          hasError = true;
        }
      }
      
      // Update images state with all successfully uploaded images
      setImages(prevImages => {
        // Create a new array without the temporary previews
        const filteredImages = prevImages.filter((_, index) => !tempImageIndexes.includes(index));
        // Add the successfully uploaded images
        return [...filteredImages, ...uploadedImages];
      });
      
      // Show appropriate toast
      if (hasError) {
        if (uploadedImages.length > 0) {
          toast.success(`Uploaded ${uploadedImages.length} out of ${files.length} images`);
        } else {
          toast.error('Failed to upload images');
        }
      } else {
        toast.success(`Successfully uploaded ${files.length} images`);
      }
    } catch (error) {
      console.error('Error in bulk upload:', error);
      toast.error('Failed to upload images');
    } finally {
      setBulkUploadInProgress(false);
      
      // Reset the file input
      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = '';
      }
    }
  };
  
  // Add this simple function to handle variant image uploads
  const handleVariantImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, variantIndex: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImageUploading((prev) => ({ ...prev, [`variant-${variantIndex}`]: true }));
      
      if (!productId) {
        // For new products, create a temporary preview
        const blobUrl = URL.createObjectURL(file);
        console.log(`Created blob URL for new product variant image: ${blobUrl}`);
        
        // Add the image to the images array
        const newImageIndex = images.length;
        setImages([...images, {
          src: blobUrl,
          alt: file.name.split('.')[0],
          file
        }]);
        
        // Update the variant with a reference to this image URL
        const updatedVariants = [...variants];
        updatedVariants[variantIndex] = { 
          ...updatedVariants[variantIndex], 
          image_url: blobUrl // Just store the blob URL for display
        };
        setVariants(updatedVariants);
        console.log(`Variant ${variantIndex} updated with blob URL: ${blobUrl}`);
        
        toast.success('Variant image added. It will be uploaded when product is saved.');
        setImageUploading((prev) => ({ ...prev, [`variant-${variantIndex}`]: false }));
        return;
      }
      
      // For existing products, upload immediately
      const formData = new FormData();
      formData.append('image', file);
      
      console.log(`Uploading variant image for product ${productId}: ${file.name}`);
      
      const response = await fetch(`${ENDPOINTS.UPLOADS}/products/${productId}/images`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      console.log('Variant image upload response:', data);
      
      const imageUrl = getImageUrl(data.image.src);
      console.log(`Processed image URL: ${imageUrl}`);
      
      // Add the image to our images array
      setImages(prevImages => [
        ...prevImages, 
        {
          id: data.image.id,
          src: imageUrl,
          alt: file.name.split('.')[0],
        }
      ]);
      
      // Update the variant with the image URL
      const updatedVariants = [...variants];
      updatedVariants[variantIndex] = { 
        ...updatedVariants[variantIndex], 
        image_url: imageUrl // Store just the URL
      };
      setVariants(updatedVariants);
      console.log(`Updated variant ${variantIndex} with image URL: ${imageUrl}`);
      
      toast.success('Variant image uploaded successfully');
    } catch (error) {
      console.error('Error uploading variant image:', error);
      toast.error('Failed to upload variant image');
    } finally {
      setImageUploading((prev) => ({ ...prev, [`variant-${variantIndex}`]: false }));
    }
  };
  
  // Simplified function to select existing image
  const selectImageForVariant = (variantIndex: number, imageUrl: string) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex] = { 
      ...updatedVariants[variantIndex], 
      image_url: imageUrl // Just store the URL
    };
    setVariants(updatedVariants);
  };
  
  // Add the handleImagesForProduct function
  const handleImagesForProduct = async (productId: number, images: ImageType[]) => {
    // Upload all images that have a file property
    if (images.length > 0) {
      const imagesToUpload = images.filter(img => img.file);
      
      if (imagesToUpload.length > 0) {
        toast.success(`Uploading ${imagesToUpload.length} images for the product...`);
        
        const updatedImages: ImageType[] = [];
        
        // Process each file upload
        for (let i = 0; i < imagesToUpload.length; i++) {
          const image = imagesToUpload[i];
          if (!image.file) continue;
          
          try {
            // Create form data for the file
            const formData = new FormData();
            formData.append('image', image.file);
            
            // Upload file
            const uploadResponse = await fetch(`${ENDPOINTS.UPLOADS}/products/${productId}/images`, {
              method: 'POST',
              body: formData,
            });
            
            if (!uploadResponse.ok) {
              const errorText = await uploadResponse.text();
              console.error(`Failed to upload image ${i+1}: HTTP ${uploadResponse.status} - ${errorText}`);
              continue;
            }
            
            // Parse the response
            const responseData = await uploadResponse.json();
            console.log('Image upload response:', responseData);
            
            // Add the uploaded image to our results
            if (responseData.image) {
              updatedImages.push({
                id: responseData.image.id,
                src: getImageUrl(responseData.image.src),
                alt: responseData.image.alt || image.alt || '',
                is_primary: image.is_primary || false
              });
              
              // If this was a primary image, ensure it's set as primary in the database
              if (image.is_primary && responseData.image.id) {
                try {
                  await fetch(`${API_URL}/products/${productId}/images/${responseData.image.id}/primary`, {
                    method: 'PUT',
                  });
                } catch (error) {
                  console.error('Error setting primary image:', error);
                }
              }
            }
          } catch (uploadError) {
            console.error(`Error uploading image ${i+1}:`, uploadError);
          }
        }
        
        // Now that uploads are complete, update the images state
        // Keep any existing images that don't have files (they're already uploaded)
        const existingImages = images.filter(img => !img.file);
        
        // If we're in a new product creation flow, replace all images with the uploaded ones
        if (updatedImages.length > 0) {
          setImages([...existingImages, ...updatedImages]);
        }
        
        return updatedImages.length > 0;
      }
    }
    
    return true;
  };
  
  if (isLoading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-pulse">Loading product data...</div>
        </div>
      </Card>
    );
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information */}
      <Card 
        title={productId ? 'Edit Product' : 'Create New Product'}
        className="overflow-visible"
      >
        <div className="space-y-6">
          {/* Product Title and Slug - grouped together */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className={labelClasses}>
                Product Title {requiredFieldMark}
            </label>
            <input
              id="title"
              type="text"
                className={errors.title ? errorInputClasses : inputClasses}
                placeholder="Enter product title"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
                <p className={errorTextClasses}>{errors.title.message}</p>
            )}
          </div>
          
            <div className="md:col-span-2">
              <label htmlFor="slug" className={labelClasses}>
                URL Slug {requiredFieldMark}
              </label>
              <input
                id="slug"
                type="text"
                className={errors.slug ? errorInputClasses : inputClasses}
                placeholder="product-url-slug"
                {...register('slug', { required: 'Slug is required' })}
                onChange={handleSlugChange}
              />
              {errors.slug && (
                <p className={errorTextClasses}>{errors.slug.message}</p>
              )}
              <p className={helperTextClasses}>
                This will be used in the product URL. Auto-generated from title unless manually set.
              </p>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className={labelClasses}>
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              className={inputClasses + " resize-none"}
              placeholder="Enter product description"
              {...register('description')}
            />
          </div>
          
          {/* Pricing, Stock and Flags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="price" className={labelClasses}>
                Price {requiredFieldMark}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className={errors.price ? errorInputClasses + " pl-7" : inputClasses + " pl-7"}
                  placeholder="0.00"
                  {...register('price', { 
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be positive' },
                    valueAsNumber: true
                  })}
                />
              </div>
              {errors.price && (
                <p className={errorTextClasses}>{errors.price.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="stock" className={labelClasses}>
                Stock
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                className={errors.stock ? errorInputClasses : inputClasses}
                placeholder="0"
                {...register('stock', { 
                  min: { value: 0, message: 'Stock must be positive' },
                  valueAsNumber: true
                })}
              />
              {errors.stock && (
                <p className={errorTextClasses}>{errors.stock.message}</p>
              )}
          </div>
          
            {/* Flags */}
            <div className="flex flex-col justify-end mb-1">
              <label className={labelClasses}>Product Tags</label>
              <div className="flex flex-wrap gap-2 py-2">
                <div 
                  onClick={() => setValue('is_new', !watch('is_new'))} 
                  className={`cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    watch('is_new') 
                      ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                      : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <span className="flex items-center">
                    {watch('is_new') && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    New
                  </span>
                  <input
                    id="is_new"
                    type="checkbox"
                    className="hidden"
                    checked={watch('is_new')}
                    {...register('is_new')}
                  />
                </div>
                
                <div 
                  onClick={() => setValue('is_featured', !watch('is_featured'))} 
                  className={`cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    watch('is_featured') 
                      ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                      : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <span className="flex items-center">
                    {watch('is_featured') && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    Featured
                  </span>
                  <input
                    id="is_featured"
                    type="checkbox"
                    className="hidden"
                    checked={watch('is_featured')}
                    {...register('is_featured')}
                  />
                </div>
                
                <div 
                  onClick={() => setValue('is_sale', !watch('is_sale'))} 
                  className={`cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    watch('is_sale') 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <span className="flex items-center">
                    {watch('is_sale') && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    On Sale
                  </span>
                  <input
                    id="is_sale"
                    type="checkbox"
                    className="hidden"
                    checked={watch('is_sale')}
                    {...register('is_sale')}
                  />
                </div>
              </div>
              
              {isSale && (
                <div className="mt-3 flex items-center bg-gray-50 p-3 rounded-lg">
                  <label htmlFor="discount" className="block text-sm text-gray-700 mr-2">
                    Discount %:
                  </label>
                  <input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    className="w-20 rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                    {...register('discount', { 
                      min: { value: 0, message: 'Discount must be positive' },
                      max: { value: 100, message: 'Discount cannot exceed 100%' },
                      valueAsNumber: true
                    })}
                  />
                  {errors.discount && (
                    <p className="ml-2 text-xs text-red-600">{errors.discount.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* SEO Metadata Card */}
      <Card 
        title="SEO Metadata" 
        subtitle="Optimize your product for search engines" 
        className="overflow-visible"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="meta_title" className={labelClasses}>
                Meta Title
              </label>
              <input
                id="meta_title"
                type="text"
                className={inputClasses}
                placeholder="SEO title (defaults to product title if empty)"
                {...register('meta_title')}
              />
              <p className={helperTextClasses}>
                Recommended length: up to 60 characters.
              </p>
            </div>
            
            <div>
              <label htmlFor="meta_description" className={labelClasses}>
                Meta Description
              </label>
              <textarea
                id="meta_description"
                rows={3}
                className={inputClasses + " resize-none"}
                placeholder="Brief description for search results and social sharing"
                {...register('meta_description')}
              />
              <p className={helperTextClasses}>
                Recommended length: 155-160 characters.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="meta_keywords" className={labelClasses}>
                  Meta Keywords
                </label>
                <input
                  id="meta_keywords"
                  type="text"
                  className={inputClasses}
                  placeholder="product, keyword, another-keyword"
                  {...register('meta_keywords')}
                />
                <p className={helperTextClasses}>
                  Comma-separated keywords related to the product.
                </p>
              </div>
              
              <div>
                <label htmlFor="meta_image" className={labelClasses}>
                  Meta Image URL
                </label>
                <input
                  id="meta_image"
                  type="text"
                  className={inputClasses}
                  placeholder="https://example.com/image.jpg"
                  {...register('meta_image')}
                />
                <p className={helperTextClasses}>
                  Recommended size: 1200x630 pixels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Update the Collections card */}
      <Card title="Product Categories" subtitle="Add product to brands and categories" className="overflow-visible">
        <div className="space-y-6">
          {isLoadingCollections ? (
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <div className="bg-indigo-50 p-4 rounded-lg mb-4 border border-indigo-100">
                <p className="text-sm text-indigo-700">
                  {productId && !isEditingCollections 
                    ? "View and manage product collections. Click Edit Collections to see all available collections."
                    : "Select a brand and category for your product. Parent categories will be automatically added."}
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Selected Collections:</h4>
                <div className="min-h-11 flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {selectedCollections.length === 0 ? (
                    <div className="text-sm text-gray-500 py-1 italic">Select at least one brand and category</div>
                  ) : (
                    allCollections
                      .filter(c => selectedCollections.includes(c.id))
                      .sort((a, b) => {
                        // Sort by collection type first (brand, then category)
                        if (a.collection_type === 'brand' && b.collection_type !== 'brand') return -1;
                        if (a.collection_type !== 'brand' && b.collection_type === 'brand') return 1;
                        // Then by level
                        return (a.level || 0) - (b.level || 0);
                      })
                      .map(collection => (
                        <div 
                          key={collection.id}
                          className={`
                            inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium
                            ${getCollectionTagColor(collection.collection_type)}
                            ${isEditingCollections ? 'cursor-pointer hover:bg-opacity-80' : ''}
                          `}
                          onClick={() => isEditingCollections && handleTagClick(collection.id)}
                        >
                          {collection.collection_type === 'brand' && (
                            <span className="mr-1.5 text-xs">
                              {/* Brand Icon */}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9a4 4 0 118 0 4 4 0 01-8 0zm4-6a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                          {collection.collection_type === 'category' && (
                            <span className="mr-1.5 text-xs">
                              {/* Category Icon */}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                              </svg>
                            </span>
                          )}
                          {collection.name}
                          {isEditingCollections && (
                            <button 
                              type="button"
                              className="ml-1.5 text-current opacity-70 hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCollection(collection.id);
                              }}
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Only show Edit button when not editing and we have a productId */}
              {productId && !isEditingCollections ? (
                <div className="flex justify-center">
                  <Button
                    variant="primary"
                    onClick={() => setIsEditingCollections(true)}
                    size="md"
                    className="w-full md:w-auto"
                  >
                    Edit Collections
                  </Button>
                </div>
              ) : (
                <>
                  {/* Only show these controls when in edit mode */}
                  {isEditingCollections && (
                    <>
                      <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1">
                          <Input
                            placeholder="Search collections..."
                            icon={<TagIcon className="h-4 w-4" />}
                            value={collectionSearchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCollectionSearchTerm(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="w-full md:w-64">
                          <select 
                            className="block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={collectionTypeFilter}
                            onChange={(e) => setCollectionTypeFilter(e.target.value)}
                          >
                            <option value="all">All Collection Types</option>
                            <option value="brand">Brands</option>
                            <option value="category">Categories</option>
                            <option value="category_parent">Parent Categories</option>
                            <option value="featured">Featured Collections</option>
                            <option value="custom">Custom Collections</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Collection selection area */}
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">
                          {collectionTypeFilter === 'all' ? 'Available Collections:' : 
                          collectionTypeFilter === 'brand' ? 'Available Brands:' : 
                          collectionTypeFilter === 'category' ? 'Available Categories:' :
                          `Available ${collectionTypeFilter.replace('_', ' ')} Collections:`}
                        </h4>
                        
                        <div className="border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto">
                          {filteredCollectionsByType.length === 0 ? (
                            <div className="text-center py-2 text-gray-500">
                              No {collectionTypeFilter === 'all' ? 'collections' : collectionTypeFilter} found. {collectionSearchTerm ? 'Try a different search term.' : ''}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {filteredCollectionsByType
                                .filter(c => !selectedCollections.includes(c.id))
                                .sort((a, b) => {
                                  // First sort by collection type (brand first)
                                  if (a.collection_type === 'brand' && b.collection_type !== 'brand') return -1;
                                  if (a.collection_type !== 'brand' && b.collection_type === 'brand') return 1;
                                  // Then by level
                                  return (a.level || 0) - (b.level || 0);
                                })
                                .map(collection => {
                                  const isDisabled = !areAllParentsSelected(collection.id) && collection.parent_id !== null;
                                  
                                  return (
                                    <div 
                                      key={collection.id}
                                      className={`
                                        inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium
                                        ${isDisabled 
                                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200' 
                                          : `${getCollectionTagColor(collection.collection_type)} cursor-pointer hover:bg-opacity-80`}
                                      `}
                                      onClick={() => !isDisabled && handleTagClick(collection.id)}
                                      title={isDisabled ? "Parent collection must be selected first" : collection.description || collection.name}
                                    >
                                      {collection.collection_type === 'brand' && (
                                        <span className="mr-1.5 text-xs">
                                          {/* Brand Icon */}
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5 9a4 4 0 118 0 4 4 0 01-8 0zm4-6a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
                                          </svg>
                                        </span>
                                      )}
                                      {collection.collection_type === 'category' && (
                                        <span className="mr-1.5 text-xs">
                                          {/* Category Icon */}
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                          </svg>
                                        </span>
                                      )}
                                      {collection.name}
                                      {collection.level && collection.level > 0 && (
                                        <span className="ml-1.5 text-xs opacity-70">
                                          (L{collection.level})
                                        </span>
                                      )}
                                      {collection.parent_id && (
                                        <span className="ml-1.5 text-xs opacity-70">
                                          ↑
                                        </span>
                                      )}
                                    </div>
                                  );
                                })
                              }
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Done button in edit mode */}
                      {productId && (
                        <div className="flex justify-center mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingCollections(false)}
                            size="md"
                            className="w-full md:w-auto"
                          >
                            Done Editing
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </Card>
      
      {/* Product Images Card - Enhanced Design */}
      <Card 
        title="Product Images"
        subtitle="Upload and manage product images"
        className="overflow-visible"
        actions={
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addImage}
              icon={<PlusIcon className="h-4 w-4" />}
              type="button"
            >
              Add Image
            </Button>
            
            {/* Multiple Upload Button */}
            <div>
              <input
                type="file"
                ref={multipleFileInputRef}
                accept="image/*"
                multiple
                onChange={handleMultipleFileUpload}
                className="hidden"
                id="multiple-image-upload"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => multipleFileInputRef.current?.click()}
                icon={<PhotoIcon className="h-4 w-4" />}
                type="button"
                loading={bulkUploadInProgress}
                disabled={bulkUploadInProgress}
              >
                Bulk Upload
              </Button>
            </div>
          </div>
        }
      >
        {bulkUploadInProgress && (
          <div className="my-3 p-3 bg-indigo-50 text-indigo-700 rounded-md flex items-center justify-center border border-indigo-100">
            <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading multiple images...
          </div>
        )}
        
        {images.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <PhotoIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No images added yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Image" to add product images</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {images.map((image, index) => (
              <div key={index} className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md">
                {/* Image Preview Area */}
                <div className="relative h-40 bg-gray-100 overflow-hidden">
                    {image.src ? (
                        <SafeImage
                          src={image.src}
                          alt={image.alt || "Product image"}
                      className="w-full h-full object-contain"
                        />
                    ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <PhotoIcon className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                  
                  {/* Primary Image Badge */}
                  <div className="absolute top-2 left-2 flex space-x-2">
                    <div className="flex items-center">
                      <input
                        id={`is_primary_${index}`}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={image.is_primary || false}
                        onChange={(e) => {
                          // Set this image as primary and all others as not primary
                          const updatedImages = images.map((img, i) => ({
                            ...img,
                            is_primary: i === index ? e.target.checked : false
                          }));
                          setImages(updatedImages);
                        }}
                      />
                      <label htmlFor={`is_primary_${index}`} className="ml-2 text-xs font-medium bg-white px-2 py-1 rounded-md shadow-sm text-gray-700">
                        Primary
                      </label>
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm border border-gray-200 hover:bg-gray-50"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                
                {/* Image Details */}
                <div className="p-4 space-y-3">
                  {/* Alt Text */}
                    <div>
                    <label className={labelClasses}>
                      Alt Text
                      </label>
                    <input
                      type="text"
                      value={image.alt}
                      onChange={(e) => updateImage(index, 'alt', e.target.value)}
                      className={inputClasses}
                      placeholder="Product image description"
                    />
                  </div>
                  
                  {/* File Upload */}
                  <div>
                    <label className={labelClasses}>
                      Replace Image
                    </label>
                    <div className="flex items-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, index)}
                        className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3
                          file:rounded-md file:border-0 file:text-xs file:font-semibold file:cursor-pointer
                          file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      {imageUploading[index.toString()] && (
                          <span className="inline-flex items-center text-xs text-indigo-600">
                          <svg className="animate-spin mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      {/* Product Variants Card - Enhanced Design */}
      <Card 
        title="Product Variants"
        subtitle="Add size, color and other variants of this product"
        className="overflow-visible"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={addVariant}
            icon={<PlusIcon className="h-4 w-4" />}
            type="button"
          >
            Add Variant
          </Button>
        }
      >
        {variants.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </div>
            <p className="mt-2 text-sm text-gray-500">No variants added yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Variant" to add product variants</p>
          </div>
        ) : (
          <>
            <div className="bg-indigo-50 p-3 rounded-lg mb-6 border border-indigo-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="ml-3">
              <p className="text-sm text-indigo-700">
                To associate an image with a variant, upload the image in the 'Images' section first, then select it here.
              </p>
            </div>
              </div>
            </div>
            
            <div className="space-y-5">
              {variants.map((variant, index) => (
                <div key={index} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-700 mr-2">
                        <span className="text-xs font-semibold">{index + 1}</span>
                      </div>
                    <h3 className="text-sm font-medium text-gray-700">Variant {index + 1}</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeVariant(index)}
                      icon={<XMarkIcon className="h-4 w-4" />}
                      type="button"
                      className="border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>
                        Size
                      </label>
                      <input
                        type="text"
                        value={variant.size}
                        onChange={(e) => updateVariant(index, 'size', e.target.value)}
                          className={inputClasses}
                        placeholder="S, M, L, XL, etc."
                      />
                    </div>
                    <div>
                        <label className={labelClasses}>
                        Color
                      </label>
                      <input
                        type="text"
                        value={variant.color}
                        onChange={(e) => updateVariant(index, 'color', e.target.value)}
                          className={inputClasses}
                        placeholder="Red, Blue, Green, etc."
                      />
                    </div>
                    <div>
                        <label className={labelClasses}>
                        Price (Optional)
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.price || ''}
                          onChange={(e) => updateVariant(index, 'price', e.target.value)}
                            className={inputClasses + " pl-7"}
                          placeholder="Same as base price"
                        />
                      </div>
                    </div>
                    </div>
                    
                    <div>
                      <label className={labelClasses}>
                        Variant Image
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        {/* Image preview */}
                        {variant.image_url ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="relative">
                              <SafeImage
                                src={variant.image_url}
                                alt={`Variant image for ${variant.size} ${variant.color}`}
                                className="h-20 w-20 object-contain rounded-md border border-gray-200 bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  console.log(`Removing image from variant ${index}`);
                                  const updatedVariants = [...variants];
                                  updatedVariants[index] = { 
                                    ...updatedVariants[index], 
                                    image_url: '' 
                                  };
                                  setVariants(updatedVariants);
                                }}
                                className="absolute -top-2 -right-2 h-5 w-5 bg-white rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                              >
                                <XMarkIcon className="h-3 w-3 text-gray-500" />
                              </button>
                            </div>
                            <div>
                              <p className="text-sm text-gray-700 font-medium">Image Selected</p>
                              <p className="text-xs text-gray-500 truncate max-w-sm mt-1">
                              {variant.image_url.split('/').pop()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <label className="cursor-pointer inline-flex items-center bg-indigo-600 text-white px-3 py-1.5 text-xs rounded-md hover:bg-indigo-700 transition-colors">
                              <PlusIcon className="h-3 w-3 mr-1" /> Upload Image
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleVariantImageUpload(e, index)}
                                className="hidden"
                              />
                            </label>
                            
                            {imageUploading[`variant-${index}`] && (
                              <span className="inline-flex items-center text-xs text-indigo-600">
                                <svg className="animate-spin mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                              </span>
                            )}
                            
                            {images.length > 0 && (
                              <div className="flex-1 w-full sm:w-auto">
                              <select 
                                  className="block w-full rounded-md border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5"
                                value={variant.image_url || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  console.log(`Selected image URL for variant ${index}: ${value}`);
                                  if (value) {
                                    selectImageForVariant(index, value);
                                  } else {
                                    const updatedVariants = [...variants];
                                    updatedVariants[index] = { 
                                      ...updatedVariants[index], 
                                      image_url: '' 
                                    };
                                    setVariants(updatedVariants);
                                  }
                                }}
                              >
                                  <option value="">Select existing image</option>
                                {images.map((img, imgIndex) => (
                                  <option key={img.id || `temp-${imgIndex}`} value={img.src}>
                                    Image {imgIndex + 1} {img.alt ? `- ${img.alt}` : ''}
                                  </option>
                                ))}
                              </select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
      
      {/* Submit & Cancel Buttons */}
      <div className="mt-6 flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => router.push('/products')}
          type="button"
          className="w-24"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-24"
        >
          {productId ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

// Helper function to get color classes based on collection type
function getCollectionTagColor(type?: string): string {
  switch (type) {
    case 'brand':
      return 'bg-green-100 text-green-800';
    case 'category':
      return 'bg-blue-100 text-blue-800';
    case 'featured':
      return 'bg-yellow-100 text-yellow-800';
    case 'category_parent':
      return 'bg-indigo-100 text-indigo-800';
    case 'brand_parent':
      return 'bg-emerald-100 text-emerald-800';
    case 'custom':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 