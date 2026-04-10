import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "../../hooks/useAuthState";
import type { Role, AuthState } from "../../@types/auth.type";

interface Props {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, status } = useAuthState() as AuthState;
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <svg
          className="animate-spin w-8 h-8 text-primeColor"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}