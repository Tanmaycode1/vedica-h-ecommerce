import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import Slider from "react-slick";
import { Container } from "reactstrap";
import Link from "next/link";
import apiService from "../../../helpers/apiService";

// Enhanced slider settings with custom arrows
const settings = {
  dots: true,
  infinite: true,
  speed: 800,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 6000,
  arrows: true,
  fade: true,
  cssEase: "ease-in-out",
  responsive: [
    {
      breakpoint: 768,
      settings: {
        arrows: false,
      },
    },
  ],
};

const SliderBanner: NextPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    // Fetch featured products from API
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        // Get all featured products
        const params = { is_featured: true, limit: 20 };
        const response = await apiService.getProducts(params);
        
        if (response && response.products && response.products.length > 0) {
          // Randomize the products array
          const shuffled = [...response.products].sort(() => 0.5 - Math.random());
          // Take first 3 products
          const randomFeatured = shuffled.slice(0, 3);
          setFeaturedProducts(randomFeatured);
        }
      } catch (error) {
        console.error("Error fetching featured products:", error);
        // Use dummy data as fallback
        setFeaturedProducts([
          {
            id: 1,
            title: "Premium Ayurvedic Facial Cream",
            price: 799.99,
            images: [{ src: "/images/product/1.jpg" }],
            description: "Rejuvenating cream made with ancient herbal ingredients"
          },
          {
            id: 2,
            title: "Handcrafted Brass Pooja Thali",
            price: 1299.99,
            images: [{ src: "/images/product/2.jpg" }],
            description: "Traditional design with intricate patterns"
          },
          {
            id: 3,
            title: "Organic Sandalwood Incense",
            price: 149.99,
            images: [{ src: "/images/product/3.jpg" }],
            description: "Pure fragrance for meditation and rituals"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Format image URL
  const formatImageUrl = (src) => {
    if (!src) return "/images/product-placeholder.jpg";
    
    if (src.startsWith('http')) return src;
    
    // Handle backend URLs
    const BACKEND_URL = 'http://localhost:3002';
    
    if (src.startsWith('/uploads/') || src.startsWith('uploads/')) {
      const path = src.startsWith('/') ? src.substring(1) : src;
      return `${BACKEND_URL}/${path}`;
    }
    
    return src;
  };

  // Format price with rupee symbol
  const formatPrice = (price) => {
    if (typeof price !== 'number') {
      price = Number(price) || 0;
    }
    return `₹${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <section className="theme-slider product-slider" style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="loading-spinner"></div>
      </section>
    );
  }

  return (
    <section className="theme-slider product-slider">
      <Container fluid={true} className="p-0">
        <Slider {...settings}>
          {featuredProducts.map((product, index) => (
            <div key={index} className="slider-slide">
              <Link href={`/product-details/${product.id}`}>
                <div className="product-banner">
                  <div className="slide-bg" style={{ 
                    backgroundImage: `url(${formatImageUrl(product.images?.[0]?.src)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: isMobile ? '400px' : '500px',
                    position: 'relative'
                  }}>
                    <div className="slide-overlay"></div>
                    
                    {isMobile ? (
                      // Mobile view - show only product name at the bottom
                      <div className="mobile-product-info">
                        <h3>{product.title}</h3>
                        <span className="mobile-view-details">View Details</span>
                      </div>
                    ) : (
                      // Desktop view - show full product details
                      <div className="product-content">
                        <div className="product-img-wrap">
                          <img 
                            src={formatImageUrl(product.images?.[0]?.src)} 
                            alt={product.title}
                            className="product-img"
                          />
                        </div>
                        
                        <div className="product-info">
                          <div className="product-info-inner">
                            <h2>{product.title}</h2>
                            <div className="divider"></div>
                            <p>{product.description || "Experience the finest quality and traditional craftsmanship"}</p>
                            <div className="price">{formatPrice(product.price)}</div>
                            <button className="btn-view">View Details</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </Slider>
      </Container>
      
      <style jsx>{`
        .product-slider {
          margin-bottom: 30px;
        }
        
        .loading-spinner {
          border: 4px solid rgba(255, 153, 51, 0.2);
          border-radius: 50%;
          border-top: 4px solid #FF9933;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .slide-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.4);
        }
        
        /* Mobile view styles */
        .mobile-product-info {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
          padding: 20px;
          box-sizing: border-box;
          text-align: center;
        }
        
        .mobile-product-info h3 {
          color: white;
          font-size: 20px;
          margin: 0 0 10px 0;
          font-weight: 600;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
        }
        
        .mobile-view-details {
          display: inline-block;
          color: #FF9933;
          font-size: 14px;
          font-weight: 500;
          background-color: rgba(255, 255, 255, 0.2);
          padding: 5px 15px;
          border-radius: 20px;
          margin-top: 5px;
        }
        
        /* Desktop view styles */
        .product-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 1100px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          z-index: 2;
        }
        
        .product-img-wrap {
          width: 45%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .product-img {
          max-width: 100%;
          max-height: 350px;
          object-fit: contain;
        }
        
        .product-info {
          width: 48%;
          background-color: rgba(255, 255, 255, 0.95);
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }
        
        .product-info-inner {
          position: relative;
        }
        
        .product-info h2 {
          font-size: 28px;
          color: #9A3324;
          margin-bottom: 15px;
          font-weight: 600;
        }
        
        .divider {
          height: 2px;
          background: linear-gradient(90deg, #FF9933, transparent);
          margin-bottom: 15px;
        }
        
        .product-info p {
          color: #555;
          margin-bottom: 20px;
          font-size: 16px;
          line-height: 1.5;
        }
        
        .price {
          font-size: 32px;
          color: #FF9933;
          font-weight: 700;
          margin-bottom: 20px;
        }
        
        .btn-view {
          background: linear-gradient(135deg, #9A3324, #FF9933);
          color: white;
          border: none;
          padding: 10px 25px;
          border-radius: 5px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-view:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 153, 51, 0.3);
        }
        
        @media (max-width: 991px) {
          .product-content {
            flex-direction: column;
          }
          .product-img-wrap, .product-info {
            width: 90%;
            margin-bottom: 20px;
          }
          .product-img {
            max-height: 250px;
          }
          .product-info h2 {
            font-size: 24px;
          }
        }
        
        :global(.slick-dots) {
          bottom: 20px;
        }
        :global(.slick-dots li button:before) {
          color: #FF9933;
          font-size: 12px;
          opacity: 0.5;
        }
        :global(.slick-dots li.slick-active button:before) {
          color: #fff;
          opacity: 1;
        }
        :global(.slick-prev), :global(.slick-next) {
          z-index: 1;
          width: 40px;
          height: 40px;
        }
        :global(.slick-prev) {
          left: 20px;
        }
        :global(.slick-next) {
          right: 20px;
        }
        :global(.slick-prev:before), :global(.slick-next:before) {
          font-size: 40px;
          opacity: 0.8;
        }
        
        @media (max-width: 767px) {
          :global(.slick-dots) {
            bottom: 70px;
          }
          :global(.slick-dots li button:before) {
            color: white;
          }
        }
      `}</style>
    </section>
  );
};

export default SliderBanner;
