import React, { useState } from "react";
import { TabContent, TabPane, Nav, NavItem, NavLink, Row, Col, Form, Input, Label } from "reactstrap";

interface TabProductProps {
  product?: any;
}

const TabProduct: React.FC<TabProductProps> = ({ product }) => {
  const [activeTab, setActiveTab] = useState("1");

  return (
    <section className="tab-product tab-exes creative-card creative-inner mb-0">
      <Row>
        <Col sm="12" lg="12">
          <Nav tabs className="nav-material" id="top-tab" role="tablist">
            <NavItem>
              <NavLink className={activeTab === "1" ? "active" : ""} onClick={() => setActiveTab("1")}>
                Description
                <div className="material-border"></div>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink className={activeTab === "2" ? "active" : ""} onClick={() => setActiveTab("2")}>
                Write Review
                <div className="material-border"></div>
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent className="nav-material" activeTab={activeTab}>
            <TabPane tabId="1">
              <p className="ps-0">
                {product?.description || 
                  "No product description available."}
              </p>
              <div className="single-product-tables">
                <table>
                  <tbody>
                    <tr>
                      <td>Brand</td>
                      <td>{product?.brand || "N/A"}</td>
                    </tr>
                    <tr>
                      <td>Category</td>
                      <td>{product?.category || "N/A"}</td>
                    </tr>
                    <tr>
                      <td>Collection</td>
                      <td>{product?.collection?.[0]?.collectionName || "N/A"}</td>
                    </tr>
                  </tbody>
                </table>
                <table>
                  <tbody>
                    <tr>
                      <td>Stock</td>
                      <td>{product?.stock || 0} items</td>
                    </tr>
                    {product?.variants && product.variants.length > 0 && (
                      <tr>
                        <td>Available Sizes</td>
                        <td>
                          {Array.from(new Set(product.variants.map(v => v.size))).filter(Boolean).join(', ') || 'N/A'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabPane>
            <TabPane tabId="2">
              <Form>
                <div className="form-row row">
                  <Col md="12">
                    <div className="media">
                      <Label className="mb-0">Rating</Label>
                      <div className="media-body ms-3">
                        <div className="rating three-star">
                          <i className="fa fa-star"></i> <i className="fa fa-star"></i> <i className="fa fa-star"></i> <i className="fa fa-star"></i> <i className="fa fa-star"></i>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md="6">
                    <Label htmlFor="name">Name</Label>
                    <Input type="text" className="form-control" id="name" placeholder="Enter Your name" required />
                  </Col>
                  <Col md="6">
                    <Label htmlFor="email">Email</Label>
                    <Input type="text" className="form-control" id="email" placeholder="Email" required />
                  </Col>
                  <Col md="12">
                    <Label htmlFor="review">Review Title</Label>
                    <Input type="text" className="form-control" id="review" placeholder="Enter your Review Subjects" required />
                  </Col>
                  <Col md="12">
                    <Label htmlFor="reviewContent">Your Review</Label>
                    <textarea className="form-control" rows={4} placeholder="Write Your Testimonial Here" id="reviewContent"></textarea>
                  </Col>
                  <Col md="12">
                    <button className="btn btn-normal" type="submit">
                      Submit Your Review
                    </button>
                  </Col>
                </div>
              </Form>
            </TabPane>
          </TabContent>
        </Col>
      </Row>
    </section>
  );
};

export default TabProduct;
