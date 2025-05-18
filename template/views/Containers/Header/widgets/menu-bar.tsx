import React, { useState, useContext, useEffect, CSSProperties } from "react";
import Link from "next/link";
import data from "../../../../data/menu.json";
import { NextPage } from "next";
import { Media, Col, Row, Container } from "reactstrap";
import { MenuContext } from "../../../../helpers/menu/MenuContext";
import { useTranslation } from "react-i18next";
import useOutSideClick from "utils/outSideClick";
import useMobileSize from "utils/isMobile";
import apiService from "../../../../helpers/apiService";

type MenuBarState = {
  menuData?: any[];
};

// Define types for menu items
interface MenuItem {
  title: string;
  type: string;
  megaMenu?: boolean;
  children: any[];
  path?: string;
}

const MenuBar1: NextPage<MenuBarState> = ({ menuData = data }) => {
  const menuContext = useContext(MenuContext);
  const { setMenuResponsive } = menuContext;
  const { ref, isComponentVisible, setIsComponentVisible } = useOutSideClick(false);
  const mobileSize = useMobileSize();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(null);
  const [isSubNavOpen, setIsSubNavOpen] = useState(null);
  const path = window.location.pathname;
  const [megaMenuData, setMegaMenuData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom styles to reduce spacing
  const compactMenuStyles = {
    menuContainer: {
      width: '100%',
      margin: '0',
      padding: '0'
    } as CSSProperties,
    menuRow: {
      display: 'flex',
      flexWrap: 'wrap' as CSSProperties['flexWrap'],
      margin: '0',
      width: '100%',
      justifyContent: 'flex-start'
    } as CSSProperties,
    menuColumn: {
      paddingRight: '10px',
      paddingLeft: '10px',
      marginBottom: '0',
      flex: '0 0 20%',
      maxWidth: '20%',
      boxSizing: 'border-box'
    } as CSSProperties,
    menuTitle: {
      marginBottom: mobileSize ? '2px' : '4px',
      marginTop: mobileSize ? '2px' : '4px',
      borderBottom: mobileSize ? '2px solid #f8c7b7' : '1px solid #eee',
      paddingBottom: mobileSize ? '4px' : '2px',
      fontSize: '12px',
      fontWeight: 'bold'
    } as CSSProperties,
    menuContent: {
      paddingTop: '0'
    } as CSSProperties,
    menuList: {
      padding: '0',
      margin: '0',
      listStyle: 'none'
    } as CSSProperties,
    menuItem: {
      marginBottom: '2px',
      fontSize: '11px',
      lineHeight: '1.1'
    } as CSSProperties,
    menuLink: {
      color: '#666',
      textDecoration: 'none',
      transition: 'color 0.2s ease'
    } as CSSProperties,
    megaMenu: {
      padding: mobileSize ? '5px' : '10px 5px',
      width: mobileSize ? '100%' : '600px',
      minWidth: 'auto',
      maxWidth: mobileSize ? '100%' : '90vw',
      left: mobileSize ? '0' : '50%',
      transform: mobileSize ? 'none' : 'translateX(-50%)',
      boxSizing: 'border-box',
      border: '1px solid #eee',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      backgroundColor: mobileSize ? '#fafafa' : 'white'
    } as CSSProperties,
    mobileBackBtn: {
      padding: '8px 0',
      fontSize: '14px',
      color: '#222',
      fontWeight: 500,
      textTransform: 'capitalize',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center'
    } as CSSProperties
  };
  
  // Fetch megamenu data from REST API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get megamenu data
        const megaMenuResult = await apiService.getMegaMenuTree();
        setMegaMenuData(megaMenuResult.megaMenu || []);
        console.log('Megamenu data loaded:', megaMenuResult);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Define static menu items - just Home now
  const staticMenuItems: MenuItem[] = [
    {
      title: "home",
      type: "link",
      path: "/",
      children: []
    },
    {
      title: "collections",
      type: "link",
      path: "/collections/leftsidebar",
      children: []
    }
  ];

  // Combine static menu with dynamic megamenu
  const combinedMenu: MenuItem[] = [
    ...staticMenuItems,
    {
      title: "shop",
      type: "sub",
      megaMenu: true,
      children: loading ? [] : megaMenuData
        .filter(item => item.is_active && item.level === 0)
        .map(category => ({
          title: category.collection_name,
          children: category.children.map(subcategory => ({
            title: subcategory.collection_name,
            path: `/collections/${subcategory.collection_slug}`
          }))
        }))
    }
  ];

  return (
    <>
      {path !== "/Layouts/layout3" && (
        <li>
          <div
            className="mobile-back text-right"
            onClick={() => {
              setMenuResponsive(false);
              document.body.style.overflow = "visible";
            }}
            style={compactMenuStyles.mobileBackBtn}>
            Back<i className="fa fa-angle-right ps-2" aria-hidden="true" style={{ fontSize: '12px', paddingLeft: '5px' }}></i>
          </div>
        </li>
      )}
      {/* Using combined menu items */}
      {combinedMenu.map((menuItem, i) => {
        return (
          <li 
            key={i} 
            className={` ${menuItem.megaMenu ? "mega" : ""}`}
            onMouseEnter={() => {
              if (menuItem.type !== "link") {
                setIsComponentVisible(true);
                setIsOpen(menuItem.title);
              }
            }}
            onMouseLeave={() => {
              if (menuItem.type !== "link") {
                setIsComponentVisible(false);
                setIsOpen(null);
              }
            }}
          >
            {menuItem.type === "link" && (
              <Link href={menuItem.path || "/"} className="dark-menu-item" style={mobileSize ? 
                { padding: '10px 5px', fontSize: '15px', display: 'block' } : {}}>
                {t(menuItem.title)}
              </Link>
            )}
            
            {(menuItem.type === "sub" || menuItem.megaMenu) && menuItem.children && (
              <a
                className="dark-menu-item has-submenu"
                style={mobileSize ? { padding: '10px 5px', fontSize: '15px', display: 'flex', justifyContent: 'space-between' } : {}}
                onClick={(e) => {
                  e.preventDefault();
                  // For mobile, toggle the menu on tap
                  if (mobileSize) {
                    setIsComponentVisible(true);
                    setIsOpen(menuItem.title !== isOpen ? menuItem.title : null);
                  }
                }}>
                {t(menuItem.title)}
                <span className={`sub-arrow ${(path === "/Layouts/layout3" || mobileSize) && (isOpen === menuItem.title ? "minus" : "plus")}`}></span>
              </a>
            )}

            {/* MEGHA MENU */}
            {menuItem.megaMenu && (
              <ul
                ref={ref}
                className={`mega-menu full-mega-menu submenu ${isComponentVisible && isOpen === menuItem.title ? "d-block" : ""}`}
                style={compactMenuStyles.megaMenu}
              >
                <div style={compactMenuStyles.menuContainer}>
                  {loading ? (
                    <div className="text-center py-1">
                      <p style={{fontSize: '11px', margin: '0'}}>Loading...</p>
                    </div>
                  ) : menuItem.children && menuItem.children.length > 0 ? (
                    <div style={compactMenuStyles.menuRow}>
                      {menuItem.children.slice(0, mobileSize ? 4 : 5).map((megaMenuItem: any, i: any) => {
                        return (
                          <div key={i} style={{
                            paddingRight: '10px',
                            paddingLeft: '10px',
                            marginBottom: '0',
                            flex: mobileSize ? '0 0 50%' : '0 0 20%',
                            maxWidth: mobileSize ? '50%' : '20%',
                            boxSizing: 'border-box',
                            borderTop: mobileSize && i >= 2 ? '1px solid #eee' : 'none',
                            paddingTop: mobileSize && i >= 2 ? '5px' : '0'
                          }}>
                            <div className="link-section" style={{padding: 0}}>
                              <div style={compactMenuStyles.menuTitle}>
                                <h5 style={{ margin: 0, fontSize: mobileSize ? '14px' : '12px' }}>{megaMenuItem.title}</h5>
                              </div>
                              <div style={compactMenuStyles.menuContent}>
                                <ul style={compactMenuStyles.menuList}>
                                  {megaMenuItem.children &&
                                    megaMenuItem.children.slice(0, mobileSize ? 4 : 6).map((item: any, j: any) => {
                                      return (
                                        <li key={j} style={{
                                          margin: mobileSize ? '2px 0' : '4px 0',
                                          padding: 0,
                                          display: 'block'
                                        }}>
                                          <Link 
                                            href={`/collections/leftsidebar?brand=&color=&category=${item.title}&pricemin=0&pricemax=999999`} 
                                            style={{
                                              fontSize: mobileSize ? '13px' : '12px',
                                              padding: mobileSize ? '4px 0' : 0,
                                              display: 'block',
                                              color: '#888',
                                              fontWeight: mobileSize ? '400' : 'normal'
                                            }}
                                          >
                                            {item.title}
                                          </Link>
                                        </li>
                                      );
                                    })}
                                </ul>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-1">
                      <p style={{fontSize: '11px', margin: '0'}}>No categories found</p>
                    </div>
                  )}
                </div>
              </ul>
            )}
          </li>
        );
      })}
    </>
  );
};

export default MenuBar1;
