import React from "react";
import { Media } from "reactstrap";

interface ImageSwatchProps {
  item: any;
  changeColorVar: Function;
}

const ImageSwatch: React.FC<ImageSwatchProps> = ({ item, changeColorVar }) => {
  // Function to format image path correctly
  const formatImagePath = (src) => {
    if (!src) return "/images/placeholder.jpg";
    
    // Check if it's already a complete URL
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    // Backend URL
    const BACKEND_URL = 'http://localhost:3002';
    
    // Check if it's a path from backend without leading slash
    if (src.startsWith('uploads/product-images/')) {
      return `${BACKEND_URL}/${src}`;
    }
    
    // Check if it's a product images path with leading slash
    if (src.startsWith('/uploads/product-images/') || src.startsWith('/product-images/')) {
      // Remove leading slash if needed
      const path = src.startsWith('/') ? src.substring(1) : src;
      return `${BACKEND_URL}/${path}`;
    }
    
    // If it's a regular image from /images/ directory
    return `/images/${src}`;
  };

  return (
    <ul className="image-swatch color-variant">
      {item &&
        item.images.map((vari: any, i: any) => {
          return (
            <li
              key={i}
              onClick={() => {
                changeColorVar(i);
              }}>
              <a>
                <Media className="img-fluid" src={formatImagePath(vari.src)} />
              </a>
            </li>
          );
        })}
    </ul>
  );
};

export default ImageSwatch;
