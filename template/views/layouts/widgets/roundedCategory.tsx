import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import { Row, Col, Container, Media } from "reactstrap";
import Slider from "react-slick";
import apiService from "../../../helpers/apiService";
import Link from "next/link";

// Settings for the slider
const sliderSettings = {
  dots: false,
  infinite: false,
  speed: 300,
  slidesToShow: 6,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1367,
      settings: {
        slidesToShow: 5,
        slidesToScroll: 1,
        infinite: false,
      },
    },
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 1,
        infinite: false,
      },
    },
    {
      breakpoint: 767,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 1,
        infinite: false,
        arrows: false,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
        infinite: false,
        arrows: false,
        dots: true,
      },
    },
  ],
};

// Define category interface
interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  collection_type: string;
}

// Fallback images for categories without images
const categoryIcons: Record<string, string> = {
  "Food": "/images/layout-1/rounded-cat/7.png",
  "Cosmetics": "/images/layout-1/rounded-cat/6.png",
  "Jewelry": "/images/layout-1/rounded-cat/8.png",
  "Electronics": "/images/layout-1/rounded-cat/2.png",
  "Home & Garden": "/images/layout-1/rounded-cat/5.png",
  "Lighting": "/images/layout-1/rounded-cat/1.png",
  "Furniture": "/images/layout-1/rounded-cat/5.png",
  "Kitchen": "/images/layout-1/rounded-cat/7.png",
  "Decor": "/images/layout-1/rounded-cat/1.png",
  "Bedding": "/images/layout-1/rounded-cat/4.png",
  "default": "/images/layout-1/rounded-cat/1.png"
};

const Category: NextPage = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        // Get collections tree data with filter for category_parent type
        const collectionsData = await apiService.getCollectionsTree({ collection_type: 'category_parent' });
        
        // Process parent categories and remove duplicates by name
        const uniqueNames = new Set();
        const parentCategories: CategoryItem[] = collectionsData
          .map(parent => ({
            id: parent.id,
            name: parent.name,
            slug: parent.slug,
            image_url: parent.image_url,
            collection_type: parent.collection_type
          }))
          .filter(category => {
            if (uniqueNames.has(category.name)) {
              return false;
            }
            uniqueNames.add(category.name);
            return true;
          });
        
        setCategories(parentCategories);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Get appropriate image for a category
  const getCategoryImage = (category: CategoryItem): string => {
    if (category.image_url) return category.image_url;
    return categoryIcons[category.name] || categoryIcons.default;
  };

  return (
    <>
      <style jsx global>{`
        /* Styles for rounded category section */
        .rounded-category {
          padding: 40px 0;
          margin-top: 20px;
          background: #fff;
        }
        
        .category-contain {
          text-align: center;
          margin: 5px;
        }
        
        .category-contain .img-wrapper {
          border-radius: 100%;
          background-color: #f8f8f8;
          width: 110px;
          height: 110px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 153, 51, 0.2);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 5px;
        }
        
        .category-contain .img-wrapper img {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }
        
        .category-contain:hover .img-wrapper {
          border-color: #FF9933;
          box-shadow: 0 3px 8px rgba(255, 153, 51, 0.3);
          transform: translateY(-3px);
        }
        
        .category-contain:hover .img-wrapper img {
          transform: scale(1.1);
        }
        
        .category-contain .btn-rounded {
          background-color: transparent;
          color: #333;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          text-transform: capitalize;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 110px;
          margin: 0 auto;
          cursor: pointer;
          display: inline-block;
        }
        
        .category-contain:hover .btn-rounded {
          color: #FF9933;
        }
        
        /* Mobile responsive adjustments */
        @media (max-width: 767px) {
          .rounded-category {
            padding: 20px 0;
          }
          
          .category-contain .img-wrapper {
            width: 90px;
            height: 90px;
            margin-bottom: 10px;
          }
          
          .category-contain .btn-rounded {
            font-size: 12px;
            max-width: 90px;
          }
        }
        
        @media (max-width: 480px) {
          .category-contain .img-wrapper {
            width: 80px;
            height: 80px;
            margin-bottom: 8px;
          }
          
          .category-contain .btn-rounded {
            font-size: 11px;
            max-width: 80px;
          }
          
          .rounded-category .slick-dots {
            bottom: -25px;
          }
          
          .rounded-category .slick-dots li button:before {
            font-size: 8px;
          }
        }
      `}</style>
      <Container>
        <Row>
          <Col>
            <div className="title-basic mb-4">
              <h2 className="title font-fraunces text-center">Shop by Category</h2>
            </div>
            {loading ? (
              <div className="text-center my-5">
                <p>Loading categories...</p>
              </div>
            ) : categories.length > 0 ? (
              <div className="slide-6 no-arrow">
                <Slider {...sliderSettings}>
                  {categories.map((category) => (
                    <div key={category.id}>
                      <div className="category-contain">
                        <Link href={`/collections/leftsidebar?category=${encodeURIComponent(category.name)}`}>
                          <div className="img-wrapper">
                            <Media src={getCategoryImage(category)} alt={category.name} className="img-fluid" />
                          </div>
                          <div>
                            <div className="btn-rounded">{category.name}</div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  ))}
                </Slider>
              </div>
            ) : (
              <div className="text-center my-5">
                <p>No parent categories found.</p>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Category;
