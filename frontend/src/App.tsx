import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Outlet, Routes, Route, useLocation } from "react-router-dom";

import { AuthProvider } from "./context/authContext";
import Header from "./components/layout/Header";
import PromoBar from "./components/layout/Promobar";
import HomePage from "./pages/HomePage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import NotificationRealtimeBridge from "./components/notification/NotificationRealtimeBridge";

const Footer = lazy(() => import("./components/layout/Footer"));
const SupportChatWidget = lazy(() => import("./components/chat/SupportChatWidget"));
const SignIn = lazy(() => import("./pages/account/SignIn"));
const SignUp = lazy(() => import("./pages/account/SignUp"));
const ForgotPassword = lazy(() => import("./pages/account/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/account/ResetPassword"));
const Profile = lazy(() => import("./pages/account/Profile"));
const ChangePassword = lazy(() => import("./pages/account/ChangePassword"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const ProductDetailPage = lazy(() => import("./pages/ShopPageDetail"));
const CartPage = lazy(() => import("./pages/CartPage"));
const VnPayReturnPage = lazy(() => import("./pages/VnPayReturn"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const MyOrdersPage = lazy(() => import("./pages/OrderPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const SupportChatPage = lazy(() => import("./pages/SupportChatPage"));
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

type ChatPanel = "ai" | "support";

function StorefrontLayout() {
  return (
    <>
      <PromoBar />
      <Header />
      <main>
        <Outlet />
      </main>
      <LazyFooter />
      <LazySupportChatWidget />
    </>
  );
}

function LazySupportChatWidget() {
  const [initialPanel, setInitialPanel] = useState<ChatPanel | null>(null);

  if (initialPanel) {
    return (
      <Suspense fallback={<ChatLaunchButtons disabled />}>
        <SupportChatWidget initialPanel={initialPanel} />
      </Suspense>
    );
  }

  return <ChatLaunchButtons onOpen={setInitialPanel} />;
}

function ChatLaunchButtons({
  onOpen,
  disabled = false,
}: {
  onOpen?: (panel: ChatPanel) => void;
  disabled?: boolean;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[80] flex flex-col gap-3 sm:bottom-6 sm:right-6">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOpen?.("ai")}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_14px_34px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-wait disabled:opacity-70 sm:h-16 sm:w-16"
        aria-label="Mo AI chat"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v3m0 12v3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12M3 12h3m12 0h3M5.64 18.36l2.12-2.12m8.48-8.48 2.12-2.12M12 8.5A3.5 3.5 0 1 1 12 15.5 3.5 3.5 0 0 1 12 8.5Z" />
        </svg>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOpen?.("support")}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_14px_34px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-wait disabled:opacity-70 sm:h-16 sm:w-16"
        aria-label="Mo chat nhan vien"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M8 10h8M8 14h5m8-2a9 9 0 1 1-4.2-7.62L21 4l-1.38 4.2A8.96 8.96 0 0 1 21 12Z"
          />
        </svg>
      </button>
    </div>
  );
}

function LazyFooter() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;

    const element = ref.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "900px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldRender]);

  return (
    <div ref={ref} className={!shouldRender ? "min-h-64" : undefined}>
      {shouldRender ? (
        <Suspense fallback={<div className="min-h-64 bg-primeColor" />}>
          <Footer />
        </Suspense>
      ) : null}
    </div>
  );
}

function AdminPageFallback() {
  return (
    <div className="min-h-screen bg-[#fffaf4] px-6 py-10">
      <div className="mx-auto h-[70vh] max-w-[1600px] animate-pulse rounded-[32px] border border-[#f2dec4] bg-white/80" />
    </div>
  );
}

function StorefrontPageFallback() {
  return (
    <div className="mx-auto min-h-[55vh] max-w-container px-4 py-10 sm:px-6 lg:px-10">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

function SuspendedRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<StorefrontPageFallback />}>{children}</Suspense>;
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <AuthProvider>
      <NotificationRealtimeBridge />
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<SuspendedRoute><ShopPage /></SuspendedRoute>} />
          <Route path="/shop/:slug" element={<SuspendedRoute><ProductDetailPage /></SuspendedRoute>} />
          <Route path="/cart" element={<SuspendedRoute><CartPage /></SuspendedRoute>} />
          <Route path="/wishlist" element={<SuspendedRoute><WishlistPage /></SuspendedRoute>} />
          <Route path="/signin" element={<SuspendedRoute><SignIn /></SuspendedRoute>} />
          <Route path="/signup" element={<SuspendedRoute><SignUp /></SuspendedRoute>} />
          <Route path="/forgot-password" element={<SuspendedRoute><ForgotPassword /></SuspendedRoute>} />
          <Route path="/reset-password" element={<SuspendedRoute><ResetPassword /></SuspendedRoute>} />
          <Route path="/profile" element={<SuspendedRoute><Profile /></SuspendedRoute>} />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <SuspendedRoute><ChangePassword /></SuspendedRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/contact-us" element={<SuspendedRoute><ContactUs /></SuspendedRoute>} />
          <Route path="/about-us" element={<SuspendedRoute><AboutUs /></SuspendedRoute>} />
          <Route path="/checkout" element={<SuspendedRoute><CheckoutPage /></SuspendedRoute>} />
          <Route path="/orders" element={<SuspendedRoute><MyOrdersPage /></SuspendedRoute>} />
          <Route path="/orders/:id" element={<SuspendedRoute><OrderDetailPage /></SuspendedRoute>} />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <SuspendedRoute><NotificationsPage /></SuspendedRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/support-chat" element={<SuspendedRoute><SupportChatPage /></SuspendedRoute>} />
          <Route path="/payment/vnpay-return" element={<SuspendedRoute><VnPayReturnPage /></SuspendedRoute>} />
          {!isAdminRoute ? <Route path="*" element={<SuspendedRoute><NotFound /></SuspendedRoute>} /> : null}
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
            path="notifications"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <NotificationsPage />
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
        <Route path="*" element={<SuspendedRoute><NotFound /></SuspendedRoute>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
