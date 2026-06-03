import type { ChangeEvent, ReactNode, RefObject } from "react";
import { Link } from "react-router-dom";
import type { UserDto } from "../../../@types/auth.type";
import { ROUTES } from "../../../lib/routes";
import { LogoutIcon, TrashIcon, UploadIcon, UserIcon } from "./HeaderIcons";

type UserMenuProps = {
  user: UserDto | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  avatarUrl: string | null | undefined;
  resolvedAvatarUrl: string | null;
  showUserMenu: boolean;
  uploadingAvatar: boolean;
  adminToggleTarget: string;
  adminToggleLabel: string;
  menuRef: RefObject<HTMLDivElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onAvatarClick: () => void;
  onAvatarUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  onLogout: () => void;
  onClose: () => void;
};

export default function UserMenu({
  user,
  isAuthenticated,
  isAdmin,
  avatarUrl,
  resolvedAvatarUrl,
  showUserMenu,
  uploadingAvatar,
  adminToggleTarget,
  adminToggleLabel,
  menuRef,
  fileInputRef,
  onAvatarClick,
  onAvatarUpload,
  onRemoveAvatar,
  onLogout,
  onClose,
}: UserMenuProps) {
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onAvatarClick}
        className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200 ring-1 ring-transparent transition-colors duration-200 hover:ring-red-400 xl:h-11 xl:w-11"
        aria-label={isAuthenticated ? "Open user menu" : "Sign in"}
      >
        {avatarUrl ? (
          <img
            src={resolvedAvatarUrl ?? undefined}
            alt={`${user?.firstName ?? ""} avatar`}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserIcon className="h-5 w-5 text-gray-500 xl:h-6 xl:w-6" />
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
                <img src={resolvedAvatarUrl ?? undefined} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="m-2.5 h-6 w-6 text-gray-400" />
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
            onChange={onAvatarUpload}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <UploadIcon />
            {uploadingAvatar ? "Uploading..." : "Upload Avatar"}
          </button>

          {avatarUrl && (
            <button
              onClick={onRemoveAvatar}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <TrashIcon />
              Xóa ảnh đại diện
            </button>
          )}
        </div>

        <div className="my-2 h-px bg-gray-100" />

        <div className="space-y-1">
          {isAdmin && (
            <Link
              to={adminToggleTarget}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              onClick={onClose}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              {adminToggleLabel}
            </Link>
          )}

          <UserMenuLink to={ROUTES.PROFILE} onClose={onClose} label="Hồ sơ của tôi">
            <UserIcon className="h-4 w-4" />
          </UserMenuLink>
          <UserMenuLink to={ROUTES.ORDERS} onClose={onClose} label="Đơn hàng của tôi">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.7}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </UserMenuLink>
          <UserMenuLink to={ROUTES.CANCELLATIONS} onClose={onClose} label="Đơn đã hủy">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </UserMenuLink>
          <UserMenuLink to={ROUTES.REVIEWS} onClose={onClose} label="Đánh giá của tôi">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </UserMenuLink>

          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <LogoutIcon />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

function UserMenuLink({
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
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
      onClick={onClose}
    >
      {children}
      {label}
    </Link>
  );
}
