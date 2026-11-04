import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import SearchTerminal from "@/components/ui/search-terminal";
import PropertyCard from "@/components/ui/property-card";
import { mockProperties, mockCategories } from "@/lib/mock-data";

export default function HomePage() {
  const featuredProperties = mockProperties.filter((p) => p.featured);

  return (
    <>
      <Navbar />

      <main className="w-full pt-20 bg-[#f8f9fb] flex-1">
        {/* HERO SECTION WITH INTEGRATED SEARCH */}
        <section className="relative w-full overflow-hidden bg-[#f2f4f6] pb-12 pt-8">
          {/* Ambient architectural gradient blooms */}
          <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-[#a1f1e9]/20 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-[#d7e2ff]/30 blur-3xl pointer-events-none" />

          <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">
            {/* Editorial Lead */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-8">
              <div className="lg:col-span-8 flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e1e2e4] rounded-full w-fit">
                  <span className="w-2 h-2 rounded-full bg-[#076a64] animate-pulse" />
                  <span className="text-xs uppercase tracking-wider text-[#44474e] font-semibold">
                    Next-Gen Real Estate Ecosystem
                  </span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-[#001637] tracking-tight font-plus-jakarta mt-1">
                  Find a Place You&apos;ll Love to Call Home.
                </h1>
                <p className="text-base lg:text-lg text-[#44474e] max-w-2xl mt-1 leading-relaxed">
                  Explore premium rental apartments, family villas, and investment plots with verified
                  tenant agreements and AI-assisted property management.
                </p>
              </div>

              <div className="lg:col-span-4 flex justify-start lg:justify-end">
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-sm border border-[#e7e8ea]">
                  <div className="w-10 h-10 rounded-lg bg-[#076a64]/10 flex items-center justify-center text-[#076a64]">
                    <span className="material-symbols-outlined text-[24px]">verified_user</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#191c1e]">9,900+ Verified Assets</p>
                    <p className="text-xs text-[#44474e]">0% Fake Listings Guarantee</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Omni-Search Terminal */}
            <SearchTerminal />
          </div>
        </section>

        {/* SECTION: BROWSE BY PROPERTY CATEGORY */}
        <section className="w-full py-16 bg-[#f8f9fb]">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#076a64] font-bold">
                  Curated Portfolios
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#001637] tracking-tight font-plus-jakarta mt-1">
                  Browse by Property Category
                </h2>
              </div>
              <p className="text-sm text-[#44474e] max-w-sm">
                Classified by architectural blueprint and zoning approval for verified residential &amp; commercial investments.
              </p>
            </div>

            {/* Category Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/properties?cat=${cat.id}`}
                  className="group relative rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between h-80 border border-[#e7e8ea] hover:border-[#c5c6cf]"
                >
                  <div className="relative w-full h-44 rounded-lg overflow-hidden bg-[#edeef0]">
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-2 right-2 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-xs text-[#001637] font-bold shadow-sm">
                      {cat.count}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f2f4f6] group-hover:bg-[#001637] group-hover:text-white transition-colors flex items-center justify-center text-[#001637]">
                        <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#191c1e] group-hover:text-[#076a64] transition-colors font-plus-jakarta">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-[#44474e]">{cat.subtitle}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-[#44474e] group-hover:translate-x-1 group-hover:text-[#076a64] transition-all">
                      arrow_forward
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: FEATURED PREMIUM PROPERTIES */}
        <section className="w-full py-16 bg-[#f2f4f6]">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#076a64] rounded-full" />
                  <span className="text-xs uppercase tracking-wider text-[#076a64] font-bold">
                    Curated Masterpieces
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#001637] tracking-tight font-plus-jakarta mt-1">
                  Featured Premium Properties
                </h2>
              </div>

              <Link
                href="/properties"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#076a64] hover:text-[#001637] transition-colors"
              >
                <span>Explore All 240+ Featured Listings</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: AI ASSISTANT PROMOTIONAL BANNER */}
        <section className="w-full py-16 bg-white border-y border-[#e7e8ea]">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
            <div className="relative rounded-2xl bg-[#001637] text-white p-8 lg:p-12 overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#076a64]/30 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 flex flex-col gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full w-fit">
                    <span className="material-symbols-outlined text-[16px] text-[#a1f1e9]">
                      smart_toy
                    </span>
                    <span className="text-xs font-semibold text-[#a1f1e9] uppercase tracking-wider">
                      HavenKey AI Copilot
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight font-plus-jakarta">
                    Ask Anything. Find Your Dream Property in Seconds.
                  </h3>
                  <p className="text-sm text-[#8093bb] max-w-xl leading-relaxed">
                    Our AI parses natural language: &ldquo;Find me a 4-bed villa in DHA Phase 6 under 400k
                    with solar backup and verified biometric title&rdquo; and suggests verified listings instantly.
                  </p>
                </div>

                <div className="lg:col-span-4 flex justify-start lg:justify-end">
                  <Link
                    href="/ai-assistant"
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#076a64] text-white hover:bg-[#00201e] font-semibold rounded-xl transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                    <span>Launch AI Assistant</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
