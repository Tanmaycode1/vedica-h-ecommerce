import React from "react";
import { NextPage } from "next";
import Slider from "react-slick";
import { Container, Media } from "reactstrap";

// Slider settings
const settings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 5000,
  arrows: false,
  responsive: [
    {
      breakpoint: 768,
      settings: {
        arrows: false,
        slidesToShow: 1,
      },
    },
    {
      breakpoint: 480,
      settings: {
        arrows: false,
        slidesToShow: 1,
      },
    },
  ],
};

// Carousel images
const carouselImages = [
  {
    src: "/images/banner/banner1.jpg",
    alt: "Promotional Banner 1",
  },
  {
    src: "/images/banner/banner2.jpg",
    alt: "Promotional Banner 2",
  },
  {
    src: "/images/banner/banner3.jpg",
    alt: "Promotional Banner 3",
  }
];

const SimpleCarousel: NextPage = () => {
  return (
    <section className="simple-carousel section-pt-space b-g-white">
      <Container>
        <div className="row">
          <div className="col-12">
            <div className="title-basic">
              <h2 className="title font-fraunces">Special Offers</h2>
            </div>
            <div className="carousel-wrapper">
              <Slider {...settings}>
                {carouselImages.map((image, index) => (
                  <div key={index} className="carousel-slide">
                    <Media 
                      src={image.src} 
                      alt={image.alt}
                      className="img-fluid" 
                      style={{ 
                        borderRadius: '8px',
                        width: '100%',
                        height: 'auto',
                        objectFit: 'cover',
                        maxHeight: '300px'
                      }}
                    />
                  </div>
                ))}
              </Slider>
            </div>
          </div>
        </div>
      </Container>
      <style jsx>{`
        .simple-carousel {
          padding: 40px 0;
        }
        .carousel-wrapper {
          margin-top: 20px;
          overflow: hidden;
        }
        .title-basic {
          text-align: center;
          margin-bottom: 20px;
        }
        .title {
          font-size: 28px;
          color: #9A3324;
          position: relative;
          display: inline-block;
        }
        .title:after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          right: 0;
          margin: 0 auto;
          width: 80px;
          height: 2px;
          background-color: #FF9933;
        }
        .carousel-slide {
          padding: 5px;
        }
        :global(.slick-dots) {
          bottom: 10px;
        }
        :global(.slick-dots li button:before) {
          color: #FF9933;
        }
        :global(.slick-dots li.slick-active button:before) {
          color: #9A3324;
        }
      `}</style>
    </section>
  );
};

export default SimpleCarousel; 