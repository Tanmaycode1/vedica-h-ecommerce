import React, { Fragment, useContext, useState } from "react";
import { Media, Modal, ModalBody } from "reactstrap";
import { CurrencyContext } from "../../../../helpers/currency/CurrencyContext";
import { useRouter } from "next/router";
import { NextPage } from "next";
import Slider from "react-slick";
import Link from "next/link";

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

const CollectionProductBox: NextPage<productType> = ({ layout, id, item, title, newLabel, sale, featured, price, discount, stock, images, addCart, addCompare, addWish, hoverEffect }) => {
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

  // Calculate sale price
  const calculateDiscountPrice = () => {
    if (discount && price) {
      return price - (price * discount / 100);
    }
    return price;
  };

  // Format price with currency symbol
  const formatPrice = (price) => {
    if (typeof price !== 'number') {
      price = Number(price) || 0;
    }
    return (<><span className="rupee-symbol">₹</span>{price.toFixed(2)}</>);
  };

  return (
    <Fragment>
      <div className="collection-product-box">
        {/* Image Container */}
        <div className="collection-product-imgbox">
          <div 
            className="product-front"
            onClick={clickProductDetail}
          >
            <img 
              src={imgsrc || (images && images[0] && formatImagePath(images[0].src)) || "/images/placeholder.jpg"} 
              alt={title || "product"} 
            />
          </div>
          
          {/* Thumbnail Images */}
          {images && images.length > 1 && (
            <div className="product-thumbnails">
              {images.slice(0, 4).map((pic, i) => (
                <div 
                  className={`product-thumbnail ${formatImagePath(pic.src) === imgsrc ? "active" : ""}`} 
                  key={i}
                >
                  <img
                    src={formatImagePath(pic.src)}
                    onMouseEnter={() => imgChange(pic.src)}
                    alt={pic.alt || title || "product thumbnail"}
                    onClick={() => imgChange(pic.src)}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Product Labels */}
          <div className="product-labels">
            {newLabel && !sale && (
              <div className="product-label product-label-new">
                NEW
              </div>
            )}
            {sale && (
              <div className="product-label product-label-sale">
                SALE
              </div>
            )}
            {newLabel && sale && (
              <div className="product-label product-label-new">
                NEW
              </div>
            )}
            {(featured || (item && item.featured)) && (
              <div className="product-label product-label-featured">
                HOT
              </div>
            )}
          </div>
          
          {/* Discount Tag */}
          {discount && discount > 0 && (
            <div className="product-discount-badge">
              {discount}%
            </div>
          )}
        </div>
        
        <div className="collection-product-detail">
          {/* Product Info */}
          <div>
            {/* Name */}
            <h3>
              <Link href={`/product-details/${item && item.id}`}>
                <span>{item && item.title || title}</span>
              </Link>
            </h3>
            
            {/* Decorative underline */}
            <div className="product-divider"></div>
            
            {/* Description */}
            <p>{getShortDescription()}</p>
          </div>
          
          {/* Price and Actions */}
          <div>
            {/* Price */}
            <div className="collection-price">
              <span className="collection-current-price">
                {formatPrice(calculateDiscountPrice())}
              </span>
              
              {discount && discount > 0 && (
                <span className="collection-old-price">
                  {formatPrice(price)}
                </span>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="collection-action-buttons">
              <button
                onClick={() => addCart()}
                className="collection-add-cart-btn"
                disabled={stock <= 0}
              >
                <i className="fa fa-shopping-cart"></i>
                <span>Add to Cart</span>
              </button>
              
              <button
                onClick={QuickView}
                className="collection-quick-view-btn"
              >
                <i className="fa fa-eye"></i>
              </button>
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
                <h3 style={{ color: '#FF9933' }}>₹{item?.price}</h3>
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
                  <button disabled={stock <= 0} onClick={() => addCart()} className="btn btn-solid" style={{ backgroundColor: '#9A3324', borderColor: '#9A3324' }}>
                    add to cart
                  </button>
                  <button onClick={clickProductDetail} className="btn btn-solid" style={{ backgroundColor: '#FF9933', borderColor: '#FF9933' }}>
                    view detail
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </Fragment>
  );
};

export default CollectionProductBox; 