import React, { useContext, useState, useEffect } from "react";
import { NextPage } from "next";
import { Row, Col, Spinner, Pagination, PaginationItem, PaginationLink } from "reactstrap";
import ProductBox from "../layouts/widgets/Product-Box/productbox";
import CollectionProductBox from "../layouts/widgets/Product-Box/CollectionProductBox";
import CollectionBanner from "./CollectionBanner";
import { FilterContext } from "../../helpers/filter/filter.context";
import { CartContext } from "../../helpers/cart/cart.context";
import { WishlistContext } from "../../helpers/wishlist/wish.context";
import { Skeleton } from "../../common/skeleton";
import { CompareContext } from "helpers/compare/compare.context";
import apiService from "../../helpers/apiService";

type CollectionProps = {
  cols: any;
  layoutList: string;
};

const Collection: NextPage<CollectionProps> = ({ cols, layoutList }) => {
  const { selectedCategory, selectedBrands, selectedColor, selectedPrice, setSelectedColor, setSelectedBrands, setLeftSidebarOpen, leftSidebarOpen } = useContext(FilterContext);
  const { addToCart } = React.useContext(CartContext);
  const { addToWish } = React.useContext(WishlistContext);
  const { addToCompare } = React.useContext(CompareContext);
  const [grid, setGrid] = useState(cols);
  const [sortBy, setSortBy] = useState("ASC_ORDER");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [layout, setLayout] = useState(layoutList);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isNewFilter, setIsNewFilter] = useState(false);
  const [isSaleFilter, setIsSaleFilter] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Function to fetch products from the backend
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare query parameters - use consistent naming with backend filter API
      const params: any = {};
      
      // Add all applicable filters
      if (selectedCategory && selectedCategory !== "ALL") {
        params.category = selectedCategory;
      }
      
      if (selectedBrands && selectedBrands.length > 0) {
        params.brand = selectedBrands.join(',');
      }
      
      if (selectedColor && selectedColor !== "") {
        params.color = selectedColor;
      }
      
      if (selectedPrice) {
        params.min_price = selectedPrice.min;
        params.max_price = selectedPrice.max;
      }
      
      if (isNewFilter) {
        params.is_new = true;
      }
      
      if (isSaleFilter) {
        params.is_sale = true;
      }
      
      // Add pagination with consistent page size
      params.page = currentPage;
      params.limit = pageSize;
      
      // Add sorting
      if (sortBy) {
        params.sort_by = sortBy;
      }
      
      // Add timestamp to prevent caching issues
      params._t = Date.now();
      
      console.log('Fetching products with params:', params);
      
      // Call API with a timeout to handle slow responses
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const result: any = await Promise.race([
        apiService.getProducts(params),
        timeoutPromise
      ]);
      
      console.log('API Response:', result);
      
      // Extract data from response with fallbacks
      const apiProducts = result.products || [];
      const totalCount = result.totalCount || 0;
      const pages = result.totalPages || 1;
      
      // Log pagination information for debugging
      console.log(`Pagination response: page=${currentPage}, totalCount=${totalCount}, totalPages=${pages}, received=${apiProducts.length} products`);
      
      // Replace products completely instead of appending
      // This ensures we always display the correct page of results
      setProducts(apiProducts);
      setTotalProducts(totalCount);
      setTotalPages(pages);
      
      // Calculate if there are more products to load
      const hasMoreProducts = currentPage < pages;
      setHasMore(hasMoreProducts);
      
      // When no products but filters are applied, show empty result message
      if (apiProducts.length === 0 && 
          ((selectedCategory && selectedCategory !== "ALL") || 
            selectedBrands.length > 0 || 
            selectedColor || 
            isNewFilter || 
            isSaleFilter)) {
        console.log("No products found with the current filters");
        
        // Dispatch event to notify sidebar about empty results
        window.dispatchEvent(new CustomEvent('empty-filter-results', { 
          detail: { 
            category: selectedCategory, 
            brands: selectedBrands 
          }
        }));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Error fetching products. Please try again.");
      // Keep existing products on error to avoid flickering
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch products when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchProducts();
  }, [selectedCategory, selectedBrands, selectedColor, selectedPrice, sortBy, isNewFilter, isSaleFilter]);

  // Fetch products when page changes or page size changes
  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    fetchProducts();
  }, [currentPage, pageSize]);

  // Update URL with current filters and page
  useEffect(() => {
    const queryParams = new URLSearchParams();
    
    if (selectedCategory && selectedCategory !== "ALL") {
      queryParams.append("category", selectedCategory as string);
    }
    
    if (selectedBrands.length > 0) {
      queryParams.append("brand", selectedBrands.join(','));
    }
    
    if (selectedColor) {
      queryParams.append("color", selectedColor as string);
    }
    
    if (selectedPrice) {
      queryParams.append("pricemin", `${selectedPrice.min}`);
      queryParams.append("pricemax", `${selectedPrice.max}`);
    }
    
    if (isNewFilter) {
      queryParams.append("is_new", "true");
    }
    
    if (isSaleFilter) {
      queryParams.append("is_sale", "true");
    }
    
    if (currentPage > 1) {
      queryParams.append("page", `${currentPage}`);
    }
    
    // Update URL without reloading page
    window.history.replaceState(
      {}, 
      '', 
      `${window.location.pathname}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }, [selectedCategory, selectedBrands, selectedColor, selectedPrice, currentPage, isNewFilter, isSaleFilter]);

  // Add event listener for price sorting from sidebar
  useEffect(() => {
    const handlePriceSort = (event) => {
      setSortBy(event.detail);
    };
    
    window.addEventListener('sort-price', handlePriceSort);
    
    return () => {
      window.removeEventListener('sort-price', handlePriceSort);
    };
  }, []);

  // Add event listener for product type filtering from sidebar
  useEffect(() => {
    const handleProductTypeFilter = (event) => {
      const { type, value } = event.detail;
      if (type === 'new') {
        setIsNewFilter(value);
      } else if (type === 'sale') {
        setIsSaleFilter(value);
      }
    };
    
    window.addEventListener('filter-product-type', handleProductTypeFilter);
    
    return () => {
      window.removeEventListener('filter-product-type', handleProductTypeFilter);
    };
  }, []);

  // Function to set sort by options
  const handleSortChange = (sortOrder) => {
    setSortBy(sortOrder);
    
    // Also update the radio selection in the sidebar
    let radioValue = 0;
    switch (sortOrder) {
      case 'LOW_TO_HIGH':
        radioValue = 6;
        break;
      case 'HIGH_TO_LOW':
        radioValue = 7;
        break;
      case 'NEWEST':
        radioValue = 8;
        break;
      case 'ASC_ORDER':
        radioValue = 9;
        break;
      case 'DESC_ORDER':
        radioValue = 10;
        break;
      default:
        radioValue = 0;
    }
    
    // If a valid radio value was determined, dispatch an event to update the sidebar
    if (radioValue > 0) {
      window.dispatchEvent(new CustomEvent('update-sort-radio', { detail: radioValue }));
    }
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    console.log(`Changing to page ${pageNumber}`);
    setCurrentPage(pageNumber);
  };

  const removeBrand = (val) => {
    const temp = [...selectedBrands];
    temp.splice(selectedBrands.indexOf(val), 1);
    setSelectedBrands(temp);
  };

  const removeColor = () => {
    setSelectedColor("");
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <PaginationItem key="prev" disabled={currentPage === 1}>
        <PaginationLink previous onClick={() => handlePageChange(currentPage - 1)} />
      </PaginationItem>
    );
    
    // Calculate page range to show (show up to 5 pages)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust start page if end page is at max
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - 4);
    }
    
    // First page
    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        items.push(<PaginationItem key="ellipsis1" disabled><PaginationLink>...</PaginationLink></PaginationItem>);
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i} active={i === currentPage}>
          <PaginationLink onClick={() => handlePageChange(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<PaginationItem key="ellipsis2" disabled><PaginationLink>...</PaginationLink></PaginationItem>);
      }
      
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Next button
    items.push(
      <PaginationItem key="next" disabled={currentPage === totalPages}>
        <PaginationLink next onClick={() => handlePageChange(currentPage + 1)} />
      </PaginationItem>
    );
    
    return items;
  };

  // Display pagination information
  const getPaginationInfo = () => {
    if (isLoading) return <Spinner size="sm" className="me-2" />;
    
    if (products.length === 0) return "No products found";
    
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalProducts);
    
    return (
      <div className="pagination-info">
        <div className="results-count">
          {totalProducts} <span className="product-count-text">products</span>
        </div>
        <div className="showing-results">
          Showing{start}-{end}Page&nbsp;{currentPage}/{totalPages}
        </div>
      </div>
    );
  };

  return (
    <Col className="collection-content">
      <style jsx>{`
        .product-filter-content {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          background-color: #f8f9fa;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .search-count {
          margin-right: 20px;
          margin-bottom: 10px;
          flex-grow: 1;
        }
        
        .search-count h5 {
          margin: 0;
          color: #333;
          font-size: 14px;
          font-weight: 500;
        }
        
        .pagination-info {
          display: flex;
          flex-direction: column;
        }
        
        .results-count {
          font-size: 15px;
          margin-bottom: 8px;
          color: #333;
          font-weight: 500;
          display: flex;
          align-items: center;
        }
        
        .product-count-badge {
          background-color: #2874f0;
          color: white;
          font-weight: 600;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 14px;
          display: inline-block;
          margin-right: 8px;
          min-width: 36px;
          text-align: center;
        }
        
        .product-count-text {
          font-weight: 500;
          color: #444;
        }
        
        .showing-results {
          font-size: 13px;
          color: #666;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .showing-label {
          margin-right: 4px;
          color: #777;
        }
        
        .page-separator {
          display: inline-block;
          height: 12px;
          width: 1px;
          background-color: #ddd;
          margin: 0 8px;
        }
        
        .page-info {
          color: #777;
        }
        
        .product-page-filter-container {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          margin-left: auto;
          background: white;
          padding: 8px 12px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .product-page-per-view, .product-page-filter {
          margin: 0 8px;
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .dropdown-label {
          font-size: 13px;
          color: #555;
          margin-right: 8px;
          font-weight: 500;
          white-space: nowrap;
        }
        
        .product-page-per-view:after {
          content: '';
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          height: 20px;
          width: 1px;
          background-color: #ddd;
        }
        
        .form-select {
          height: 38px;
          padding: 5px 30px 5px 10px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          background-color: white;
          font-size: 14px;
          font-weight: 400;
          color: #495057;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 16px 12px;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          min-width: 160px;
        }
        
        .form-select:focus {
          border-color: #86b7fe;
          outline: 0;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        
        .collection-view ul {
          display: flex;
          margin: 0;
          padding: 0;
        }
        
        .collection-view li {
          margin-right: 10px;
          cursor: pointer;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .collection-view li:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
        }
        
        .collection-grid-view ul {
          display: flex;
          margin: 0;
          padding: 0;
        }
        
        .collection-grid-view li {
          margin-right: 10px;
          cursor: pointer;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .collection-grid-view li:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
        }
        
        .collection-grid-view img {
          max-width: 14px;
          height: auto;
        }
        
        @media (max-width: 767px) {
          .product-filter-content {
            flex-direction: column;
            align-items: flex-start;
            padding: 12px 15px;
          }
          
          .search-count {
            width: 100%;
            margin-bottom: 15px;
          }
          
          .product-page-filter-container {
            width: 100%;
            justify-content: space-between;
            margin-left: 0;
            flex-wrap: nowrap;
          }
          
          .form-select {
            min-width: 120px;
            padding-left: 5px;
            padding-right: 20px;
            font-size: 13px;
          }
          
          .dropdown-label {
            font-size: 12px;
            margin-right: 5px;
          }
          
          .product-count-badge {
            font-size: 13px;
            padding: 2px 8px;
          }
          
          .product-count-text {
            font-size: 14px;
          }
          
          .showing-results {
            font-size: 12px;
          }
        }
        
        /* Pagination styling */
        .pagination-summary {
          font-size: 14px;
          color: #6c757d;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }
        
        .product-count-pill {
          background: #2874f0;
          color: white;
          font-weight: 500;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
        }
        
        .pagination-info-divider {
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background-color: #aaa;
        }
        
        .page-number-info {
          color: #555;
          font-weight: 500;
        }
        
        .pagination-custom {
          display: flex;
          padding-left: 0;
          list-style: none;
          border-radius: 4px;
        }
        
        .pagination-custom .page-link {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          min-width: 38px;
          padding: 6px 12px;
          margin-left: -1px;
          line-height: 1.25;
          color: #333;
          background-color: #fff;
          border: 1px solid #dee2e6;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        
        .pagination-custom .page-link:hover {
          z-index: 2;
          color: #0056b3;
          text-decoration: none;
          background-color: #f8f9fa;
          border-color: #dee2e6;
        }
        
        .pagination-custom .page-link:focus {
          z-index: 3;
          outline: 0;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
        
        .pagination-custom .page-item.active .page-link {
          z-index: 3;
          color: #fff;
          background-color: #007bff;
          border-color: #007bff;
        }
        
        .pagination-custom .page-item.disabled .page-link {
          color: #6c757d;
          pointer-events: none;
          cursor: not-allowed;
          background-color: #fff;
          border-color: #dee2e6;
        }
        
        .pagination-custom .page-item:first-child .page-link {
          margin-left: 0;
          border-top-left-radius: 4px;
          border-bottom-left-radius: 4px;
        }
        
        .pagination-custom .page-item:last-child .page-link {
          border-top-right-radius: 4px;
          border-bottom-right-radius: 4px;
        }
      `}</style>
      <div className="page-main-content">
        <Row>
          <Col sm="12">
            {/* Collection Banner */}
            <CollectionBanner />
            
            <div className="collection-product-wrapper">
              <div className="container-fluid p-0">
                <div className="row">
                  <div className="col-sm-12">
                    {/* Filter Row */}
                    <div className="top-filter-row">
                      <Row>
                        <Col xs="12">
                          <div className="filter-main-btn">
                            <span
                              className="filter-btn"
                              onClick={() => {
                                setLeftSidebarOpen(!leftSidebarOpen);
                              }}>
                              <i className="fa fa-filter" aria-hidden="true"></i> Filter
                            </span>
                          </div>
                        </Col>
                        <Col xs="12">
                          <div className="product-filter-content">
                            <div className="search-count">
                              <h5>
                                {getPaginationInfo()}
                              </h5>
                            </div>
                            <div className="collection-view">
                              <ul>
                                <li
                                  onClick={() => {
                                    setLayout("");
                                    setGrid(cols);
                                  }}>
                                  <i className="fa fa-th grid-layout-view"></i>
                                </li>
                                <li
                                  onClick={() => {
                                    setLayout("list-view");
                                    setGrid("col-lg-12");
                                  }}>
                                  <i className="fa fa-list-ul list-layout-view"></i>
                                </li>
                              </ul>
                            </div>
                            <div className="collection-grid-view" style={layout === "list-view" ? { opacity: 0 } : { opacity: 1 }}>
                              <ul>
                                <li onClick={() => setGrid("col-lg-6")}>
                                  <img src="/images/category/icon/2.png" alt="" className="product-2-layout-view" />
                                </li>
                                <li onClick={() => setGrid("col-lg-4")}>
                                  <img src="/images/category/icon/3.png" alt="" className="product-3-layout-view" />
                                </li>
                                <li onClick={() => setGrid("col-lg-3")}>
                                  <img src="/images/category/icon/4.png" alt="" className="product-4-layout-view" />
                                </li>
                              </ul>
                            </div>
                            <div className="product-page-filter-container">
                              <div className="product-page-per-view">
                                <label className="dropdown-label">Show:</label>
                                <select 
                                  className="form-select custom-select" 
                                  onChange={(e) => setPageSize(parseInt(e.target.value))}
                                  value={pageSize}
                                >
                                  <option value="10">10</option>
                                  <option value="15">15</option>
                                  <option value="20">20</option>
                                  <option value="30">30</option>
                                  <option value="50">50</option>
                                </select>
                              </div>
                              <div className="product-page-filter">
                                <label className="dropdown-label">Sort by:</label>
                                <select 
                                  className="form-select custom-select" 
                                  value={sortBy} 
                                  onChange={(e) => handleSortChange(e.target.value)}
                                >
                                  <option value="ASC_ORDER">Default</option>
                                  <option value="HIGH_TO_LOW">Price: High to Low</option>
                                  <option value="LOW_TO_HIGH">Price: Low to High</option>
                                  <option value="NEWEST">Newest First</option>
                                  <option value="ASC_ORDER">Name: A-Z</option>
                                  <option value="DESC_ORDER">Name: Z-A</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>

                    {/* Product Grid */}
                    <div className={`product-wrapper-grid ${layout}`}>
                      <Row className="product-grid">
                        {/* Product Box */}
                        {isLoading ? (
                          <Skeleton />
                        ) : products.length === 0 ? (
                          <Col xs="12">
                            <div>
                              <div className="col-sm-12 empty-cart-cls text-center">
                                <img src={`/images/empty-search.jpg`} className="img-fluid mb-4" alt="" />
                                <h3>
                                  <strong>No Products Found</strong>
                                </h3>
                                <h4>Try changing your filter criteria.</h4>
                              </div>
                            </div>
                          </Col>
                        ) : (
                          products.map((item, i) => (
                            <div className={grid} key={i}>
                              <div className="product">
                                <div>
                                  <CollectionProductBox
                                    newLabel={item.new}
                                    {...item}
                                    layout={layout}
                                    item={item}
                                    addCompare={() => addToCompare(item)}
                                    addWish={() => addToWish(item)}
                                    addCart={() => addToCart(item)}
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </Row>
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="section-t-space">
                        <div className="text-center">
                          <div className="pagination-summary mb-3">
                            <span className="product-count-pill">{totalProducts} products</span>
                            <span className="pagination-info-divider"></span>
                            <span className="page-number-info">
                              Page {currentPage} of {totalPages}
                            </span>
                          </div>
                          <Pagination 
                            aria-label="Product pagination"
                            className="justify-content-center pagination-custom"
                          >
                            {renderPaginationItems()}
                          </Pagination>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </Col>
  );
};

export default Collection;
