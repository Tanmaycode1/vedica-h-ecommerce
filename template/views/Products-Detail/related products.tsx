import React, { useEffect, useState, useContext, useRef } from "react";
import { NextPage } from "next";
import Slider from "react-slick";
import { Row, Col } from "reactstrap";
import ProductBox from "../layouts/widgets/Product-Box/productbox";
import { Skeleton } from "../../common/skeleton";
import { CartContext } from "../../helpers/cart/cart.context";
import { WishlistContext } from "../../helpers/wishlist/wish.context";
import { CompareContext } from "../../helpers/compare/compare.context";
import apiService from "../../helpers/apiService";

// Custom CSS for the slider arrows
const sliderArrowStyles = {
  arrowBase: {
    display: "block",
    width: "40px",
    height: "40px",
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: "50%",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.15)",
    zIndex: 1,
    cursor: "pointer",
    textAlign: "center",
    lineHeight: "40px",
    fontSize: "20px",
    color: "#333",
    transition: "all 0.3s ease"
  },
  hoverState: {
    backgroundColor: "#fff",
    boxShadow: "0 3px 8px rgba(0, 0, 0, 0.2)",
    color: "#000"
  },
  prevArrow: {
    left: "-20px",
  },
  nextArrow: {
    right: "-20px",
  }
};

// Custom next arrow component for the slider
const NextArrow = (props) => {
  const { className, style, onClick } = props;
  const [isHover, setIsHover] = useState(false);
  
  return (
    <div
      className={`${className} slick-next`}
      style={{ 
        ...sliderArrowStyles.arrowBase, 
        ...sliderArrowStyles.nextArrow,
        ...(isHover ? sliderArrowStyles.hoverState : {}),
        ...style 
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <i className="fa fa-chevron-right"></i>
    </div>
  );
};

// Custom previous arrow component for the slider
const PrevArrow = (props) => {
  const { className, style, onClick } = props;
  const [isHover, setIsHover] = useState(false);
  
  return (
    <div
      className={`${className} slick-prev`}
      style={{ 
        ...sliderArrowStyles.arrowBase, 
        ...sliderArrowStyles.prevArrow,
        ...(isHover ? sliderArrowStyles.hoverState : {}),
        ...style 
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <i className="fa fa-chevron-left"></i>
    </div>
  );
};

const sliderSettings = {
  arrows: true,
  dots: false,
  infinite: true,
  speed: 300,
  slidesToShow: 6,
  slidesToScroll: 1,
  nextArrow: <NextArrow />,
  prevArrow: <PrevArrow />,
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
      breakpoint: 576,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      },
    },
  ],
};

interface RelatedProductsProps {
  currentProduct?: any;
}

const RelatedProducts: NextPage<RelatedProductsProps> = ({ currentProduct }) => {
  const { addToWish } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const { addToCompare } = useContext(CompareContext);
  
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [error, setError] = useState(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const isMounted = useRef(true);

  // Helper function to filter out current product from results
  const removeCurrentProduct = (products) => {
    if (!currentProduct || !products) return products;
    return products.filter(product => product.id !== currentProduct.id);
  };

  // Use a stable version of currentProduct ID to prevent excessive re-renders
  const currentProductId = currentProduct?.id;

  // Reset loading state when product changes
  useEffect(() => {
    if (currentProductId) {
      setHasAttemptedLoad(false);
    }
  }, [currentProductId]);

  useEffect(() => {
    // Set mounted ref
    isMounted.current = true;
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted.current = false;
    };
  }, []); // Empty dependency array = only run on mount/unmount

  useEffect(() => {
    // Skip if we've already loaded products
    if (hasAttemptedLoad) {
      return;
    }

    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If no current product, just show new products
        if (!currentProduct) {
          const response = await apiService.getProducts({
            limit: 8,
            is_new: "true"
          });
          
          if (isMounted.current && response?.products?.items) {
            setRelatedProducts(response.products.items);
            setHasAttemptedLoad(true);
            setLoading(false);
          }
          return;
        }

        // APPROACH 1: Get products from the same brand
        if (currentProduct.brand) {
          try {
            const response = await apiService.getProducts({
              brand: currentProduct.brand,
              limit: 8
            });
            
            if (isMounted.current && response?.products?.items) {
              const filtered = removeCurrentProduct(response.products.items);
              if (filtered.length > 0) {
                setRelatedProducts(filtered);
                setHasAttemptedLoad(true);
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            // Silently continue to next approach
          }
        }
        
        // APPROACH 2: Try products on sale if current product is on sale
        if (currentProduct.sale) {
          try {
            const response = await apiService.getProducts({
              is_sale: "true",
              limit: 8
            });
            
            if (isMounted.current && response?.products?.items) {
              const filtered = removeCurrentProduct(response.products.items);
              if (filtered.length > 0) {
                setRelatedProducts(filtered);
                setHasAttemptedLoad(true);
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            // Silently continue to next approach
          }
        }
        
        // APPROACH 3: Try new products if current product is new
        if (currentProduct.new) {
          try {
            const response = await apiService.getProducts({
              is_new: "true",
              limit: 8
            });
            
            if (isMounted.current && response?.products?.items) {
              const filtered = removeCurrentProduct(response.products.items);
              if (filtered.length > 0) {
                setRelatedProducts(filtered);
                setHasAttemptedLoad(true);
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            // Silently continue to next approach
          }
        }
        
        // APPROACH 4: Final fallback, get any products
        try {
          const response = await apiService.getProducts({
            limit: 8
          });
          
          if (isMounted.current && response?.products?.items) {
            const filtered = removeCurrentProduct(response.products.items);
            setRelatedProducts(filtered);
          }
        } catch (error) {
          if (isMounted.current) {
            setError("Failed to load related products");
          }
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err.message);
        }
      } finally {
        if (isMounted.current) {
          setHasAttemptedLoad(true);
          setLoading(false);
        }
      }
    };

    fetchRelatedProducts();
  }, [currentProductId, hasAttemptedLoad]);

  // If we have no related products after loading, don't show the section
  if (!loading && (!relatedProducts || relatedProducts.length === 0)) {
    return null;
  }

  return (
    <section className="section-big-py-space ratio_asos bg-light">
      <div className="custom-container">
        <Row>
          <Col className="product-related">
            <h2>related products</h2>
          </Col>
        </Row>

        {loading ? (
          <Skeleton />
        ) : error ? (
          <Row>
            <Col>
              <p className="text-center">Error loading related products</p>
            </Col>
          </Row>
        ) : (
          <Row>
            <Col className="product">
              <Slider {...sliderSettings}>
                {relatedProducts.map((item, i) => (
                  <div key={i}>
                    <ProductBox 
                      newLabel={item.new} 
                      {...item} 
                      item={item} 
                      addCart={() => addToCart(item)} 
                      addCompare={() => addToCompare(item)} 
                      addWish={() => addToWish(item)} 
                    />
                  </div>
                ))}
              </Slider>
            </Col>
          </Row>
        )}
      </div>
    </section>
  );
};

export default RelatedProducts;
