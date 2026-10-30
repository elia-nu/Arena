import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Orders from "./pages/Orders";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import AboutUs from "./pages/AboutUs";
import CommunityImpact from "./pages/CommunityImpact";
import CommunityImpactDetail from "./pages/CommunityImpactDetail";
import Social from "./pages/Social";
import AdminDashboard from "./pages/AdminDashboard";
import TeamLeaderDashboard from "./pages/TeamLeaderDashboard";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import PlayerDashboard from "./pages/PlayerDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import SetPassword from "./pages/SetPassword";
import CreateAdmin from "./pages/CreateAdmin";
import SuspensionNotice from "./components/SuspensionNotice";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { NotificationProvider } from "./components/NotificationProvider";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { SocialAnalyticsProvider } from "./context/SocialAnalyticsContext";
import GlobalShareBar from "./components/social/GlobalShareBar";
import "./App.css";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const root = document.getElementById("root");
    if (root) root.scrollTop = 0;
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const isAdminDashboard = location.pathname === "/admin";
  const isPlayerDashboard = location.pathname === "/player";
  const isTeamLeaderDashboard = location.pathname === "/team-leader";
  const isDashboard =
    isAdminDashboard || isPlayerDashboard || isTeamLeaderDashboard;

  return (
    <div className="App min-h-screen flex flex-col">
      <ScrollToTop />
      {!isDashboard && <Navbar />}
      <main className="flex-grow relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:type/:id" element={<EventDetails />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<Orders />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/community-impact" element={<CommunityImpact />} />
          <Route
            path="/community-impact/:id"
            element={<CommunityImpactDetail />}
          />
          <Route path="/social" element={<Social />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team-leader"
            element={
              <ProtectedRoute requiredRole="team_leader">
                <TeamLeaderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player"
            element={
              <ProtectedRoute requiredRole="player">
                <PlayerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/create-admin" element={<CreateAdmin />} />
          <Route path="/suspended" element={<SuspensionNotice />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {!isDashboard && <GlobalShareBar />}
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <SocialAnalyticsProvider>
            <Router>
              <AppContent />
            </Router>
          </SocialAnalyticsProvider>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
