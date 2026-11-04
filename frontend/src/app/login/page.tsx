"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

interface LoginErrors {
  identifier?: string;
  password?: string;
}

export default function LoginPage() {
  const [role, setRole] = useState<"tenant" | "landlord" | "admin">("tenant");
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const validate = (): boolean => {
    const errs: LoginErrors = {};

    const cleanId = identifier.trim();
    if (!cleanId) {
      errs.identifier = "Email, Mobile number, or CNIC is required.";
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
      const digitsOnly = cleanId.replace(/\D/g, "");
      const isPakMobile = digitsOnly.length === 11 && (digitsOnly.startsWith("03") || digitsOnly.startsWith("923"));
      const isCnic = cnicRegex.test(cleanId) || digitsOnly.length === 13;
      const isEmail = emailRegex.test(cleanId);

      if (!isEmail && !isPakMobile && !isCnic && cleanId.length < 3) {
        errs.identifier = "Please enter a valid email, mobile number, or CNIC.";
      }
    }

    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters long.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setErrorMsg("Please provide your login credentials.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password, role }),
      });

      const text = await res.text();
      let result: any = null;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(text || "Server returned an unexpected response. Please try again.");
      }

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Login failed. Check your credentials.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("havenkey_user", JSON.stringify(result.data));
        if (result.token) localStorage.setItem("havenkey_token", result.token);
        window.dispatchEvent(new Event("havenkey_auth_change"));
      }

      if (result.data.role === "admin" || role === "admin") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/user/dashboard";
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="w-full pt-20 bg-[#f8f9fb] flex-1">
        <div className="w-full max-w-[1440px] mx-auto min-h-[calc(100vh-5rem)] flex flex-col lg:flex-row bg-[#f8f9fb]">
          {/* Left Column: Authentication Form Panel */}
          <div className="w-full lg:w-[48%] xl:w-[46%] flex flex-col justify-between px-6 sm:px-10 lg:px-14 py-8 lg:py-12 bg-[#f8f9fb]">
            {/* Top Utility Nav */}
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[#44474e] hover:text-[#001637] transition-colors text-xs font-semibold group"
              >
                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
                  arrow_back
                </span>
                <span>Back to Home</span>
              </Link>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#e7e8ea] rounded-full">
                <span className="inline-block w-2 h-2 rounded-full bg-[#076a64] animate-pulse" />
                <span className="text-[11px] font-semibold text-[#44474e] uppercase tracking-wider">
                  Secure Portal
                </span>
              </div>
            </div>

            {/* Center Form Container */}
            <div className="w-full max-w-[460px] mx-auto my-auto py-2">
              {/* Title & Subtitle */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 bg-[#076a64]/10 rounded-md">
                  <span className="material-symbols-outlined text-[16px] text-[#076a64]">
                    verified_user
                  </span>
                  <span className="text-xs font-semibold text-[#076a64] tracking-wide">
                    Enterprise Identity Gate
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-[#001637] font-plus-jakarta tracking-tight mb-2">
                  Welcome back to HavenKey
                </h1>
                <p className="text-sm text-[#44474e] leading-relaxed">
                  Access your property portfolio, digital lease agreements, and verified concierge services.
                </p>
              </div>



              {/* 
                COMMENTED OUT: Google SSO & Apple ID per request
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button type="button">Google SSO</button>
                  <button type="button">Apple ID</button>
                </div>
              */}

              {/* Form Elements */}
              <form onSubmit={handleLogin} noValidate className="space-y-4">
                {/* Identifier */}
                <div>
                  <label className="block text-xs font-semibold text-[#191c1e] mb-1.5" htmlFor="identifier">
                    Email, Mobile, or CNIC <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-lg shadow-xs">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#75777f]">
                      <span className="material-symbols-outlined text-[20px]">badge</span>
                    </span>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
                      }}
                      placeholder="name@havenkey.pk, 0300-1234567, or 61101-1234567-1"
                      className={`w-full h-11 pl-10 pr-4 bg-white text-[#191c1e] placeholder:text-[#75777f]/70 rounded-lg border ${
                        errors.identifier ? "border-red-500 bg-red-50/20" : "border-[#e7e8ea] focus:border-[#076a64]"
                      } focus:outline-none text-xs transition-shadow`}
                    />
                  </div>
                  {errors.identifier ? (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.identifier}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-[#44474e] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-[#076a64]">
                        info
                      </span>
                      <span>NADRA biometric linked CNIC or registered email</span>
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#191c1e]" htmlFor="password">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <a
                      href="#"
                      className="text-xs font-semibold text-[#076a64] hover:text-[#00201e] transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative rounded-lg shadow-xs">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#75777f]">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      placeholder="Enter your account password"
                      className={`w-full h-11 pl-10 pr-11 bg-white text-[#191c1e] placeholder:text-[#75777f]/70 rounded-lg border ${
                        errors.password ? "border-red-500 bg-red-50/20" : "border-[#e7e8ea] focus:border-[#076a64]"
                      } focus:outline-none text-xs transition-shadow`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#75777f] hover:text-[#191c1e] transition-colors focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.password}</p>}
                </div>

                {/* Options Row */}
                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#076a64] focus:ring-0 accent-[#076a64]"
                    />
                    <span className="text-xs text-[#44474e]">Remember device for 30 days</span>
                  </label>

                  {/* 
                    COMMENTED OUT: Biometric Ready badge per request
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#076a64]/10 rounded text-[11px] text-[#076a64] font-semibold self-start sm:self-auto">
                      <span className="material-symbols-outlined text-[13px]">fingerprint</span>
                      <span>Biometric Ready</span>
                    </div>
                  */}
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-red-500">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#172b4d] hover:bg-[#001637] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg focus:outline-none"
                  >
                    <span>{loading ? "Authenticating..." : "Sign In to HavenKey"}</span>
                    <span className="material-symbols-outlined text-[20px]">
                      {loading ? "hourglass_top" : "arrow_forward"}
                    </span>
                  </button>
                </div>

                {/* 
                  COMMENTED OUT: OTP Alternative button per request
                  <div className="pt-1 text-center">
                    <button type="button">Sign in via One-Time Passcode (OTP)</button>
                  </div>
                */}
              </form>

              {/* Create account switch */}
              <div className="mt-6 pt-5 text-center bg-[#f2f4f6]/60 rounded-xl p-3.5 border border-[#e7e8ea]">
                <p className="text-xs text-[#44474e]">
                  New to HavenKey platform?
                  <Link
                    href="/signup"
                    className="text-xs font-bold text-[#076a64] hover:text-[#00201e] underline underline-offset-4 ml-1"
                  >
                    Create an Account
                  </Link>
                </p>
              </div>
            </div>

            {/* Trust disclaimer */}
            <div className="mt-8 pt-4 flex flex-col gap-2 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 text-[#75777f] text-[11px] font-semibold">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#076a64]">lock</span>
                  Bcrypt Salt-10 Hash
                </span>
                <span className="w-1 h-1 rounded-full bg-[#75777f]" />
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#076a64]">
                    account_balance
                  </span>
                  SBP Escrow Standards
                </span>
                <span className="w-1 h-1 rounded-full bg-[#75777f]" />
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#076a64]">
                    verified
                  </span>
                  NADRA CNIC Audit
                </span>
              </div>
              <p className="text-[11px] text-[#75777f] max-w-sm mx-auto lg:mx-0">
                Protected by HavenKey Identity Guard. Passwords are never stored in plain text.
              </p>
            </div>
          </div>

          {/* Right Column: Visual Architectural Showcase Panel */}
          <div className="w-full lg:w-[52%] xl:w-[54%] relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden min-h-[560px] lg:min-h-full">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-100 hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuALyAwR_YQ7aHgzFwFfqIzg2BrEmMJq8afMlJwf_prP7YapSDFboeIcoAlZdjhnfZ-oEGy1uZL5_jw9sj_KJj8B6aeFV9R_UKFIV-2uafVymM8FxmsrVT1G6-UpdoTnss-oIbXhbtQm0aYZ9NV_xBW5WGF5N83vW2nKBHWeeGymuNKCP9bxS2PAlFQjiYwuJu9XIm94Gzfd3iprYUjSCdH6FSMfyHK8GxwlSC5vUKo')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001637] via-[#001637]/60 to-[#001637]/30 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#001637]/80 via-transparent to-[#001637]/40" />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/15 backdrop-blur-md rounded-full shadow-lg">
                <span className="material-symbols-outlined text-[18px] text-[#a1f1e9]">
                  shield_with_heart
                </span>
                <span className="text-xs font-semibold text-white tracking-wide">
                  Institutional Asset Custody
                </span>
              </div>
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs text-[#e1e2e4]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>99.98% System Uptime</span>
              </div>
            </div>

            <div className="relative z-10 my-auto py-12 max-w-lg text-white">
              <div className="w-12 h-1 bg-[#076a64] rounded-full mb-6" />
              <span className="text-xs uppercase tracking-widest text-[#a1f1e9] mb-3 block font-bold">
                Featured Residence • Sector E-7, Margalla View
              </span>
              <blockquote className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 leading-snug font-plus-jakarta">
                &ldquo;HavenKey revolutionized our portfolio leasing. Transparent verification, seamless rent settlement, and institutional security in one clean ecosystem.&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-sm">
                  AA
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Asadullah Abbasi</p>
                  <p className="text-xs text-[#b4c7f1]">Managing Principal, Highland Capital &amp; Living</p>
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-white">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-white/80 mb-1">
                      Managed Volume
                    </span>
                    <span className="text-2xl font-bold tracking-tight font-plus-jakarta">
                      PKR 4.2B+
                    </span>
                    <span className="text-xs text-[#a1f1e9] mt-0.5 flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[15px]">trending_up</span>
                      <span>Active Leases</span>
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-white/80 mb-1">
                      ID Verification
                    </span>
                    <span className="text-2xl font-bold tracking-tight font-plus-jakarta">
                      100%
                    </span>
                    <span className="text-xs text-[#a1f1e9] mt-0.5 flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[15px]">verified</span>
                      <span>NADRA Verified</span>
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-white/80 mb-1">
                      Settlement Cycle
                    </span>
                    <span className="text-2xl font-bold tracking-tight font-plus-jakarta">
                      Real-Time
                    </span>
                    <span className="text-xs text-[#a1f1e9] mt-0.5 flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[15px]">bolt</span>
                      <span>Raast Instant Rail</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
