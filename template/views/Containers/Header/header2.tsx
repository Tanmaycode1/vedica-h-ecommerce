import React, { Fragment, useContext, useEffect } from "react";
import { Container, Row, Col, Media } from "reactstrap";
import Search from "./widgets/search";
import ShoppingCart from "./widgets/shopping-cart";
import Category from "./widgets/by-category";
import User from "./widgets/user-profile";
import WishList from "./widgets/whishlist";
import { NextPage } from "next";
import HorizaontalMenu from "../Menu/horizontal";
import MobileSearch from "./widgets/mobile-search";
import MobileSetting from "./widgets/mobile-setting";
import { MenuContext } from "helpers/menu/MenuContext";

interface header {
  cartPopupPosition: string;
  display: string;
  category: boolean;
  layoutLogo: string;
  categoryHeaderClass?: any;
}

const Header2: NextPage<header> = ({ cartPopupPosition, display, category, layoutLogo, categoryHeaderClass }) => {
  const menuContext = useContext(MenuContext);
  const { setLeftMenu, leftMenu } = menuContext;
  const handleScroll = () => {
    let number = window.pageXOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (number >= 300) {
      if (window.innerWidth < 581) document.getElementById("stickyHeader").classList.remove("sticky");
      else document.getElementById("stickyHeader").classList.add("sticky");
    } else document.getElementById("stickyHeader").classList.remove("sticky");
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  return (
    <Fragment>
      <header id="stickyHeader">
        <div className="mobile-fix-option"></div>
        <div className="layout-header2">
          <Container>
            <Row>
              <Col md="12">
                <div className="main-menu-block">
                  <div
                    onClick={() => {
                      setLeftMenu(!leftMenu);
                      document.body.style.overflow = "hidden";
                    }}
                    className="sm-nav-block">
                    <span className="sm-nav-btn">
                      <i className="fa fa-bars"></i>
                    </span>
                  </div>
                  <div className="logo-block">
                    <a href="/#">
                      <div className="vedich-logo">
                        <div className="top-lotus">❁</div>
                        <div className="vedich-logo-text">Vedic<span>H</span></div>
                        <div className="bottom-lotus">❁</div>
                      </div>
                    </a>
                  </div>
                  <Search />
                  <ShoppingCart position={cartPopupPosition} cartDisplay={display} layout="layout2" />
                </div>
              </Col>
            </Row>
          </Container>
        </div>
        <div className={`category-header-2 ${categoryHeaderClass ? categoryHeaderClass : ""}`}>
          <div className="custom-container">
            <Row>
              <Col>
                <div className="navbar-menu">
                  <div className="category-left">
                    <Category category={category} />
                    <HorizaontalMenu />
                    <div className="icon-block">
                      <ul>
                        <User />
                        <WishList />
                        <MobileSearch />
                        <MobileSetting />
                      </ul>
                    </div>
                  </div>
                  <div className="category-right">
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </header>
    </Fragment>
  );
};
export default Header2; 