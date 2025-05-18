import React from "react";
import { Row, Col, Container, Media, Input } from "reactstrap";

type FooterSectionProps = {
  layoutLogo: string;
};

const FooterSection: React.FC<FooterSectionProps> = ({ layoutLogo }) => {
  return (
    <footer className="footer-2">
      <Container>
        <Row>
          <Col xs="12">
            <div className="footer-main-contian">
              <Row>
                <Col lg="4" md="12">
                  <div className="footer-left">
                    <div className="footer-logo">
                      <div className="vedich-logo">
                        <div className="top-lotus">❁</div>
                        <div className="vedich-logo-text">Vedic<span>H</span></div>
                        <div className="bottom-lotus">❁</div>
                      </div>
                    </div>
                    <div className="footer-detail">
                      <p>
                        Your one-stop shop for quality products at affordable prices. Explore our collection and find what you're looking for.
                      </p>
                      <ul className="paymant-bottom">
                        <li>
                          <a href="#">
                            <Media src="/images/layout-1/pay/1.png" className="img-fluid" alt="pay" />
                          </a>
                        </li>
                        <li>
                          <a href="#">
                            <Media src="/images/layout-1/pay/2.png" className="img-fluid" alt="pay" />
                          </a>
                        </li>
                        <li>
                          <a href="#">
                            <Media src="/images/layout-1/pay/3.png" className="img-fluid" alt="pay" />
                          </a>
                        </li>
                        <li>
                          <a href="#">
                            <Media src="/images/layout-1/pay/4.png" className="img-fluid" alt="pay" />
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </Col>
                <Col lg="8" md="12">
                  <div className="footer-right">
                    <Row>
                      <Col md="6">
                        <div className="footer-box">
                          <div className="footer-title">
                            <h5>Quick Links</h5>
                          </div>
                          <div className="footer-contant">
                            <ul>
                              <li>
                                <a href="/">Home</a>
                              </li>
                              <li>
                                <a href="/collections">Collections</a>
                              </li>
                              <li>
                                <a href="/collections/featured">Featured Products</a>
                              </li>
                              <li>
                                <a href="/collections/new-arrivals">New Arrivals</a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </Col>
                      <Col md="6">
                        <div className="footer-box footer-contact-box">
                          <div className="footer-title">
                            <h5>Contact Us</h5>
                          </div>
                          <div className="footer-contant">
                            <ul className="contact-list">
                              <li>
                                <i className="fa fa-map-marker"></i>
                                <span>
                                  123 Main Street <br /> <span>New York, NY 10001</span>
                                </span>
                              </li>
                              <li>
                                <i className="fa fa-phone"></i>
                                <span>Call us: (123) 456-7890</span>
                              </li>
                              <li>
                                <i className="fa fa-envelope-o"></i>
                                <span>Email: support@example.com</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
      <div className="sub-footer">
        <Container>
          <Row>
            <Col xs="12">
              <div className="sub-footer-contain">
                <p>
                  <span>© 2023 </span>All rights reserved
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </footer>
  );
};

export default FooterSection;
