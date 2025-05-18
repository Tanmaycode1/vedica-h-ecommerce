import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Media } from "reactstrap";
import { useRouter } from "next/router";
import apiService from "../../helpers/apiService";

const CollectionBanner: NextPage = () => {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Banner styles
  const bannerStyles = {
    wrapper: {
      position: 'relative',
      overflow: 'hidden',
      height: '300px',  // Fixed height for the banner
      width: '100%',
      marginBottom: '30px'
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',  // Cover the entire area while maintaining aspect ratio
      objectPosition: 'center',  // Center the image
    },
    content: {
      position: 'absolute',
      bottom: '0',
      left: '0',
      width: '100%',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(5px)'
    }
  };

  useEffect(() => {
    // Get collection from URL query parameters
    const { category, slug } = router.query;
    
    // If no category or category is ALL, don't show banner
    if ((!category && !slug) || category === "ALL" || category === "all") {
      setCollection(null);
      return;
    }

    // Fetch collection data from API
    const fetchCollectionData = async () => {
      setLoading(true);
      try {
        let collectionData;

        // Try to fetch by slug first if available
        if (slug && typeof slug === 'string') {
          collectionData = await apiService.getCollectionBySlug(slug);
        } 
        // Otherwise try to match by category name
        else if (category && typeof category === 'string') {
          // Get all collections and find one matching the category
          const collections = await apiService.getCollections();
          collectionData = collections.find(c => 
            c.name.toLowerCase() === category.toLowerCase() ||
            c.slug.toLowerCase() === category.toLowerCase()
          );
        }

        // If we found collection data
        if (collectionData) {
          // Check for nested structure - some APIs return { collection: { ... } }
          const collectionObj = collectionData.collection || collectionData;
          
          // Format the image URL correctly
          let imageUrl = collectionObj.image_url;
          
          // Ensure the image_url has the correct prefix
          if (imageUrl) {
            // If it doesn't start with http or /uploads, add the /uploads prefix
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/uploads')) {
              imageUrl = `/uploads${imageUrl}`;
            }
            
            // Add API base URL if it's a relative path but not a blob URL
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('blob:')) {
              imageUrl = `http://localhost:3002${imageUrl}`;
            }
          }
          
          setCollection({
            ...collectionObj,
            imageUrl
          });
        } else {
          // Fallback to basic data if no collection found
          setCollection({
            name: category || slug,
            imageUrl: "/images/category/1.jpg", // Default image
            description: `Collection of products in the ${category || slug} category.`
          });
        }
      } catch (error) {
        console.error("Error fetching collection data:", error);
        // Fallback to basic data
        setCollection({
          name: category || slug,
          imageUrl: "/images/category/1.jpg", // Default image
          description: `Collection of products in the ${category || slug} category.`
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollectionData();
  }, [router.query]);

  // If no collection or collection is ALL, don't show banner
  if (!collection) {
    return null;
  }

  return (
    <div className="top-banner-wrapper" style={bannerStyles.wrapper}>
      {loading ? (
        <div className="placeholder-banner">Loading collection data...</div>
      ) : (
        <>
          <a href="#" style={{ display: 'block', height: '100%' }}>
            <Media 
              src={collection.imageUrl || "/images/category/1.jpg"} 
              alt={collection.name}
              style={bannerStyles.image}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop
                target.src = "/images/category/1.jpg";
              }}
            />
          </a>
          <div className="top-banner-content small-section" style={bannerStyles.content}>
            <h4>{collection.name}</h4>
            <h5>{collection.description}</h5>
          </div>
        </>
      )}
    </div>
  );
};

export default CollectionBanner;
