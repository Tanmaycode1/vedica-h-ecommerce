import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col } from "reactstrap";
import ProductBox from "../Product-Box/productbox";
import Slider from "react-slick";
import { CartContext } from "../../../../helpers/cart/cart.context";
import { WishlistContext } from "../../../../helpers/wishlist/wish.context";
import { CompareContext } from "../../../../helpers/compare/compare.context";
import { Skeleton } from "../../../../common/skeleton";
import apiService from "../../../../helpers/apiService";

// Slider settings
const settings = {
  arrows: true,
  dots: false,
  infinite: false,
  speed: 300,
  slidesToShow: 6,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1700,
      settings: {
        slidesToShow: 5,
        slidesToScroll: 5,
        infinite: true,
      },
    },
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 4,
        infinite: true,
      },
    },
    {
      breakpoint: 991,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 3,
        infinite: true,
      },
    },
    {
      breakpoint: 767,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2,
        arrows: true,
        dots: false,
      },
    },
    {
      breakpoint: 576,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2,
        arrows: false,
        dots: true,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1.5,
        slidesToScroll: 1,
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
  is_new?: boolean;
  is_sale?: boolean;
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
  featured?: boolean;
  is_featured?: boolean;
}

type TabProductProps = {
  effect?: any;
};

const TabProduct: NextPage<TabProductProps> = ({ effect }) => {
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
  
  // State variables
  const [activeTab, setActiveTab] = useState("new");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Define the tabs for products
  const tabs = [
    { id: "new", label: "New Arrivals" },
    { id: "sale", label: "On Sale" }
  ];

  // Fetch products based on active tab
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        let queryParams = {};
        
        // Set query parameters based on active tab - using correct REST API filters
        if (activeTab === "sale") {
          queryParams = { is_sale: "true", limit: 12 };
        } else if (activeTab === "new") {
          queryParams = { is_new: "true", limit: 12 };
        }
        
        console.log("Fetching products with params:", queryParams);
        
        // Call the API
        const response = await apiService.getProducts(queryParams);
        console.log("API response:", response);
        
        if (response && response.products && Array.isArray(response.products)) {
          setProducts(response.products);
          console.log("Setting products array:", response.products);
        } else if (response && response.products && response.products.items && Array.isArray(response.products.items)) {
          setProducts(response.products.items);
          console.log("Setting products.items array:", response.products.items);
        } else {
          console.log("No products found in response:", response);
          setProducts([]);
          setError("No products found");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
        setProducts([]);
        setError("Failed to load products");
      }
    };
    
    fetchProducts();
  }, [activeTab]);

  // Transform product images to match component requirements
  const transformProductImages = (product: Product) => {
    if (!product.images || !Array.isArray(product.images)) return [];
    
    return product.images.map(img => ({
      alt: img.alt || product.title,
      src: img.src
    }));
  };

  return (
    <>
      <section className="section-pt-space">
        <div className="tab-product-main">
          <div className="tab-prodcut-contain">
            <Nav tabs>
              {tabs.map((tab, i) => (
                <NavItem key={i}>
                  <NavLink 
                    className={activeTab === tab.id ? "active" : ""} 
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </NavLink>
                </NavItem>
              ))}
            </Nav>
          </div>
        </div>
      </section>
      <section className="section-py-space ratio_asos product">
        <div className="custom-container">
          <Row>
            <Col className="pe-0">
              <TabContent activeTab={activeTab}>
                <TabPane tabId={activeTab}>
                  <div className="product product-slide-6 product-m no-arrow">
                    <div>
                      {loading ? (
                        <Skeleton />
                      ) : error ? (
                        <div className="text-center text-danger">
                          <p>{error}</p>
                        </div>
                      ) : products.length === 0 ? (
                        <div className="text-center">
                          <p>No products found</p>
                        </div>
                      ) : (
                        <Slider {...settings}>
                          {products.map((product, i) => (
                            <div key={i}>
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
                </TabPane>
              </TabContent>
            </Col>
          </Row>
        </div>
      </section>
    </>
  );
};

export default TabProduct;
