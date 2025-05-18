import { ReactNode, useEffect } from "react";
import { NextPage } from "next";
import HeaderContainer from "../../Containers/Header/header1";
import Footer from "../../Containers/Footer";
import { FilterProvider } from "../../../helpers/filter/filter.provider";
import { CartProvider } from "../../../helpers/cart/cart.provider";
import Loader from "common/Loader";

interface Props {
  children: ReactNode;
}

const Layout1: NextPage<Props> = ({ children }) => {
  useEffect(() => {
    // Set default color scheme for Hindu pooja website
    document.documentElement.classList.remove(localStorage.getItem("color"));
    localStorage.setItem("color", "color-7"); // Changed to our new Hindu religious color theme
    document.documentElement.classList.add(localStorage.getItem("color"));
    
    // Add light mode by default
    if (!document.body.classList.contains("light")) {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    }
    
    // Load additional pooja/spiritual CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/scss/pooja-theme.scss';
    document.head.appendChild(link);
    
    // Add spiritual classes to key elements
    setTimeout(() => {
      // Add mandala background to product boxes
      document.querySelectorAll('.product-box').forEach(box => {
        box.classList.add('mandala-bg');
        const decoration = document.createElement('div');
        decoration.className = 'spiritual-product-decoration';
        box.appendChild(decoration);
      });
      
      // Add om symbol to section titles
      document.querySelectorAll('h2, h3, h4').forEach(heading => {
        if(!heading.classList.contains('om-symbol') && heading.parentElement && 
           !heading.parentElement.classList.contains('product-box')) {
          heading.classList.add('om-symbol');
        }
      });
      
      // Add spiritual price tag styling
      document.querySelectorAll('.product-detail h5').forEach(price => {
        price.classList.add('spiritual-price-tag');
      });
      
      // Add footer decoration
      const footer = document.querySelector('footer');
      if(footer) {
        footer.classList.add('footer-om-symbol');
      }
      
      // Add header decoration
      const header = document.querySelector('header');
      if(header) {
        header.classList.add('header-decoration');
      }
      
      // Add section decoration to main sections
      document.querySelectorAll('section').forEach(section => {
        if(!section.classList.contains('section-decoration')) {
          section.classList.add('section-decoration');
        }
      });
    }, 500);
  }, []);
  
  return (
    <Loader>
      <div>
        <CartProvider>
          <HeaderContainer category={false} cartPopupPosition="top" display="d-block" layoutLogo="layout-2" />
          <FilterProvider>{children}</FilterProvider>
          <Footer layoutLogo="layout-2" />
        </CartProvider>
      </div>
    </Loader>
  );
};

export default Layout1;
