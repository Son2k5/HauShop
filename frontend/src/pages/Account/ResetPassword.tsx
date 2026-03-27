// src/pages/Auth/ResetPassword.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logoLight } from "../../assets/images";
import { authService } from "../../services/Auth.service";
import { type ApiError } from "../../@types/auth.type";

// ── OTP length ────────────────────────────────────────────────────
const OTP_LENGTH = 6;

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

const ResetPassword = () => {
  // ── Route state ───────────────────────────────────────────────────
  const location      = useLocation();
  const navigate      = useNavigate();
  const emailFromPrev = (location.state as { email?: string })?.email ?? "";

  // ── Step ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<"otp" | "password">("otp");

  // ── OTP step ──────────────────────────────────────────────────────
  const [otp,           setOtp]           = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [errOtp,        setErrOtp]        = useState("");
  const [otpLoading,    setOtpLoading]    = useState(false);
  const [resendCooldown,setResendCooldown]= useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Password step ─────────────────────────────────────────────────
  const [newPassword,    setNewPassword]    = useState("");
  const [confirmPassword,setConfirmPassword]= useState("");
  const [showNew,        setShowNew]        = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [errNewPassword, setErrNewPassword] = useState("");
  const [errConfirm,     setErrConfirm]     = useState("");
  const [pwLoading,      setPwLoading]      = useState(false);

  // ── Shared ────────────────────────────────────────────────────────
  const [serverErrMsg, setServerErrMsg] = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");

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

  // ── Guards (original logic) ───────────────────────────────────────
  useEffect(() => {
    if (!emailFromPrev) navigate("/forgot-password", { replace: true });
  }, [emailFromPrev, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── OTP handlers (original logic) ────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    setErrOtp("");
    setServerErrMsg("");
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const next = [...otp]; next[index] = ""; setOtp(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft"  && index > 0)             inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next   = [...otp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  // ── Submit OTP (original logic) ───────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) { setErrOtp(`Please enter all ${OTP_LENGTH} digits`); return; }
    setStep("password");
    setServerErrMsg("");
  };

  // ── Resend OTP (original logic) ───────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtpLoading(true);
    setServerErrMsg("");
    try {
      await authService.forgotPassword({ email: emailFromPrev });
      setResendCooldown(60);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      const e = err as ApiError;
      setServerErrMsg(e.message ?? "Failed to resend. Try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Submit new password (original logic) ──────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasErr = false;
    if (!newPassword)     { setErrNewPassword("Enter your new password");       hasErr = true; }
    if (!confirmPassword) { setErrConfirm("Please confirm your password");      hasErr = true; }
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setErrConfirm("Passwords do not match"); hasErr = true;
    }
    if (hasErr) return;

    setPwLoading(true);
    setServerErrMsg("");
    try {
      await authService.resetPassword({ email: emailFromPrev, otp: otp.join(""), newPassword, confirmPassword });
      setSuccessMsg("Your password has been reset successfully.");
    } catch (err) {
      const e = err as ApiError;
      if (e.errors && Object.keys(e.errors).length > 0) {
        const errs: Record<string, string[]> = {};
        for (const key in e.errors) errs[key.toLowerCase()] = e.errors[key];
        if (errs["newpassword"]?.length) setErrNewPassword(errs["newpassword"].join(" • "));
        if (errs["otp"]?.length) { setStep("otp"); setErrOtp(errs["otp"].join(" • ")); }
      } else if (e.statusCode === 401) {
        setStep("otp");
        setErrOtp("Invalid or expired OTP. Please try again.");
        setOtp(Array(OTP_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else if (e.statusCode && e.statusCode >= 500) {
        setServerErrMsg("Server error. Please try again later.");
      } else {
        setServerErrMsg(e.message ?? "Reset failed. Please try again.");
      }
    } finally {
      setPwLoading(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────
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

  const inputCls = (hasErr: boolean) =>
    `w-full h-[52px] px-5 bg-white rounded-xl border text-sm text-gray-800 placeholder-[#9CA3AF] outline-none transition-colors duration-200 focus:border-[#E14D3D] focus:ring-1 focus:ring-[#E14D3D] ${hasErr ? "border-red-400" : "border-[#E5E7EB]"}`;

  const FieldError = ({ msg }: { msg: string }) =>
    msg ? <p className="text-xs text-red-500 font-medium px-1 mt-0.5"><span className="italic mr-1">!</span>{msg}</p> : null;

  const SubmitBtn = ({ loading, label, icon }: { loading: boolean; label: string; icon?: React.ReactNode }) => (
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
      ) : <>{icon}{label}</>}
    </button>
  );

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
              <Link to="/signin" className="text-white text-[10px] font-bold hover:opacity-80 transition-opacity">Sign In</Link>
              <Link to="/signup" className="px-3 py-1 rounded-full border border-white text-white text-[10px] font-bold hover:bg-white hover:text-black transition-all duration-300">Join Us</Link>
            </div>
          </div>

          {/* Step indicator overlay */}
          <div className="absolute bottom-16 left-0 right-0 z-10 px-10">
            <div className="flex items-center gap-3 mb-2">
              {/* Step 1 */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-300 ${step === "otp" ? "bg-white text-gray-900" : "bg-white/20 text-white"}`}>
                <span>1</span>
                <span>Verify OTP</span>
              </div>
              <div className="flex-1 h-px bg-white/30" />
              {/* Step 2 */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-300 ${step === "password" ? "bg-white text-gray-900" : "bg-white/20 text-white"}`}>
                <span>2</span>
                <span>New Password</span>
              </div>
            </div>
            <p className="text-white/70 text-sm">{SLIDES[activeSlide].sub}</p>
          </div>

          {/* Dots */}
          <div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-center gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className="transition-all duration-300 rounded-full"
                style={{ width: activeSlide === idx ? 28 : 8, height: 8, background: activeSlide === idx ? "white" : "rgba(255,255,255,0.4)" }}
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

            {/* ══ SUCCESS ══ */}
            {successMsg ? (
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(225,77,61,0.08)" }}>
                  <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="#E14D3D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-black leading-none" style={{ fontFamily: "Roboto, sans-serif" }}>
                    Password reset!
                  </h2>
                  <p className="text-[#666666] text-sm mt-3 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                    {successMsg}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/signin", { replace: true })}
                  className="w-full h-[52px] rounded-xl text-white text-sm font-bold tracking-wide hover:bg-black transition-colors duration-300 flex items-center justify-center gap-2"
                  style={{ background: "#E14D3D", boxShadow: "0px 10px 15px -3px rgba(225,77,61,0.20)", fontFamily: "Inter, sans-serif" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14"/>
                  </svg>
                  Back to Sign In
                </button>
              </div>

            ) : step === "otp" ? (
              /* ══ STEP 1: OTP ══ */
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">

                {/* Heading */}
                <div className="text-center mb-1">
                  <h1 className="text-4xl font-extrabold text-black leading-none" style={{ fontFamily: "Roboto, sans-serif" }}>
                    Enter OTP
                  </h1>
                  <p className="text-[#666666] text-sm mt-2 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-gray-800">{emailFromPrev}</span>
                  </p>
                </div>

                {/* Server error */}
                {serverErrMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-600 font-medium"><span className="italic mr-1">!</span>{serverErrMsg}</p>
                  </div>
                )}

                {/* OTP boxes */}
                <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border outline-none transition-all duration-150
                        ${errOtp
                          ? "border-red-400 bg-red-50 text-red-600"
                          : digit
                            ? "border-[#E14D3D] bg-white text-gray-900"
                            : "border-[#E5E7EB] bg-white text-gray-900"
                        }
                        focus:border-[#E14D3D] focus:ring-1 focus:ring-[#E14D3D]`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                  ))}
                </div>
                {errOtp && (
                  <p className="text-xs text-red-500 font-medium px-1 -mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    <span className="italic mr-1">!</span>{errOtp}
                  </p>
                )}

                <SubmitBtn
                  loading={otpLoading}
                  label="Verify code"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  }
                />

                {/* Resend */}
                <div className="flex items-center justify-center gap-1 text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
                  <span className="text-[#6B7280]">Didn't receive it?</span>
                  {resendCooldown > 0 ? (
                    <span className="text-[#9CA3AF]">Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={otpLoading}
                      className="text-[#E14D3D] font-semibold hover:underline disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  )}
                </div>

                <p className="text-center text-[11px] text-[#6B7280]" style={{ fontFamily: "Inter, sans-serif" }}>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-[#E14D3D] font-semibold hover:underline"
                  >
                    ← Use a different email
                  </button>
                </p>
              </form>

            ) : (
              /* ══ STEP 2: NEW PASSWORD ══ */
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">

                {/* Heading */}
                <div className="text-center mb-1">
                  <h1 className="text-4xl font-extrabold text-black leading-none" style={{ fontFamily: "Roboto, sans-serif" }}>
                    New Password
                  </h1>
                  <p className="text-[#666666] text-sm mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
                    Create a strong password for{" "}
                    <span className="font-semibold text-gray-800">{emailFromPrev}</span>
                  </p>
                </div>

                {/* Server error */}
                {serverErrMsg && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-600 font-medium"><span className="italic mr-1">!</span>{serverErrMsg}</p>
                  </div>
                )}

                {/* New password */}
                <div className="flex flex-col gap-1">
                  <div className="relative">
                    <input
                      onChange={e => { setNewPassword(e.target.value); setErrNewPassword(""); setServerErrMsg(""); }}
                      value={newPassword}
                      type={showNew ? "text" : "password"}
                      placeholder="New password"
                      autoComplete="new-password"
                      autoFocus
                      className={inputCls(!!errNewPassword) + " pr-12"}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                    <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                      <EyeIcon show={showNew} />
                    </button>
                  </div>
                  {errNewPassword && errNewPassword.split(" • ").map((msg, i) => (
                    <p key={i} className="text-xs text-red-500 font-medium px-1"><span className="italic mr-1">!</span>{msg}</p>
                  ))}
                </div>

                {/* Confirm password */}
                <div className="flex flex-col gap-1">
                  <div className="relative">
                    <input
                      onChange={e => { setConfirmPassword(e.target.value); setErrConfirm(""); }}
                      value={confirmPassword}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className={inputCls(!!errConfirm) + " pr-12"}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                      <EyeIcon show={showConfirm} />
                    </button>
                  </div>
                  <FieldError msg={errConfirm} />
                </div>

                <SubmitBtn
                  loading={pwLoading}
                  label="Reset password"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                    </svg>
                  }
                />

                <p className="text-center text-[11px] text-[#6B7280]" style={{ fontFamily: "Inter, sans-serif" }}>
                  <button type="button" onClick={() => setStep("otp")} className="text-[#E14D3D] font-semibold hover:underline">
                    ← Back to OTP
                  </button>
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

export default ResetPassword;