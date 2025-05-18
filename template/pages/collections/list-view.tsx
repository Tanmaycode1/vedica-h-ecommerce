import { NextPage } from "next";
import { Row, Col } from "reactstrap";

import Layout1 from "../../views/layouts/layout1";
import Sidebar from "../../views/Collections/Sidebar";
import NewProduct from "../../views/Collections/NewProduct";
import OfferSlider from "../../views/Collections/OfferSlider";
import Collection from "../../views/Collections/Collection";
import Breadcrumb from "views/Containers/Breadcrumb";
import { useContext, useEffect, useState } from "react";
import { FilterContext } from "helpers/filter/filter.context";
import { useRouter } from "next/router";

const ThreeGrid: NextPage = () => {
  const { selectedBrands, selectedCategory } = useContext(FilterContext);
  const [pageTitle, setPageTitle] = useState("Collections");
  const router = useRouter();
  
  useEffect(() => {
    // Get values from query parameters for initial load
    const { brand, category } = router.query;
    
    // Create dynamic title based on filters
    let title = "Collections";
    let brandTitle = "";
    
    // Handle category
    if (category) {
      title = Array.isArray(category) ? category[0] : category;
    }
    
    // Handle brand(s)
    if (brand) {
      if (Array.isArray(brand)) {
        // Multiple brands
        if (brand.length > 2) {
          // More than 2 brands, show first one and "and more"
          brandTitle = `${brand[0]} and more`;
        } else if (brand.length === 2) {
          // Exactly 2 brands, join with "and"
          brandTitle = `${brand[0]} and ${brand[1]}`;
        } else if (brand.length === 1) {
          // Just one brand in array
          brandTitle = brand[0];
        }
      } else {
        // Single brand as string
        brandTitle = brand;
      }
    }
    
    // Format final title
    if (brandTitle && title !== "Collections") {
      // Both brand and category available
      setPageTitle(`${brandTitle} ${title}`);
    } else if (brandTitle) {
      // Only brand available
      setPageTitle(brandTitle);
    } else {
      // Only category or default
      setPageTitle(title);
    }
    
  }, [router.query, selectedCategory, selectedBrands]);

  return (
    <Layout1>
      <Breadcrumb parent="Category" title={pageTitle} />
      <section className="section-big-pt-space ratio_asos bg-light">
        <div className="collection-wrapper">
          <div className="custom-container">
            <Row>
              {/* Sidebar */}
              <Col sm="3" className="collection-filter category-page-side">
                <div className="sticky-sidebar">
                  <Sidebar />
                  <NewProduct />
                </div>
                <OfferSlider />
              </Col>

              {/* Collection */}
              <Collection cols="col-md-12 col-sm-6" layoutList="list-view" />
            </Row>
          </div>
        </div>
      </section>
    </Layout1>
  );
};

export default ThreeGrid;
