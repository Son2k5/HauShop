// src/pages/Auth/SignIn.tsx

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { logoMainLight } from "../../assets/images";
import {test} from "../../assets/images"
import { useAuthActions } from "../../hooks/useAuthActions";

// ── Helpers ───────────────────────────────────────────────────────
const GOOGLE_ERRORS: Record<string, string> = {
  google_denied:       "You denied Google sign-in",
  google_invalid:      "Invalid Google request",
  google_unauthorized: "Google account email is not verified",
  google_error:        "Google sign-in failed, please try again",
};

const SignIn = () => {
  // ============= Initial State Start here =============
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  // ============= Initial State End here ===============

  // ============= Error Msg Start here =================
  const [errEmail,    setErrEmail]    = useState("");
  const [errPassword, setErrPassword] = useState("");
  // ============= Error Msg End here ===================

  const [successMsg,   setSuccessMsg]   = useState("");
  const [serverErrMsg, setServerErrMsg] = useState(""); // lỗi từ API / Google
  const [loading,      setLoading]      = useState(false);

  // ── Hooks ─────────────────────────────────────────────────────
  const navigate       = useNavigate();
  const location       = useLocation();
  const [searchParams] = useSearchParams();
  const { login, loginWithGoogle } = useAuthActions();
  const from = (location.state as { from?: string })?.from ?? "/";

  // Hiện lỗi nếu Google OAuth redirect về với ?error=
  useEffect(() => {
    const e = searchParams.get("error");
    if (e) setServerErrMsg(GOOGLE_ERRORS[e] ?? "Google sign-in failed");
  }, [searchParams]);

  // ============= Event Handler Start here =============
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
  // ============= Event Handler End here ===============

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email)    setErrEmail("Enter your email");
    if (!password) setErrPassword("Create a password");

    // ============== Getting the value ==============
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
        setServerErrMsg((err as { message?: string }).message ?? "Invalid email or password");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="w-1/2 hidden lgl:inline-flex h-full text-white">
        <div className="w-[450px] h-full bg-primeColor px-10 flex flex-col gap-6 justify-center">
          <Link to="/">
            <img src={test} alt="logoImg" className="w-40" />
          </Link>
          <div className="flex flex-col gap-1 -mt-1">
            <h1 className="font-titleFont text-xl font-medium">
              Stay sign in for more
            </h1>
            <p className="text-base">When you sign in, you are with us!</p>
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
            <p className="text-sm font-titleFont font-semibold text-gray-300 hover:text-white cursor-pointer duration-300">
              Terms
            </p>
            <p className="text-sm font-titleFont font-semibold text-gray-300 hover:text-white cursor-pointer duration-300">
              Privacy
            </p>
            <p className="text-sm font-titleFont font-semibold text-gray-300 hover:text-white cursor-pointer duration-300">
              Security
            </p>
          </div>
        </div>
      </div>
      <div className="w-full lgl:w-1/2 h-full">
        {successMsg ? (
          <div className="w-full lgl:w-[500px] h-full flex flex-col justify-center">
            <p className="w-full px-4 py-10 text-green-500 font-medium font-titleFont">
              {successMsg}
            </p>
            <Link to="/signup">
              <button
                className="w-full h-10 bg-primeColor text-gray-200 rounded-md text-base font-titleFont font-semibold 
            tracking-wide hover:bg-black hover:text-white duration-300"
              >
                Sign Up
              </button>
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSignUp}
            className="w-full lgl:w-[450px] h-screen flex items-center justify-center"
          >
            <div className="px-6 py-4 w-full h-[90%] flex flex-col justify-center overflow-y-scroll scrollbar-thin scrollbar-thumb-primeColor">
              <h1 className="font-titleFont underline underline-offset-4 decoration-[1px] font-semibold text-3xl mdl:text-4xl mb-4">
                Sign in
              </h1>
              <div className="flex flex-col gap-3">

                {/* Server / Google error */}
                {serverErrMsg && (
                  <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                    <span className="font-bold italic mr-1">!</span>
                    {serverErrMsg}
                  </p>
                )}


                {/* Email */}
                <div className="flex flex-col gap-.5">
                  <p className="font-titleFont text-base font-semibold text-gray-600">
                    Email
                  </p>
                  <input
                    onChange={handleEmail}
                    value={email}
                    className="w-full h-8 placeholder:text-sm placeholder:tracking-wide px-4 text-base font-medium placeholder:font-normal rounded-md border-[1px] border-gray-400 outline-none"
                    type="email"
                    placeholder="john@workemail.com"
                    autoComplete="email"
                  />
                  {errEmail && (
                    <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                      <span className="font-bold italic mr-1">!</span>
                      {errEmail}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-.5">
                  <p className="font-titleFont text-base font-semibold text-gray-600">
                    Password
                  </p>
                  <input
                    onChange={handlePassword}
                    value={password}
                    className="w-full h-8 placeholder:text-sm placeholder:tracking-wide px-4 text-base font-medium placeholder:font-normal rounded-md border-[1px] border-gray-400 outline-none"
                    type="password"
                    placeholder="Create password"
                    autoComplete="current-password"
                  />
                  {errPassword && (
                    <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                      <span className="font-bold italic mr-1">!</span>
                      {errPassword}
                    </p>
                  )}
                  {/* Forgot password */}
                  <div className="flex justify-end mt-1">
                    <Link
                      to="/forgot-password"
                      className="text-sm font-titleFont font-medium text-gray-500 hover:text-primeColor duration-300"
                    >
                      Forgot password?
                    </Link>
                  </div>
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
                  ) : "Sign In"}
                </button>
                  {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[1px] bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">or</span>
                  <div className="flex-1 h-[1px] bg-gray-200" />
                </div>

                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="w-full h-10 flex items-center justify-center gap-3 border-[1px] border-gray-400 rounded-md text-gray-700 text-sm font-medium hover:bg-gray-50 duration-300"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <p className="text-sm text-center font-titleFont font-medium">
                  Don't have an Account?{" "}
                  <Link to="/signup">
                    <span className="hover:text-blue-600 duration-300">
                      Sign up
                    </span>
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

export default SignIn;