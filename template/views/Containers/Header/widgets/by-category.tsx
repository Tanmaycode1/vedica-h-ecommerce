import React, { useContext, useState, useEffect } from "react";
import { NextPage } from "next";
import { Media } from "reactstrap";
import { useTranslation } from "react-i18next";
import { MenuContext } from "helpers/menu/MenuContext";
import apiService from "../../../../helpers/apiService";

// Define types for collection data
interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  collection_type: string;
  image_url: string | null;
}

interface byCategory {
  category: boolean;
}

const ByCategory: NextPage<byCategory> = ({ category }) => {
  // Initialize showState as false regardless of category prop to ensure dropdown is closed on page load
  const [showState, setShowState] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const menuContext = useContext(MenuContext);
  const { leftMenu, setLeftMenu } = menuContext;
  
  // Icons for different categories (fallback images)
  const categoryIcons: Record<string, string> = {
    "Food": "/images/layout-1/nav-img/07.png",
    "Cosmetics": "/images/layout-1/nav-img/06.png",
    "Jewelry": "/images/layout-1/nav-img/08.png",
    "Electronics": "/images/layout-1/nav-img/02.png",
    "Home & Garden": "/images/layout-1/nav-img/05.png",
    "Fashion": "/images/layout-1/nav-img/01.png",
    "default": "/images/layout-1/nav-img/01.png"
  };

  // Dropdown scrollable styles
  const scrollableDropdownStyles = {
    maxHeight: '400px',
    overflowY: 'auto' as const,
    scrollbarWidth: 'thin' as const,
    scrollbarColor: '#ccc #f5f5f5'
  };

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Get collections tree data
        const collectionsData = await apiService.getCollectionsTree();
        
        // Extract all subcategories (not brands)
        const allCategories: Category[] = [];
        
        // First add just parent categories
        collectionsData.forEach(parent => {
          // Add the parent category
          allCategories.push({
            id: parent.id,
            name: parent.name,
            slug: parent.slug,
            description: parent.description,
            collection_type: parent.collection_type,
            image_url: parent.image_url
          });
        });
        
        // Then add subcategories that are not brands
        collectionsData.forEach(parent => {
          const subcategories = parent.children.filter(child => 
            child.collection_type === 'category'
          );
          
          allCategories.push(...subcategories);
        });
        
        setCategories(allCategories);
        console.log('Categories loaded:', allCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Get icon for a category
  const getCategoryIcon = (category: Category) => {
    // If category has an image_url, use it
    if (category.image_url) return category.image_url;
    
    // Otherwise try to match with predefined icons
    return categoryIcons[category.name] || categoryIcons.default;
  };
  
  return (
    <>
      <div 
        className="nav-block" 
        onClick={() => setShowState(!showState)}
        onMouseEnter={() => setShowState(true)} 
        onMouseLeave={() => setShowState(false)}
      >
        <div className="nav-left">
          <nav className="navbar" data-toggle="collapse" data-target="#navbarToggleExternalContent">
            <button className="navbar-toggler" type="button">
              <span className="navbar-icon">
                <i className="fa fa-arrow-down"></i>
              </span>
            </button>
            <h5 className="mb-0 text-white title-font"> {t("shopByCategory")}</h5>
          </nav>
          <div className={`collapse nav-desk ${showState ? "show" : ""}`} id="navbarToggleExternalContent">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setLeftMenu(!leftMenu);
                document.body.style.overflow = "visible";
              }}
              className={`overlay-cat ${leftMenu ? "showoverlay" : ""}`}></a>
            <ul 
              className={`nav-cat title-font ${leftMenu ? "openmenu" : ""}`}
              style={scrollableDropdownStyles}
            >
              <li
                className="back-btn"
                onClick={() => {
                  setLeftMenu(!leftMenu);
                  document.body.style.overflow = "visible";
                }}>
                <a>
                  <i className="fa fa-angle-left"></i>Back
                </a>
              </li>
              
              {loading ? (
                <li className="text-center py-3">
                  <span>Loading categories...</span>
                </li>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <li key={category.id} style={{ padding: '4px 0' }}>
                    <a href={`/collections/leftsidebar?brand=&color=&category=${category.name}&pricemin=0&pricemax=999999`} style={{ display: 'flex', alignItems: 'center' }}>
                      <Media 
                        src={getCategoryIcon(category)} 
                        alt={category.name} 
                        className="img-fluid" 
                        style={{ width: '20px', height: '20px', marginRight: '8px' }}
                      />
                      <span style={{ fontSize: '12px' }}>{category.name.toUpperCase()}</span>
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-center py-3">
                  <span>No categories found</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default ByCategory;
