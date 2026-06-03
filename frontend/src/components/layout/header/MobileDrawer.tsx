import type { ReactNode, RefObject } from "react";
import { Link } from "react-router-dom";
import type { UserDto } from "../../../@types/auth.type";
import { ROUTES } from "../../../lib/routes";
import { CartIcon, CloseIcon, HeartIcon, LogoutIcon, UserIcon } from "./HeaderIcons";
import type { HeaderNavLink } from "./headerLinks";

type MobileDrawerProps = {
  navLinks: HeaderNavLink[];
  pathname: string;
  user: UserDto | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  avatarUrl: string | null | undefined;
  resolvedAvatarUrl: string | null;
  totalQty: number;
  adminToggleTarget: string;
  adminToggleLabel: string;
  mobileMenuRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onLogout: () => void;
};

export default function MobileDrawer({
  navLinks,
  pathname,
  user,
  isAuthenticated,
  isAdmin,
  avatarUrl,
  resolvedAvatarUrl,
  totalQty,
  adminToggleTarget,
  adminToggleLabel,
  mobileMenuRef,
  onClose,
  onLogout,
}: MobileDrawerProps) {
  return (
    <div className="fixed inset-0 z-[60] transition-opacity duration-300 lg:hidden">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div
        ref={mobileMenuRef}
        className="absolute right-0 top-0 h-full w-[300px] bg-white shadow-2xl transition-transform duration-300 ease-out sm:w-[340px]"
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <span className="text-lg font-bold tracking-[0.08em] text-black" style={{ fontFamily: "Inter, sans-serif" }}>
            MENU
          </span>

          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-red-500"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex h-[calc(100%-64px)] flex-col overflow-y-auto">
          {isAuthenticated && (
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200">
                  {avatarUrl ? (
                    <img src={resolvedAvatarUrl ?? undefined} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="m-2.5 h-7 w-7 text-gray-400" />
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
                onClick={onClose}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === link.path ? "bg-red-50 text-red-500" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {!isAuthenticated && (
              <Link
                to="/signup"
                onClick={onClose}
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Sign Up
              </Link>
            )}

            {isAdmin && (
              <Link
                to={adminToggleTarget}
                onClick={onClose}
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {adminToggleLabel}
              </Link>
            )}

            <div className="my-2 border-t border-gray-200" />
            <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              Quick Actions
            </div>

            <MobileDrawerLink to={ROUTES.WISHLIST} onClose={onClose} label="Wishlist">
              <HeartIcon className="h-5 w-5" />
            </MobileDrawerLink>

            <MobileDrawerLink to={ROUTES.CART} onClose={onClose} label="Giỏ hàng">
              <div className="relative inline-flex h-5 w-5 items-center justify-center">
                <CartIcon className="h-5 w-5" />
                {totalQty > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                    {totalQty > 99 ? "99+" : totalQty}
                  </span>
                )}
              </div>
            </MobileDrawerLink>

            {isAuthenticated && (
              <>
                <div className="my-2 border-t border-gray-200" />
                <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                  Tài khoản
                </div>

                <MobileDrawerLink to={ROUTES.PROFILE} onClose={onClose} label="Hồ sơ của tôi">
                  <UserIcon className="h-5 w-5" />
                </MobileDrawerLink>
                <MobileDrawerLink to={ROUTES.ORDERS} onClose={onClose} label="Đơn hàng của tôi">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.7}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </MobileDrawerLink>
                <MobileDrawerLink to={ROUTES.CANCELLATIONS} onClose={onClose} label="Đơn đã hủy">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                </MobileDrawerLink>
                <MobileDrawerLink to={ROUTES.REVIEWS} onClose={onClose} label="Đánh giá của tôi">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </MobileDrawerLink>

                <div className="my-2 border-t border-gray-200" />
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogoutIcon className="h-5 w-5" />
                  Đăng xuất
                </button>
              </>
            )}

            {!isAuthenticated && (
              <>
                <div className="my-2 border-t border-gray-200" />
                <div className="p-4">
                  <Link
                    to={ROUTES.SIGN_IN}
                    onClick={onClose}
                    className="flex w-full items-center justify-center rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                  >
                    Đăng nhập
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}

function MobileDrawerLink({
  to,
  label,
  onClose,
  children,
}: {
  to: string;
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
    >
      {children}
      {label}
    </Link>
  );
}
