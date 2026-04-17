// src/pages/Auth/SignIn.tsx

import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthActions } from "../../hooks/useAuthActions";
import { type ApiError } from "../../@types/auth.type";

// ── Helpers ───────────────────────────────────────────────────────
const GOOGLE_ERRORS: Record<string, string> = {
  google_denied:       "You denied Google sign-in",
  google_invalid:      "Invalid Google request",
  google_unauthorized: "Google account email is not verified",
  google_error:        "Google sign-in failed, please try again",
  invalid_request:     "Invalid Google request",
  session_expired:     "Google sign-in session expired, please try again",
  auth_failed:         "Google sign-in failed, please try again",
};

// ── Slideshow images (thay bằng ảnh thật của bạn) ─────────────────
const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
    caption: "New Arrivals",
    sub: "Explore the latest collections",
  },
  {
    src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80",
    caption: "Selected Works",
    sub: "Curated styles for every season",
  },
];

const SignIn = () => {
  // ── Original logic state ──────────────────────────────────────
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [errEmail,    setErrEmail]    = useState("");
  const [errPassword, setErrPassword] = useState("");
  const [successMsg,  setSuccessMsg]  = useState("");
  const [serverErrMsg,setServerErrMsg]= useState("");
  const [loading,     setLoading]     = useState(false);
  const [showPassword,setShowPassword]= useState(false);

  const navigate       = useNavigate();
  const location       = useLocation();
  const [searchParams] = useSearchParams();
  const { login, loginWithGoogle } = useAuthActions();
  const from = (location.state as { from?: string })?.from ?? "/";

  // ── Slideshow state ───────────────────────────────────────────
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = useCallback((idx: number) => {
    if (isAnimating || idx === activeSlide) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveSlide(idx);
      setIsAnimating(false);
    }, 400);
  }, [activeSlide, isAnimating]);

  // Auto-advance every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveSlide(prev => (prev + 1) % SLIDES.length);
        setIsAnimating(false);
      }, 400);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Google error from redirect
  useEffect(() => {
    const e = searchParams.get("error");
    if (e) setServerErrMsg(GOOGLE_ERRORS[e] ?? "Google sign-in failed");
  }, [searchParams]);

  // ── Event Handlers (original) ─────────────────────────────────
  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrEmail("");
    setServerErrMsg("");
  };
  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setErrPassword("");
    setServerErrMsg("");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email)    setErrEmail("Enter your email");
    if (!password) setErrPassword("Create a password");

    if (email && password) {
      setLoading(true);
      setServerErrMsg("");
      try {
        await login({ email, password });
        setSuccessMsg(
          `Hello dear, Thank you for your attempt. We are processing to validate your access. Till then stay connected and additional assistance will be sent to you by your mail at ${email}`
        );
        setEmail("");
        setPassword("");
        navigate(from, { replace: true });
      } catch (err) {
        const e = err as ApiError;
        if (e.errors && Object.keys(e.errors).length > 0) {
          const errs: Record<string, string[]> = {};
          for (const key in e.errors) {
            errs[key.toLowerCase()] = e.errors[key];
          }
          if (errs["email"]?.length)    setErrEmail(errs["email"].join(" • "));
          if (errs["password"]?.length) setErrPassword(errs["password"].join(" • "));
          const knownKeys = ["email", "password"];
          const unknownErrors = Object.keys(errs).filter(k => !knownKeys.includes(k));
          if (unknownErrors.length > 0) {
            setServerErrMsg(unknownErrors.map(k => errs[k].join(", ")).join(" | "));
          }
        } else if (e.statusCode === 401) {
          setServerErrMsg("Invalid email or password.");
        } else if (e.statusCode && e.statusCode >= 500) {
          setServerErrMsg("Server error. Please try again later.");
        } else {
          setServerErrMsg(e.message ?? "Invalid email or password");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 lg:p-10 relative overflow-hidden">

      {/* ── Background image with blur overlay ── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px) brightness(0.55)",
          transform: "scale(1.05)",
        }}
      />
      {/* Tint overlay */}
      <div className="absolute inset-0 z-0 bg-black/30" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[1024px] bg-white rounded-[48px] overflow-hidden flex flex-col lg:flex-row"
        style={{
          boxShadow:
            "0px 32px 80px -8px rgba(0,0,0,0.55), 0px 8px 24px -4px rgba(0,0,0,0.35)",
        }}
      >
        {/* ── LEFT: Slideshow panel ─────────────────────────── */}
        <div className="hidden lg:block relative w-[497px] flex-shrink-0 h-[700px]">
          {/* Images */}
          {SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className="absolute inset-4 rounded-[40px] overflow-hidden transition-opacity duration-500"
              style={{ opacity: activeSlide === idx && !isAnimating ? 1 : 0 }}
            >
              <img
                src={slide.src}
                alt={slide.caption}
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/30" />
            </div>
          ))}

          {/* Top nav overlay */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 pt-8">
            {/* Badge */}
            <div
              className="px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-[0.5px]"
              style={{
                background: "rgba(0,0,0,0.20)",
                outline: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(6px)",
              }}
            >
              {SLIDES[activeSlide].caption}
            </div>
            {/* Sign Up / Join Us */}
            <div className="flex items-center gap-3">
              <Link to="/signup" className="text-white text-[10px] font-bold hover:opacity-80 transition-opacity">
                Sign Up
              </Link>
              <Link
                to="/signup"
                className="px-3 py-1 rounded-full border border-white text-white text-[10px] font-bold hover:bg-white hover:text-black transition-all duration-300"
              >
                Join Us
              </Link>
            </div>
          </div>

          {/* Slide caption */}
          <div className="absolute bottom-16 left-0 right-0 z-10 px-10">
            <p className="text-white/70 text-sm">{SLIDES[activeSlide].sub}</p>
          </div>

          {/* Dot navigation */}
          <div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-center gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: activeSlide === idx ? 28 : 8,
                  height: 8,
                  background: activeSlide === idx ? "white" : "rgba(255,255,255,0.4)",
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ── RIGHT: Form panel ─────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-between px-10 lg:px-16 py-10 bg-white">
          {/* Logo */}
          <div>
            <Link to="/home">
              <span className="text-2xl font-extrabold tracking-tight text-black" style={{ fontFamily: "Roboto, sans-serif" }}>
                HAUSHOP
              </span>
            </Link>
          </div>

          {/* Main form area */}
          <div className="w-full max-w-[360px] mx-auto">
            {successMsg ? (
              /* ── Success state ── */
              <div className="flex flex-col gap-6">
                <p className="text-green-600 font-medium text-sm leading-relaxed">{successMsg}</p>
                <Link to="/signup">
                  <button className="w-full h-12 bg-[#E14D3D] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors duration-300">
                    Sign Up
                  </button>
                </Link>
              </div>
            ) : (
              /* ── Sign-in form ── */
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                {/* Heading */}
                <div className="text-center mb-2">
                  <h1
                    className="text-5xl font-extrabold text-black leading-none"
                    style={{ fontFamily: "Roboto, sans-serif" }}
                  >
                    Sign In
                  </h1>
                  <p className="text-[#666666] text-base mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    Welcome to HAUSHOP
                  </p>
                </div>

                {/* Server / Google error */}
                {serverErrMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-600 font-medium">
                      <span className="font-bold italic mr-1">!</span>
                      {serverErrMsg}
                    </p>
                  </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <input
                    onChange={handleEmail}
                    value={email}
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    className={`w-full h-[52px] px-5 bg-white rounded-xl border text-sm text-gray-800 placeholder-[#9CA3AF] outline-none transition-colors duration-200 focus:border-[#E14D3D] focus:ring-1 focus:ring-[#E14D3D] ${
                      errEmail ? "border-red-400" : "border-[#E5E7EB]"
                    }`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                  {errEmail && (
                    <p className="text-xs text-red-500 font-medium px-1">
                      <span className="italic mr-1">!</span>{errEmail}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1">
                  <div className="relative">
                    <input
                      onChange={handlePassword}
                      value={password}
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      autoComplete="current-password"
                      className={`w-full h-[52px] px-5 pr-12 bg-white rounded-xl border text-sm text-gray-800 placeholder-[#9CA3AF] outline-none transition-colors duration-200 focus:border-[#E14D3D] focus:ring-1 focus:ring-[#E14D3D] ${
                        errPassword ? "border-red-400" : "border-[#E5E7EB]"
                      }`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.97 9.97 0 014.9 1.275M15 12a3 3 0 11-4.5-2.598M3 3l18 18"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errPassword && (
                    <p className="text-xs text-red-500 font-medium px-1">
                      <span className="italic mr-1">!</span>{errPassword}
                    </p>
                  )}
                  {/* Forgot password */}
                  <div className="flex justify-end mt-1">
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-bold text-[#E14D3D] hover:underline"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-[#F3F4F6]" />
                  <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF]" style={{ fontFamily: "Inter, sans-serif" }}>
                    or
                  </span>
                  <div className="flex-1 h-px bg-[#F3F4F6]" />
                </div>

                {/* Google */}
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="w-full h-[52px] flex items-center justify-center gap-3 rounded-xl border border-[#E5E7EB] text-[#374151] text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Login with Google
                </button>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[52px] rounded-xl bg-[#E14D3D] text-white text-sm font-bold tracking-wide hover:bg-black transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                  style={{
                    boxShadow: "0px 10px 15px -3px rgba(225,77,61,0.20), 0px 4px 6px -4px rgba(225,77,61,0.20)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {loading ? (
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : "Login"}
                </button>

                {/* Sign up link */}
                <p
                  className="text-center text-[11px] text-[#6B7280] mt-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Don&apos;t have an account?{" "}
                  <Link to="/signup" className="text-[#E14D3D] font-semibold hover:underline">
                    Sign up
                  </Link>
                </p>
              </form>
            )}
          </div>

          {/* Footer social icons */}
          <div className="flex items-center justify-center gap-6">
            {/* Facebook */}
            <a href="#" className="text-[#9CA3AF] hover:text-gray-600 transition-colors" aria-label="Facebook">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
            </a>
            {/* Twitter/X */}
            <a href="#" className="text-[#9CA3AF] hover:text-gray-600 transition-colors" aria-label="Twitter">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" className="text-[#9CA3AF] hover:text-gray-600 transition-colors" aria-label="Instagram">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            {/* Pinterest */}
            <a href="#" className="text-[#9CA3AF] hover:text-gray-600 transition-colors" aria-label="Pinterest">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      {/* end card */}
    </div>
  );
};

export default SignIn;
