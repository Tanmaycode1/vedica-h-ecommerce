import React from "react";
import { NextPage } from "next";
import Layout1 from "../../../views/layouts/layout1";
import OrdersPage from "../../../views/pages/account/ordersPage";

const Orders: NextPage = () => {
  return (
    <Layout1>
      <OrdersPage />
    </Layout1>
  );
};

export default Orders; 