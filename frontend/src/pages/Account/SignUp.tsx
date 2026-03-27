// src/pages/Auth/SignUp.tsx

import React, { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import { test } from "../../assets/images";
import { useAuthActions } from "../../hooks/useAuthActions";
import type { ApiError } from "../../@types/auth.type";

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

const SignUp = () => {
  // ── Form state ────────────────────────────────────────────────────
  const [firstName,       setFirstName]       = useState("");
  const [lastName,        setLastName]         = useState("");
  const [email,           setEmail]            = useState("");
  const [phone,           setPhone]            = useState("");
  const [password,        setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword]  = useState("");
  const [showPassword,    setShowPassword]     = useState(false);
  const [showConfirm,     setShowConfirm]      = useState(false);
  const [checked,         setChecked]          = useState(false);

  // ── Error state ───────────────────────────────────────────────────
  const [errFirstName,       setErrFirstName]       = useState("");
  const [errLastName,        setErrLastName]         = useState("");
  const [errEmail,           setErrEmail]            = useState("");
  const [errPhone,           setErrPhone]            = useState("");
  const [errPassword,        setErrPassword]         = useState("");
  const [errConfirmPassword, setErrConfirmPassword]  = useState("");
  const [successMsg,         setSuccessMsg]          = useState("");
  const [serverErrMsg,       setServerErrMsg]        = useState("");
  const [loading,            setLoading]             = useState(false);

  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuthActions();

  // ── Slideshow state ───────────────────────────────────────────────
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
  const handleFirstName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value); setErrFirstName(""); setServerErrMsg("");
  };
  const handleLastName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value); setErrLastName(""); setServerErrMsg("");
  };
  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value); setErrEmail(""); setServerErrMsg("");
  };
  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value); setErrPhone(""); setServerErrMsg("");
  };
  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value); setErrPassword(""); setErrConfirmPassword(""); setServerErrMsg("");
  };
  const handleConfirmPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value); setErrConfirmPassword("");
  };

  // ── Submit (original logic) ───────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checked) return;

    let hasClientError = false;
    if (!firstName)       { setErrFirstName("Enter your first name");          hasClientError = true; }
    if (!email)           { setErrEmail("Enter your email");                   hasClientError = true; }
    if (!phone)           { setErrPhone("Enter your phone number");            hasClientError = true; }
    if (!password)        { setErrPassword("Enter your password");             hasClientError = true; }
    if (!confirmPassword) { setErrConfirmPassword("Please confirm your password"); hasClientError = true; }
    if (password && confirmPassword && password !== confirmPassword) {
      setErrConfirmPassword("Passwords do not match");
      hasClientError = true;
    }
    if (hasClientError) return;

    setLoading(true);
    setServerErrMsg("");
    try {
      await register({ firstName, lastName, email, phoneNumber: phone, password });
      setSuccessMsg(`Hello dear ${firstName}, Welcome you to HAUSHOP! Your account has been created successfully.`);
      setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setPassword("");
      navigate("/", { replace: true });
    } catch (err) {
      const e = err as ApiError;
      if (e.errors && Object.keys(e.errors).length > 0) {
        const errs: Record<string, string[]> = {};
        for (const key in e.errors) errs[key.toLowerCase()] = e.errors[key];
        if (errs["firstname"]?.length)   setErrFirstName(errs["firstname"].join(" • "));
        if (errs["lastname"]?.length)    setErrLastName(errs["lastname"].join(" • "));
        if (errs["email"]?.length)       setErrEmail(errs["email"].join(" • "));
        if (errs["phonenumber"]?.length) setErrPhone(errs["phonenumber"].join(" • "));
        if (errs["password"]?.length)    setErrPassword(errs["password"].join(" • "));
        const knownKeys = ["firstname", "lastname", "email", "phonenumber", "password"];
        const unknownErrors = Object.keys(errs).filter(k => !knownKeys.includes(k));
        if (unknownErrors.length > 0) {
          setServerErrMsg(unknownErrors.map(k => errs[k].join(", ")).join(" | "));
        }
      } else if (e.statusCode && e.statusCode >= 500) {
        setServerErrMsg("Server error. Please try again later.");
      } else {
        setServerErrMsg(e.message ?? "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Eye toggle icon ───────────────────────────────────────────────
  const EyeIcon = ({ show }: { show: boolean }) =>
    show ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.97 9.97 0 014.9 1.275M15 12a3 3 0 11-4.5-2.598M3 3l18 18"/>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
    );

  // ── Field error helper ────────────────────────────────────────────
  const FieldError = ({ msg }: { msg: string }) =>
    msg ? (
      <p className="text-xs text-red-500 font-medium px-1 mt-0.5">
        <span className="italic mr-1">!</span>{msg}
      </p>
    ) : null;

  // ── Input class helper ────────────────────────────────────────────
  const inputCls = (hasErr: boolean) =>
    `w-full h-[46px] px-4 bg-white rounded-xl border text-sm text-gray-800 placeholder-[#9CA3AF] outline-none transition-colors duration-200 focus:border-[#E14D3D] focus:ring-1 focus:ring-[#E14D3D] ${
      hasErr ? "border-red-400" : "border-[#E5E7EB]"
    }`;

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
      {/* Tint overlay */}
      <div className="absolute inset-0 z-0 bg-black/30" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[1024px] bg-white rounded-[48px] overflow-hidden flex flex-col lg:flex-row"
        style={{
          boxShadow: "0px 32px 80px -8px rgba(0,0,0,0.55), 0px 8px 24px -4px rgba(0,0,0,0.35)",
        }}
      >
        {/* ── LEFT: Slideshow ─────────────────────────────────── */}
        <div className="hidden lg:block relative w-[420px] flex-shrink-0" style={{ minHeight: 680 }}>
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
                to="/signin"
                className="px-3 py-1 rounded-full border border-white text-white text-[10px] font-bold hover:bg-white hover:text-black transition-all duration-300"
              >
                Login
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

        {/* ── RIGHT: Form ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-between px-10 lg:px-14 py-10 bg-white overflow-y-auto" style={{ maxHeight: 680 }}>

          {/* Logo */}
          <div className="mb-2">
            <Link to="/">
              <span className="text-2xl font-extrabold tracking-tight text-black" style={{ fontFamily: "Roboto, sans-serif" }}>
                HAUSHOP
              </span>
            </Link>
          </div>

          {successMsg ? (
            /* ── Success ── */
            <div className="flex flex-col gap-4 my-auto">
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <p className="text-green-700 font-medium text-sm">{successMsg}</p>
              </div>
              <Link to="/signin">
                <button className="w-full h-12 bg-[#E14D3D] text-white rounded-xl text-sm font-bold hover:bg-black transition-colors duration-300">
                  Sign In
                </button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-3">

              {/* Heading */}
              <div className="text-center mb-1">
                <h1 className="text-4xl font-extrabold text-black leading-none" style={{ fontFamily: "Roboto, sans-serif" }}>
                  Create Account
                </h1>
                <p className="text-[#666666] text-sm mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                  Join HAUSHOP today
                </p>
              </div>

              {/* Server error */}
              {serverErrMsg && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-sm text-red-600 font-medium">{serverErrMsg}</p>
                </div>
              )}

              {/* Last Name + First Name — 2 cột */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5">
                  <input
                    onChange={handleLastName}
                    value={lastName}
                    type="text"
                    placeholder="Last name"
                    autoComplete="family-name"
                    className={inputCls(!!errLastName)}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                  <FieldError msg={errLastName} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <input
                    onChange={handleFirstName}
                    value={firstName}
                    type="text"
                    placeholder="First name *"
                    autoComplete="given-name"
                    className={inputCls(!!errFirstName)}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                  <FieldError msg={errFirstName} />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-0.5">
                <input
                  onChange={handleEmail}
                  value={email}
                  type="email"
                  placeholder="Email *"
                  autoComplete="email"
                  className={inputCls(!!errEmail)}
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
                <FieldError msg={errEmail} />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-0.5">
                <input
                  onChange={handlePhone}
                  value={phone}
                  type="text"
                  placeholder="Phone number *"
                  autoComplete="tel"
                  className={inputCls(!!errPhone)}
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
                <FieldError msg={errPhone} />
              </div>

              {/* Password + Confirm — 2 cột */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="relative">
                    <input
                      onChange={handlePassword}
                      value={password}
                      type={showPassword ? "text" : "password"}
                      placeholder="Password *"
                      autoComplete="new-password"
                      className={inputCls(!!errPassword) + " pr-10"}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                      <EyeIcon show={showPassword} />
                    </button>
                  </div>
                  {errPassword && errPassword.split(" • ").map((msg, i) => (
                    <p key={i} className="text-xs text-red-500 font-medium px-1 mt-0.5">
                      <span className="italic mr-1">!</span>{msg}
                    </p>
                  ))}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="relative">
                    <input
                      onChange={handleConfirmPassword}
                      value={confirmPassword}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm password *"
                      autoComplete="new-password"
                      className={inputCls(!!errConfirmPassword) + " pr-10"}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                      <EyeIcon show={showConfirm} />
                    </button>
                  </div>
                  <FieldError msg={errConfirmPassword} />
                </div>
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setChecked(!checked)}
                  className="w-4 h-4 mt-0.5 cursor-pointer accent-[#E14D3D]"
                />
                <p className="text-xs text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                  I agree to HAUSHOP&apos;s{" "}
                  <span className="text-[#E14D3D] font-semibold cursor-pointer hover:underline">Terms of Service</span>
                  {" "}and{" "}
                  <span className="text-[#E14D3D] font-semibold cursor-pointer hover:underline">Privacy Policy</span>.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !checked}
                className="w-full h-[48px] rounded-xl text-white text-sm font-bold tracking-wide transition-colors duration-300 flex items-center justify-center disabled:cursor-not-allowed"
                style={{
                  background: checked ? "#E14D3D" : "#9CA3AF",
                  boxShadow: checked ? "0px 10px 15px -3px rgba(225,77,61,0.20), 0px 4px 6px -4px rgba(225,77,61,0.20)" : "none",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                ) : "Create Account"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[#F3F4F6]" />
                <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF]" style={{ fontFamily: "Inter, sans-serif" }}>or</span>
                <div className="flex-1 h-px bg-[#F3F4F6]" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full h-[46px] flex items-center justify-center gap-3 rounded-xl border border-[#E5E7EB] text-[#374151] text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>

              {/* Sign in link */}
              <p className="text-center text-[11px] text-[#6B7280]" style={{ fontFamily: "Inter, sans-serif" }}>
                Already have an account?{" "}
                <Link to="/signin" className="text-[#E14D3D] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}

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

export default SignUp;