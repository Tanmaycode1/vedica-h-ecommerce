import React from 'react';
import { getImageUrl } from '@/utils/imageHelpers';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export default function SafeImage({ src, alt, className, onError }: SafeImageProps) {
  const imageSrc = getImageUrl(src);
  
  return (
    <img
      src={imageSrc}
      alt={alt || ''}
      className={className}
      onError={onError || ((e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://placehold.co/600x400?text=Image+Not+Found";
      })}
    />
  );
} 