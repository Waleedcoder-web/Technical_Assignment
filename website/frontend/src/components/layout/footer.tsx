import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#001637] text-white pt-16 pb-12 border-t border-[#172b4d]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand info */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[22px] text-[#a1f1e9]">
                  domain
                </span>
              </div>
              <span className="text-xl tracking-tight font-bold text-white">
                Haven<span className="text-[#a1f1e9]">Key</span>
              </span>
            </Link>
            <p className="text-sm text-[#8093bb] max-w-sm leading-relaxed">
              Pakistan&apos;s authoritative real estate management &amp; verified rental platform.
              Integrated with biometric landlord registries, digital lease agreements, and AI-driven matching.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-[#a1f1e9] border border-white/10">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                100% Verified Escrow
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-[#d7e2ff] border border-white/10">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                Biometric KYC
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs uppercase tracking-wider text-[#8093bb] font-semibold">
              Platform
            </h4>
            <Link href="/properties" className="text-sm text-white/80 hover:text-white transition-colors">
              Browse Properties
            </Link>
            <Link href="/ai-assistant" className="text-sm text-white/80 hover:text-white transition-colors">
              AI Real Estate Assistant
            </Link>
            <Link href="/properties?type=rent" className="text-sm text-white/80 hover:text-white transition-colors">
              Rental Homes &amp; Villas
            </Link>
            <Link href="/properties?type=sale" className="text-sm text-white/80 hover:text-white transition-colors">
              Properties for Sale
            </Link>
          </div>

          {/* User Portals */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs uppercase tracking-wider text-[#8093bb] font-semibold">
              Portals
            </h4>
            <Link href="/user/dashboard" className="text-sm text-white/80 hover:text-white transition-colors">
              Customer Dashboard
            </Link>
            <Link href="/user/dashboard" className="text-sm text-white/80 hover:text-white transition-colors">
              Active Leases
            </Link>
            <Link href="/admin/dashboard" className="text-sm text-white/80 hover:text-white transition-colors">
              Admin Operations Portal
            </Link>
            <Link href="/admin/dashboard" className="text-sm text-white/80 hover:text-white transition-colors">
              Landlord Verification Queue
            </Link>
          </div>

          {/* Legal / Contact */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs uppercase tracking-wider text-[#8093bb] font-semibold">
              Security &amp; Trust
            </h4>
            <span className="text-xs text-[#8093bb]">
              Encrypted biometric document verification &amp; regulatory compliant tenancy escrow.
            </span>
            <div className="mt-2 text-xs text-white/60">
              Support: concierge@havenkey.pk
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8093bb]">
          <p>© 2026 HavenKey Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-white transition-colors cursor-pointer">Tenant Escrow Protection</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
