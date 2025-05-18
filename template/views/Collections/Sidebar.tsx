import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { NextPage } from "next";
import { Input, Label, Collapse, Alert } from "reactstrap";
import { FilterContext } from "../../helpers/filter/filter.context";
import { useRouter } from "next/router";
import apiService from "../../helpers/apiService";

const Sidebar: NextPage = () => {
  const {
    handleBrands,
    selectedBrands,
    selectedColor,
    setSelectedColor,
    setSelectedPrice,
    setSelectedBrands,
    setSelectedCategory,
    selectedCategory,
    selectedPrice,
    leftSidebarOpen,
    setLeftSidebarOpen,
  } = useContext(FilterContext);

  // State for brands, colors, and categories
  const [brands, setBrands] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isNewFilter, setIsNewFilter] = useState(false);
  const [isSaleFilter, setIsSaleFilter] = useState(false);
  const [emptyCombinationAlert, setEmptyCombinationAlert] = useState(false);
  const [availableBrandsForCategory, setAvailableBrandsForCategory] = useState<string[]>([]);
  
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const toggleCategory = () => setIsCategoryOpen(!isCategoryOpen);
  const [isBrandOpen, setIsBrandOpen] = useState(true);
  const toggleBrand = () => setIsBrandOpen(!isBrandOpen);
  const [isColorOpen, setIsColorOpen] = useState(true);
  const toggleColor = () => setIsColorOpen(!isColorOpen);
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const togglePrice = () => setIsPriceOpen(!isPriceOpen);
  const [isProductTypeOpen, setIsProductTypeOpen] = useState(true);
  const toggleProductType = () => setIsProductTypeOpen(!isProductTypeOpen);
  const [radioChecked, setRadioChecked] = useState(null);
  const router = useRouter();

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const categoriesData = await apiService.getProductCategories();
        if (Array.isArray(categoriesData)) {
          // Check if ALL is already included in the API response
          const hasAll = categoriesData.some(
            category => category.toUpperCase() === 'ALL'
          );
          
          // Only add ALL if it's not already included
          setCategories(hasAll ? categoriesData : ['ALL', ...categoriesData]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch brands and colors when category changes
  useEffect(() => {
    const fetchBrandsAndColors = async () => {
      setLoading(true);
      try {
        // Prepare params to get brands specific to category if needed
        const params: any = {};
        if (selectedCategory && selectedCategory !== "ALL") {
          params.category = selectedCategory;
        }
        
        // Fetch brands - only fetch brands available for the current category
        let brandsData: string[] = [];
        const categoryParams = selectedCategory !== "ALL" ? 
          { category: selectedCategory } : 
          {};
          
        brandsData = await apiService.getProductBrands(categoryParams);
        
        // Set available brands for the current category
        setBrands(Array.isArray(brandsData) ? brandsData : []);
        setAvailableBrandsForCategory(Array.isArray(brandsData) ? brandsData : []);
        
        // Fetch colors with params if category is selected
        const colorsData = await apiService.getProductColors(params);
        if (Array.isArray(colorsData)) {
          setColors(colorsData);
        }
      } catch (error) {
        console.error("Error fetching brands and colors:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrandsAndColors();
    
    // Reset empty combination alert when category changes
    setEmptyCombinationAlert(false);
  }, [selectedCategory]);

  useEffect(() => {
    router.push(`${window.location.pathname}?brand=${selectedBrands}&color=${selectedColor}&category=${selectedCategory}&pricemin=${selectedPrice.min}&pricemax=${selectedPrice.max}${isNewFilter ? '&is_new=true' : ''}${isSaleFilter ? '&is_sale=true' : ''}`, undefined, {
      shallow: true,
    });
  }, [selectedCategory, selectedPrice, selectedBrands, selectedColor, isNewFilter, isSaleFilter]);

  useEffect(() => {
    const { min, max } = selectedPrice;

    if (min === 0 && max === 100) setRadioChecked(1);
    else if (min === 100 && max === 200) setRadioChecked(2);
    else if (min === 200 && max === 300) setRadioChecked(3);
    else if (min === 300 && max === 400) setRadioChecked(4);
    else if (min === 400) setRadioChecked(5);
    else setRadioChecked(null);
  }, [router.query.pricemin, selectedPrice]);

  // Listen for sort updates from the main component
  useEffect(() => {
    const handleSortUpdate = (event) => {
      setRadioChecked(event.detail);
    };
    
    window.addEventListener('update-sort-radio', handleSortUpdate);
    
    return () => {
      window.removeEventListener('update-sort-radio', handleSortUpdate);
    };
  }, []);

  // Listen for empty filter results notifications
  useEffect(() => {
    const handleEmptyResults = (event) => {
      const { category, brands } = event.detail;
      console.log(`Empty results for category: ${category} with brands: ${brands.join(', ')}`);
      setEmptyCombinationAlert(true);
    };
    
    window.addEventListener('empty-filter-results', handleEmptyResults);
    
    return () => {
      window.removeEventListener('empty-filter-results', handleEmptyResults);
    };
  }, []);

  const resetFilter = () => {
    setSelectedBrands([]);
    setSelectedColor("");
    setSelectedPrice({ min: 0, max: 999999 });
    setRadioChecked(null);
    setIsNewFilter(false);
    setIsSaleFilter(false);
    setEmptyCombinationAlert(false);
    
    // Reset sorting to default
    window.dispatchEvent(new CustomEvent('sort-price', { detail: 'ASC_ORDER' }));
  };

  // Handler for New/Sale filter changes
  const handleProductTypeChange = (type, checked) => {
    if (type === 'new') {
      setIsNewFilter(checked);
      window.dispatchEvent(new CustomEvent('filter-product-type', { 
        detail: { type: 'new', value: checked }
      }));
    } else if (type === 'sale') {
      setIsSaleFilter(checked);
      window.dispatchEvent(new CustomEvent('filter-product-type', { 
        detail: { type: 'sale', value: checked }
      }));
    }
  };

  // Handler for category selection
  const handleCategoryClick = (category, e) => {
    e.preventDefault();
    setSelectedCategory(category);
    resetFilter();
  };

  // Check if a brand is available for the selected category
  const isBrandAvailableForCategory = (brand) => {
    return selectedCategory === "ALL" || availableBrandsForCategory.includes(brand);
  };
  
  return (
    <div className="collection-filter-block creative-card creative-inner category-side">
      {/* <!-- brand filter start --> */}
      <div className="collection-mobile-back">
        <span className="filter-back" onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}>
          <i className="fa fa-angle-left" aria-hidden="true"></i> back
        </span>
      </div>

      {/* Empty Filter Combination Alert */}
      {emptyCombinationAlert && (
        <Alert color="warning" className="mb-3">
          <i className="fa fa-exclamation-triangle mr-2"></i>
          No products found with the current filters.
          <a 
            href="#" 
            className="alert-link ml-2" 
            onClick={(e) => {
              e.preventDefault();
              resetFilter();
            }}
          >
            Reset filters
          </a>
        </Alert>
      )}
      
      {/* <!-- price filter start here --> */}
      <div className="collection-collapse-block open">
        <h3 className="collapse-block-title mt-0" onClick={toggleCategory}>
          Category
        </h3>
        <Collapse isOpen={isCategoryOpen}>
          <div className="collection-collapse-block-content">
            <div className="collection-brand-filter">
              {loadingCategories ? (
                <div className="text-center p-3">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <ul className="category-list">
                  {categories.map((category, index) => (
                    <li key={`category-${index}`}>
                      <a
                        className={selectedCategory === category ? "active" : ""}
                        onClick={(e) => handleCategoryClick(category, e)}>
                        {category}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Collapse>
      </div>
      
      {/* Product type section (New/Sale) */}
      <div className="collection-collapse-block open">
        <h3 className="collapse-block-title" onClick={toggleProductType}>
          product type
        </h3>
        <Collapse isOpen={isProductTypeOpen}>
          <div className="collection-collapse-block-content">
            <div className="collection-brand-filter">
              <div className="custom-control custom-checkbox collection-filter-checkbox">
                <Input
                  checked={isNewFilter}
                  type="checkbox"
                  className="custom-control-input"
                  id="new-filter"
                  onChange={(e) => handleProductTypeChange('new', e.target.checked)}
                />
                <Label className="custom-control-label" htmlFor="new-filter">
                  New Products
                </Label>
              </div>
              <div className="custom-control custom-checkbox collection-filter-checkbox">
                <Input
                  checked={isSaleFilter}
                  type="checkbox"
                  className="custom-control-input"
                  id="sale-filter"
                  onChange={(e) => handleProductTypeChange('sale', e.target.checked)}
                />
                <Label className="custom-control-label" htmlFor="sale-filter">
                  Sale Products
                </Label>
              </div>
            </div>
          </div>
        </Collapse>
      </div>
      
      {/* Brand section */}
      {loading ? (
        <div className="text-center p-3">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="collection-collapse-block open">
          <h3 className="collapse-block-title mt-0" onClick={toggleBrand}>
            brand
          </h3>
          <Collapse isOpen={isBrandOpen}>
            <div className="collection-collapse-block-content">
              <div className="collection-brand-filter" style={{ maxHeight: '220px', overflowY: 'auto', marginTop: '5px' }}>
                {brands.length === 0 ? (
                  <p>No brands available in this category</p>
                ) : (
                  <ul className="category-list">
                    {brands.map((brand, index) => (
                      <li key={`brand-${index}`}>
                        <div className="custom-control custom-checkbox collection-filter-checkbox">
                          <Input
                            checked={selectedBrands.includes(brand)}
                            onChange={() => {
                              handleBrands(brand);
                            }}
                            type="checkbox"
                            className="custom-control-input"
                            id={`brand-${index}`}
                          />
                          <label 
                            className="custom-control-label" 
                            htmlFor={`brand-${index}`}
                          >
                            {brand}
                          </label>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Collapse>
        </div>
      )}

      {/* Color section */}
      <div className="collection-collapse-block open">
        <h3 className="collapse-block-title" onClick={toggleColor}>
          colors
        </h3>
        <Collapse isOpen={isColorOpen}>
          <div className="collection-collapse-block-content">
            <div className="color-selector">
              <ul>
                {loading ? (
                  <div className="text-center">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : colors.length === 0 ? (
                  <p>No colors available</p>
                ) : (
                  colors.map((color, index) => (
                    <li 
                      className={`${color.toLowerCase()} ${selectedColor === color ? "active" : ""}`} 
                      onClick={() => setSelectedColor(color)} 
                      key={index}
                    ></li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </Collapse>
      </div>

      {/* Price filter */}
      <div className="collection-collapse-block border-0 open">
        <h3 className="collapse-block-title" onClick={togglePrice}>
          price filter
        </h3>
        <Collapse isOpen={isPriceOpen}>
          <div className="collection-collapse-block-content">
            <div className="collection-brand-filter">
              {/* Custom price range slider */}
              <div className="price-range-slider mb-2" style={{ fontSize: '13px' }}>
                <div className="d-flex justify-content-between mb-1">
                  <label>Min Price:</label>
                  <span>₹{selectedPrice.min}</span>
                </div>
                <input 
                  type="range" 
                  className="form-range w-100" 
                  min="0" 
                  max="1000" 
                  step="10"
                  value={selectedPrice.min}
                  onChange={(e) => setSelectedPrice({...selectedPrice, min: parseInt(e.target.value)})}
                  style={{ height: '16px' }}
                />
                
                <div className="d-flex justify-content-between mt-2 mb-1">
                  <label>Max Price:</label>
                  <span>{selectedPrice.max === 999999 ? "No Limit" : `₹${selectedPrice.max}`}</span>
                </div>
                <input 
                  type="range" 
                  className="form-range w-100" 
                  min="0" 
                  max="1000" 
                  step="10"
                  value={selectedPrice.max > 1000 ? 1000 : selectedPrice.max}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setSelectedPrice({
                      ...selectedPrice, 
                      max: value === 1000 ? 999999 : value
                    });
                  }}
                  style={{ height: '16px' }}
                />
                
                <div className="d-flex mt-2">
                  <button 
                    className="btn btn-sm btn-outline-secondary me-2 py-0 px-2"
                    onClick={resetFilter}
                    style={{ fontSize: '11px' }}
                  >
                    Reset
                  </button>
                  <button 
                    className="btn btn-sm btn-primary py-0 px-2"
                    onClick={() => {
                      // Custom filter application logic if needed
                    }}
                    style={{ fontSize: '11px' }}
                  >
                    Apply
                  </button>
                </div>
              </div>
              
              <hr style={{ margin: '8px 0', opacity: 0.25 }} />
              {/* Sort by price options */}
              <div className="price-sort-options">
                <div className="custom-control custom-checkbox collection-filter-checkbox">
                  <Input
                    checked={radioChecked === 6}
                    type="radio"
                    className="custom-control-input"
                    id="price-filter-low-high"
                    onChange={() => {
                      setRadioChecked(6);
                      window.dispatchEvent(new CustomEvent('sort-price', { detail: 'LOW_TO_HIGH' }));
                    }}
                  />
                  <Label className="custom-control-label" htmlFor="price-filter-low-high">
                    Price: Low to High
                  </Label>
                </div>
                <div className="custom-control custom-checkbox collection-filter-checkbox">
                  <Input
                    checked={radioChecked === 7}
                    type="radio"
                    className="custom-control-input"
                    id="price-filter-high-low"
                    onChange={() => {
                      setRadioChecked(7);
                      window.dispatchEvent(new CustomEvent('sort-price', { detail: 'HIGH_TO_LOW' }));
                    }}
                  />
                  <Label className="custom-control-label" htmlFor="price-filter-high-low">
                    Price: High to Low
                  </Label>
                </div>
                <div className="custom-control custom-checkbox collection-filter-checkbox">
                  <Input
                    checked={radioChecked === 8}
                    type="radio"
                    className="custom-control-input"
                    id="price-filter-newest"
                    onChange={() => {
                      setRadioChecked(8);
                      window.dispatchEvent(new CustomEvent('sort-price', { detail: 'NEWEST' }));
                    }}
                  />
                  <Label className="custom-control-label" htmlFor="price-filter-newest">
                    Newest First
                  </Label>
                </div>
                <div className="custom-control custom-checkbox collection-filter-checkbox">
                  <Input
                    checked={radioChecked === 9}
                    type="radio"
                    className="custom-control-input"
                    id="price-filter-name-asc"
                    onChange={() => {
                      setRadioChecked(9);
                      window.dispatchEvent(new CustomEvent('sort-price', { detail: 'ASC_ORDER' }));
                    }}
                  />
                  <Label className="custom-control-label" htmlFor="price-filter-name-asc">
                    Name: A to Z
                  </Label>
                </div>
                <div className="custom-control custom-checkbox collection-filter-checkbox">
                  <Input
                    checked={radioChecked === 10}
                    type="radio"
                    className="custom-control-input"
                    id="price-filter-name-desc"
                    onChange={() => {
                      setRadioChecked(10);
                      window.dispatchEvent(new CustomEvent('sort-price', { detail: 'DESC_ORDER' }));
                    }}
                  />
                  <Label className="custom-control-label" htmlFor="price-filter-name-desc">
                    Name: Z to A
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </Collapse>
      </div>
    </div>
  );
};

export default Sidebar;
