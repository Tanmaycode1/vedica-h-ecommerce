import React, { useState, useEffect, useRef } from "react";
import { NextPage } from "next";
import { Row, Col } from "reactstrap";
import ProductBox from "../Product-Box/productbox";
import Slider from "react-slick";
import { CartContext } from "../../../../helpers/cart/cart.context";
import { WishlistContext } from "../../../../helpers/wishlist/wish.context";
import { CompareContext } from "../../../../helpers/compare/compare.context";
import { Skeleton } from "../../../../common/skeleton";
import apiService from "../../../../helpers/apiService";

// Custom arrow components for the slider
const PrevArrow = (props) => {
  const { className, onClick } = props;
  return (
    <button
      className={`${className} slick-prev`}
      onClick={onClick}
      aria-label="Previous"
      style={{ 
        left: '10px', 
        zIndex: 1,
        background: 'rgba(255, 255, 255, 0.8)',
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
      }}
    >
      <i className="fa fa-chevron-left" style={{ fontSize: '16px', color: '#222' }}></i>
    </button>
  );
};

const NextArrow = (props) => {
  const { className, onClick } = props;
  return (
    <button
      className={`${className} slick-next`}
      onClick={onClick}
      aria-label="Next"
      style={{ 
        right: '10px', 
        zIndex: 1,
        background: 'rgba(255, 255, 255, 0.8)',
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
      }}
    >
      <i className="fa fa-chevron-right" style={{ fontSize: '16px', color: '#222' }}></i>
    </button>
  );
};

// Slider settings
const settings = {
  arrows: true,
  dots: false,
  infinite: true,
  speed: 500,
  autoplay: true,
  autoplaySpeed: 4000,
  pauseOnHover: true,
  slidesToShow: 5,
  slidesToScroll: 1,
  prevArrow: <PrevArrow />,
  nextArrow: <NextArrow />,
  responsive: [
    {
      breakpoint: 1700,
      settings: {
        slidesToShow: 5,
        slidesToScroll: 1,
        infinite: true,
      },
    },
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 1,
        infinite: true,
      },
    },
    {
      breakpoint: 991,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 1,
        infinite: true,
      },
    },
    {
      breakpoint: 767,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
        infinite: true,
        arrows: true,
        dots: false,
      },
    },
    {
      breakpoint: 576,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
        infinite: true,
        arrows: false,
        dots: true,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1.5,
        slidesToScroll: 1,
        infinite: true,
        arrows: false,
        dots: true,
        centerMode: true,
        centerPadding: '20px',
      },
    },
  ],
};

// Interface for product data
interface Product {
  id: number;
  title: string;
  description: string;
  brand: string;
  category: string;
  price: string;
  new: boolean;
  sale: boolean;
  featured: boolean;
  is_new?: boolean;
  is_sale?: boolean;
  is_featured?: boolean;
  discount: string;
  stock: number;
  images: Array<{
    alt: string;
    src: string;
  }>;
  variants: Array<{
    id: number;
    sku: string;
    size: string;
    color: string;
    image_id: string;
    image_url: string;
  }>;
  collection: Array<{
    collectionName: string;
  }>;
}

type FeaturedProductsProps = {
  effect?: any;
  title?: string;
};

const FeaturedProducts: NextPage<FeaturedProductsProps> = ({ effect, title = "Featured Products" }) => {
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
  const sliderRef = useRef<Slider>(null);
  
  // State variables
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Fetch featured products
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call the API with is_featured parameter - increased limit to 20 for smoother infinite carousel
        const response = await apiService.getProducts({ is_featured: "true", limit: 20 });
        console.log("Featured products API response:", response);
        
        if (response && response.products && Array.isArray(response.products)) {
          setProducts(response.products);
        } else if (response && response.products && response.products.items && Array.isArray(response.products.items)) {
          setProducts(response.products.items);
        } else {
          console.log("No featured products found in response:", response);
          setProducts([]);
          setError("No featured products found");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching featured products:", error);
        setLoading(false);
        setProducts([]);
        setError("Failed to load featured products");
      }
    };
    
    fetchFeaturedProducts();
  }, []);

  // Function to play/pause the carousel
  const togglePlay = () => {
    if (isPlaying) {
      sliderRef.current?.slickPause();
    } else {
      sliderRef.current?.slickPlay();
    }
    setIsPlaying(!isPlaying);
  };

  // Transform product images to match component requirements
  const transformProductImages = (product: Product) => {
    if (!product.images || !Array.isArray(product.images)) return [];
    
    return product.images.map(img => ({
      alt: img.alt || product.title,
      src: img.src
    }));
  };

  // If no featured products are found, don't render anything
  if (!loading && products.length === 0 && !error) {
    return null;
  }

  return (
    <section className="section-py-space ratio_asos">
      <div className="custom-container">
        <div className="row">
          <div className="col-12">
            <div className="title-basic">
              <h2 className="title font-fraunces">{title}</h2>
            </div>
          </div>
        </div>
        <div className="b-g-white px-3 py-4">
          <Row>
            <Col className="pe-0">
              <div className="product product-slide-5 product-m no-arrow">
                <div>
                  {loading ? (
                    <Skeleton />
                  ) : error ? (
                    <div className="text-center text-danger">
                      <p>{error}</p>
                    </div>
                  ) : (
                    <Slider ref={sliderRef} {...settings}>
                      {products.map((product, i) => (
                        <div key={i} className="px-1">
                          <ProductBox
                            hoverEffect={effect}
                            id={product.id}
                            title={product.title}
                            newLabel={product.new || product.is_new}
                            sale={product.sale || product.is_sale}
                            featured={product.featured || product.is_featured}
                            price={parseFloat(product.price)}
                            discount={parseFloat(product.discount || "0")}
                            stock={product.stock}
                            images={transformProductImages(product)}
                            item={product}
                            addCart={() => addToCart(product)}
                            addCompare={() => addToCompare(product)}
                            addWish={() => addToWish(product)}
                            layout=""
                            type={[product.category]}
                          />
                        </div>
                      ))}
                    </Slider>
                  )}
                </div>
              </div>
              <div className="carousel-controls d-flex justify-content-center mt-3">
                <button 
                  className="btn btn-sm mx-1"
                  onClick={() => sliderRef.current?.slickPrev()}
                >
                  <i className="fa fa-chevron-left"></i>
                </button>
                <button 
                  className="btn btn-sm mx-1"
                  onClick={togglePlay}
                >
                  <i className={`fa fa-${isPlaying ? 'pause' : 'play'}`}></i>
                </button>
                <button 
                  className="btn btn-sm mx-1"
                  onClick={() => sliderRef.current?.slickNext()}
                >
                  <i className="fa fa-chevron-right"></i>
                </button>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts; 