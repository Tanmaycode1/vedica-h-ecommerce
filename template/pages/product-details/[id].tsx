import React, { useState, useRef, useEffect } from "react";

import { NextPage } from "next";
import { useRouter } from "next/router";
import Layout1 from "../../views/layouts/layout1";
import Breadcrumb from "../../views/Containers/Breadcrumb";
import RelatedProducts from "../../views/Products-Detail/related products";
import LeftSidebarPage from "../../views/Products-Detail/leftSidebarPage";

const LeftSidebar: NextPage = () => {
  const router = useRouter();
  const id = router.query.id;
  
  // Use a ref to store product data to prevent re-renders
  const productRef = useRef(null);
  // State to control when to render RelatedProducts
  const [productLoaded, setProductLoaded] = useState(false);
  
  // Callback function to receive product data from the LeftSidebarPage component
  const handleProductLoaded = (productData) => {
    if (productData && productData.id) {
      productRef.current = productData;
      setProductLoaded(true);
    }
  };

  return (
    <Layout1>
      <Breadcrumb title="left sidebar" parent="product" />
      <section className="section-big-pt-space bg-light">
        <LeftSidebarPage pathId={id} onProductLoaded={handleProductLoaded} />
      </section>
      {productLoaded && <RelatedProducts currentProduct={productRef.current} />}
    </Layout1>
  );
};

export default LeftSidebar;
