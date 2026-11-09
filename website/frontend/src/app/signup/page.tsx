"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  cnic?: string;
  adress?: string;
  postalCode?: string;
  password?: string;
  confirmPassword?: string;
  agreeTerms?: string;
}

export default function SignUpPage() {
  const [role, setRole] = useState<"tenant" | "landlord" | "admin">("tenant");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [adress, setAdress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-format CNIC as XXXXX-XXXXXXX-X
  const handleCnicChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 13);
    let formatted = digits;
    if (digits.length > 5 && digits.length <= 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else if (digits.length > 12) {
      formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
    }
    setCnic(formatted);
    if (errors.cnic) setErrors((prev) => ({ ...prev, cnic: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};

    // 1. Full Legal Name: strictly letters A-Z, a-z and blank spaces ONLY (no numbers, no special characters)
    const nameRegex = /^[a-zA-Z ]+$/;
    if (!fullName.trim()) {
      errs.fullName = "Full legal name is required.";
    } else if (!nameRegex.test(fullName)) {
      errs.fullName = "Name cannot contain numbers or special characters. Only alphabets and spaces are allowed.";
    } else if (fullName.trim().length < 3) {
      errs.fullName = "Name must be at least 3 characters long.";
    } else if (fullName.trim().length > 50) {
      errs.fullName = "Name must not exceed 50 characters.";
    }

    // 2. Email Address
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!emailRegex.test(email.trim()) || email.includes("..")) {
      errs.email = "Please enter a valid email address (e.g. name@domain.com).";
    }

    // 3. Mobile Phone Number (Pakistani format 03XXXXXXXXX or +92 3XX XXXXXXX)
    const cleanPhone = phone.replace(/[\s-]/g, "");
    const phoneRegex = /^(\+923[0-9]{9}|03[0-9]{9})$/;
    if (!phone.trim()) {
      errs.phone = "Mobile phone number is required.";
    } else if (!phoneRegex.test(cleanPhone)) {
      errs.phone = "Enter a valid Pakistani mobile number (e.g. 0300 1234567 or +92 300 1234567).";
    }

    // 4. CNIC: Exactly 13 digits (XXXXX-XXXXXXX-X)
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!cnic.trim()) {
      errs.cnic = "CNIC / Smart National ID is required.";
    } else if (!cnicRegex.test(cnic.trim())) {
      errs.cnic = "CNIC must follow 13-digit standard format (e.g. 61101-1234567-1).";
    }

    // 5. Physical Address
    if (!adress.trim()) {
      errs.adress = "Physical address is required.";
    } else if (adress.trim().length < 5) {
      errs.adress = "Address must be at least 5 characters.";
    } else if (adress.trim().length > 200) {
      errs.adress = "Address cannot exceed 200 characters.";
    } else if (!/[a-zA-Z]/.test(adress)) {
      errs.adress = "Address must contain valid letters.";
    }

    // 6. Postal Code: Exactly 5 numeric digits
    const postalRegex = /^\d{5}$/;
    if (!postalCode.trim()) {
      errs.postalCode = "Postal code is required.";
    } else if (!postalRegex.test(postalCode.trim())) {
      errs.postalCode = "Postal code must be exactly 5 numeric digits (e.g. 44000).";
    }

    // 7. Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters long.";
    } else if (password.length > 64) {
      errs.password = "Password cannot exceed 64 characters.";
    } else if (!/[A-Z]/.test(password)) {
      errs.password = "Must contain at least 1 uppercase letter (A-Z).";
    } else if (!/[a-z]/.test(password)) {
      errs.password = "Must contain at least 1 lowercase letter (a-z).";
    } else if (!/\d/.test(password)) {
      errs.password = "Must contain at least 1 numeric digit (0-9).";
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errs.password = "Must contain at least 1 special character (!@#$%^&*).";
    }

    // 8. Confirm Password
    if (!confirmPassword) {
      errs.confirmPassword = "Confirm password is required.";
    } else if (confirmPassword !== password) {
      errs.confirmPassword = "Passwords do not match.";
    }

    // 9. Terms of Service
    if (!agreeTerms) {
      errs.agreeTerms = "You must agree to the Terms of Service.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setErrorMsg("Please correct the errors highlighted in red.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone_no: phone.trim(),
          CNIC: cnic.trim(),
          password,
          adress: adress.trim(),
          postal_code: postalCode.trim(),
          role,
        }),
      });

      const text = await res.text();
      let result: any = null;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(text || "Server returned an unexpected response. Please try again.");
      }

      if (!res.ok || !result.success) {
        if (result.field === "email") {
          setErrors((prev) => ({ ...prev, email: result.message }));
        } else if (result.field === "cnic") {
          setErrors((prev) => ({ ...prev, cnic: result.message }));
        }
        throw new Error(result.message || "Registration failed.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("havenkey_user", JSON.stringify(result.data));
        window.dispatchEvent(new Event("havenkey_auth_change"));
      }

      if (role === "admin") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/user/dashboard";
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="w-full pt-20 bg-[#f8f9fb] flex-1">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Panel: Sign Up Onboarding Flow */}
            <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl shadow-sm border border-[#e7e8ea] p-6 sm:p-8 lg:p-10">
              {/* Top Navigation & Badge */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#44474e] hover:text-[#001637] transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Back to Sign In</span>
                </Link>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#a1f1e9] text-[#076a64] text-[11px] font-bold tracking-wide">
                  <span className="material-symbols-outlined text-[14px]">verified_user</span>
                  <span>Institutional Identity Portal</span>
                </span>
              </div>

              {/* Headline & Intro */}
              <div className="flex flex-col gap-1.5 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#001637] tracking-tight font-plus-jakarta">
                  Create your HavenKey account
                </h1>
                <p className="text-xs sm:text-sm text-[#44474e] max-w-xl leading-relaxed">
                  Join Pakistan&apos;s premier verified real estate network for seamless leasing, escrow-backed rent protection, and sovereign digital property management.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                {/* Full Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1" htmlFor="full-name">
                      Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[18px] text-[#75777f] absolute left-3 pointer-events-none">
                        person
                      </span>
                      <input
                        id="full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          const lettersAndSpacesOnly = e.target.value.replace(/[^a-zA-Z ]/g, "");
                          setFullName(lettersAndSpacesOnly);
                          if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                        }}
                        placeholder="Letters and spaces only"
                        className={`w-full h-11 pl-10 pr-3 bg-[#f2f4f6] rounded-lg text-[#191c1e] text-xs placeholder:text-[#75777f]/70 border ${
                          errors.fullName ? "border-red-500 bg-red-50/30" : "border-[#e7e8ea] focus:border-[#076a64]"
                        } focus:bg-white outline-none transition-all`}
                      />
                    </div>
                    {errors.fullName && <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1" htmlFor="email">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[18px] text-[#75777f] absolute left-3 pointer-events-none">
                        mail
                      </span>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        placeholder="name@havenkey.pk"
                        className={`w-full h-11 pl-10 pr-3 bg-[#f2f4f6] rounded-lg text-[#191c1e] text-xs placeholder:text-[#75777f]/70 border ${
                          errors.email ? "border-red-500 bg-red-50/30" : "border-[#e7e8ea] focus:border-[#076a64]"
                        } focus:bg-white outline-none transition-all`}
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.email}</p>}
                  </div>
                </div>

                {/* Phone & CNIC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1" htmlFor="phone">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="h-11 px-3 bg-[#e7e8ea] rounded-lg flex items-center justify-center text-xs font-bold text-[#191c1e] shrink-0">
                        <span>🇵🇰 +92</span>
                      </div>
                      <div className="relative flex-1 flex items-center">
                        <input
                          id="phone"
                          type="tel"
                          maxLength={15}
                          value={phone}
                          onChange={(e) => {
                            const filtered = e.target.value.replace(/[^\d\s-]/g, "");
                            setPhone(filtered);
                            if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                          }}
                          placeholder="300 1234567"
                          className={`w-full h-11 px-3 bg-[#f2f4f6] rounded-lg text-[#191c1e] text-xs placeholder:text-[#75777f]/70 border ${
                            errors.phone ? "border-red-500 bg-red-50/30" : "border-[#e7e8ea] focus:border-[#076a64]"
                          } focus:bg-white outline-none transition-all`}
                        />
                        {/* 
                          COMMENTED OUT: Send OTP button per request
                          <button type="button">Send OTP</button> 
                        */}
                      </div>
                    </div>
                    {errors.phone && <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.phone}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#191c1e]" htmlFor="cnic">
                        CNIC / National ID <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-[#75777f]">13-digit format</span>
                    </div>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[18px] text-[#75777f] absolute left-3 pointer-events-none">
                        badge
                      </span>
                      <input
                        id="cnic"
                        type="text"
                        maxLength={15}
                        value={cnic}
                        onChange={(e) => handleCnicChange(e.target.value)}
                        placeholder="61101-1234567-1"
                        className={`w-full h-11 pl-10 pr-3 bg-[#f2f4f6] rounded-lg text-[#191c1e] text-xs placeholder:text-[#75777f]/70 border ${
                          errors.cnic ? "border-red-500 bg-red-50/30" : "border-[#e7e8ea] focus:border-[#076a64]"
                        } focus:bg-white outline-none transition-all`}
                      />
                    </div>
                    {errors.cnic && <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.cnic}</p>}
                  </div>
                </div>

                {/* Address & Postal Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1" htmlFor="adress">
                      Residential / Office Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[18px] text-[#75777f] absolute left-3 pointer-events-none">
                        home
                      </span>
                      <input
                        id="adress"
                        type="text"
                        maxLength={200}
                        value={adress}
                        onChange={(e) => {
                          setAdress(e.target.value);
                          if (errors.adress) setErrors((prev) => ({ ...prev, adress: undefined }));
                        }}
                        placeholder="House / Flat / Street, Sector, City"
                        className={`w-full h-11 pl-10 pr-3 bg-[#f2f4f6] rounded-lg text-[#191c1e] text-xs placeholder:text-[#75777f]/70 border ${
                          errors.adress ? "border-red-500 bg-red-50/30" : "border-[#e7e8ea] focus:border-[#076a64]"
                        } focus:bg-white outline-none transition-all`}
                      />
                    </div>
                    {errors.adress && <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.adress}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1" htmlFor="postalCode">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[18px] text-[#75777f] absolute left-3 pointer-events-none">
                        markunread_mailbox
                      </span>
                      <input
                        id="postalCode"
                        type="text"
                        maxLength={5}
                        value={postalCode}
                        onChange={(e) => {
                          setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5));
                          if (errors.postalCode) setErrors((prev) => ({ ...prev, postalCode: undefined }));
                        }}
                        placeholder="44000"
                        className={`w-full h-11 pl-10 pr-3 bg-[#f2f4f6] rounded-lg text-[#191c1e] text-xs placeholder:text-[#75777f]/70 border ${
                          errors.postalCode ? "border-red-500 bg-red-50/30" : "border-[#e7e8ea] focus:border-[#076a64]"
                        } focus:bg-white outline-none transition-all`}
                      />
                    </div>
                    {errors.postalCode && <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.postalCode}</p>}
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#191c1e]" htmlFor="password">
                        Create Password <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] font-semibold text-[#076a64] hover:text-[#001637] transition-colors focus:outline-none"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[18px] text-[#75777f] absolute left-3 pointer-events-none">
                        lock
                      </span>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        placeholder="Min 8 characters with symbol"
                        className={`w-full h-11 pl-10 pr-3 bg-[#f2f4f6] rounded-lg text-[#191c1e] text-xs placeholder:text-[#75777f]/70 border ${
                          errors.password ? "border-red-500 bg-red-50/30" : "border-[#e7e8ea] focus:border-[#076a64]"
                        } focus:bg-white outline-none transition-all`}
                      />
                    </div>
                    {errors.password && <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191c1e] mb-1" htmlFor="confirm-password">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined text-[18px] text-[#75777f] absolute left-3 pointer-events-none">
                        lock_reset
                      </span>
                      <input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                        }}
                        placeholder="Re-enter password"
                        className={`w-full h-11 pl-10 pr-3 bg-[#f2f4f6] rounded-lg text-[#191c1e] text-xs placeholder:text-[#75777f]/70 border ${
                          errors.confirmPassword ? "border-red-500 bg-red-50/30" : "border-[#e7e8ea] focus:border-[#076a64]"
                        } focus:bg-white outline-none transition-all`}
                      />
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Password Strength Checklist */}
                <div className="p-3 bg-[#f2f4f6] rounded-lg flex flex-col gap-1.5 border border-[#e7e8ea]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#44474e] font-semibold">Security Criteria:</span>
                    <span className="text-[#076a64] font-bold text-[11px]">Bcrypt Salt-10 Encrypted</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                    <span className={`flex items-center gap-1 ${password.length >= 8 ? "text-[#076a64] font-bold" : "text-[#75777f]"}`}>
                      <span className="material-symbols-outlined text-[13px]">{password.length >= 8 ? "check_circle" : "radio_button_unchecked"}</span> 8+ chars
                    </span>
                    <span className={`flex items-center gap-1 ${/\d/.test(password) ? "text-[#076a64] font-bold" : "text-[#75777f]"}`}>
                      <span className="material-symbols-outlined text-[13px]">{/\d/.test(password) ? "check_circle" : "radio_button_unchecked"}</span> 1 Number
                    </span>
                    <span className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? "text-[#076a64] font-bold" : "text-[#75777f]"}`}>
                      <span className="material-symbols-outlined text-[13px]">{/[A-Z]/.test(password) ? "check_circle" : "radio_button_unchecked"}</span> 1 Uppercase
                    </span>
                    <span className={`flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-[#076a64] font-bold" : "text-[#75777f]"}`}>
                      <span className="material-symbols-outlined text-[13px]">{/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "check_circle" : "radio_button_unchecked"}</span> 1 Symbol
                    </span>
                  </div>
                </div>

                {/* Agreement Checkboxes */}
                <div className="flex flex-col gap-2 mt-1">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: undefined }));
                      }}
                      className="mt-1 w-4 h-4 rounded text-[#076a64] focus:ring-0 cursor-pointer accent-[#076a64]"
                    />
                    <span className="text-xs text-[#44474e] leading-relaxed">
                      I agree to the{" "}
                      <a href="#" className="font-semibold text-[#076a64] underline">
                        Terms of Service
                      </a>
                      ,{" "}
                      <a href="#" className="font-semibold text-[#076a64] underline">
                        Privacy Policy
                      </a>
                      , and verified tenancy escrow regulations.
                    </span>
                  </label>
                  {errors.agreeTerms && <p className="text-[11px] text-red-600 font-medium pl-6">{errors.agreeTerms}</p>}

                  {/* 
                    COMMENTED OUT: Biometric checkbox per request
                    <label>Enable biometric identity...</label>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-12 w-full rounded-lg bg-[#001637] hover:bg-[#172b4d] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md focus:outline-none"
                >
                  <span>{loading ? "Creating Encrypted Account..." : "Create Account & Continue"}</span>
                  <span className="material-symbols-outlined text-[20px]">
                    {loading ? "hourglass_top" : "arrow_forward"}
                  </span>
                </button>
              </form>

              {/* Sign in prompt */}
              <div className="mt-6 text-center text-xs text-[#44474e]">
                Already have a HavenKey account?
                <Link
                  href="/login"
                  className="text-xs font-bold text-[#076a64] hover:text-[#001637] transition-colors ml-1"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Right Panel: Brand & Institutional Showcase */}
            <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
              <div className="relative w-full rounded-2xl overflow-hidden shadow-xl min-h-[540px] flex flex-col justify-between p-8 text-white">
                <div
                  className="absolute inset-0 bg-cover bg-center -z-10"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA0M7Y7J92WaomE06NQNhYCGOrus2bQUHaYlkug56ERx5ks4dPAialFPRwtx_yfsunmdiKZ-O-d2PjhY7fl8g1ehjMNFcPozb1AHnMzZw3do_ZKkGf780GI2TMb0CZdkmjqlwvdkppp0Wk1N8Lw_YzdqKTpB2LuMd68jsht3V2qVZKmoRzPMTXF_l97Aj0j5rVUu4ocO328YFhNHuCjMdTVi9cNan0uKoc8WeIsyjc')",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001637] via-[#001637]/70 to-[#001637]/40 -z-10" />

                <div className="flex flex-col gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-white/90 w-fit">
                    <span className="material-symbols-outlined text-[16px] text-[#a1f1e9]">security</span>
                    Bank-Grade Hash Security
                  </span>
                  <h3 className="text-2xl font-bold font-plus-jakarta leading-tight">
                    Encrypted Real Estate Portal for Pakistan
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed">
                    All passwords are salted and hashed using Bcrypt before storage. Your data is protected under SBP escrow security guidelines.
                  </p>
                </div>

                <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex flex-col gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#a1f1e9] font-bold">
                    Enterprise Standards
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-bold text-white">Bcrypt 10-Rounds</p>
                      <p className="text-[11px] text-white/70">One-way hash</p>
                    </div>
                    <div>
                      <p className="font-bold text-white">NADRA Verification</p>
                      <p className="text-[11px] text-white/70">13-Digit CNIC</p>
                    </div>
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
