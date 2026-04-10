import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
    const {
        user,
        isAuthenticated,
        logout,
        updateAvatar,
        removeAvatar,
        refreshUser,
    } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement;
                if (!target.closest('[data-mobile-toggle]')) {
                    setShowMobileMenu(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (showSearchBar && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearchBar]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (showMobileMenu) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showMobileMenu]);

    // Close mobile menu on route change
    useEffect(() => {
        setShowMobileMenu(false);
    }, [location.pathname]);

    // Chỉ chạy một lần khi mount để sync user từ localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('_u');
        if (storedUser && !user) {
            refreshUser();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Chỉ chạy 1 lần khi mount

    const handleAvatarClick = () => {
        if (isAuthenticated) {
            setShowUserMenu(prev => !prev);
        } else {
            navigate('/signin');
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        e.target.value = '';

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setUploadingAvatar(true);
        try {
            await updateAvatar(file);
            setShowUserMenu(false);
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            alert('Failed to upload avatar. Please try again.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('Are you sure you want to remove your avatar?')) return;

        try {
            await removeAvatar();
            setShowUserMenu(false);
        } catch (error) {
            console.error('Failed to remove avatar:', error);
            alert('Failed to remove avatar. Please try again.');
        }
    };

    const handleLogout = async () => {
        setShowUserMenu(false);
        await logout();
        navigate('/signin');
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Shop', path: '/shop' },
        { name: 'Contact', path: '/contact-us' },
        { name: 'About', path: '/about-us' },
    ];

    const avatarUrl = user?.avatar;

    return (
        <>
            <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
                {/* Container responsive cho các kích thước màn hình */}
                <div className="mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
                    {/*
                        Responsive container widths:
                        - Mobile (<768px): full width
                        - Tablet (768-1024px): max-w-full
                        - Laptop 16.5" (~1366-1440px): max-w-7xl (1280px)
                        - 24" monitor (1920px+): max-w-[1600px]
                    */}
                    <div className="max-w-full lg:max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto">
                        <div className="flex justify-between items-center h-16 lg:h-18 2xl:h-20 gap-4 lg:gap-6 xl:gap-8 2xl:gap-12">
                            {/* Logo */}
                            <Link to="/" className="flex-shrink-0">
                                <span className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl 2xl:text-3xl font-bold text-black" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    HAUSHOP
                                </span>
                            </Link>

                            {/* Desktop Navigation - hidden on mobile/tablet (<lg), show on lg+ */}
                            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-10">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`text-sm xl:text-base 2xl:text-lg font-normal transition-colors hover:text-red-500 whitespace-nowrap ${location.pathname === link.path
                                            ? 'text-red-500 border-b-2 border-red-500 pb-1'
                                            : 'text-black'
                                            }`}
                                        style={{ fontFamily: 'Poppins, sans-serif' }}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                                {!isAuthenticated && (
                                    <Link
                                        to="/signup"
                                        className="text-sm xl:text-base 2xl:text-lg font-normal text-black transition-colors hover:text-red-500 whitespace-nowrap"
                                        style={{ fontFamily: 'Poppins, sans-serif' }}
                                    >
                                        Sign Up
                                    </Link>
                                )}
                            </nav>

                            {/* Mobile/Tablet: Hamburger + Search toggle - hidden on lg+ */}
                            <div className="flex items-center gap-2 lg:hidden">
                                <button
                                    onClick={() => setShowSearchBar(!showSearchBar)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Toggle search"
                                >
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                                <button
                                    data-mobile-toggle
                                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Toggle menu"
                                >
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>

                            {/* Right side: Search + Icons - Desktop */}
                            <div className="hidden lg:flex items-center gap-3 xl:gap-4 2xl:gap-6">
                                {/* Search bar */}
                                <div className="flex items-center bg-gray-100 rounded-lg px-3 xl:px-4 py-2 2xl:py-2.5">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="What are you looking for?"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-transparent outline-none text-sm xl:text-base text-gray-700 placeholder-gray-500 w-40 xl:w-56 2xl:w-72"
                                        style={{ fontFamily: 'Poppins, sans-serif' }}
                                    />
                                    <button className="p-1 hover:text-red-500 transition-colors">
                                        <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Wishlist - Desktop */}
                                <Link to="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </Link>

                                {/* Cart - Desktop */}
                                <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <svg className="w-5 h-5 xl:w-6 xl:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 17v4" />
                                    </svg>
                                    <span className="absolute -top-1 -right-1 w-4 h-4 xl:w-5 xl:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        0
                                    </span>
                                </Link>

                                {/* User Avatar - Desktop */}
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={handleAvatarClick}
                                        className="relative w-8 h-8 xl:w-9 xl:h-9 2xl:w-10 2xl:h-10 rounded-full overflow-hidden bg-gray-200 hover:ring-2 hover:ring-red-500 transition-all"
                                        aria-label={isAuthenticated ? 'Open user menu' : 'Sign in'}
                                    >
                                        {avatarUrl ? (
                                            <img
                                                src={`${avatarUrl}?t=${Date.now()}`}
                                                alt={`${user?.firstName ?? ''} avatar`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <svg
                                                className="w-5 h-5 xl:w-6 xl:h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        )}

                                        {uploadingAvatar && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </button>

                                    {/* User Dropdown Menu */}
                                    {showUserMenu && isAuthenticated && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                                        {avatarUrl ? (
                                                            <img src={`${avatarUrl}?t=${Date.now()}`} alt="avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <svg className="w-6 h-6 m-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {user?.firstName} {user?.lastName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-4 py-2 hover:bg-gray-50">
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
                                                    className="flex items-center gap-3 w-full text-sm text-gray-700 disabled:opacity-50"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                    {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                                                </button>
                                            </div>

                                            {avatarUrl && (
                                                <div className="px-4 py-2 hover:bg-gray-50">
                                                    <button
                                                        onClick={handleRemoveAvatar}
                                                        className="flex items-center gap-3 w-full text-sm text-red-600"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Remove Avatar
                                                    </button>
                                                </div>
                                            )}

                                            <div className="border-t border-gray-100 mt-2 pt-2">
                                                <Link
                                                    to="/profile"
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setShowUserMenu(false)}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    My Profile
                                                </Link>

                                                <Link
                                                    to="/orders"
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                    onClick={() => setShowUserMenu(false)}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    My Orders
                                                </Link>

                                                <button
                                                    onClick={() => {
                                                        navigate('/cancellations');
                                                        setShowUserMenu(false);
                                                    }}
                                                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                                                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                                                    </svg>
                                                    My Cancellations
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        navigate('/reviews');
                                                        setShowUserMenu(false);
                                                    }}
                                                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    My Reviews
                                                </button>

                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Search Bar */}
                        {showSearchBar && (
                            <div className="lg:hidden pb-4 pt-2">
                                <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2 gap-2">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="What are you looking for?"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                setShowSearchBar(false);
                                            }
                                        }}
                                        className="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-500 flex-1"
                                        style={{ fontFamily: 'Poppins, sans-serif' }}
                                    />
                                    <button className="p-1 hover:text-red-500 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setShowSearchBar(false)}
                                        className="p-1 hover:text-red-500 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Menu Drawer */}
            <div
                className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${showMobileMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setShowMobileMenu(false)}
                />

                {/* Drawer Panel */}
                <div
                    ref={mobileMenuRef}
                    className={`absolute top-0 right-0 h-full w-[280px] sm:w-[320px] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${showMobileMenu ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <span className="text-lg font-bold text-black" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Menu
                        </span>
                        <button
                            onClick={() => setShowMobileMenu(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Drawer Content */}
                    <div className="flex flex-col h-[calc(100%-65px)] overflow-y-auto">
                        {/* User Section (if authenticated) */}
                        {isAuthenticated && (
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                        {avatarUrl ? (
                                            <img src={`${avatarUrl}?t=${Date.now()}`} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <svg className="w-7 h-7 m-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {user?.firstName} {user?.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Links */}
                        <nav className="flex-1 py-2">
                            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Navigation
                            </div>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${location.pathname === link.path
                                        ? 'text-red-500 bg-red-50'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            {!isAuthenticated && (
                                <Link
                                    to="/signup"
                                    className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Sign Up
                                </Link>
                            )}

                            {/* Divider */}
                            <div className="my-2 border-t border-gray-200" />

                            {/* Quick Actions */}
                            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quick Actions
                            </div>
                            <Link
                                to="/wishlist"
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                Wishlist
                            </Link>
                            <Link
                                to="/cart"
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <div className="relative">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6M12 17v4" />
                                    </svg>
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                                        0
                                    </span>
                                </div>
                                Cart
                            </Link>

                            {/* User Menu Items (if authenticated) */}
                            {isAuthenticated && (
                                <>
                                    <div className="my-2 border-t border-gray-200" />
                                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Account
                                    </div>
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        My Profile
                                    </Link>
                                    <Link
                                        to="/orders"
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        My Orders
                                    </Link>
                                    <Link
                                        to="/cancellations"
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                                            <circle cx="12" cy="12" r="3" fill="currentColor" />
                                        </svg>
                                        My Cancellations
                                    </Link>
                                    <Link
                                        to="/reviews"
                                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        My Reviews
                                    </Link>
                                    <div className="my-2 border-t border-gray-200" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </button>
                                </>
                            )}

                            {/* Sign In button (if not authenticated) */}
                            {!isAuthenticated && (
                                <>
                                    <div className="my-2 border-t border-gray-200" />
                                    <div className="p-4">
                                        <Link
                                            to="/signin"
                                            className="flex items-center justify-center w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
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