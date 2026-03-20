// src/App.tsx

import { Routes, Route, Navigate } from "react-router-dom";
import SignIn         from "./pages/Account/SignIn";
import SignUp from "./pages/Account/SignUp";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// TODO: thay bằng trang thật của bạn
const Home = () => <div className="p-8 text-xl">🏠 Home — đã đăng nhập</div>;
const NotFound = () => <div className="p-8 text-xl">404 — Không tìm thấy</div>;

export default function App() {
  return (
    <Routes>
      {/* ── Public ────────────────────────────────── */}
      <Route path="/signin"          element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      {/* ── Protected ─────────────────────────────── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      {/* ── Fallback ──────────────────────────────── */}
      <Route path="/403" element={<div className="p-8 text-xl">403 — Không có quyền truy cập</div>} />
      <Route path="*"    element={<NotFound />} />
    </Routes>
  );
}