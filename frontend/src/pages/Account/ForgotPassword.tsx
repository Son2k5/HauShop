// src/pages/Auth/ForgotPassword.tsx

import React, { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import { logoLight } from "../../assets/images";
import { authService } from "../../services/Auth.service";
import { type ApiError } from "../../@types/auth.type";

// ── Slideshow images ───────────────────────────────────────────────
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

const ForgotPassword = () => {
  // ── State (original logic) ────────────────────────────────────────
  const [email,        setEmail]        = useState("");
  const [errEmail,     setErrEmail]     = useState("");
  const [serverErrMsg, setServerErrMsg] = useState("");
  const [loading,      setLoading]      = useState(false);
  const [successMsg,   setSuccessMsg]   = useState("");

  const navigate = useNavigate();

  // ── Slideshow state ───────────────────────────────────────────────
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = useCallback((idx: number) => {
    if (isAnimating || idx === activeSlide) return;
    setIsAnimating(true);
    setTimeout(() => { setActiveSlide(idx); setIsAnimating(false); }, 400);
  }, [activeSlide, isAnimating]);

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

  // ── Handlers (original logic) ─────────────────────────────────────
  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrEmail("");
    setServerErrMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setErrEmail("Enter your email address"); return; }

    setLoading(true);
    setServerErrMsg("");
    try {
      await authService.forgotPassword({ email });
      setSuccessMsg(email);
    } catch (err) {
      const e = err as ApiError;
      if (e.errors && Object.keys(e.errors).length > 0) {
        const errs: Record<string, string[]> = {};
        for (const key in e.errors) errs[key.toLowerCase()] = e.errors[key];
        if (errs["email"]?.length) setErrEmail(errs["email"].join(" • "));
      } else if (e.statusCode && e.statusCode >= 500) {
        setServerErrMsg("Server error. Please try again later.");
      } else {
        setServerErrMsg(e.message ?? "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 lg:p-10 relative overflow-hidden">

      {/* Background blurred image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px) brightness(0.55)",
          transform: "scale(1.05)",
        }}
      />
      <div className="absolute inset-0 z-0 bg-black/30" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[1024px] bg-white rounded-[48px] overflow-hidden flex flex-col lg:flex-row"
        style={{
          boxShadow: "0px 32px 80px -8px rgba(0,0,0,0.55), 0px 8px 24px -4px rgba(0,0,0,0.35)",
          minHeight: 560,
        }}
      >
        {/* ── LEFT: Slideshow ─────────────────────────────────── */}
        <div className="hidden lg:block relative w-[420px] flex-shrink-0" style={{ minHeight: 560 }}>
          {SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className="absolute inset-4 rounded-[40px] overflow-hidden transition-opacity duration-500"
              style={{ opacity: activeSlide === idx && !isAnimating ? 1 : 0 }}
            >
              <img src={slide.src} alt={slide.caption} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          ))}

          {/* Top nav */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 pt-8">
            <div
              className="px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-[0.5px]"
              style={{ background: "rgba(0,0,0,0.20)", outline: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(6px)" }}
            >
              {SLIDES[activeSlide].caption}
            </div>
            <div className="flex items-center gap-3">
              <Link to="/signin" className="text-white text-[10px] font-bold hover:opacity-80 transition-opacity">
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-3 py-1 rounded-full border border-white text-white text-[10px] font-bold hover:bg-white hover:text-black transition-all duration-300"
              >
                Join Us
              </Link>
            </div>
          </div>

          {/* Caption */}
          <div className="absolute bottom-16 left-0 right-0 z-10 px-10">
            <p className="text-white/70 text-sm">{SLIDES[activeSlide].sub}</p>
          </div>

          {/* Dots */}
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

        {/* ── RIGHT: Content ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-between px-10 lg:px-16 py-10 bg-white">

          {/* Logo */}
          <div>
            <Link to="/">
              <span className="text-2xl font-extrabold tracking-tight text-black" style={{ fontFamily: "Roboto, sans-serif" }}>
                HAUSHOP
              </span>
            </Link>
          </div>

          {/* Center content */}
          <div className="w-full max-w-[360px] mx-auto">
            {successMsg ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center gap-5 text-center">
                {/* Icon */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(225,77,61,0.08)" }}
                >
                  <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="#E14D3D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>

                <div>
                  <h2
                    className="text-3xl font-extrabold text-black leading-none"
                    style={{ fontFamily: "Roboto, sans-serif" }}
                  >
                    Check your email
                  </h2>
                  <p className="text-[#666666] text-sm mt-3 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                    If{" "}
                    <span className="font-semibold text-gray-800">{successMsg}</span>{" "}
                    is registered, we've sent a 6-digit OTP.
                    It expires in{" "}
                    <span className="font-semibold text-gray-800">15 minutes</span>.
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    Don't see it? Check your spam folder.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/reset-password", { state: { email: successMsg } })}
                  className="w-full h-[52px] rounded-xl text-white text-sm font-bold tracking-wide transition-colors duration-300 flex items-center justify-center gap-2"
                  style={{
                    background: "#E14D3D",
                    boxShadow: "0px 10px 15px -3px rgba(225,77,61,0.20), 0px 4px 6px -4px rgba(225,77,61,0.20)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                  </svg>
                  Enter OTP
                </button>

                <button
                  onClick={() => { setSuccessMsg(""); setEmail(""); }}
                  className="text-sm text-[#9CA3AF] hover:text-[#E14D3D] transition-colors duration-200 underline underline-offset-2"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Use a different email
                </button>

                <p className="text-[11px] text-[#6B7280]" style={{ fontFamily: "Inter, sans-serif" }}>
                  Remember your password?{" "}
                  <Link to="/signin" className="text-[#E14D3D] font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            ) : (
              /* ── Form state ── */
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* Heading */}
                <div className="text-center mb-2">
                  <h1
                    className="text-4xl font-extrabold text-black leading-none"
                    style={{ fontFamily: "Roboto, sans-serif" }}
                  >
                    Forgot Password
                  </h1>
                  <p className="text-[#666666] text-sm mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    Enter your email and we'll send you a reset code.
                  </p>
                </div>

                {/* Server error */}
                {serverErrMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-600 font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                      <span className="italic mr-1">!</span>{serverErrMsg}
                    </p>
                  </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <input
                    onChange={handleEmail}
                    value={email}
                    type="email"
                    placeholder="Email address"
                    autoComplete="email"
                    autoFocus
                    className={`w-full h-[52px] px-5 bg-white rounded-xl border text-sm text-gray-800 placeholder-[#9CA3AF] outline-none transition-colors duration-200 focus:border-[#E14D3D] focus:ring-1 focus:ring-[#E14D3D] ${
                      errEmail ? "border-red-400" : "border-[#E5E7EB]"
                    }`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                  {errEmail && (
                    <p className="text-xs text-red-500 font-medium px-1" style={{ fontFamily: "Inter, sans-serif" }}>
                      <span className="italic mr-1">!</span>{errEmail}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[52px] rounded-xl text-white text-sm font-bold tracking-wide transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-black"
                  style={{
                    background: "#E14D3D",
                    boxShadow: "0px 10px 15px -3px rgba(225,77,61,0.20), 0px 4px 6px -4px rgba(225,77,61,0.20)",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {loading ? (
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      Send reset code
                    </>
                  )}
                </button>

                {/* Back to sign in */}
                <p
                  className="text-center text-[11px] text-[#6B7280]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Remember your password?{" "}
                  <Link to="/signin" className="text-[#E14D3D] font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </div>

          {/* Footer social */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <a href="#" className="text-[#9CA3AF] hover:text-gray-600 transition-colors" aria-label="Facebook">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="#" className="text-[#9CA3AF] hover:text-gray-600 transition-colors" aria-label="Twitter">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
            <a href="#" className="text-[#9CA3AF] hover:text-gray-600 transition-colors" aria-label="Instagram">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="#" className="text-[#9CA3AF] hover:text-gray-600 transition-colors" aria-label="Pinterest">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;