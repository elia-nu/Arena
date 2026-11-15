import HeroSection from "../components/HeroSection";
import FeaturedEvents from "../components/FeaturedEvents";
import ShopHighlights from "../components/ShopHighlights";
import GalleryHighlights from "../components/GalleryHighlights";
import DomeGallerySection from "../components/DomeGallerySection";
import Testimonials from "../components/Testimonials";

const Home = () => {
  return (
    <div className="bg-white min-h-screen selection:bg-secondary-500 selection:text-white">
      <HeroSection />
      <FeaturedEvents />
      <ShopHighlights />
      <GalleryHighlights />
      <DomeGallerySection />
      <Testimonials />
    </div>
  );
};

export default Home;
