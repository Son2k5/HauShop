// src/App.tsx

import { Routes, Route, Navigate } from "react-router-dom";
import SignIn  from "./pages/account/SignIn";
import SignUp from "./pages/account/SignUp";
import ForgotPassword from "./pages/account/ForgotPassword";
import ResetPassword  from "./pages/account/ResetPassword";
import Profile from "./pages/account/Profile";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import NotFound from "./pages/NotFound";


import { AuthProvider } from "./context/authContext";
import Header from "./components/layout/Header";
import  Footer  from "./components/layout/Footer";
import PromoBar from "./components/layout/Promobar";
import { HeroBanner, BestSellers } from "./components/home";
import type { Product } from "./components/product";

// Home page component with all sections
function HomePage() {
  const handleAddToCart = (product: Product) => {
    console.log("Thêm vào giỏ:", product);
    // TODO: Implement cart functionality
  };

  const handleBuyNow = (product: Product) => {
    console.log("Mua ngay:", product);
    // TODO: Implement buy now functionality
  };

  return (
    <>
      <HeroBanner />
      <BestSellers onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PromoBar />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </AuthProvider>
  );
}
