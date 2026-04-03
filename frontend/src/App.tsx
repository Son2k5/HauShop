// src/App.tsx

import { Routes, Route, Navigate } from "react-router-dom";
import SignIn         from "./pages/account/SignIn";
import SignUp from "./pages/account/SignUp";
import ForgotPassword from "./pages/account/ForgotPassword";
import ResetPassword  from "./pages/account/ResetPassword";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import BulkUpload from "./pages/admin/BulkUpload";

// TODO: thay bằng trang thật của bạn
const Home = () => <div className="p-8 text-xl">🏠 Home — đã đăng nhập</div>;
const NotFound = () => <div className="p-8 text-xl">404 — Không tìm thấy</div>;

export default function App() {
  return (
    <Routes>
       {/* ── Public ────────────────────────────────── */}
      <Route path="/signin"          element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      
       {/* ── Protected ───────────────────────────────  */}
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
      <Route path="/admin/bulk-upload" element={<BulkUpload />} />
    </Routes>
  );
}