import React, { Fragment, useState, useContext, useEffect } from "react";
import { Input, Modal, ModalBody } from "reactstrap";
import { CartContext } from "../../../../helpers/cart/cart.context";
import Masonry from "react-masonry-css";
import { CurrencyContext } from "../../../../helpers/currency/CurrencyContext";
import { useRouter } from "next/router";
import Link from "next/link";
import Img from "utils/BgImgRatio";

interface productType {
  id: Number;
  title: string;
  newLabel: boolean;
  sale: Boolean;
  stock: Number;
  price: number;
  item: any;
  discount: number;
  images: any;
  layout: string;
  addCart: Function;
  addWish: Function;
  addCompare: Function;
  incrementQty: Function;
  hoverEffect: any;
  type: Array<string>;
}

const ProductBox2: React.FC<productType> = (data) => {
  const { cartItems, updateQty, removeFromCart } = useContext(CartContext);
  const currencyContext = useContext(CurrencyContext);
  const [openQty, setOpenQty] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [stock1, setstock] = useState("InStock");
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const uniqueSize = [];
  const { selectedCurr } = currencyContext;
  const titleProps = data.title.split(" ").join("");
  const minusQty = () => {
    if (quantity > 1) {
      setstock("InStock");
      const qty = quantity - 1;
      setQuantity(qty);
      updateQty(data.item, qty);
    } else {
      setOpenQty(false);
      removeFromCart(data);
    }
  };
  const plusQty = () => {
    if (Number(data.stock) >= quantity) {
      const qty = quantity + 1;
      setQuantity(qty);
      updateQty(data.item, qty);
    } else {
      setstock("Out of Stock !");
    }
  };

  const QuickView = () => {
    setModal(!modal);
  };

  const clickProductDetail = () => {
    router.push(`/product-details/${data.id}` + "-" + `${titleProps}`);
  };

  useEffect(() => {
    cartItems.filter((elem) => {
      elem.id === data.item.id && setQuantity(elem.qty);
    });
  });
  return (
    <Fragment>
      <Masonry className="masonary-banner-main">
        <div className="product-box" style={{
          borderRadius: '5px',
          border: '1px solid rgba(255, 153, 51, 0.2)',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}>
          <div className="product-imgbox" style={{
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#fffaf5'
          }}>
            <div className="product-front" onClick={clickProductDetail}>
              <Img src={`/images/${data.images[0].src}`} className="img-fluid" alt="product" />
            </div>
            
            <div className="product-icon" style={{
              borderTop: '1px solid rgba(255, 153, 51, 0.15)'
            }}>
              <button onClick={() => data.addCart()} style={{
                backgroundColor: '#fff', 
                borderColor: '#FF9933',
                color: '#9A3324'
              }}>
                <i className="ti-bag" aria-hidden="true"></i>
              </button>
              <a onClick={() => data.addWish()} style={{
                color: '#9A3324'
              }}>
                <i className="ti-heart" aria-hidden="true" style={{
                  backgroundColor: '#fff', 
                  borderColor: '#FF9933',
                  color: '#9A3324'
                }}></i>
              </a>
              <a href="#" data-toggle="modal" data-target="#quick-view" title="Quick View" onClick={() => QuickView()}>
                <i className="ti-search" aria-hidden="true" style={{
                  backgroundColor: '#fff', 
                  borderColor: '#FF9933',
                  color: '#9A3324'
                }}></i>
              </a>
              <a href="#" title="Compare" onClick={() => data.addCompare()}>
                <i className="ti-reload" aria-hidden="true" style={{
                  backgroundColor: '#fff', 
                  borderColor: '#FF9933',
                  color: '#9A3324'
                }}></i>
              </a>
            </div>
            {data.newLabel && (
              <div className="new-label1" style={{
                backgroundColor: '#FF9933',
                color: 'white'
              }}>
                <div>new</div>
              </div>
            )}
            {data.sale && <div className="on-sale1" style={{color: '#9A3324'}}>on sale</div>}
            {Number(data.stock) <= 0 ? <span>Out Of Stock</span> : ""}
            {stock1 !== "InStock" ? <span>Out Of Stock</span> : ""}
          </div>
          <div className="product-detail detail-center1" style={{
            borderTop: '1px dashed rgba(255, 153, 51, 0.3)',
            paddingBottom: '15px',
            paddingTop: '15px',
            backgroundColor: '#fff'
          }}>
            <ul className="rating-star">
              <li>
                <i className="fa fa-star" style={{color: '#FF9933'}}></i>
              </li>
              <li>
                <i className="fa fa-star" style={{color: '#FF9933'}}></i>
              </li>
              <li>
                <i className="fa fa-star" style={{color: '#FF9933'}}></i>
              </li>
              <li>
                <i className="fa fa-star" style={{color: '#FF9933'}}></i>
              </li>
              <li>
                <i className="fa fa-star" style={{color: '#FF9933'}}></i>
              </li>
            </ul>
            <Link href={`/product-details/${data.id}` + "-" + `${titleProps}`}>
              <h6 className="price-title" style={{
                color: '#9A3324',
                textAlign: 'center',
                position: 'relative',
                display: 'inline-block'
              }}>{data.title}</h6>
            </Link>

            {/* Decorative underline for title */}
            <div style={{
              width: '40%',
              height: '1px',
              margin: '5px auto 10px auto',
              background: 'linear-gradient(90deg, transparent 0%, #FF9933 20%, #FF9933 80%, transparent 100%)'
            }}></div>

            <span className="detail-price" style={{color: '#FF9933'}}>
              {selectedCurr.symbol}
              {(data.price * selectedCurr.value).toFixed(2)}
              <span style={{
                color: '#999',
                textDecoration: 'line-through'
              }}>
                {selectedCurr.symbol}
                {((data.price - data.price * (data.discount / 100)) * selectedCurr.value).toFixed(2)}
              </span>
            </span>
          </div>
          <div className="addtocart_btn">
            <button
              className="add-button add_cart"
              title="Add to cart"
              onClick={() => {
                Number(data.stock) > 0 ? (setOpenQty(true), updateQty(data, quantity)) : "";
              }}
              style={{
                backgroundColor: '#FF9933',
                color: 'white'
              }}>
              add to cart
            </button>
            <div className={`qty-box cart_qty ${openQty ? "open" : ""}`}>
              <div className="input-group">
                <button type="button" className="btn quantity-left-minus" data-type="minus" data-field="" onClick={minusQty} style={{borderColor: '#FF9933'}}>
                  <i className="fa fa-minus" aria-hidden="true"></i>
                </button>
                <Input type="text" name="quantity" value={quantity} className="form-control input-number qty-input" onChange={() => {}} style={{borderColor: '#FF9933'}} />
                <button type="button" className="btn quantity-right-plus" data-type="plus" data-field="" onClick={plusQty} style={{borderColor: '#FF9933'}}>
                  <i className="fa fa-plus" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Masonry>
      {data.item.variants &&
        data.item.variants.map((vari) => {
          var findItemSize = uniqueSize.find((x) => x === vari.size);
          if (!findItemSize && vari.size) uniqueSize.push(vari.size);
        })}
      <Modal className="fade bd-example-modal-lg theme-modal show quick-view-modal" isOpen={modal} toggle={() => setModal(!modal)} centered size="lg">
        <ModalBody>
          <button type="button" className="close" onClick={() => setModal(!modal)}>
            <span>&times;</span>
          </button>
          <div className="row">
            <div className="col-lg-6 col-xs-12">
              <div className="quick-view-img">
                <img src={`/images/${data?.item?.variants ? data?.item?.images[0].src : data?.item?.images[0].src}`} alt="" className="img-fluid" />
              </div>
            </div>
            <div className="col-lg-6 rtl-text">
              <div className="product-right">
                <h2 style={{color: '#9A3324'}}>{data?.item?.title}</h2>
                <h3 style={{color: '#FF9933'}}>
                  {selectedCurr.symbol}
                  {data?.item?.price * selectedCurr.value}
                </h3>

                <div className="border-product" style={{borderColor: 'rgba(255, 153, 51, 0.3)'}}>
                  <h6 className="product-title" style={{color: '#9A3324'}}>product details</h6>
                  <p>{data?.item?.description}</p>
                </div>
                <div className="product-description border-product" style={{borderColor: 'rgba(255, 153, 51, 0.3)'}}>
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
                  {stock1 !== "InStock" ? <span className="instock-cls">Out Of Stock</span> : ""}
                  <h6 className="product-title" style={{color: '#9A3324'}}>quantity</h6>
                  <div className="qty-box">
                    <div className="input-group">
                      <span className="input-group-prepend">
                        <button type="button" className="btn quantity-left-minus" onClick={minusQty} style={{borderColor: '#FF9933'}}>
                          <i className="ti-angle-left"></i>
                        </button>
                      </span>
                      <input type="text" name="quantity" className="form-control input-number" value={quantity} onChange={() => updateQty(data.item, quantity)} style={{borderColor: '#FF9933'}} />
                      <span className="input-group-prepend">
                        <button type="button" className="btn quantity-right-plus" onClick={plusQty} style={{borderColor: '#FF9933'}}>
                          <i className="ti-angle-right"></i>
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="product-buttons">
                  <a href="#" className="btn btn-normal" onClick={() => data.addCart()} style={{backgroundColor: '#FF9933', borderColor: '#FF9933'}}>
                    add to cart
                  </a>
                  <a href="#" className="btn btn-normal" onClick={() => clickProductDetail()} style={{backgroundColor: '#9A3324', borderColor: '#9A3324'}}>
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
export default ProductBox2;
