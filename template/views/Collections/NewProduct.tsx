import React, { useEffect, useState, useRef } from "react";
import { NextPage } from "next";
import Slider from "react-slick";
import { Media } from "reactstrap";
import Link from "next/link";
import apiService from "../../helpers/apiService";

// Slider settings
const bestSellerSetting = {
  dots: false,
  infinite: false,
  speed: 300,
  slidesToShow: 1,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: true,
      },
    },
  ],
};

interface NewProductProps {
  currentProduct?: any;
}

const NewProduct: NextPage<NewProductProps> = ({ currentProduct }) => {
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for mobile view
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper to format price
  const formatPrice = (price) => {
    return (<><span className="rupee-symbol">₹</span>{parseFloat(price).toFixed(2)}</>);
  };

  // Group products into chunks of 3 for slider
  const groupProducts = (products, size = 3) => {
    const groups = [];
    
    for (let i = 0; i < products.length; i += size) {
      groups.push(products.slice(i, i + size));
    }
    
    return groups;
  };

  useEffect(() => {
    // Set mounted ref
    isMounted.current = true;
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchNewProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get collection from current product if available
        let collection = null;
        if (currentProduct?.collections && currentProduct.collections.length > 0) {
          collection = currentProduct.collections[0]?.name;
        } else if (currentProduct?.collection && currentProduct.collection.length > 0) {
          collection = currentProduct.collection[0]?.collectionName;
        }
        
        // Prepare parameters for the API call
        const params: any = {
          is_new: true,
          limit: 6,
          _t: Date.now() // Add timestamp to prevent caching
        };
        
        // Add collection filter if we have one
        if (collection) {
          params.collection = collection;
        }
        
        console.log('Fetching new products with params:', params);
        
        // Call the API with a timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        const response: any = await Promise.race([
          apiService.getProducts(params),
          timeoutPromise
        ]);
        
        console.log('New products API response:', response);
        
        if (isMounted.current) {
          // Extract products from the response with fallback
          const productsFromAPI = response.products || [];
          
          // Filter out the current product if it exists
          const filteredProducts = currentProduct?.id ? 
            productsFromAPI.filter(p => p.id !== currentProduct.id) : 
            productsFromAPI;
          
          // Log what we're setting in state
          console.log(`Setting ${filteredProducts.length} new products`);
          
          setNewProducts(filteredProducts);
        }
      } catch (err) {
        if (isMounted.current) {
          console.error("Error fetching new products:", err);
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    fetchNewProducts();
  }, [currentProduct]);

  // Show loading skeleton
  if (loading) {
    return (
      <div className="theme-card creative-card creative-inner">
        <h5 className="title-border">new product</h5>
        <div className="placeholder-loading">
          <div className="placeholder-line"></div>
          <div className="placeholder-line"></div>
          <div className="placeholder-line"></div>
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="theme-card creative-card creative-inner">
        <h5 className="title-border">new product</h5>
        <div className="text-center py-3">
          <p>Unable to load new products: {error}</p>
        </div>
      </div>
    );
  }

  // No products found
  if (newProducts.length === 0) {
    return (
      <div className="theme-card creative-card creative-inner">
        <h5 className="title-border">new product</h5>
        <div className="text-center py-3">
          <p>No new products found</p>
        </div>
      </div>
    );
  }

  // Group products into chunks of 3 for slider
  const productGroups = groupProducts(newProducts);

  return (
    <div className="theme-card creative-card creative-inner">
      <h5 className="title-border">new product</h5>
      <div className="offer-slider slide-1">
        <Slider {...bestSellerSetting}>
          {productGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.map((product, productIndex) => (
                <div className={`media ${isMobile ? 'mobile-product-card' : ''}`} key={`${groupIndex}-${productIndex}`}>
                  <Link href={`/product-details/${product.id}`} legacyBehavior>
                    <a className="product-thumbnail">
                      <Media 
                        className="img-fluid" 
                        src={product.images && product.images[0]?.src || "/images/product-sidebar/001.jpg"} 
                        alt={product.title || "Product"}
                      />
                    </a>
                  </Link>
                  <div className="media-body align-self-center">
                    <div className="rating">
                      <i className="fa fa-star"></i>
                      <i className="fa fa-star"></i>
                      <i className="fa fa-star"></i>
                      <i className="fa fa-star"></i>
                      <i className="fa fa-star"></i>
                    </div>
                    <Link href={`/product-details/${product.id}`} legacyBehavior>
                      <a>
                        <h6>{product.title}</h6>
                      </a>
                    </Link>
                    <h4 className="product-price">{formatPrice(product.price)}</h4>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Slider>
      </div>
      
      <style jsx>{`
        .rupee-symbol {
          font-family: Arial, sans-serif;
          margin-right: 2px;
        }
        
        .product-thumbnail {
          display: block;
          width: 110px;
          min-width: 110px;
          overflow: hidden;
        }
        
        .media {
          display: flex;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid #ededed;
        }
        
        .media:last-child {
          border-bottom: none;
        }
        
        .media-body {
          padding-left: 15px;
        }
        
        .media-body h6 {
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .product-price {
          color: #FF9933;
          font-weight: 600;
          margin: 0;
          font-size: 16px;
        }
        
        .rating {
          margin-bottom: 8px;
        }
        
        .fa-star {
          color: #ffcc33;
          font-size: 12px;
        }
        
        /* Mobile styles */
        @media (max-width: 767px) {
          .mobile-product-card {
            flex-direction: row;
            padding: 10px 0;
          }
          
          .product-thumbnail {
            width: 80px;
            min-width: 80px;
            height: 80px;
          }
          
          .media-body {
            width: calc(100% - 80px);
          }
          
          .media-body h6 {
            font-size: 13px;
            -webkit-line-clamp: 1;
            margin-bottom: 5px;
          }
          
          .product-price {
            font-size: 14px;
          }
          
          .rating {
            margin-bottom: 5px;
          }
          
          .fa-star {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default NewProduct;
