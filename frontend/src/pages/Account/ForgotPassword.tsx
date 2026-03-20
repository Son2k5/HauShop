// src/pages/Auth/ForgotPassword.tsx

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import { logoLight } from "../../assets/images";
import { authService } from "../../services/Auth.service";
import { type ApiError } from "../../@types/auth.type";

const ForgotPassword = () => {
  const [email,        setEmail]        = useState("");
  const [errEmail,     setErrEmail]     = useState("");
  const [serverErrMsg, setServerErrMsg] = useState("");
  const [loading,      setLoading]      = useState(false);
  const [successMsg,   setSuccessMsg]   = useState("");

  const navigate = useNavigate();

  // ============= Event Handler =============
  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrEmail("");
    setServerErrMsg("");
  };

  // ============= Submit =============
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setErrEmail("Enter your email address");
      return;
    }

    setLoading(true);
    setServerErrMsg("");
    try {
      await authService.forgotPassword({ email });
      // Backend luôn trả 200 dù email có tồn tại hay không (bảo mật)
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
              Reset your password
            </h1>
            <p className="text-base">We'll send a code to your email</p>
          </div>
          <div className="w-[300px] flex items-start gap-3">
            <span className="text-green-500 mt-1">
              <Icon icon="mdi:check-circle" width="24" height="24" />
            </span>
            <p className="text-base text-gray-300">
              <span className="text-white font-semibold font-titleFont">
                Quick &amp; secure reset
              </span>
              <br />
              Enter your registered email and we'll send a one-time passcode valid for 15 minutes.
            </p>
          </div>
          <div className="w-[300px] flex items-start gap-3">
            <span className="text-green-500 mt-1">
              <Icon icon="mdi:check-circle" width="24" height="24" />
            </span>
            <p className="text-base text-gray-300">
              <span className="text-white font-semibold font-titleFont">
                Your account stays protected
              </span>
              <br />
              We never share your data. The OTP expires automatically if unused.
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
        {successMsg ? (
          /* ── Success state ── */
          <div className="w-full lgl:w-[450px] h-full flex flex-col justify-center px-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <h2 className="font-titleFont font-semibold text-2xl">Check your email</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                If <span className="font-medium text-gray-700">{successMsg}</span> is registered,
                we've sent a 6-digit OTP. It expires in <span className="font-medium">15 minutes</span>.
              </p>
              <p className="text-xs text-gray-400">Don't see it? Check your spam folder.</p>

              <button
                onClick={() => navigate("/reset-password", { state: { email: successMsg } })}
                className="w-full h-10 bg-primeColor hover:bg-black text-gray-200 hover:text-white text-base font-medium rounded-md duration-300 mt-2"
              >
                Enter OTP
              </button>

              <button
                onClick={() => { setSuccessMsg(""); setEmail(""); }}
                className="text-sm text-gray-500 hover:text-primeColor duration-300 underline underline-offset-2"
              >
                Use a different email
              </button>

              <p className="text-sm font-titleFont font-medium mt-2">
                Remember your password?{" "}
                <Link to="/signin">
                  <span className="hover:text-blue-600 duration-300">Sign in</span>
                </Link>
              </p>
            </div>
          </div>
        ) : (
          /* ── Form state ── */
          <form
            onSubmit={handleSubmit}
            className="w-full lgl:w-[450px] h-full flex items-center justify-center"
          >
            <div className="px-6 py-4 w-full flex flex-col justify-center">
              <h1 className="font-titleFont underline underline-offset-4 decoration-[1px] font-semibold text-3xl mdl:text-4xl mb-2">
                Forgot password
              </h1>
              <p className="text-sm text-gray-500 mb-4">
                Enter your email and we'll send you a reset code.
              </p>

              <div className="flex flex-col gap-3">
                {/* Server error */}
                {serverErrMsg && (
                  <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                    <span className="font-bold italic mr-1">!</span>
                    {serverErrMsg}
                  </p>
                )}

                {/* Email */}
                <div className="flex flex-col gap-.5">
                  <p className="font-titleFont text-base font-semibold text-gray-600">
                    Email address
                  </p>
                  <input
                    onChange={handleEmail}
                    value={email}
                    className="w-full h-8 placeholder:text-sm placeholder:tracking-wide px-4 text-base font-medium placeholder:font-normal rounded-md border-[1px] border-gray-400 outline-none"
                    type="email"
                    placeholder="john@workemail.com"
                    autoComplete="email"
                    autoFocus
                  />
                  {errEmail && (
                    <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                      <span className="font-bold italic mr-1">!</span>
                      {errEmail}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primeColor hover:bg-black text-gray-200 hover:text-white cursor-pointer w-full text-base font-medium h-10 rounded-md duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : "Send reset code"}
                </button>

                <p className="text-sm text-center font-titleFont font-medium">
                  Remember your password?{" "}
                  <Link to="/signin">
                    <span className="hover:text-blue-600 duration-300">Sign in</span>
                  </Link>
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;