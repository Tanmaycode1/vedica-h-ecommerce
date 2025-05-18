import React from "react";
import { NextPage } from "next";
import Layouts from "../views/layouts/layout1";
import SliderBanner from "../views/layouts/layout1/slider";
import TabProduct from "../views/layouts/widgets/Tab-Product/TabProduct";
import Category from "../views/layouts/widgets/roundedCategory";
import FeaturedProducts from "../views/layouts/widgets/FeaturedProducts/FeaturedProducts";
import NewsLatter from "views/Containers/news-letter";

const Home: NextPage = () => {
  return (
    <>
      <NewsLatter />
      <Layouts>
        <div className="bg-light">
          <SliderBanner />
          <TabProduct effect="icon-inline" />
          <section className="rounded-category">
            <Category />
          </section>
          <FeaturedProducts effect="icon-inline" title="Our Featured Collection" />
        </div>
      </Layouts>
    </>
  );
};

export default Home;
