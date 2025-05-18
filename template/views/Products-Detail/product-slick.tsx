import React, { useState } from "react";
import { Col, Row, Media } from "reactstrap";
import Slider from "react-slick";
import ProductDetail from "./product-detail";

interface ProductSlickProps {
  item: any;
  bundle: boolean;
  swatch: boolean;
}

const ProductSlick: React.FC<ProductSlickProps> = ({ item, bundle, swatch }) => {
  const [state, setState] = useState({ nav1: null, nav2: null });

  const slider1 = React.useRef<Slider>();
  const slider2 = React.useRef<Slider>();

  React.useEffect(() => {
    setState({
      nav1: slider1.current,
      nav2: slider2.current,
    });
  }, [item]);
  
  const { nav1, nav2 } = state;
  
  const changeColorVar = (img_id) => {
    slider1.current.slickGoTo(img_id);
  };

  // Function to format image path correctly
  const getImagePath = (img) => {
    if (!img || !img.src) return "/images/placeholder.png"; // Fallback image
    
    // Check if it's already a complete URL
    if (img.src.startsWith('http://') || img.src.startsWith('https://')) {
      return img.src;
    }
    
    // Backend URL
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3002';
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4); // Remove the /api suffix for image URLs
    }
    
    // Check if it's an upload path from the backend without leading slash
    if (img.src.startsWith('uploads/product-images/')) {
      return `${baseUrl}/${img.src}`;
    }
    
    // Check if it's a product images path with leading slash
    if (img.src.startsWith('/uploads/product-images/') || img.src.startsWith('/product-images/')) {
      // Remove leading slash if needed
      const path = img.src.startsWith('/') ? img.src.substring(1) : img.src;
      return `${baseUrl}/${path}`;
    }
    
    // Default case for other images
    return img.src;
  };

  return (
    <>
      <Col lg="5">
        <Slider className="product-slick" asNavFor={nav2} ref={(slider) => (slider1.current = slider)}>
          {item && item.images && item.images.length > 0 ? (
            item.images.map((img: any, i: any) => (
              <div key={i}>
                <Media src={getImagePath(img)} alt={img.alt || item.title} className="img-fluid image_zoom_cls-0" />
              </div>
            ))
          ) : (
            <div>
              <Media src="/images/placeholder.png" alt="Product image" className="img-fluid image_zoom_cls-0" />
            </div>
          )}
        </Slider>
        <Row>
          <Col>
            <Slider 
              className="slider-nav" 
              asNavFor={nav1} 
              ref={(slider) => (slider2.current = slider)} 
              slidesToShow={3} 
              swipeToSlide={true} 
              focusOnSelect={true} 
              arrows={false} 
              adaptiveHeight={true}
            >
              {item && item.images && item.images.length > 0 ? (
                item.images.map((img: any, i: any) => (
                  <div key={i}>
                    <Media src={getImagePath(img)} alt={img.alt || item.title} className="img-fluid image_zoom_cls-0" />
                  </div>
                ))
              ) : (
                <div>
                  <Media src="/images/placeholder.png" alt="Product image" className="img-fluid image_zoom_cls-0" />
                </div>
              )}
            </Slider>
          </Col>
        </Row>
      </Col>
      <Col lg="7" className="rtl-text">
        <ProductDetail item={item} changeColorVar={changeColorVar} bundle={bundle} swatch={swatch} />
      </Col>
    </>
  );
};

export default ProductSlick;
