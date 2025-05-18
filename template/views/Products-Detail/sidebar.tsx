import React, { useContext, useState, useEffect } from "react";
import { NextPage } from "next";
import { Collapse } from "reactstrap";
import { FilterContext } from "helpers/filter/filter.context";
import apiService from "../../helpers/apiService";
import Link from "next/link";

const Sidebar: NextPage = () => {
  const [isBrandOpen, setIsBrandOpen] = useState(true);
  const toggleBrand = () => setIsBrandOpen(!isBrandOpen);
  const filterContext = useContext(FilterContext);
  const { setFilterOpen, filterOpen } = filterContext;
  
  // State to store brands from API
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch brands from API on component mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const brandsData = await apiService.getProductBrands();
        
        // Sort brands alphabetically for better UX
        if (Array.isArray(brandsData)) {
          setBrands(brandsData.sort());
        } else {
          setError("Invalid data format received from API");
        }
      } catch (err) {
        console.error("Error fetching brands:", err);
        setError("Failed to load brands");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrands();
  }, []);

  return (
    <div className="collection-filter-block creative-card creative-inner">
      <div className="collection-mobile-back">
        <span className="filter-back" onClick={() => setFilterOpen(!filterOpen)}>
          <i className="fa fa-angle-left" aria-hidden="true"></i>
          back
        </span>
      </div>
      <div className="collection-collapse-block border-0 open">
        <h3 className="collapse-block-title" onClick={toggleBrand}>
          brand
        </h3>
        <Collapse isOpen={isBrandOpen}>
          <div className="collection-collapse-block-content">
            <div className="collection-brand-filter">
              {loading ? (
                <div className="loading-brands">
                  <p>Loading brands...</p>
                </div>
              ) : error ? (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              ) : brands.length === 0 ? (
                <div className="no-brands">
                  <p>No brands available</p>
                </div>
              ) : (
                <ul className="category-list">
                  {brands.map((brand, index) => (
                    <li key={`brand-${index}`}>
                      <Link href={`/collections/leftsidebar?brand=${brand}`} legacyBehavior>
                        <a>{brand}</a>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Collapse>
      </div>
    </div>
  );
};

export default Sidebar;
