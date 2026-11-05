import HeroSection from "../components/HeroSection";
import FeaturedEvents from "../components/FeaturedEvents";
import ShopHighlights from "../components/ShopHighlights";
import NonProfitHighlights from "../components/NonProfitHighlights";
import Testimonials from "../components/Testimonials";

const Home = () => {
  return (
    <div className="bg-white min-h-screen selection:bg-secondary-500 selection:text-white">
      <HeroSection />
      <FeaturedEvents />
      <ShopHighlights />
      <NonProfitHighlights />
      <Testimonials />
    </div>
  );
};

export default Home;
