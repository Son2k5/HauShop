import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAppSelector } from "../../store/hooks";
import { productService } from "../../services/productService";
import { formatPrice } from "../../utils/formatPrice";
import type { ProductSummaryDto } from "../../@types/product.type";

const Header: React.FC = () => {
  const {
    user,
    isAuthenticated,
    logout,
    updateAvatar,
    removeAvatar,
    refreshUser,
  } = useAuth();

  const totalQty = useAppSelector((state) => state.cart.totalQty);

  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSummaryDto[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileMenu]);

  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/shop") return;

    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get("search") ?? "");
  }, [location.pathname, location.search]);

  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setSuggestionsLoading(true);
        const data = await productService.getAll({
          search: query,
          isActive: true,
          page: 1,
          pageSize: 5,
        });

        if (!cancelled) {
          setSuggestions(data.items ?? []);
          setShowSuggestions(true);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Search suggestions failed:", error);
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSuggestionsLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const storedUser = localStorage.getItem("_u");
    if (storedUser && !user) {
      refreshUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarClick = () => {
    if (isAuthenticated) {
      setShowUserMenu((prev) => !prev);
    } else {
      navigate("/signin");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

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
      setShowUserMenu(false);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("Are you sure you want to remove your avatar?")) return;

    try {
      await removeAvatar();
      setShowUserMenu(false);
    } catch (error) {
      console.error("Failed to remove avatar:", error);
      alert("Failed to remove avatar. Please try again.");
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate("/signin");
  };

  const handleSearchSubmit = () => {
    const query = searchQuery.trim();
    const target = query ? `/shop?search=${encodeURIComponent(query)}` : "/shop";

    navigate(target);
    setShowSuggestions(false);
    setShowSearchBar(false);
    setShowMobileMenu(false);
  };

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    setShowSearchBar(false);
    setShowMobileMenu(false);
    navigate(`/shop/${slug}`);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "Contact", path: "/contact-us" },
    { name: "About", path: "/about-us" },
  ];

  const avatarUrl = user?.avatar;

  const iconButtonClass =
    "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors duration-200 hover:bg-gray-100 hover:text-red-500";

  const desktopNavClass = (path: string) =>
    `relative text-sm xl:text-[15px] 2xl:text-base font-medium tracking-[0.2px] transition-colors duration-200 whitespace-nowrap ${
      location.pathname === path ? "text-red-500" : "text-gray-800 hover:text-red-500"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto max-w-full lg:max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px]">
            <div className="flex h-16 items-center justify-between gap-4 lg:h-[74px] 2xl:h-20">
              {/* Left */}
              <div className="flex min-w-0 items-center gap-4 lg:gap-8 xl:gap-10">
                <Link to="/" className="shrink-0">
                  <span
                    className="block text-xl font-extrabold tracking-[0.16em] text-black sm:text-2xl xl:text-[30px]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    HAUSHOP
                  </span>
                </Link>

                <nav className="hidden lg:flex items-center gap-5 xl:gap-7 2xl:gap-9">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={desktopNavClass(link.path)}
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {link.name}
                      {location.pathname === link.path && (
                        <span className="absolute -bottom-[23px] left-0 h-[2px] w-full rounded-full bg-red-500 lg:-bottom-[27px] 2xl:-bottom-[30px]" />
                      )}
                    </Link>
                  ))}

                  {!isAuthenticated && (
                    <Link
                      to="/signup"
                      className="text-sm xl:text-[15px] 2xl:text-base font-medium text-gray-800 transition-colors duration-200 hover:text-red-500"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Sign Up
                    </Link>
                  )}
                </nav>
              </div>

              {/* Mobile actions */}
              <div className="flex items-center gap-1 lg:hidden">
                <button
                  onClick={() => setShowSearchBar(!showSearchBar)}
                  className={iconButtonClass}
                  aria-label="Toggle search"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>

                <button
                  data-mobile-toggle
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className={iconButtonClass}
                  aria-label="Toggle menu"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Desktop right */}
              <div className="hidden lg:flex items-center gap-2 xl:gap-3 2xl:gap-4">
                            {/* Search */}
                            <div
              ref={searchBoxRef}
              className="
                relative
                flex items-center 
                h-11
                rounded-full 
                bg-gray-100 
                px-4
                border border-transparent
                transition-all duration-200
                focus-within:bg-white
                focus-within:border-red-400
              "
            >
          <input
            ref={searchInputRef}
            type="text"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (searchQuery.trim().length >= 2) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchSubmit();
              }
            }}
            className="
              w-40 xl:w-56 2xl:w-72
              bg-transparent
              text-sm text-gray-700
              placeholder-gray-400
              outline-none
              border-none
              focus:outline-none
              focus:ring-0
              appearance-none
            "
            style={{ fontFamily: "Poppins, sans-serif" }}
          />

          <button
            type="button"
            onClick={handleSearchSubmit}
            className="
              ml-2 
              flex items-center justify-center
              w-8 h-8
              rounded-full
              text-gray-500
              transition
              hover:bg-gray-200
              hover:text-red-500
            "
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {showSuggestions && searchQuery.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
              {suggestionsLoading ? (
                <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
              ) : suggestions.length > 0 ? (
                <div className="py-2">
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSuggestionClick(product.slug)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{formatPrice(product.minVariantPrice ?? product.price)}</p>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full border-t border-gray-100 px-4 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-red-50"
                  >
                    View all results for "{searchQuery.trim()}"
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
              )}
            </div>
          )}
        </div>

                {/* Wishlist */}
                <Link to="/wishlist" className={iconButtonClass}>
                  <svg className="h-5 w-5 xl:h-[22px] xl:w-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.7}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </Link>

                {/* Cart */}
                <Link to="/cart" className={iconButtonClass}>
                  <svg className="h-5 w-5 xl:h-[22px] xl:w-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.7}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 17v4"
                    />
                  </svg>

                  {totalQty > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white xl:h-5 xl:min-w-5">
                      {totalQty > 99 ? "99+" : totalQty}
                    </span>
                  )}
                </Link>

                {/* User */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={handleAvatarClick}
                    className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200 ring-1 ring-transparent transition-colors duration-200 hover:ring-red-400 xl:h-11 xl:w-11"
                    aria-label={isAuthenticated ? "Open user menu" : "Sign in"}
                  >
                    {avatarUrl ? (
                      <img
                        src={`${avatarUrl}?t=${Date.now()}`}
                        alt={`${user?.firstName ?? ""} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg
                        className="h-5 w-5 text-gray-500 xl:h-6 xl:w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.7}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}

                    {uploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      </div>
                    )}
                  </button>

                  <div
                    className={`absolute right-0 top-[calc(100%+10px)] w-72 origin-top-right rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_18px_50px_rgba(0,0,0,0.12)] transition-all duration-200 ${
                      showUserMenu && isAuthenticated
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-1 opacity-0"
                    }`}
                  >
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-200">
                          {avatarUrl ? (
                            <img
                              src={`${avatarUrl}?t=${Date.now()}`}
                              alt="avatar"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <svg className="m-2.5 h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.6}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="truncate text-xs text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.9}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        {uploadingAvatar ? "Uploading..." : "Upload Avatar"}
                      </button>

                      {avatarUrl && (
                        <button
                          onClick={handleRemoveAvatar}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.9}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Remove Avatar
                        </button>
                      )}
                    </div>

                    <div className="my-2 h-px bg-gray-100" />

                    <div className="space-y-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.7}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        My Profile
                      </Link>

                      <Link
                        to="/orders"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.7}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        My Orders
                      </Link>

                      <button
                        onClick={() => {
                          navigate("/cancellations");
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                          <circle cx="12" cy="12" r="3" fill="currentColor" />
                        </svg>
                        My Cancellations
                      </button>

                      <button
                        onClick={() => {
                          navigate("/reviews");
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.7}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        My Reviews
                      </button>

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.7}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile search */}
            {showSearchBar && (
              <div className="border-t border-gray-100 pb-4 pt-3 lg:hidden">
                <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 2) {
                        setShowSuggestions(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchSubmit();
                        return;
                      }

                      if (e.key === "Escape") {
                        setShowSearchBar(false);
                      }
                    }}
                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowSearchBar(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {showSuggestions && searchQuery.trim().length >= 2 && (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                    {suggestionsLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                    ) : suggestions.length > 0 ? (
                      <div className="py-2">
                        {suggestions.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSuggestionClick(product.slug)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                          >
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                  No img
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                              <p className="mt-0.5 text-xs text-gray-500">{formatPrice(product.minVariantPrice ?? product.price)}</p>
                            </div>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          className="w-full border-t border-gray-100 px-4 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-red-50"
                        >
                          View all results for "{searchQuery.trim()}"
                        </button>
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
          showMobileMenu ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-black/45" onClick={() => setShowMobileMenu(false)} />

        <div
          ref={mobileMenuRef}
          className={`absolute right-0 top-0 h-full w-[300px] bg-white shadow-2xl transition-transform duration-300 ease-out sm:w-[340px] ${
            showMobileMenu ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <span
              className="text-lg font-bold tracking-[0.08em] text-black"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              MENU
            </span>

            <button
              onClick={() => setShowMobileMenu(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-500"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex h-[calc(100%-64px)] flex-col overflow-y-auto">
            {isAuthenticated && (
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200">
                    {avatarUrl ? (
                      <img
                        src={`${avatarUrl}?t=${Date.now()}`}
                        alt="avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg className="m-2.5 h-7 w-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="flex-1 py-2">
              <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                Navigation
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? "bg-red-50 text-red-500"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {!isAuthenticated && (
                <Link
                  to="/signup"
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Sign Up
                </Link>
              )}

              <div className="my-2 border-t border-gray-200" />

              <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                Quick Actions
              </div>

              <Link
                to="/wishlist"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.7}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Wishlist
              </Link>

              <Link
                to="/cart"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <div className="relative inline-flex h-5 w-5 items-center justify-center">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.7}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 17v4"
                    />
                  </svg>
                  {totalQty > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                      {totalQty > 99 ? "99+" : totalQty}
                    </span>
                  )}
                </div>
                Cart
              </Link>

              {isAuthenticated && (
                <>
                  <div className="my-2 border-t border-gray-200" />

                  <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    Account
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.7}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    My Profile
                  </Link>

                  <Link
                    to="/orders"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.7}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    My Orders
                  </Link>

                  <Link
                    to="/cancellations"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </svg>
                    My Cancellations
                  </Link>

                  <Link
                    to="/reviews"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.7}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    My Reviews
                  </Link>

                  <div className="my-2 border-t border-gray-200" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.7}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
                </>
              )}

              {!isAuthenticated && (
                <>
                  <div className="my-2 border-t border-gray-200" />
                  <div className="p-4">
                    <Link
                      to="/signin"
                      className="flex w-full items-center justify-center rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                    >
                      Sign In
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
