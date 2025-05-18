import React, { useContext, useState, useEffect } from "react";
import { NextPage } from "next";
import { Row, Col } from "reactstrap";
import Sidebar from "../../views/Products-Detail/sidebar";
import ProductService from "../../views/Products-Detail/product-service";
import NewProduct from "../Collections/NewProduct";
import TabProduct from "../../views/Products-Detail/tab-product";
import ProductSlick from "../../views/Products-Detail/product-slick";
import { FilterContext } from "helpers/filter/filter.context";
import apiService from "../../helpers/apiService";

interface LeftSidebar {
  pathId: any;
  onProductLoaded?: (product: any) => void;
}

const LeftSidebarPage: NextPage<LeftSidebar> = ({ pathId, onProductLoaded }) => {
  const filterContext = useContext(FilterContext);
  const { filterOpen, setFilterOpen } = filterContext;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Function to fetch product data
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Extract the actual product ID from the path parameter
        // The ID might be in format "9-KindBeveragesProduct9", so we need to extract the numeric part
        const numericId = pathId ? parseInt(pathId.toString().split('-')[0]) : null;
        
        if (!numericId) {
          throw new Error("Invalid product ID");
        }
        
        // Fetch the product from the backend API
        const productData = await apiService.getProductById(numericId);
        
        // Format the product data to match the expected structure
        if (productData) {
          setProduct(productData);
          
          // Call the callback to pass product data to parent component
          if (onProductLoaded && typeof onProductLoaded === 'function') {
            onProductLoaded(productData);
          }
        } else {
          throw new Error("Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (pathId) {
      fetchProductData();
    }
  }, [pathId, onProductLoaded]);

  if (loading) {
    return (
      <div className="collection-wrapper">
        <div className="custom-container">
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collection-wrapper">
        <div className="custom-container">
          <div className="text-center py-5">
            <div className="alert alert-danger">
              <p>Error loading product: {error}</p>
              <p>Please try again later or contact support.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="collection-wrapper">
      {product && (
        <div className="custom-container">
          <Row>
            <Col
              sm="3"
              className="collection-filter"
              style={{
                left: filterOpen ? "-15px" : "",
              }}>
              <Sidebar />
              <ProductService />
              <NewProduct currentProduct={product} />
            </Col>
            <Col sm="12" lg="9" xs="12">
              <Row>
                <Col xl="12">
                  <div className="filter-main-btn mb-sm-4">
                    <span className="filter-btn" onClick={() => setFilterOpen(!filterOpen)}>
                      <i className="fa fa-filter" aria-hidden="true"></i> filter
                    </span>
                  </div>
                </Col>
              </Row>
              <Row>
                <ProductSlick item={product} bundle={false} swatch={false} />
              </Row>
              <TabProduct product={product} />
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default LeftSidebarPage;
