import { Routes, Route } from "react-router-dom";
import SignIn from "./pages/account/SignIn";
import SignUp from "./pages/account/SignUp";
import ForgotPassword from "./pages/account/ForgotPassword";
import ResetPassword from "./pages/account/ResetPassword";
import Profile from "./pages/account/Profile";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import NotFound from "./pages/NotFound";

import { AuthProvider } from "./context/authContext";
import { ToastProvider } from "./context/toastContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import PromoBar from "./components/layout/Promobar";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ShopPageDetail";
import CartPage from "./pages/CartPage";
import VnPayReturnPage from "./pages/VnPayReturn";
import OrderDetailPage from "./pages/OrderDetailPage";
import MyOrdersPage from "./pages/OrderPage";
import CheckoutPage from "./pages/CheckoutPage";
import WishlistPage from "./pages/WishlistPage";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <PromoBar />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<MyOrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/payment/vnpay-return" element={<VnPayReturnPage />} />
          </Routes>
        </main>
        <Footer />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
