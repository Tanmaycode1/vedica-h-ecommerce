'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CollectionForm from '@/components/collections/CollectionForm';
import { collectionsApi } from '@/lib/api';
import Card from '@/components/ui/Card';

interface Collection {
  id: number;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  is_featured?: boolean;
  [key: string]: any;
}

export default function EditCollectionPage() {
  const params = useParams();
  const collectionId = parseInt(params.id as string);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch collection data
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setIsLoading(true);
        // First we need to get the collection to get its slug
        const collections = await collectionsApi.getAll();
        const targetCollection = collections.find((c: Collection) => c.id === collectionId);
        
        if (targetCollection) {
          // Now fetch the full collection details including products
          const detailedCollection = await collectionsApi.getBySlug(targetCollection.slug);
          setCollection(detailedCollection);
        }
      } catch (error) {
        console.error('Error fetching collection:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCollection();
  }, [collectionId]);
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Collection</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update an existing collection.
          </p>
        </div>
        
        <Card>
          <div className="p-6 text-center">
            <div className="animate-pulse">Loading collection data...</div>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Collection</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update an existing collection.
        </p>
      </div>
      
      <CollectionForm 
        collectionId={collectionId} 
        initialData={collection?.collection || collection} 
      />
    </div>
  );
} 