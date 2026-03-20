// src/pages/Auth/ResetPassword.tsx

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logoLight } from "../../assets/images";
import { authService } from "../../services/Auth.service";
import { type ApiError } from "../../@types/auth.type";

// ── OTP length ────────────────────────────────────────────────────
const OTP_LENGTH = 6;

const ResetPassword = () => {
  // Email được truyền từ ForgotPassword qua location.state
  const location      = useLocation();
  const navigate      = useNavigate();
  const emailFromPrev = (location.state as { email?: string })?.email ?? "";

  // ── Step: "otp" | "password" ──────────────────────────────────
  const [step, setStep] = useState<"otp" | "password">("otp");

  // ── OTP step ──────────────────────────────────────────────────
  const [otp,        setOtp]        = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [errOtp,     setErrOtp]     = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // countdown giây
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Password step ─────────────────────────────────────────────
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [errNewPassword,  setErrNewPassword]  = useState("");
  const [errConfirm,      setErrConfirm]      = useState("");
  const [pwLoading,       setPwLoading]       = useState(false);

  // ── Shared ────────────────────────────────────────────────────
  const [serverErrMsg, setServerErrMsg] = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");

  // Nếu không có email → về ForgotPassword
  useEffect(() => {
    if (!emailFromPrev) navigate("/forgot-password", { replace: true });
  }, [emailFromPrev, navigate]);

  // Countdown resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── OTP input handlers ────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Chỉ nhận số
    const digit = value.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    setErrOtp("");
    setServerErrMsg("");
    // Auto-focus next
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const next = [...otp];
        next[index] = "";
        setOtp(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0)            inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next   = [...otp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    // Focus ô cuối đã điền
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  // ── Submit OTP (chỉ verify, chưa reset) ──────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setErrOtp(`Please enter all ${OTP_LENGTH} digits`);
      return;
    }
    // Chuyển sang bước nhập password, lưu OTP để dùng khi submit cuối
    setStep("password");
    setServerErrMsg("");
  };

  // ── Resend OTP ────────────────────────────────────────────────
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

  // ── Submit new password ───────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasErr = false;

    if (!newPassword) {
      setErrNewPassword("Enter your new password");
      hasErr = true;
    }
    if (!confirmPassword) {
      setErrConfirm("Please confirm your password");
      hasErr = true;
    }
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setErrConfirm("Passwords do not match");
      hasErr = true;
    }
    if (hasErr) return;

    setPwLoading(true);
    setServerErrMsg("");
    try {
      await authService.resetPassword({
        email:       emailFromPrev,
        otp:         otp.join(""),
        newPassword,
        confirmPassword,
      });
      setSuccessMsg("Your password has been reset successfully.");
    } catch (err) {
      const e = err as ApiError;
      if (e.errors && Object.keys(e.errors).length > 0) {
        const errs: Record<string, string[]> = {};
        for (const key in e.errors) errs[key.toLowerCase()] = e.errors[key];
        if (errs["newpassword"]?.length) setErrNewPassword(errs["newpassword"].join(" • "));
        if (errs["otp"]?.length)         { setStep("otp"); setErrOtp(errs["otp"].join(" • ")); }
      } else if (e.statusCode === 401) {
        // OTP sai / hết hạn → quay về bước OTP
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

  // ── SVG helpers ───────────────────────────────────────────────
  const EyeOff = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.97 9.97 0 014.9 1.275M15 12a3 3 0 11-4.5-2.598M3 3l18 18"/>
    </svg>
  );
  const EyeOn = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  );

  return (
    <div className="w-full h-screen flex items-center justify-center">
      {/* ── Left panel ── */}
      <div className="w-1/2 hidden lgl:inline-flex h-full text-white">
        <div className="w-[450px] h-full bg-primeColor px-10 flex flex-col gap-6 justify-center">
          <Link to="/">
            <img src={logoLight} alt="logoImg" className="w-28" />
          </Link>
          <div className="flex flex-col gap-1 -mt-1">
            <h1 className="font-titleFont text-xl font-medium">
              {step === "otp" ? "Verify your identity" : "Set a new password"}
            </h1>
            <p className="text-base">
              {step === "otp"
                ? "Enter the 6-digit code we sent to your email"
                : "Choose a strong password for your account"}
            </p>
          </div>
          <div className="w-[300px] flex items-start gap-3">
            <span className="text-green-500 mt-1">
              <Icon icon="mdi:check-circle" width="24" height="24" />
            </span>
            <p className="text-base text-gray-300">
              <span className="text-white font-semibold font-titleFont">
                Get started fast with HAUSHOP
              </span>
              <br />
              Your ultimate shopping experience. Explore the latest collections and enjoy exclusive deals reserved only for our official members.
            </p>
          </div>
          <div className="w-[300px] flex items-start gap-3">
            <span className="text-green-500 mt-1">
              <Icon icon="mdi:check-circle" width="24" height="24" />
            </span>
            <p className="text-base text-gray-300">
              <span className="text-white font-semibold font-titleFont">
                Access all HAUSHOP services
              </span>
              <br />
              Personalized privileges. Track your orders in real-time, save your favorites to a wishlist, and get early access to limited drops.
            </p>
          </div>
          <div className="w-[300px] flex items-start gap-3">
            <span className="text-green-500 mt-1">
              <Icon icon="mdi:check-circle" width="24" height="24" />
            </span>
            <p className="text-base text-gray-300">
              <span className="text-white font-semibold font-titleFont">
                Trusted by online Shoppers
              </span>
              <br />
              Quality you can feel. Express your style with high-end materials and a flexible 30-day return policy.
            </p>
          </div>
          <div className="flex items-center justify-between mt-10">
            <Link to="/">
              <p className="text-sm font-titleFont font-semibold text-gray-300 hover:text-white cursor-pointer duration-300">
                © HAUSHOP
              </p>
            </Link>
            <p className="text-sm font-titleFont font-semibold text-gray-300 hover:text-white cursor-pointer duration-300">Terms</p>
            <p className="text-sm font-titleFont font-semibold text-gray-300 hover:text-white cursor-pointer duration-300">Privacy</p>
            <p className="text-sm font-titleFont font-semibold text-gray-300 hover:text-white cursor-pointer duration-300">Security</p>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lgl:w-1/2 h-full">

        {/* ══ SUCCESS ══ */}
        {successMsg ? (
          <div className="w-full lgl:w-[450px] h-full flex flex-col justify-center px-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 className="font-titleFont font-semibold text-2xl">Password reset!</h2>
              <p className="text-gray-500 text-sm">{successMsg}</p>
              <button
                onClick={() => navigate("/signin", { replace: true })}
                className="w-full h-10 bg-primeColor hover:bg-black text-gray-200 hover:text-white text-base font-medium rounded-md duration-300 mt-2"
              >
                Back to Sign in
              </button>
            </div>
          </div>

        ) : step === "otp" ? (
          /* ══ STEP 1: OTP ══ */
          <form
            onSubmit={handleVerifyOtp}
            className="w-full lgl:w-[450px] h-full flex items-center justify-center"
          >
            <div className="px-6 py-4 w-full flex flex-col justify-center">
              <h1 className="font-titleFont underline underline-offset-4 decoration-[1px] font-semibold text-3xl mdl:text-4xl mb-2">
                Enter OTP
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-gray-700">{emailFromPrev}</span>.
              </p>

              <div className="flex flex-col gap-3">
                {/* Server error */}
                {serverErrMsg && (
                  <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                    <span className="font-bold italic mr-1">!</span>
                    {serverErrMsg}
                  </p>
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
                      className={`w-12 h-12 text-center text-xl font-bold rounded-md border-[1px] outline-none transition-colors duration-150
                        ${errOtp
                          ? "border-red-400 bg-red-50"
                          : digit
                            ? "border-primeColor bg-white"
                            : "border-gray-400 bg-white"
                        }
                        focus:border-primeColor`}
                    />
                  ))}
                </div>
                {errOtp && (
                  <p className="text-sm text-red-500 font-titleFont font-semibold px-1">
                    <span className="font-bold italic mr-1">!</span>
                    {errOtp}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="bg-primeColor hover:bg-black text-gray-200 hover:text-white cursor-pointer w-full text-base font-medium h-10 rounded-md duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {otpLoading ? (
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : "Verify code"}
                </button>

                {/* Resend */}
                <div className="flex items-center justify-center gap-1 text-sm font-titleFont font-medium">
                  <span className="text-gray-500">Didn't receive it?</span>
                  {resendCooldown > 0 ? (
                    <span className="text-gray-400">Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={otpLoading}
                      className="text-primeColor hover:text-black duration-300 underline underline-offset-2 disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  )}
                </div>

                <p className="text-sm text-center font-titleFont font-medium">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-gray-500 hover:text-primeColor duration-300"
                  >
                    ← Use a different email
                  </button>
                </p>
              </div>
            </div>
          </form>

        ) : (
          /* ══ STEP 2: NEW PASSWORD ══ */
          <form
            onSubmit={handleResetPassword}
            className="w-full lgl:w-[450px] h-full flex items-center justify-center"
          >
            <div className="px-6 py-4 w-full flex flex-col justify-center">
              <h1 className="font-titleFont underline underline-offset-4 decoration-[1px] font-semibold text-3xl mdl:text-4xl mb-2">
                New password
              </h1>
              <p className="text-sm text-gray-500 mb-4">
                Create a strong password for{" "}
                <span className="font-medium text-gray-700">{emailFromPrev}</span>.
              </p>

              <div className="flex flex-col gap-3">
                {/* Server error */}
                {serverErrMsg && (
                  <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                    <span className="font-bold italic mr-1">!</span>
                    {serverErrMsg}
                  </p>
                )}

                {/* New password */}
                <div className="flex flex-col gap-.5">
                  <p className="font-titleFont text-base font-semibold text-gray-600">New Password</p>
                  <div className="relative">
                    <input
                      onChange={e => { setNewPassword(e.target.value); setErrNewPassword(""); setServerErrMsg(""); }}
                      value={newPassword}
                      className="w-full h-8 placeholder:text-sm placeholder:tracking-wide px-4 pr-10 text-base font-medium placeholder:font-normal rounded-md border-[1px] border-gray-400 outline-none"
                      type={showNew ? "text" : "password"}
                      placeholder="Create a new password"
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff /> : <EyeOn />}
                    </button>
                  </div>
                  {errNewPassword && (
                    <div className="px-4">
                      {errNewPassword.split(" • ").map((msg, i) => (
                        <p key={i} className="text-sm text-red-500 font-titleFont font-semibold">
                          <span className="font-bold italic mr-1">!</span>
                          {msg}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="flex flex-col gap-.5">
                  <p className="font-titleFont text-base font-semibold text-gray-600">Confirm Password</p>
                  <div className="relative">
                    <input
                      onChange={e => { setConfirmPassword(e.target.value); setErrConfirm(""); }}
                      value={confirmPassword}
                      className="w-full h-8 placeholder:text-sm placeholder:tracking-wide px-4 pr-10 text-base font-medium placeholder:font-normal rounded-md border-[1px] border-gray-400 outline-none"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff /> : <EyeOn />}
                    </button>
                  </div>
                  {errConfirm && (
                    <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                      <span className="font-bold italic mr-1">!</span>
                      {errConfirm}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="bg-primeColor hover:bg-black text-gray-200 hover:text-white cursor-pointer w-full text-base font-medium h-10 rounded-md duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {pwLoading ? (
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : "Reset password"}
                </button>

                <p className="text-sm text-center font-titleFont font-medium">
                  <button
                    type="button"
                    onClick={() => setStep("otp")}
                    className="text-gray-500 hover:text-primeColor duration-300"
                  >
                    ← Back to OTP
                  </button>
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;