"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface UserProfile {
  id?: string;
  fullname?: string;
  name?: string;
  email?: string;
  role?: string;
}

function getInitials(name?: string): string {
  if (!name) return "WH";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      try {
        const stored = localStorage.getItem("havenkey_user");
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    syncUser();

    // Listen to storage events and custom auth changes
    window.addEventListener("storage", syncUser);
    window.addEventListener("havenkey_auth_change", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("havenkey_auth_change", syncUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("havenkey_user");
    localStorage.removeItem("havenkey_token");
    setUser(null);
    setMenuOpen(false);
    window.dispatchEvent(new Event("havenkey_auth_change"));
    window.location.href = "/login";
  };

  // Base links visible to all users
  const baseLinks = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: "AI Assistant", href: "/ai-assistant" },
  ];

  // Dashboard link ONLY shown when user is logged in AND role is admin
  const navLinks =
    user?.role === "admin"
      ? [...baseLinks, { label: "Dashboard", href: "/admin/dashboard" }]
      : baseLinks;

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#f8f9fb]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#e7e8ea]">
      <div className="h-20 max-w-[1440px] mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
        {/* Logo and Nav links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 focus:outline-none group">
            <div className="w-9 h-9 rounded-lg bg-[#001637] flex items-center justify-center text-white shadow-sm group-hover:bg-[#172b4d] transition-colors">
              <span className="material-symbols-outlined text-[22px] text-[#a1f1e9]">
                domain
              </span>
            </div>
            <span className="font-headline-sm text-headline-sm text-[#001637] tracking-tight font-bold">
              Haven<span className="text-[#076a64]">Key</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors py-1 text-sm font-semibold ${
                    isActive
                      ? "text-[#001637] border-b-2 border-[#076a64]"
                      : "text-[#44474e] hover:text-[#001637]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/properties"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-[#172b4d] text-white text-xs font-semibold rounded-lg hover:bg-[#001637] transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>List Property</span>
          </Link>

          {/* User state: Show avatar circle ONLY when logged in */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 focus:outline-none group p-0.5 rounded-full"
                title={`${user.fullname || user.name || "User"} (${user.role || "User"})`}
              >
                <div className="w-9 h-9 rounded-full bg-[#001637] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#a1f1e9] shadow-sm hover:scale-105 transition-transform">
                  {getInitials(user.fullname || user.name)}
                </div>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#e7e8ea] py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#edeef0]">
                      <p className="text-xs font-bold text-[#001637] truncate">
                        {user.fullname || user.name || "HavenKey User"}
                      </p>
                      <p className="text-[11px] text-[#75777f] truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#076a64]/10 text-[#076a64]">
                        Role: {user.role || "tenant"}
                      </span>
                    </div>

                    {user.role === "admin" ? (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#191c1e] hover:bg-[#f2f4f6] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#076a64]">
                          admin_panel_settings
                        </span>
                        <span>Admin Dashboard</span>
                      </Link>
                    ) : (
                      <Link
                        href="/user/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#191c1e] hover:bg-[#f2f4f6] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#076a64]">
                          dashboard
                        </span>
                        <span>My Dashboard</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors border-t border-[#edeef0] mt-1"
                    >
                      <span className="material-symbols-outlined text-[18px] text-red-500">
                        logout
                      </span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Logged out state: No circle, show Sign In & Sign Up */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-semibold text-[#191c1e] hover:text-[#076a64] transition-colors px-3 py-2 rounded-lg hover:bg-[#edeef0]"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-xs font-semibold bg-[#001637] text-white hover:bg-[#172b4d] transition-colors px-3 py-2 rounded-lg shadow-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
