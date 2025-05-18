'use client';

import { useParams } from 'next/navigation';
import ProductForm from '@/components/products/ProductForm';

export default function EditProductPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update an existing product in your inventory.
        </p>
      </div>
      
      <ProductForm productId={productId} />
    </div>
  );
} 