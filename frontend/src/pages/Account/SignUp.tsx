// src/pages/Auth/SignUp.tsx

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate } from "react-router-dom";
import { test } from "../../assets/images";
import { useAuthActions } from "../../hooks/useAuthActions";

// ================= Email Validation start here =============
const EmailValidation = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i);
};
// ================= Email Validation End here ===============

const SignUp = () => {
  // ============= Initial State Start here =============
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [password,  setPassword]  = useState("");
  const [checked,   setChecked]   = useState(false);
  // ============= Initial State End here ===============

  // ============= Error Msg Start here =================
  const [errFirstName, setErrFirstName] = useState("");
  const [errLastName,  setErrLastName]  = useState("");
  const [errEmail,     setErrEmail]     = useState("");
  const [errPhone,     setErrPhone]     = useState("");
  const [errPassword,  setErrPassword]  = useState("");
  // ============= Error Msg End here ===================

  const [successMsg,   setSuccessMsg]   = useState("");
  const [serverErrMsg, setServerErrMsg] = useState("");
  const [loading,      setLoading]      = useState(false);

  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuthActions();

  // ============= Event Handler Start here =============
  const handleFirstName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
    setErrFirstName("");
    setServerErrMsg("");
  };
  const handleLastName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
    setErrLastName("");
    setServerErrMsg("");
  };
  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrEmail("");
    setServerErrMsg("");
  };
  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    setErrPhone("");
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
    if (checked) {
      if (!firstName) setErrFirstName("Enter your first name");
      if (!lastName)  setErrLastName("Enter your last name");
      if (!email) {
        setErrEmail("Enter your email");
      } else {
        if (!EmailValidation(email)) setErrEmail("Enter a Valid email");
      }
      if (!phone) setErrPhone("Enter your phone number");
      if (!password) {
        setErrPassword("Create a password");
      } else {
        if (password.length < 6) setErrPassword("Passwords must be at least 6 characters");
      }

      // ============== Getting the value ==============
      if (
        firstName &&
        lastName &&
        email &&
        EmailValidation(email) &&
        phone &&
        password &&
        password.length >= 6
      ) {
        setLoading(true);
        setServerErrMsg("");
        try {
          await register({ firstName, lastName, email, phoneNumber: phone, password });
          setSuccessMsg(
            `Hello dear ${firstName}, Welcome you to HAUSHOP. We received your Sign up request. We are processing to validate your access. Till then stay connected and additional assistance will be sent to you by your mail at ${email}`
          );
          setFirstName("");
          setLastName("");
          setEmail("");
          setPhone("");
          setPassword("");
          navigate("/", { replace: true });
        } catch (err) {
          setServerErrMsg((err as { message?: string }).message ?? "Registration failed");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-start">
      <div className="w-1/2 hidden lgl:inline-flex h-full text-white">
        <div className="w-[450px] h-full bg-primeColor px-10 flex flex-col gap-6 justify-center">
          <Link to="/">
            <img src={test} alt="logoImg" className="w-40" />
          </Link>
          <div className="flex flex-col gap-1 -mt-1">
            <h1 className="font-titleFont text-xl font-medium">
              Get started for free
            </h1>
            <p className="text-base">Create your account to access more</p>
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
      <div className="w-full lgl:w-[500px] h-full flex flex-col justify-center">
        {successMsg ? (
          <div className="w-[500px]">
            <p className="w-full px-4 py-10 text-green-500 font-medium font-titleFont">
              {successMsg}
            </p>
            <Link to="/signin">
              <button
                className="w-full h-10 bg-primeColor rounded-md text-gray-200 text-base font-titleFont font-semibold
            tracking-wide hover:bg-black hover:text-white duration-300"
              >
                Sign in
              </button>
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSignUp}
            className="w-full lgl:w-[500px] h-screen flex items-center justify-center"
          >
            <div className="px-6 py-4 w-full h-[96%] flex flex-col justify-start overflow-y-scroll scrollbar-thin scrollbar-thumb-primeColor">
              <h1 className="font-titleFont underline underline-offset-4 decoration-[1px] font-semibold text-2xl mdl:text-3xl mb-4">
                Create your account
              </h1>
              <div className="flex flex-col gap-3">

                {/* Server error */}
                {serverErrMsg && (
                  <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                    <span className="font-bold italic mr-1">!</span>
                    {serverErrMsg}
                  </p>
                )}

                {/* Last Name */}
                <div className="flex flex-col gap-.5">
                  <p className="font-titleFont text-base font-semibold text-gray-600">
                    Last Name
                  </p>
                  <input
                    onChange={handleLastName}
                    value={lastName}
                    className="w-full h-8 placeholder:text-sm placeholder:tracking-wide px-4 text-base font-medium placeholder:font-normal rounded-md border-[1px] border-gray-400 outline-none"
                    type="text"
                    placeholder="eg. Nguyen"
                    autoComplete="family-name"
                  />
                  {errLastName && (
                    <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                      <span className="font-bold italic mr-1">!</span>
                      {errLastName}
                    </p>
                  )}
                </div>

                {/* First Name */}
                <div className="flex flex-col gap-.5">
                  <p className="font-titleFont text-base font-semibold text-gray-600">
                    First Name
                  </p>
                  <input
                    onChange={handleFirstName}
                    value={firstName}
                    className="w-full h-8 placeholder:text-sm placeholder:tracking-wide px-4 text-base font-medium placeholder:font-normal rounded-md border-[1px] border-gray-400 outline-none"
                    type="text"
                    placeholder="eg. Van A"
                    autoComplete="given-name"
                  />
                  {errFirstName && (
                    <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                      <span className="font-bold italic mr-1">!</span>
                      {errFirstName}
                    </p>
                  )}
                </div>

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

                {/* Phone Number */}
                <div className="flex flex-col gap-.5">
                  <p className="font-titleFont text-base font-semibold text-gray-600">
                    Phone Number
                  </p>
                  <input
                    onChange={handlePhone}
                    value={phone}
                    className="w-full h-8 placeholder:text-sm placeholder:tracking-wide px-4 text-base font-medium placeholder:font-normal rounded-md border-[1px] border-gray-400 outline-none"
                    type="text"
                    placeholder="008801234567891"
                    autoComplete="tel"
                  />
                  {errPhone && (
                    <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                      <span className="font-bold italic mr-1">!</span>
                      {errPhone}
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
                    autoComplete="new-password"
                  />
                  {errPassword && (
                    <p className="text-sm text-red-500 font-titleFont font-semibold px-4">
                      <span className="font-bold italic mr-1">!</span>
                      {errPassword}
                    </p>
                  )}
                </div>

                {/* Checkbox */}
                <div className="flex items-start mdl:items-center gap-2">
                  <input
                    onChange={() => setChecked(!checked)}
                    className="w-4 h-4 mt-1 mdl:mt-0 cursor-pointer"
                    type="checkbox"
                    checked={checked}
                  />
                  <p className="text-sm text-primeColor">
                    I agree to the HAUSHOP{" "}
                    <span className="text-blue-500">Terms of Service </span>and{" "}
                    <span className="text-blue-500">Privacy Policy</span>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${
                    checked
                      ? "bg-primeColor hover:bg-black hover:text-white cursor-pointer"
                      : "bg-gray-500 hover:bg-gray-500 hover:text-gray-200 cursor-none"
                  } w-full text-gray-200 text-base font-medium h-10 rounded-md hover:text-white duration-300 disabled:opacity-60 flex items-center justify-center`}
                >
                  {loading ? (
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : "Create Account"}
                </button>



                <p className="text-sm text-center font-titleFont font-medium">
                  Already have an Account?{" "}
                  <Link to="/signin">
                    <span className="hover:text-blue-600 duration-300">
                      Sign in
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

export default SignUp;