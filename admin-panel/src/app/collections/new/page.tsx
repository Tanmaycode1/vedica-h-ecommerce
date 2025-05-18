'use client';

import CollectionForm from '@/components/collections/CollectionForm';

export default function NewCollectionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Collection</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new collection to organize your products.
        </p>
      </div>
      
      <CollectionForm />
    </div>
  );
} 