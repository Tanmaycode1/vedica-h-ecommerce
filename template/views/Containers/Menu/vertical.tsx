import React, { useContext } from "react";
import { NextPage } from "next";
import Link from "next/link";
import { MenuContext } from "../../../helpers/menu/MenuContext";

const VerticalMenu: NextPage = () => {
  const menuContext = useContext(MenuContext);
  const { menuResponsive, setMenuResponsive } = menuContext;

  // Collection categories for sidebar
  const collectionCategories = [
    { title: "All Collections", path: "/collections" },
    { title: "New Arrivals", path: "/collections/new-arrivals" },
    { title: "Featured Products", path: "/collections/featured" },
    { title: "Best Sellers", path: "/collections/best-sellers" },
    { title: "Electronics", path: "/collections/electronics" },
    { title: "Fashion", path: "/collections/fashion" },
    { title: "Home & Kitchen", path: "/collections/home-kitchen" },
    { title: "Beauty", path: "/collections/beauty" },
    { title: "Discounted Items", path: "/collections/discounted" }
  ];

  return (
    <>
      <div
        className={`menu-overlay ${menuResponsive ? "active" : ""}`}
        onClick={() => {
          setMenuResponsive(!menuResponsive);
          document.body.style.overflow = "visible";
        }}></div>
      <nav id="main-nav">
        <ul id="main-menu" className={`sm pixelstrap desc-horizontal sm-vertical sm-blue ${menuResponsive ? "menu-open" : ""}`}>
          <li>
            <div
              className="desc-back text-right"
              onClick={() => {
                setMenuResponsive(false);
                document.body.style.overflow = "visible";
              }}>
              Back<i className="fa fa-angle-right ps-2" aria-hidden="true"></i>
            </div>
          </li>
          
          {/* Collection categories in sidebar */}
          <li className="sidebar-title">
            <span>Collections</span>
          </li>
          {collectionCategories.map((collection, index) => (
            <li key={index}>
              <Link href={collection.path}>
                {collection.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default VerticalMenu;
