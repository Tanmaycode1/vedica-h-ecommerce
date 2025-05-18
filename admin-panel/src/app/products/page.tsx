'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { productsApi } from '@/lib/api';
import SafeImage from '@/components/ui/SafeImage';

type ProductType = {
  id: number;
  title: string;
  price: number;
  category?: string;
  brand?: string;
  is_new?: boolean;
  is_sale?: boolean;
  discount?: number;
  stock?: number;
  type?: string;
  images?: Array<{
    id: number;
    src: string;
    alt?: string;
  }>;
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Fetch products and categories
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        // Use the dedicated method for fetching all products
        const data = await productsApi.getAllWithoutPagination();
        
        // Extract products from the response
        let productsList: ProductType[] = [];
        if (data && data.products && data.products.items) {
          productsList = data.products.items;
        } else if (data && Array.isArray(data)) {
          productsList = data;
        } else if (data && Array.isArray(data.products)) {
          productsList = data.products;
        }
        
        console.log('Fetched products count:', productsList.length);
        
        // Ensure all products have valid price as number
        productsList = productsList.map(product => ({
          ...product,
          price: typeof product.price === 'string' ? parseFloat(product.price) : product.price || 0
        }));
        
        setProducts(productsList);
        setFilteredProducts(productsList);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(productsList.map(product => product.type || product.category).filter(Boolean))
        ) as string[];
        
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Apply filters and search
  useEffect(() => {
    let result = [...products];
    
    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.title.toLowerCase().includes(search) || 
        (product.brand && product.brand.toLowerCase().includes(search))
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(product => 
        (product.type && product.type === categoryFilter) || 
        (product.category && product.category === categoryFilter)
      );
    }
    
    // Apply price range
    if (priceRange.min) {
      result = result.filter(product => product.price >= Number(priceRange.min));
    }
    
    if (priceRange.max) {
      result = result.filter(product => product.price <= Number(priceRange.max));
    }
    
    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        const fieldA = a[sortField as keyof ProductType];
        const fieldB = b[sortField as keyof ProductType];
        
        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          return sortDirection === 'asc' 
            ? fieldA.localeCompare(fieldB) 
            : fieldB.localeCompare(fieldA);
        }
        
        if (typeof fieldA === 'number' && typeof fieldB === 'number') {
          return sortDirection === 'asc' ? fieldA - fieldB : fieldB - fieldA;
        }
        
        return 0;
      });
    }
    
    setFilteredProducts(result);
  }, [products, searchTerm, categoryFilter, priceRange, sortField, sortDirection]);
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsApi.delete(id);
        setProducts(products.filter(product => product.id !== id));
        toast.success('Product deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setPriceRange({ min: '', max: '' });
    setSortField('');
    setSortDirection('asc');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Button
          onClick={() => router.push('/products/new')}
          icon={<PlusIcon className="h-5 w-5" />}
        >
          Add Product
        </Button>
      </div>
      
      <Card>
        {/* Search and Filter */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setFilterOpen(!filterOpen)}
              icon={<FunnelIcon className="h-5 w-5" />}
            >
              Filter
            </Button>
            
            <Button
              variant="outline"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
          
          {/* Filter Options */}
          {filterOpen && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price
                </label>
                <input
                  type="number"
                  id="minPrice"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  min="0"
                />
              </div>
              
              <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <input
                  type="number"
                  id="maxPrice"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  min="0"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center" 
                    onClick={() => handleSort('id')}
                  >
                    ID
                    {sortField === 'id' && (
                      sortDirection === 'asc' 
                        ? <ChevronUpIcon className="ml-1 h-4 w-4" /> 
                        : <ChevronDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center" 
                    onClick={() => handleSort('title')}
                  >
                    Product
                    {sortField === 'title' && (
                      sortDirection === 'asc' 
                        ? <ChevronUpIcon className="ml-1 h-4 w-4" /> 
                        : <ChevronDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center" 
                    onClick={() => handleSort('price')}
                  >
                    Price
                    {sortField === 'price' && (
                      sortDirection === 'asc' 
                        ? <ChevronUpIcon className="ml-1 h-4 w-4" /> 
                        : <ChevronDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{product.id}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <SafeImage
                              src={product.images[0].src}
                              alt={product.images[0].alt || product.title}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
                              No img
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.brand}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
                      {product.is_sale && product.discount && (
                        <span className="ml-2 line-through text-gray-400">
                          ₹{typeof product.price === 'number' ? (product.price / (1 - product.discount / 100)).toFixed(2) : '0.00'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category || product.type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.is_new && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 mr-1">
                          New
                        </span>
                      )}
                      {product.is_sale && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Sale
                        </span>
                      )}
                      {!product.is_new && !product.is_sale && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.stock !== undefined && (
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${product.stock > 0 
                              ? product.stock > 10 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {product.stock > 0 ? product.stock : 'Out of Stock'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => router.push(`/products/${product.id}`)}
                          icon={<PencilIcon className="h-4 w-4" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => handleDeleteProduct(product.id)}
                          icon={<TrashIcon className="h-4 w-4" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 