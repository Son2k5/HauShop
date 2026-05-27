import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import { cachePolicy } from "../../lib/cachePolicy";
import { queryKeys } from "../../lib/queryKeys";
import { ROUTES, routeTo } from "../../lib/routes";
import { cartDtoToState } from "../../lib/cart";
import { logger } from "../../lib/logger";
import { useCart } from "../../hooks/useCart";
import type { ProductSummaryDto } from "../../@types/product.type";
import DesktopNav from "./header/DesktopNav";
import HeaderActions from "./header/HeaderActions";
import HeaderSearch from "./header/HeaderSearch";
import MobileHeaderActions from "./header/MobileHeaderActions";
import UserMenu from "./header/UserMenu";
import { navLinks } from "./header/headerLinks";

const MobileDrawer = lazy(() => import("./header/MobileDrawer"));

const iconButtonClass =
  "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors duration-200 hover:bg-gray-100 hover:text-red-500";

export default function Header() {
  const { user, status, isAuthenticated, logout, updateAvatar, removeAvatar } = useAuth();
  const cartQuery = useCart({ enabled: isAuthenticated });
  const totalQty = useMemo(
    () => (isAuthenticated ? cartDtoToState(cartQuery.data).totalQty : 0),
    [cartQuery.data, isAuthenticated]
  );
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery.trim(), 200);

  const verifiedUser = status === "authenticated" ? user : null;
  const avatarUrl = verifiedUser?.avatar;
  const resolvedAvatarUrl = avatarUrl ? `${avatarUrl}?v=${avatarVersion}` : null;
  const isAdmin = verifiedUser?.role === "Admin";
  const isAdminRoute = location.pathname.startsWith(ROUTES.ADMIN);
  const adminToggleTarget = isAdminRoute ? ROUTES.HOME : ROUTES.ADMIN;
  const adminToggleLabel = isAdminRoute ? "Back to Store" : "Admin Panel";

  const shouldFetchSuggestions = showSuggestions && debouncedSearch.length >= 2;
  const suggestionsQuery = useQuery({
    queryKey: queryKeys.products.suggestions(debouncedSearch),
    queryFn: async ({ signal }) => {
      const { productService } = await import("../../services/productService");
      const data = await productService.getAll(
        {
          search: debouncedSearch,
          isActive: true,
          page: 1,
          pageSize: 5,
          includeTotal: false,
        },
        signal
      );
      return (data.items ?? []) as ProductSummaryDto[];
    },
    enabled: shouldFetchSuggestions,
    staleTime: cachePolicy.suggestions.staleTime,
    gcTime: cachePolicy.suggestions.gcTime,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }

      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest("[data-mobile-toggle]")) {
          setShowMobileMenu(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearchBar && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchBar]);

  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileMenu]);

  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== ROUTES.SHOP) return;

    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get("search") ?? "");
  }, [location.pathname, location.search]);

  const closeSearchUi = () => {
    setShowSuggestions(false);
    setShowSearchBar(false);
    setShowMobileMenu(false);
  };

  const handleAvatarClick = () => {
    if (isAuthenticated) {
      setShowUserMenu((current) => !current);
      return;
    }

    navigate(ROUTES.SIGN_IN);
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      await updateAvatar(file);
      setAvatarVersion((current) => current + 1);
      setShowUserMenu(false);
    } catch (error) {
      logger.error("Failed to upload avatar", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your avatar?")) return;

    try {
      await removeAvatar();
      setAvatarVersion((current) => current + 1);
      setShowUserMenu(false);
    } catch (error) {
      logger.error("Failed to remove avatar", error);
      alert("Failed to remove avatar. Please try again.");
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
    await logout();
    navigate(ROUTES.SIGN_IN);
  };

  const handleSearchSubmit = () => {
    const query = searchQuery.trim();
    navigate(routeTo.shopSearch(query));
    closeSearchUi();
  };

  const handleSuggestionClick = (slug: string) => {
    closeSearchUi();
    navigate(routeTo.product(slug));
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto max-w-full lg:max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px]">
            <div className="flex h-16 items-center justify-between gap-4 lg:h-[74px] 2xl:h-20">
              <div className="flex min-w-0 items-center gap-4 lg:gap-8 xl:gap-10">
                <Link to="/" className="shrink-0">
                  <span
                    className="block text-xl font-extrabold tracking-[0.16em] text-black sm:text-2xl xl:text-[30px]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    HAUSHOP
                  </span>
                </Link>

                <DesktopNav
                  navLinks={navLinks}
                  pathname={location.pathname}
                  isAuthenticated={isAuthenticated}
                  isAdmin={isAdmin}
                  adminToggleTarget={adminToggleTarget}
                  adminToggleLabel={adminToggleLabel}
                />
              </div>

              <MobileHeaderActions
                iconButtonClass={iconButtonClass}
                showSearchBar={showSearchBar}
                showMobileMenu={showMobileMenu}
                onToggleSearch={() => setShowSearchBar((current) => !current)}
                onToggleMenu={() => setShowMobileMenu((current) => !current)}
              />

              <div className="hidden items-center gap-2 lg:flex xl:gap-3 2xl:gap-4">
                <HeaderSearch
                  mode="desktop"
                  inputRef={searchInputRef}
                  searchBoxRef={searchBoxRef}
                  searchQuery={searchQuery}
                  showSuggestions={showSuggestions}
                  suggestions={suggestionsQuery.data ?? []}
                  suggestionsLoading={suggestionsQuery.isFetching}
                  onQueryChange={setSearchQuery}
                  onSuggestionsChange={setShowSuggestions}
                  onSubmit={handleSearchSubmit}
                  onSuggestionClick={handleSuggestionClick}
                />

                <HeaderActions totalQty={totalQty} iconButtonClass={iconButtonClass} />

                <UserMenu
                  user={verifiedUser}
                  isAuthenticated={isAuthenticated}
                  isAdmin={isAdmin}
                  avatarUrl={avatarUrl}
                  resolvedAvatarUrl={resolvedAvatarUrl}
                  showUserMenu={showUserMenu}
                  uploadingAvatar={uploadingAvatar}
                  adminToggleTarget={adminToggleTarget}
                  adminToggleLabel={adminToggleLabel}
                  menuRef={menuRef}
                  fileInputRef={fileInputRef}
                  onAvatarClick={handleAvatarClick}
                  onAvatarUpload={handleAvatarUpload}
                  onRemoveAvatar={handleRemoveAvatar}
                  onLogout={handleLogout}
                  onClose={() => setShowUserMenu(false)}
                />
              </div>
            </div>

            {showSearchBar && (
              <HeaderSearch
                mode="mobile"
                inputRef={searchInputRef}
                searchQuery={searchQuery}
                showSuggestions={showSuggestions}
                suggestions={suggestionsQuery.data ?? []}
                suggestionsLoading={suggestionsQuery.isFetching}
                onQueryChange={setSearchQuery}
                onSuggestionsChange={setShowSuggestions}
                onSubmit={handleSearchSubmit}
                onSuggestionClick={handleSuggestionClick}
                onCloseMobile={() => setShowSearchBar(false)}
              />
            )}
          </div>
        </div>
      </header>

      {showMobileMenu && (
        <Suspense fallback={null}>
          <MobileDrawer
            navLinks={navLinks}
            pathname={location.pathname}
            user={verifiedUser}
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            avatarUrl={avatarUrl}
            resolvedAvatarUrl={resolvedAvatarUrl}
            totalQty={totalQty}
            adminToggleTarget={adminToggleTarget}
            adminToggleLabel={adminToggleLabel}
            mobileMenuRef={mobileMenuRef}
            onClose={() => setShowMobileMenu(false)}
            onLogout={handleLogout}
          />
        </Suspense>
      )}
    </>
  );
}
