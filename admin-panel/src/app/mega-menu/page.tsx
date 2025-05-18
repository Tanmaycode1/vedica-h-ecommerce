'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { megaMenuApi } from '@/lib/api';
import { 
  PlusIcon, 
  CheckCircleIcon, 
  ChevronDownIcon, 
  ChevronRightIcon, 
  XMarkIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon, 
  ArrowDownIcon,
  EyeIcon,
  EyeSlashIcon 
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

// Dynamically import react-beautiful-dnd with SSR disabled
const DragDropContext = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.DragDropContext),
  { ssr: false }
);
const Droppable = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Droppable),
  { ssr: false }
);
const Draggable = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Draggable),
  { ssr: false }
);

type CollectionType = {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  collection_type?: string;
  level?: number;
  is_active?: boolean;
  is_in_mega_menu?: boolean;
  children?: CollectionType[];
  products_count?: number;
};

type MegaMenuItemType = {
  id: number;
  collection_id: number;
  position: number;
  is_active: boolean;
  collection_name: string;
  collection_slug: string;
  parent_menu_item_id?: number | null;
  parent_id?: number | null;
  collection_type?: string;
  level?: number;
  display_subcollections?: boolean;
  children?: MegaMenuItemType[];
};

export default function MegaMenuPage() {
  const [collections, setCollections] = useState<CollectionType[]>([]);
  const [megaMenuItems, setMegaMenuItems] = useState<MegaMenuItemType[]>([]);
  const [originalMegaMenuItems, setOriginalMegaMenuItems] = useState<MegaMenuItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Define a more specific type for expandedCollections
  type ExpandedCollectionsType = Record<number, boolean> & {
    addingSub?: number;
  };
  
  const [expandedCollections, setExpandedCollections] = useState<ExpandedCollectionsType>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isReordering, setIsReordering] = useState(false);
  const [clientSideRendered, setClientSideRendered] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [pendingAdditions, setPendingAdditions] = useState<{collectionId: number, parentMenuItemId?: number}[]>([]);
  const [pendingRemovals, setPendingRemovals] = useState<number[]>([]);
  
  // Set clientSideRendered to true when component mounts
  useEffect(() => {
    setClientSideRendered(true);
  }, []);
  
  const fetchMegaMenu = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await megaMenuApi.getTree();
      
      if (data && data.collectionsTree) {
        setCollections(data.collectionsTree || []);
      }
      
      if (data && data.megaMenu) {
        setMegaMenuItems(data.megaMenu || []);
        setOriginalMegaMenuItems(data.megaMenu || []);
      }
    } catch (error) {
      console.error('Error fetching mega menu data:', error);
      toast.error('Failed to load mega menu data');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchMegaMenu();
  }, [fetchMegaMenu]);
  
  const toggleEditMode = () => {
    if (isEditMode) {
      // If we're exiting edit mode without saving, reset to original state
      setMegaMenuItems([...originalMegaMenuItems]);
      setPendingChanges({});
      setPendingAdditions([]);
      setPendingRemovals([]);
    }
    setIsEditMode(!isEditMode);
  };
  
  const saveAllChanges = async () => {
    try {
      setIsLoading(true);
      
      // Process one change at a time to avoid deadlocks
      // First, apply all removals
      for (const itemId of pendingRemovals) {
        try {
          await megaMenuApi.removeCollection(itemId);
          // Small delay to avoid race conditions
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error removing item ${itemId}:`, error);
          toast.error(`Failed to remove item ${itemId}`);
        }
      }
      
      // Then, apply all additions
      for (const addition of pendingAdditions) {
        try {
          if (addition.parentMenuItemId) {
            await megaMenuApi.addSubcollection(addition.collectionId, addition.parentMenuItemId);
          } else {
            await megaMenuApi.addCollection(addition.collectionId, undefined, null, false);
          }
          // Small delay to avoid race conditions
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error adding collection ${addition.collectionId}:`, error);
          toast.error(`Failed to add collection ${addition.collectionId}`);
        }
      }
      
      // Finally, apply all updates one by one
      for (const [itemId, changes] of Object.entries(pendingChanges)) {
        try {
          await megaMenuApi.updateMenuItem(Number(itemId), changes);
          // Small delay to avoid race conditions
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error updating item ${itemId}:`, error);
          toast.error(`Failed to update item ${itemId}`);
        }
      }
      
      // Refresh data
      await fetchMegaMenu();
      
      // Reset state
      setPendingChanges({});
      setPendingAdditions([]);
      setPendingRemovals([]);
      setIsEditMode(false);
      
      toast.success('All mega menu changes saved successfully');
    } catch (error) {
      console.error('Error saving mega menu changes:', error);
      toast.error('Failed to save some changes');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleCollectionExpand = (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedCollections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const handleAddToMegaMenu = async (collectionId: number, parentMenuItemId?: number) => {
    if (isEditMode) {
      // In edit mode, just update local state and track the change
      setPendingAdditions(prev => [...prev, { collectionId, parentMenuItemId }]);
      
      // Create a temporary menu item for immediate visual feedback
      const collectionToAdd = findCollectionById(collections, collectionId);
      if (!collectionToAdd) return;
      
      const newMenuItem = {
        id: -Date.now(), // Temporary negative ID to avoid conflicts
        collection_id: collectionId,
        position: megaMenuItems.filter(item => item.parent_menu_item_id === parentMenuItemId).length,
        is_active: true,
        collection_name: collectionToAdd.name,
        collection_slug: collectionToAdd.slug,
        parent_menu_item_id: parentMenuItemId,
        collection_type: collectionToAdd.collection_type,
        level: parentMenuItemId ? 1 : 0,
        display_subcollections: false,
        children: []
      };
      
      // Update megaMenuItems with the new item
      setMegaMenuItems(prev => [...prev, newMenuItem]);
      
      // Mark the collection as in menu
      setCollections(prev => markCollectionAsInMenu(prev, collectionId, true));
      
      toast.success('Collection added to mega menu (pending save)');
    } else {
      try {
        if (parentMenuItemId) {
          // Add as subcollection
          await megaMenuApi.addSubcollection(collectionId, parentMenuItemId);
          toast.success('Subcollection added to mega menu');
        } else {
          // Add as top-level item
          // Explicitly pass null for parent_menu_item_id to avoid sending undefined
          await megaMenuApi.addCollection(collectionId, undefined, null, false);
          toast.success('Collection added to mega menu');
        }
        fetchMegaMenu();
      } catch (error: any) {
        console.error('Error adding collection to mega menu:', error);
        // More detailed error message if available
        const errorMsg = error.response?.data?.message || 'Failed to add collection to mega menu';
        toast.error(errorMsg);
      }
    }
  };
  
  const handleRemoveFromMegaMenu = async (menuItemId: number) => {
    if (isEditMode) {
      // In edit mode, just update local state and track the change
      if (menuItemId > 0) { // Only track real items for removal, not temporary ones
        setPendingRemovals(prev => [...prev, menuItemId]);
      }
      
      // Find the item to remove
      const itemToRemove = findMenuItemById(megaMenuItems, menuItemId);
      if (itemToRemove) {
        // Mark the collection as not in menu
        setCollections(prev => markCollectionAsInMenu(prev, itemToRemove.collection_id, false));
        
        // Remove from megaMenuItems
        setMegaMenuItems(prev => removeMenuItemAndChildren(prev, menuItemId));
      }
      
      toast.success('Collection removed from mega menu (pending save)');
    } else {
      if (window.confirm('Are you sure you want to remove this collection from the mega menu?')) {
        try {
          await megaMenuApi.removeCollection(menuItemId);
          toast.success('Collection removed from mega menu');
          fetchMegaMenu();
        } catch (error) {
          console.error('Error removing collection from mega menu:', error);
          toast.error('Failed to remove collection from mega menu');
        }
      }
    }
  };
  
  // Helper function to find a menu item by ID in the hierarchical structure
  const findMenuItemById = (items: MegaMenuItemType[], id: number): MegaMenuItemType | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children && item.children.length > 0) {
        const found = findMenuItemById(item.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };
  
  // Helper function to remove a menu item and all its children from the array
  const removeMenuItemAndChildren = (items: MegaMenuItemType[], id: number): MegaMenuItemType[] => {
    return items.filter(item => {
      if (item.id === id) return false;
      if (item.children && item.children.length > 0) {
        item.children = removeMenuItemAndChildren(item.children, id);
      }
      return true;
    });
  };
  
  // Helper function to mark a collection as in/not in the menu
  const markCollectionAsInMenu = (collections: CollectionType[], id: number, inMenu: boolean): CollectionType[] => {
    return collections.map(collection => {
      if (collection.id === id) {
        return { ...collection, is_in_mega_menu: inMenu };
      }
      if (collection.children && collection.children.length > 0) {
        return {
          ...collection,
          children: markCollectionAsInMenu(collection.children, id, inMenu)
        };
      }
      return collection;
    });
  };
  
  const handleToggleActive = async (menuItem: MegaMenuItemType) => {
    if (isEditMode) {
      // In edit mode, just update local state and track the change
      setPendingChanges(prev => ({
        ...prev,
        [menuItem.id]: {
          ...prev[menuItem.id],
          is_active: !menuItem.is_active
        }
      }));
      
      // Update the megaMenuItems state
      setMegaMenuItems(prev => updateMenuItemInTree(prev, menuItem.id, {
        is_active: !menuItem.is_active
      }));
      
      toast.success(`Collection visibility toggled (pending save)`);
    } else {
      try {
        await megaMenuApi.updateMenuItem(menuItem.id, { is_active: !menuItem.is_active });
        toast.success(`Collection ${menuItem.is_active ? 'hidden' : 'shown'} in mega menu`);
        fetchMegaMenu();
      } catch (error) {
        console.error('Error updating mega menu item:', error);
        toast.error('Failed to update mega menu item');
      }
    }
  };
  
  const handleToggleDisplaySubcollections = async (menuItem: MegaMenuItemType) => {
    if (isEditMode) {
      // In edit mode, just update local state and track the change
      setPendingChanges(prev => ({
        ...prev,
        [menuItem.id]: {
          ...prev[menuItem.id],
          display_subcollections: !menuItem.display_subcollections
        }
      }));
      
      // Update the megaMenuItems state
      setMegaMenuItems(prev => updateMenuItemInTree(prev, menuItem.id, {
        display_subcollections: !menuItem.display_subcollections
      }));
      
      toast.success(`Subcollection display toggled (pending save)`);
    } else {
      try {
        await megaMenuApi.updateMenuItem(menuItem.id, { 
          display_subcollections: !menuItem.display_subcollections 
        });
        toast.success(`Subcollections will ${menuItem.display_subcollections ? 'not be' : 'be'} displayed`);
        fetchMegaMenu();
      } catch (error) {
        console.error('Error updating mega menu item:', error);
        toast.error('Failed to update mega menu item');
      }
    }
  };
  
  // Helper function to update a menu item in the tree
  const updateMenuItemInTree = (items: MegaMenuItemType[], id: number, changes: Record<string, any>): MegaMenuItemType[] => {
    return items.map(item => {
      if (item.id === id) {
        return { ...item, ...changes };
      }
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: updateMenuItemInTree(item.children, id, changes)
        };
      }
      return item;
    });
  };
  
  const moveItemUp = async (index: number) => {
    if (index === 0) return;
    
    const newItems = [...megaMenuItems];
    const itemToMove = newItems[index];
    const itemAbove = newItems[index - 1];
    
    // Swap positions
    newItems[index - 1] = itemToMove;
    newItems[index] = itemAbove;
    
    // Update positions
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      position: idx
    }));
    
    setMegaMenuItems(updatedItems);
    
    if (isEditMode) {
      // In edit mode, track these position changes
      updatedItems.forEach(item => {
        setPendingChanges(prev => ({
          ...prev,
          [item.id]: {
            ...prev[item.id],
            position: item.position
          }
        }));
      });
      toast.success('Item moved up (pending save)');
    } else {
      try {
        await megaMenuApi.reorderItems(
          updatedItems.map(item => ({ id: item.id, position: item.position }))
        );
        toast.success('Item moved up');
      } catch (error) {
        console.error('Error reordering items:', error);
        toast.error('Failed to update menu order');
        fetchMegaMenu();
      }
    }
  };
  
  const moveItemDown = async (index: number) => {
    if (index === megaMenuItems.length - 1) return;
    
    const newItems = [...megaMenuItems];
    const itemToMove = newItems[index];
    const itemBelow = newItems[index + 1];
    
    // Swap positions
    newItems[index + 1] = itemToMove;
    newItems[index] = itemBelow;
    
    // Update positions
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      position: idx
    }));
    
    setMegaMenuItems(updatedItems);
    
    if (isEditMode) {
      // In edit mode, track these position changes
      updatedItems.forEach(item => {
        setPendingChanges(prev => ({
          ...prev,
          [item.id]: {
            ...prev[item.id],
            position: item.position
          }
        }));
      });
      toast.success('Item moved down (pending save)');
    } else {
      try {
        await megaMenuApi.reorderItems(
          updatedItems.map(item => ({ id: item.id, position: item.position }))
        );
        toast.success('Item moved down');
      } catch (error) {
        console.error('Error reordering items:', error);
        toast.error('Failed to update menu order');
        fetchMegaMenu();
      }
    }
  };
  
  // Return children of a collection, including flat children from a nested hierarchy
  const getAllCollectionChildren = (targetCollections: CollectionType[]): CollectionType[] => {
    let allChildren: CollectionType[] = [];
    
    const flattenChildren = (collections: CollectionType[]) => {
      collections.forEach(collection => {
        allChildren.push(collection);
        if (collection.children && collection.children.length > 0) {
          flattenChildren(collection.children);
        }
      });
    };
    
    targetCollections.forEach(collection => {
      if (collection.children && collection.children.length > 0) {
        flattenChildren(collection.children);
      }
    });
    
    return allChildren;
  };
  
  const renderCollectionTree = (collections: CollectionType[], level = 0) => {
    const filteredCollections = searchTerm 
      ? collections.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : collections;
      
    return (
      <ul className={`space-y-1 ${level > 0 ? 'ml-6 border-l border-gray-200 pl-2' : ''}`}>
        {filteredCollections.map((collection) => (
          <li key={collection.id} className="relative">
            <div className={`flex items-center p-2 rounded-md ${collection.is_in_mega_menu ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
              {collection.children && collection.children.length > 0 && (
                <button
                  onClick={(e) => toggleCollectionExpand(collection.id, e)}
                  className="mr-2 p-1 rounded-md hover:bg-gray-200"
                >
                  {expandedCollections[collection.id] ? 
                    <ChevronDownIcon className="h-4 w-4 text-gray-800" /> : 
                    <ChevronRightIcon className="h-4 w-4 text-gray-800" />
                  }
                </button>
              )}
              <span className="flex-1 text-sm font-medium text-gray-800">
                {collection.name} 
                <span className="ml-2 text-xs text-gray-700">
                  ({collection.collection_type || 'custom'})
                </span>
                {collection.products_count !== undefined && (
                  <span className="ml-2 text-xs text-gray-700">
                    {collection.products_count} products
                  </span>
                )}
              </span>
              {collection.is_in_mega_menu ? (
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-xs text-green-600">In Menu</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddToMegaMenu(collection.id)}
                  icon={<PlusIcon className="h-4 w-4" />}
                  className="ml-auto"
                >
                  Add
                </Button>
              )}
            </div>
            
            {collection.children && collection.children.length > 0 && expandedCollections[collection.id] && (
              renderCollectionTree(collection.children, level + 1)
            )}
          </li>
        ))}
      </ul>
    );
  };
  
  // Add this helper function to find a collection by ID in the hierarchical structure
  const findCollectionById = (items: CollectionType[], id: number): CollectionType | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children && item.children.length > 0) {
        const found = findCollectionById(item.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };
  
  // Update the subcollection selector in renderMegaMenuItems to show relevant subcollections
  const renderSubcollectionSelector = (item: MegaMenuItemType) => {
    // Get the collection that corresponds to this menu item
    const parentCollection = findCollectionById(collections, item.collection_id);
    
    // Get all subcollections including any nested ones
    let availableCollections: CollectionType[] = [];
    
    if (parentCollection) {
      // Include direct children
      if (parentCollection.children && parentCollection.children.length > 0) {
        availableCollections = [...parentCollection.children];
      }
      
      // Also include related collections based on type
      if (parentCollection.collection_type === 'category') {
        // For categories, show all relevant brands
        const brands = collections.flatMap(c => 
          c.collection_type === 'category' ? (c.children || []).filter(b => b.collection_type === 'brand') : []
        );
        availableCollections = [...availableCollections, ...brands];
      }
      
      // Filter out collections that are already in the menu
      availableCollections = availableCollections.filter(c => !c.is_in_mega_menu);
    }
    
    // If no specific subcollections are available, fall back to showing all collections
    if (availableCollections.length === 0) {
      availableCollections = collections.filter(c => !c.is_in_mega_menu);
    }
    
    return (
      <div className="mt-2 p-3 border border-dashed border-gray-300 rounded-md bg-gray-50">
        <h4 className="text-sm font-medium mb-2 text-gray-800">Select a collection to add as subcollection:</h4>
        {availableCollections.length === 0 ? (
          <p className="text-sm text-gray-700">No available collections to add.</p>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            {parentCollection && parentCollection.children && parentCollection.children.length > 0 && (
              <div className="mb-2">
                <h5 className="text-xs font-medium text-gray-800 mb-1">Direct subcollections:</h5>
                {parentCollection.children.map(collection => (
                  <div key={collection.id} className="flex items-center justify-between p-1 hover:bg-gray-100 rounded">
                    <span className="text-sm text-gray-800">
                      {collection.name}
                      <span className="ml-2 text-xs text-gray-700">
                        ({collection.collection_type || 'custom'})
                      </span>
                    </span>
                    {!collection.is_in_mega_menu && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          handleAddToMegaMenu(collection.id, item.id);
                          setExpandedCollections(prev => ({
                            ...prev,
                            addingSub: undefined
                          }));
                        }}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mb-2">
              <h5 className="text-xs font-medium text-gray-800 mb-1">Other collections:</h5>
              {availableCollections
                .filter(c => !parentCollection?.children?.some(child => child.id === c.id))
                .map(collection => (
                  <div key={collection.id} className="flex items-center justify-between p-1 hover:bg-gray-100 rounded">
                    <span className="text-sm text-gray-800">
                      {collection.name}
                      <span className="ml-2 text-xs text-gray-700">
                        ({collection.collection_type || 'custom'})
                      </span>
                    </span>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        handleAddToMegaMenu(collection.id, item.id);
                        setExpandedCollections(prev => ({
                          ...prev,
                          addingSub: undefined
                        }));
                      }}
                    >
                      Add
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}
        <div className="mt-2 text-right">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setExpandedCollections(prev => ({
              ...prev,
              addingSub: undefined
            }))}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };
  
  // Update renderMegaMenuItems function to use the new subcollection selector
  const renderMegaMenuItems = (items: MegaMenuItemType[], parentId: number | null = null, depth = 0) => {
    const itemsForParent = items.filter(item => item.parent_menu_item_id === parentId);
    
    if (itemsForParent.length === 0) return null;
    
    return (
      <ul className={`space-y-2 ${depth > 0 ? 'ml-6 border-l border-gray-200 pl-2 mt-2' : ''}`}>
        {itemsForParent.map((item, index) => (
          <li 
            key={item.id} 
            className={`p-3 rounded-md border ${item.is_active ? 'bg-white' : 'bg-gray-50'}`}
          >
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${!item.is_active ? 'text-gray-500' : 'text-gray-800'}`}>
                    {item.collection_name}
                    <span className="ml-2 text-xs text-gray-700">
                      ({item.collection_type || 'custom'})
                    </span>
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleToggleActive(item)}
                    className="p-1 rounded-md hover:bg-gray-100"
                    title={item.is_active ? "Hide from menu" : "Show in menu"}
                  >
                    {item.is_active ? 
                      <EyeIcon className="h-5 w-5 text-blue-500" /> : 
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    }
                  </button>
                  
                  {/* Only show subcollection toggle for categories */}
                  {item.collection_type === 'category' && (
                    <button 
                      onClick={() => handleToggleDisplaySubcollections(item)}
                      className="p-1 rounded-md hover:bg-gray-100"
                      title={item.display_subcollections ? "Hide subcollections" : "Show subcollections"}
                    >
                      {item.display_subcollections ? 
                        <CheckCircleIcon className="h-5 w-5 text-green-500" /> : 
                        <XMarkIcon className="h-5 w-5 text-gray-400" />
                      }
                    </button>
                  )}
                  
                  {isReordering && (
                    <>
                      <button 
                        onClick={() => moveItemUp(index)}
                        className="p-1 rounded-md hover:bg-gray-100"
                        disabled={index === 0}
                      >
                        <ArrowUpIcon className={`h-5 w-5 ${index === 0 ? 'text-gray-300' : 'text-gray-500'}`} />
                      </button>
                      <button 
                        onClick={() => moveItemDown(index)}
                        className="p-1 rounded-md hover:bg-gray-100"
                        disabled={index === itemsForParent.length - 1}
                      >
                        <ArrowDownIcon className={`h-5 w-5 ${index === itemsForParent.length - 1 ? 'text-gray-300' : 'text-gray-500'}`} />
                      </button>
                    </>
                  )}
                  
                  <button 
                    onClick={() => handleRemoveFromMegaMenu(item.id)}
                    className="p-1 rounded-md hover:bg-red-100"
                    title="Remove from menu"
                  >
                    <XMarkIcon className="h-5 w-5 text-red-500" />
                  </button>
                </div>
              </div>
              
              {/* Add subcollection button */}
              <div className="mt-2 flex items-center">
                <div className="text-xs text-gray-700">
                  Position: {item.position} | Level: {item.level || 0}
                </div>
                <div className="ml-auto">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setExpandedCollections(prev => ({
                      ...prev,
                      addingSub: item.id
                    }))}
                  >
                    Add Subcollection
                  </Button>
                </div>
              </div>
              
              {/* Subcollection selector */}
              {expandedCollections.addingSub === item.id && renderSubcollectionSelector(item)}
              
              {/* Render subcollections */}
              {item.children && item.children.length > 0 && (
                renderMegaMenuItems(item.children, item.id, depth + 1)
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };
  
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    // Reorder the items in state first (optimistic update)
    const reorderedItems = Array.from(megaMenuItems);
    const [removed] = reorderedItems.splice(sourceIndex, 1);
    reorderedItems.splice(destinationIndex, 0, removed);
    
    // Update positions
    const itemsWithNewPositions = reorderedItems.map((item, index) => ({
      ...item,
      position: index
    }));
    
    setMegaMenuItems(itemsWithNewPositions);
    
    // Send update to the server
    try {
      setIsReordering(true);
      await megaMenuApi.reorderItems(
        itemsWithNewPositions.map(item => ({ id: item.id, position: item.position }))
      );
      toast.success('Mega menu order updated');
    } catch (error) {
      console.error('Error reordering mega menu:', error);
      toast.error('Failed to update menu order');
      // Revert the state on error
      fetchMegaMenu();
    } finally {
      setIsReordering(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <Card>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mega Menu Management</h1>
      
      {/* Search and Controls */}
      <div className="mb-6">
        <div className="flex space-x-4 justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={isEditMode ? "primary" : "outline"}
              onClick={toggleEditMode}
              icon={isEditMode ? <XMarkIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
            >
              {isEditMode ? "Cancel Editing" : "Batch Edit Mode"}
            </Button>
            
            {isEditMode && (
              <Button
                variant="success"
                onClick={saveAllChanges}
                disabled={isLoading || (Object.keys(pendingChanges).length === 0 && pendingAdditions.length === 0 && pendingRemovals.length === 0)}
              >
                Save All Changes {(Object.keys(pendingChanges).length + pendingAdditions.length + pendingRemovals.length > 0) && `(${Object.keys(pendingChanges).length + pendingAdditions.length + pendingRemovals.length})`}
              </Button>
            )}
          </div>
        </div>
        
        {isEditMode && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Edit Mode Active:</strong> Make changes to the menu structure and visibility. All changes will be applied when you click "Save All Changes".
            </p>
            {(Object.keys(pendingChanges).length > 0 || pendingAdditions.length > 0 || pendingRemovals.length > 0) && (
              <div className="mt-1 text-xs text-blue-600">
                <strong>Pending changes:</strong> {pendingAdditions.length} additions, {pendingRemovals.length} removals, {Object.keys(pendingChanges).length} updates
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Collections */}
        <div className="col-span-1 space-y-4">
          <Card title="Available Collections">
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Select collections to add to the mega menu</h3>
                <p className="text-sm text-gray-500">
                  Click the "Add" button to add a collection to the mega menu.
                </p>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-center">
                    <div className="h-6 w-32 bg-gray-200 rounded mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading collections...</p>
                  </div>
                </div>
              ) : (
                <div>
                  {renderCollectionTree(collections)}
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Mega Menu Structure */}
        <div className="col-span-1 space-y-4">
          <Card title="Mega Menu Structure">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Current Menu Items</h3>
                <div className="flex space-x-2">
                  {!isEditMode && (
                    <Button
                      variant={isReordering ? "primary" : "outline"}
                      onClick={() => setIsReordering(!isReordering)}
                      icon={<ArrowsUpDownIcon className="h-5 w-5" />}
                    >
                      {isReordering ? "Done" : "Reorder"}
                    </Button>
                  )}
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-center">
                    <div className="h-6 w-32 bg-gray-200 rounded mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading menu items...</p>
                  </div>
                </div>
              ) : megaMenuItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No items in mega menu yet. Add some from the collections list.</p>
                </div>
              ) : clientSideRendered ? (
                <div className="space-y-4">
                  {renderMegaMenuItems(megaMenuItems)}
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">Loading...</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 