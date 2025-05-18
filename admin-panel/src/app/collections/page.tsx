'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PlusIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { collectionsApi } from '@/lib/api';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import React from 'react';

type CollectionType = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
  parent_id?: number | null;
  collection_type?: string;
  level?: number;
  products_count?: number;
  total_products_count?: number;
  products?: any[];
  children?: CollectionType[];
  parent_name?: string;
};

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [expandedCollections, setExpandedCollections] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        
        if (viewMode === 'tree') {
          // Fetch collections in tree structure
          const data = await collectionsApi.getTree({ include_inactive: true });
          setCollections(data || []);
        } else {
          // Fetch all collections in flat list
          const data = await collectionsApi.getAll();
          
          let collectionsData: CollectionType[] = [];
          
          if (data && Array.isArray(data)) {
            collectionsData = data.map((collection: CollectionType) => ({
              ...collection,
              products_count: collection.products_count || collection.products?.length || 0,
              total_products_count: collection.total_products_count || collection.products_count || collection.products?.length || 0
            }));
            
            // Enhanced mapping to include complete parent and child information
            const collectionMap = new Map<number, CollectionType>();
            collectionsData.forEach(collection => {
              collectionMap.set(collection.id, {
                ...collection,
                children: []
              });
            });
            
            // Build parent-child relationships
            collectionsData.forEach(collection => {
              if (collection.parent_id && collectionMap.has(collection.parent_id)) {
                const parent = collectionMap.get(collection.parent_id)!;
                collection.parent_name = parent.name;
                
                // Add this collection as a child to its parent
                if (!parent.children) parent.children = [];
                parent.children.push(collection);
              }
            });
            
            // Convert map back to array
            collectionsData = Array.from(collectionMap.values());
          } else {
            // Type assertion to any to avoid type errors
            const anyData = data as any;
            if (anyData && anyData.collections && Array.isArray(anyData.collections)) {
              collectionsData = anyData.collections.map((collection: CollectionType) => ({
                ...collection,
                products_count: collection.products_count || collection.products?.length || 0,
                total_products_count: collection.total_products_count || collection.products_count || collection.products?.length || 0
              }));
              
              collectionsData = collectionsData.map(collection => {
                if (collection.parent_id) {
                  const parent = collectionsData.find(c => c.id === collection.parent_id);
                  return {
                    ...collection,
                    parent_name: parent ? parent.name : undefined
                  };
                }
                return collection;
              });
            }
          }
          
          setCollections(collectionsData);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
        toast.error('Failed to load collections');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCollections();
  }, [viewMode]);
  
  const handleDeleteCollection = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      try {
        await collectionsApi.delete(id);
        
        // Refresh collections after delete
        if (viewMode === 'tree') {
          const data = await collectionsApi.getTree({ include_inactive: true });
          setCollections(data || []);
        } else {
          setCollections(collections.filter(collection => collection.id !== id));
        }
        
        toast.success('Collection deleted successfully');
      } catch (error) {
        console.error('Error deleting collection:', error);
        toast.error('Failed to delete collection');
      }
    }
  };
  
  const toggleCollectionExpand = (id: number) => {
    setExpandedCollections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Filter collections based on search query
  const filteredCollections = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return collections;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    
    if (viewMode === 'tree') {
      // Recursive function to filter collections in tree structure
      const filterTreeCollections = (items: CollectionType[]): CollectionType[] => {
        const result: CollectionType[] = [];
        
        for (const item of items) {
          // Check if this item matches the search
          const matches = item.name.toLowerCase().includes(lowercaseQuery) || 
                         item.slug.toLowerCase().includes(lowercaseQuery) ||
                         (item.description && item.description.toLowerCase().includes(lowercaseQuery));
          
          // Process children
          const filteredChildren = item.children ? filterTreeCollections(item.children) : [];
          
          // Include this item if it matches or has matching children
          if (matches || filteredChildren.length > 0) {
            result.push({
              ...item,
              children: filteredChildren
            });
          }
        }
        
        return result;
      };
      
      return filterTreeCollections(collections);
    } else {
      // Flat filtering for grid view
      return collections.filter(collection => 
        collection.name.toLowerCase().includes(lowercaseQuery) ||
        collection.slug.toLowerCase().includes(lowercaseQuery) ||
        (collection.description && collection.description.toLowerCase().includes(lowercaseQuery))
      );
    }
  }, [collections, searchQuery, viewMode]);
  
  // Recursive function to render collection tree
  const renderCollectionTree = (collections: CollectionType[], level: number = 0) => {
    return collections.map(collection => (
      <div key={collection.id} className="collection-tree-item">
        <div 
          className={`flex items-center py-2 px-4 rounded-md mb-1 ${
            level === 0 ? 'bg-indigo-100' : 'hover:bg-gray-100'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          {collection.children && collection.children.length > 0 ? (
            <button 
              onClick={() => toggleCollectionExpand(collection.id)}
              className="p-1 rounded-full hover:bg-gray-200 mr-2"
            >
              {expandedCollections[collection.id] ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-800" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-800" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2"></div>
          )}
          
          <div className="flex-1 flex items-center">
            <span className={`font-medium ${!collection.is_active ? 'text-gray-400' : 'text-gray-800'}`}>
              {collection.name}
            </span>
            {collection.collection_type && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                {collection.collection_type}
              </span>
            )}
            {collection.is_featured && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                Featured
              </span>
            )}
            {!collection.is_active && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                Inactive
              </span>
            )}
            <span className="ml-2 text-xs text-gray-700">
              {collection.products_count || 0} direct products
            </span>
            {collection.total_products_count !== undefined && 
             collection.total_products_count > (collection.products_count || 0) && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                {collection.total_products_count} total products
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/collections/${collection.id}`)}
              icon={<PencilIcon className="h-3 w-3" />}
              className="py-1 px-2 text-xs"
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteCollection(collection.id)}
              icon={<TrashIcon className="h-3 w-3" />}
              className="py-1 px-2 text-xs"
            >
              Delete
            </Button>
          </div>
        </div>
        
        {collection.children && collection.children.length > 0 && expandedCollections[collection.id] && (
          <div className="tree-children">
            {renderCollectionTree(collection.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
        <div className="flex gap-2">
          <Link href="/collections/new">
            <Button variant="primary" icon={<PlusIcon className="h-4 w-4" />}>
              New Collection
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center space-x-1 ${
              viewMode === 'tree'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setViewMode('tree')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Tree View</span>
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center space-x-1 ${
              viewMode === 'grid'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
            onClick={() => setViewMode('grid')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Grid View</span>
          </button>
        </div>
        <div>
          <Input
            placeholder="Search collections..."
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="animate-pulse">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 bg-gray-200 rounded mb-2"></div>
          ))}
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="p-6 text-center border border-gray-200 rounded-lg">
          <p className="text-gray-500">
            {searchQuery ? 'No collections found matching your search.' : 'No collections found. Create your first collection!'}
          </p>
        </div>
      ) : viewMode === 'tree' ? (
        <Card>
          <div className="collection-tree p-4">
            {renderCollectionTree(filteredCollections)}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <Card key={collection.id} className="overflow-hidden flex flex-col h-full border border-gray-200 hover:shadow-md transition-shadow duration-200">
              <div className="h-40 bg-gray-100 relative">
                {(collection.image || collection.image_url) ? (
                  <img 
                    src={
                      collection.image_url ? collection.image_url :
                      collection.image?.startsWith('/') 
                        ? `http://localhost:3002${collection.image}` 
                        : `http://localhost:3002/uploads/${collection.image}`
                    }
                    alt={collection.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/600x400?text=Collection+Image";
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200">
                    <span className="text-gray-500 font-medium">No Image</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                  {collection.is_featured && (
                    <span className="bg-yellow-500 text-white px-2 py-1 text-xs font-semibold rounded shadow-sm">
                      Featured
                    </span>
                  )}
                  {!collection.is_active && (
                    <span className="bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded shadow-sm">
                      Inactive
                    </span>
                  )}
                </div>
                {collection.collection_type && (
                  <span className="absolute top-2 left-2 bg-indigo-500 text-white px-2 py-1 text-xs font-semibold rounded shadow-sm">
                    {collection.collection_type}
                  </span>
                )}
                {(collection.parent_id || (collection.children && collection.children.length > 0)) && (
                  <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm rounded-full py-1 px-2 flex items-center">
                    <span className="text-xs font-medium text-gray-700">
                      {collection.parent_id ? 'Child' : 'Parent'}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors duration-200">{collection.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{collection.slug}</p>
                  {collection.parent_name && (
                    <div className="flex items-center mt-2 p-2 bg-indigo-50 rounded-md">
                      <span className="text-xs text-gray-700 font-medium">Parent:</span>
                      <span className="ml-1 text-xs font-medium text-indigo-700 px-2 py-0.5 rounded bg-indigo-100">
                        {collection.parent_name}
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                    {collection.description || 'No description provided.'}
                  </p>
                  {collection.children && collection.children.length > 0 && (
                    <div className="mt-3 border-t border-gray-100 pt-2">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center">
                        <ChevronDownIcon className="h-4 w-4 mr-1" />
                        Child Collections ({collection.children.length})
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {collection.children.map(child => (
                          <span 
                            key={child.id}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200"
                            onClick={() => router.push(`/collections/${child.id}`)}
                          >
                            {child.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex flex-wrap gap-2">
                    <div className="text-sm font-medium text-indigo-600 flex items-center">
                      <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                        {collection.products_count || 0}
                      </span>
                      <span className="ml-1">Direct products</span>
                    </div>
                    {collection.total_products_count !== undefined && collection.total_products_count > (collection.products_count || 0) && (
                      <div className="text-sm font-medium text-green-600 flex items-center">
                        <span className="inline-flex items-center justify-center bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {collection.total_products_count}
                        </span>
                        <span className="ml-1">Total products</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/collections/${collection.id}`)}
                      icon={<PencilIcon className="h-4 w-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteCollection(collection.id)}
                      icon={<TrashIcon className="h-4 w-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 