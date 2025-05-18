import React, { useState, useEffect } from "react";
import { CartContext } from "../../../../helpers/cart/cart.context";
import { WishlistContext } from "../../../../helpers/wishlist/wish.context";
import { CompareContext } from "../../../../helpers/compare/compare.context";
import ProductBox from "../Product-Box/productbox";
import Slider from "react-slick";
import { Skeleton } from "../../../../common/skeleton";
import apiService from "../../../../helpers/apiService";

// NOTE: This component is no longer used on the landing page.
// It has been replaced by the TabProduct component which uses the REST API.

var settings = {
  arrows: true,
  dots: false,
  infinite: true,
  speed: 300,
  slidesToShow: 6,
  slidesToScroll: 1,
  adaptiveHeight: true,
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
      breakpoint: 576,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2,
      },
    },
  ],
};

type ProductBox1Props = {
  hoverEffect: any;
};

const ProductBox1: React.FC<ProductBox1Props> = ({ hoverEffect }) => {
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToCompare } = React.useContext(CompareContext);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  // Fetch special products using REST API
  useEffect(() => {
    const fetchSpecialProducts = async () => {
      try {
        setLoading(true);
        // This would use a filter specific to special products if they existed
        // Currently just fetch some products as placeholder
        const response = await apiService.getProducts({ limit: 12 });
        
        if (response && response.products && response.products.items) {
          setProducts(response.products.items);
        } else {
          setProducts([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching special products:", error);
        setLoading(false);
        setProducts([]);
      }
    };
    
    fetchSpecialProducts();
  }, []);

  return (
    <div className="product product-slide-6 product-m no-arrow ratio_asos">
      <div>
        {loading ? (
          <Skeleton />
        ) : (
          <Slider {...settings}>
            {products.map((item, i) => (
              <div key={i}>
                <ProductBox 
                  hoverEffect={hoverEffect} 
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
        )}
      </div>
    </div>
  );
};

export default ProductBox1;
