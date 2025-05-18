import { API_URL } from './config';
import React from 'react';

// Remove the /api suffix from the API_URL to get the base URL for images
const getBaseUrl = () => {
  const url = API_URL || '';
  return url.endsWith('/api') ? url.slice(0, -4) : url;
};

const BASE_URL = getBaseUrl();

// Default placeholder image to use when source is empty or invalid
const DEFAULT_PLACEHOLDER = 'https://placehold.co/600x400?text=No+Image';

export const getImageUrl = (src: string) => {
  // Return a placeholder image instead of empty string
  if (!src) return DEFAULT_PLACEHOLDER;
  
  // If it's already a full URL (starts with http:// or https://) return as is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // If it's a blob URL, return as is
  if (src.startsWith('blob:')) {
    return src;
  }
  
  // If it starts with /uploads, prefix with BASE_URL
  if (src.startsWith('/uploads')) {
    return `${BASE_URL}${src}`;
  }
  
  // For other relative paths, assume they need /uploads prefix
  if (!src.startsWith('/')) {
    return `${BASE_URL}/uploads/${src}`;
  }
  
  // For paths starting with /, just prefix with BASE_URL
  return `${BASE_URL}${src}`;
};

// Safe Image component that handles various image URL formats
export const SafeImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const imageSrc = getImageUrl(src);
  
  return (
    <img
      src={imageSrc}
      alt={alt || ''}
      className={className}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite error loop
        target.src = DEFAULT_PLACEHOLDER;
      }}
    />
  );
}; 