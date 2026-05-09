import { lazy, Suspense } from "react";
import { Outlet, Routes, Route, useLocation } from "react-router-dom";
import SignIn from "./pages/account/SignIn";
import SignUp from "./pages/account/SignUp";
import ForgotPassword from "./pages/account/ForgotPassword";
import ResetPassword from "./pages/account/ResetPassword";
import Profile from "./pages/account/Profile";
import ChangePassword from "./pages/account/ChangePassword";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import NotFound from "./pages/NotFound";

import { AuthProvider } from "./context/authContext";
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
import SupportChatPage from "./pages/SupportChatPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminChatPage = lazy(() => import("./pages/admin/AdminChatPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminInventoryPage = lazy(() => import("./pages/admin/AdminInventoryPage"));
const AdminMediaPage = lazy(() => import("./pages/admin/BulkUpload"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminAccessDenied = lazy(() => import("./pages/admin/AdminAccessDenied"));

function StorefrontLayout() {
  return (
    <>
      <PromoBar />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function AdminPageFallback() {
  return (
    <div className="min-h-screen bg-[#fffaf4] px-6 py-10">
      <div className="mx-auto h-[70vh] max-w-[1600px] animate-pulse rounded-[32px] border border-[#f2dec4] bg-white/80" />
    </div>
  );
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <AuthProvider>
      <Routes>
        <Route element={<StorefrontLayout />}>
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
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/support-chat" element={<SupportChatPage />} />
          <Route path="/payment/vnpay-return" element={<VnPayReturnPage />} />
          {!isAdminRoute ? <Route path="*" element={<NotFound />} /> : null}
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Suspense fallback={<AdminPageFallback />}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminDashboardPage />
              </Suspense>
            }
          />
          <Route
            path="users"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminUsersPage />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminOrdersPage />
              </Suspense>
            }
          />
          <Route
            path="chat"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminChatPage />
              </Suspense>
            }
          />
          <Route
            path="products"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminProductsPage />
              </Suspense>
            }
          />
          <Route
            path="inventory"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminInventoryPage />
              </Suspense>
            }
          />
          <Route
            path="media"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminMediaPage />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminSettingsPage />
              </Suspense>
            }
          />
        </Route>

        <Route
          path="/403"
          element={
            <Suspense fallback={<AdminPageFallback />}>
              <AdminAccessDenied />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
