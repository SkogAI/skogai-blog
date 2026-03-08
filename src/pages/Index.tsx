import { useState, useEffect } from "react";
import PortfolioHeader from "@/components/PortfolioHeader";
import PhotographerBio from "@/components/PhotographerBio";
import PortfolioFooter from "@/components/PortfolioFooter";
import MasonryGallery from "@/components/MasonryGallery";
import Lightbox from "@/components/Lightbox";
import SEO from "@/components/SEO";
import { fetchPhotosByCategory, transformToGalleryItem } from "@/services/gallery";
import { fetchMixedMedia } from "@/services/pexels";

const Index = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [displayImages, setDisplayImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCategory = "SELECTED";

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try database first
        const dbPhotos = await fetchPhotosByCategory("selected");
        if (dbPhotos.length > 0) {
          setDisplayImages(dbPhotos.map(transformToGalleryItem));
        } else {
          // Fallback to Pexels
          const data = await fetchMixedMedia(activeCategory, 1, 20);
          setDisplayImages(data.items);
        }
      } catch (err) {
        console.error("Error loading images:", err);
        setError("Failed to load images. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []);

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Morgan Blake",
    "jobTitle": "Production Photographer",
    "description": "Production photographer specializing in fashion, editorial, and commercial photography. Creating compelling imagery for global brands and publications.",
    "url": "https://morganblake.com",
    "image": "https://morganblake.com/og-image.jpg",
    "sameAs": [
      "https://instagram.com/morganblake.photo"
    ],
    "knowsAbout": [
      "Fashion Photography",
      "Editorial Photography",
      "Commercial Production",
      "Fashion Campaigns",
      "Brand Photography"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "London",
      "addressCountry": "UK"
    }
  };

  return (
    <>
      <SEO
        title="Morgan Blake - Fashion Production & Photography"
        description="Production photographer specializing in fashion, editorial, and commercial photography. Creating compelling imagery for global brands and publications."
        canonicalUrl="/"
        ogType="profile"
        jsonLd={jsonLd}
      />

      <PortfolioHeader
        activeCategory={activeCategory}
      />
      
      <main>
        <PhotographerBio />

        {error && (
          <div className="text-center py-20">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {!error && displayImages.length > 0 && (
          <MasonryGallery
            images={displayImages}
            onImageClick={handleImageClick}
          />
        )}

        {!loading && !error && displayImages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No images found in this category.</p>
          </div>
        )}
      </main>

      {lightboxOpen && displayImages.length > 0 && (
        <Lightbox
          images={displayImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <PortfolioFooter />
    </>
  );
};

export default Index;
