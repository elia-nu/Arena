import HeroSection from "../components/HeroSection";
import FeaturedEvents from "../components/FeaturedEvents";
import ShopHighlights from "../components/ShopHighlights";
import NonProfitHighlights from "../components/NonProfitHighlights";
import Testimonials from "../components/Testimonials";

const Home = () => {
  return (
    <div className="bg-secondary-50">
      <HeroSection />
      <FeaturedEvents />
      <ShopHighlights />
      <NonProfitHighlights />
      <Testimonials />
    </div>
  );
};

export default Home;
