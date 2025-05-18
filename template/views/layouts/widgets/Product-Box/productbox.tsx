import React, { Fragment, useContext, useState } from "react";
import { Media, Modal, ModalBody } from "reactstrap";
import { CurrencyContext } from "../../../../helpers/currency/CurrencyContext";
import { useRouter } from "next/router";
import { NextPage } from "next";
import Slider from "react-slick";
import Link from "next/link";
import Img from "utils/BgImgRatio";

interface productType {
  id: Number;
  title: string;
  newLabel: boolean;
  sale: Boolean;
  featured?: Boolean;
  price: number;
  discount: number;
  stock: number;
  images: any;
  layout: string;
  addCart: Function;
  addWish: Function;
  addCompare: Function;
  hoverEffect: any;
  item: any;
  type: Array<string>;
}

const ProductBox: NextPage<productType> = ({ layout, id, item, title, newLabel, sale, featured, price, discount, stock, images, addCart, addCompare, addWish, hoverEffect }) => {
  const currencyContext = useContext(CurrencyContext);
  const { selectedCurr } = currencyContext;
  const [imgsrc, setImgsrc] = useState("");
  const imgChange = (src) => {
    setImgsrc(formatImagePath(src));
  };
  const slider2 = React.useRef<Slider>();

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
    
    return src;
  };

  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [stockState, setStockState] = useState("InStock");
  const uniqueSize = [];
  const uniqueColor = [];
  const titleProps = title.split(" ").join("");
  const changeColorVar = (img_id) => {
    slider2.current.slickGoTo(img_id);
  };

  const minusQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      setStockState("InStock");
    }
  };

  const plusQty = () => {
    if (stock > quantity) setQuantity(quantity + 1);
    else setStockState("Out of Stock !");
  };

  const changeQty = (e) => {
    setQuantity(parseInt(e.target.value));
  };

  const QuickView = () => {
    setModal(!modal);
  };

  const clickProductDetail = () => {
    router.push(`/product-details/${id}` + "-" + `${titleProps}`);
  };

  // Get a short description from the item if available
  const getShortDescription = () => {
    if (item && item.description) {
      return item.description.length > 100 
        ? item.description.substring(0, 100) + '...' 
        : item.description;
    }
    return "Premium quality product with excellent craftsmanship and design.";
  };

  return (
    <Fragment>
      <div className="product-box" style={{
        boxShadow: '0 3px 10px rgba(154, 51, 36, 0.1)',
        borderRadius: '10px',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        margin: '10px 5px',
        position: 'relative',
        border: '1px solid rgba(255, 153, 51, 0.2)'
      }}>
        <style jsx>{`
          @media (max-width: 767px) {
            .product-imgbox {
              aspect-ratio: 1 / 1 !important;
            }
            .product-details {
              padding: 10px !important;
            }
            .product-title {
              font-size: 14px !important;
              margin-bottom: 5px !important;
            }
            .product-thumb-list {
              display: none !important;
            }
            .detail-title {
              -webkit-line-clamp: 1 !important;
            }
          }
          @media (max-width: 576px) {
            .product-imgbox {
              aspect-ratio: 0.9 / 1 !important;
            }
            .product-front img {
              max-width: 85% !important;
              max-height: 85% !important;
            }
            .product-action-btn-group {
              padding: 0 5px !important;
            }
            .product-button {
              padding: 5px !important;
              font-size: 11px !important;
            }
          }
        `}</style>
        <style jsx global>{`
          /* Global responsive styles for product boxes */
          @media (max-width: 767px) {
            .product.product-m {
              margin: 0 -5px !important;
            }
            
            .product-box {
              margin: 8px 5px !important;
            }
            
            .slick-slide > div {
              padding: 0 5px;
            }
            
            /* Make product action buttons more touch-friendly */
            .product-button {
              min-height: 36px !important;
            }
          }
          
          @media (max-width: 480px) {
            .product-details {
              padding: 10px 8px !important;
            }
            
            .product-action-btn-group {
              margin-top: 5px !important;
            }
            
            /* Center product in smaller screens */
            .slick-slide.slick-active {
              display: flex;
              justify-content: center;
            }
          }
        `}</style>
        {/* Image Container */}
        <div className="product-imgbox" style={{ 
          position: 'relative', 
          overflow: 'hidden',
          aspectRatio: '1 / 1',
          backgroundColor: '#fffaf5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="product-front" 
            onClick={clickProductDetail} 
            style={{ 
              width: '100%', 
              height: '100%',
              cursor: 'pointer',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img 
              src={imgsrc || (images && images[0] && formatImagePath(images[0].src)) || "/images/placeholder.jpg"} 
              alt={title || "product"} 
              style={{ 
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                transition: 'transform 0.5s ease'
              }} 
            />
          </div>
          
          {/* Thumbnail Images */}
          <ul className="product-thumb-list" style={{
            position: 'absolute',
            bottom: '10px',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            gap: '5px',
            padding: '0 15px',
            margin: 0,
            listStyle: 'none'
          }}>
            {images && images.slice(0, 4).map((pic, i) => (
              <li 
                className={`grid_thumb_img ${formatImagePath(pic.src) === imgsrc ? "active" : ""}`} 
                key={i}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: formatImagePath(pic.src) === imgsrc ? `2px solid #FF9933` : '1px solid #ddd',
                  cursor: 'pointer',
                  backgroundColor: '#fff'
                }}
              >
                <a>
                  <img
                    src={formatImagePath(pic.src)}
                    onMouseEnter={() => imgChange(pic.src)}
                    alt={pic.alt || title || "product thumbnail"}
                    onClick={() => {
                      imgChange(pic.src);
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </a>
              </li>
            ))}
          </ul>
          
          {/* Product Labels */}
          <div style={{ 
            position: 'absolute', 
            top: '15px', 
            left: '15px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '5px' 
          }}>
            {newLabel && !sale && (
              <div style={{ 
                background: '#FF9933', 
                color: 'white',
                padding: '5px 10px',
                borderRadius: '5px',
                fontWeight: 'bold',
                fontSize: '12px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 5px rgba(255, 153, 51, 0.3)'
              }}>
                NEW
              </div>
            )}
            {sale && 
              <div style={{ 
                background: newLabel ? 'linear-gradient(135deg, #FF9933 0%, #9A3324 100%)' : '#9A3324', 
                color: 'white',
                padding: '5px 10px',
                borderRadius: '5px',
                fontWeight: 'bold',
                fontSize: '12px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 5px rgba(154, 51, 36, 0.3)'
              }}>
                {newLabel ? 'NEW & ON SALE' : 'ON SALE'}
              </div>
            }
            {/* Featured Label */}
            {(featured || (item && item.featured)) && 
              <div style={{ 
                background: 'linear-gradient(135deg, #FFD700 0%, #FF9933 100%)', 
                color: '#5d4037',
                padding: '5px 10px',
                borderRadius: '5px',
                fontWeight: 'bold',
                fontSize: '12px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 5px rgba(255, 153, 51, 0.3)',
                border: '1px solid rgba(255, 153, 51, 0.3)'
              }}>
                FEATURED
              </div>
            }
            {stock <= 5 && stock > 0 && 
              <div style={{ 
                background: '#ffede0', 
                color: '#9A3324',
                padding: '5px 10px',
                borderRadius: '5px',
                fontWeight: 'bold',
                fontSize: '12px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>
                LOW STOCK
              </div>
            }
            {stock === 0 && 
              <div style={{ 
                background: '#f8d7da', 
                color: '#721c24',
                padding: '5px 10px',
                borderRadius: '5px',
                fontWeight: 'bold',
                fontSize: '12px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>
                OUT OF STOCK
              </div>
            }
          </div>
          
          {/* Remove duplicate sale tag */}
          {/* Sale Label instead of Discount Circle */}
          {discount > 0 && !sale && 
            <div style={{ 
              position: 'absolute', 
              top: '15px', 
              right: '15px',
              background: 'rgba(154, 51, 36, 0.9)', 
              color: 'white',
              padding: '5px 10px',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '12px',
              boxShadow: '0 2px 6px rgba(154, 51, 36, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {discount}% OFF
            </div>
          }
        </div>
        
        {/* Product Details */}
        <div className="product-details" style={{
          padding: '15px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexGrow: '1',
        }}>
          <div>
            <h3 className="product-title" style={{ 
              fontSize: '16px', 
              fontWeight: '600',
              margin: '0 0 8px 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.3',
              color: '#333'
            }}>
              <span 
                onClick={clickProductDetail} 
                className="detail-title" 
                style={{ 
                  cursor: 'pointer',
                  color: '#333',
                  transition: 'color 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#FF9933'}
                onMouseOut={(e) => e.currentTarget.style.color = '#333'}
              >
                {title}
              </span>
            </h3>
          </div>
          <div className="product-info" style={{ marginTop: '5px' }}>
            {discount ? (
              <div className="price" style={{ 
                display: 'flex', 
                gap: '5px', 
                alignItems: 'center',
                flexWrap: 'wrap' 
              }}>
                <h4 
                  style={{ 
                    margin: '0', 
                    fontWeight: 'bold', 
                    color: '#FF9933', 
                    fontSize: '16px' 
                  }}
                >
                  {selectedCurr.symbol}
                  {(price - (price * discount) / 100).toFixed(2)}
                </h4>
                <del style={{ 
                  color: '#999', 
                  fontSize: '14px',
                  fontWeight: '400',
                  alignSelf: 'center'
                }}>
                  {selectedCurr.symbol}
                  {price.toFixed(2)}
                </del>
              </div>
            ) : (
              <div className="price" style={{ marginBottom: '5px' }}>
                <h4 style={{ 
                  margin: '0', 
                  fontWeight: 'bold', 
                  color: '#FF9933', 
                  fontSize: '16px' 
                }}>
                  {selectedCurr.symbol}
                  {price.toFixed(2)}
                </h4>
              </div>
            )}
            {/* Action buttons */}
            <div className="product-action-btn-group" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '10px',
              padding: '0 5px'
            }}>
              <button 
                className="product-button add-to-cart-btn" 
                onClick={() => addCart()}
                style={{
                  background: '#FF9933',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flex: '1',
                  marginRight: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'background 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#E57200'}
                onMouseOut={(e) => e.currentTarget.style.background = '#FF9933'}
                disabled={stock <= 0}
              >
                <i className="fa fa-shopping-cart" style={{ fontSize: '12px' }}></i>
                Add
              </button>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button 
                  className="product-button wishlist-btn" 
                  onClick={() => addWish()}
                  style={{
                    background: 'white',
                    color: '#555',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    padding: '7px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.borderColor = '#ccc';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#ddd';
                  }}
                >
                  <i className="fa fa-heart-o" style={{ fontSize: '12px' }}></i>
                </button>
                <button 
                  className="product-button compare-btn" 
                  onClick={() => addCompare()}
                  style={{
                    background: 'white',
                    color: '#555',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    padding: '7px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#fafafa';
                    e.currentTarget.style.borderColor = '#ccc';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#ddd';
                  }}
                >
                  <i className="fa fa-random" style={{ fontSize: '12px' }}></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick View Modal */}
      <Modal className="fade bd-example-modal-lg theme-modal show quick-view-modal" isOpen={modal} toggle={() => setModal(!modal)} centered size="lg">
        <ModalBody>
          <button type="button" className="close" onClick={() => setModal(!modal)}>
            <span>&times;</span>
          </button>
          <div className="row">
            <div className="col-lg-6 col-xs-12">
              <Slider ref={(slider) => {slider2.current = slider; return undefined;}}>
                {item && item.images && item.images.map((img: any, i: any) => {
                  return (
                    <div key={i}>
                      <Media src={formatImagePath(img.src)} alt={img.alt || item.title || "product"} className="img-fluid image_zoom_cls-0" />
                    </div>
                  );
                })}
              </Slider>
            </div>
            <div className="col-lg-6 rtl-text">
              <div className="product-right">
                <h2 style={{ color: '#9A3324' }}>{item?.title}</h2>
                <h3 style={{ color: '#FF9933' }}><span className="rupee-symbol">₹</span>{item?.price}</h3>
                <ul className="color-variant">
                  {uniqueColor.map((vari, i) => {
                    return <li className={vari.color} key={i} title={vari.color} onClick={() => changeColorVar(i)}></li>;
                  })}
                </ul>
                <div className="border-product" style={{ borderColor: 'rgba(255, 153, 51, 0.3)' }}>
                  <h6 className="product-title" style={{ color: '#9A3324' }}>product details</h6>
                  <p>{item?.description}</p>
                </div>
                <div className="product-description border-product" style={{ borderColor: 'rgba(255, 153, 51, 0.3)' }}>
                  <div className="size-box">
                    <ul>
                      {uniqueSize.map((size, i) => (
                        <li key={i}>
                          <a href="#" onClick={(e) => e.preventDefault()}>
                            {size}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {stockState !== "InStock" ? <span className="instock-cls">Out Of Stock</span> : ""}
                  <h6 className="product-title" style={{ color: '#9A3324' }}>quantity</h6>
                  <div className="qty-box">
                    <div className="input-group">
                      <span className="input-group-prepend">
                        <button type="button" className="btn quantity-left-minus" onClick={minusQty} style={{ borderColor: '#FF9933' }}>
                          <i className="ti-angle-left"></i>
                        </button>
                      </span>
                      <input type="text" name="quantity" className="form-control input-number" value={quantity} onChange={changeQty} style={{ borderColor: '#FF9933' }} />
                      <span className="input-group-prepend">
                        <button type="button" className="btn quantity-right-plus" onClick={plusQty} style={{ borderColor: '#FF9933' }}>
                          <i className="ti-angle-right"></i>
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="product-buttons">
                  <a href="#" className="btn btn-normal" onClick={() => addCart()} style={{ backgroundColor: '#FF9933', borderColor: '#FF9933' }}>
                    add to cart
                  </a>
                  <a href="#" className="btn btn-normal" onClick={() => clickProductDetail()} style={{ backgroundColor: '#9A3324', borderColor: '#9A3324' }}>
                    view detail
                  </a>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </Fragment>
  );
};

export default ProductBox;
