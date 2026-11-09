import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import SearchTerminal from "@/components/ui/search-terminal";
import PropertyCard from "@/components/ui/property-card";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let dbProperties: any[] = [];

  try {
    const { data } = await supabaseAdmin
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) dbProperties = data;
  } catch (err) {
    console.warn("HomePage properties fetch notice:", err);
  }

  // Map to PropertyCard-compatible objects
  const properties = dbProperties.map((p) => ({
    ...p,
    category: p.property_type || "villas",
    transactionType: p.listing_type || "rent",
    priceFormatted: `PKR ${Number(p.price || 0).toLocaleString()}`,
    pricePeriod: p.listing_type === "sale" ? undefined : "/ mo",
    beds: p.bedroom ?? 4,
    baths: p.bathroom ?? 4,
    size: `${p.area_value || 10} ${p.area_unit || "Marla"}`,
    city: (p.location || "Lahore").split(",")[0].trim(),
    verified: true,
    imageUrl: (p.images && p.images[0]) || p.image_url || "",
  }));

  const totalAssets = properties.length;
  const featuredProperties = properties.filter((p) => p.featured).length > 0
    ? properties.filter((p) => p.featured)
    : properties.slice(0, 6);

  // Dynamic real counts per category
  const housesCount = properties.filter((p) => {
    const t = (p.property_type || "").toLowerCase();
    return t.includes("villa") || t.includes("house") || t.includes("home");
  }).length;

  const apartmentsCount = properties.filter((p) => {
    const t = (p.property_type || "").toLowerCase();
    return t.includes("apartment");
  }).length;

  const flatsCount = properties.filter((p) => {
    const t = (p.property_type || "").toLowerCase();
    return t.includes("flat");
  }).length;

  const plotsCount = properties.filter((p) => {
    const t = (p.property_type || "").toLowerCase();
    return t.includes("plot");
  }).length;

  const categories = [
    {
      id: "houses",
      name: "Houses & Villas",
      count: `${housesCount} listing${housesCount === 1 ? "" : "s"}`,
      subtitle: "Independent Estates",
      icon: "villa",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAExGAZu9bjGZfBZuKeg2v80L2uTkQN5uPxYd5OvjIX4vnFIJ7swxpQLQaPoACbCFAgRrQckFPI4nAtLvyLf62LN9hlpd9e2EJf81POrnesjp7uGz1g4-jeZ-pt0A5it-gAtDzruihO5Jfv2TwTfNg1HjBvpAoPIP2OTvDjOw2j-v79E2qGB2mc4cSo3xoyboDl8FJaT1QsH5xdQdgboB6bwRLI6sh2R_q6Xe3NUTQ",
    },
    {
      id: "apartments",
      name: "Apartments",
      count: `${apartmentsCount} listing${apartmentsCount === 1 ? "" : "s"}`,
      subtitle: "High-Rise Complexes",
      icon: "apartment",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCJhKcNxUOfL6-Y4VmklswhpN0T0BXa_7MfbvcOcA5ynslw0iREIolQCg_woiKUWRSAWhcxFwOaeVFl4M0-Ul2QyzS8a-YluVBY2ivvU2ac1ZS4lj-btoPXwJiZ4YlqA4h2N_dY18SNcU5TowTmuO_pyVKdle4tpBZZkosdMnngjk7p3ljDWbVhTIoFJzVQq127w1BtEl890dYNFicQNJm4blcwVmo9hCOak_sODp4",
    },
    {
      id: "flats",
      name: "Modern Flats",
      count: `${flatsCount} listing${flatsCount === 1 ? "" : "s"}`,
      subtitle: "Urban Living Studios",
      icon: "home_work",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAuhCd8y5D67ZcQ8dx5AyvygB9uKVZyBWtH1ObbS54HY8uWlwy8yE_BK_PwcsBm1z3EXKFWHduEhmI4p-meuym6AlmX6Ibr6bM3-oysJZTSDxwsYzdB-VUY9bVBTrJ8ydbaUbW56oq3hgqgqxYUJPXyrHyV_7fYfDdDaR8_KFBvZjBrh8g-_-r4kyUsXQ9v3sI78eNR07ug9n9vX_nDRAihkKc1YpAombcRxyPUxn4",
    },
    {
      id: "plots",
      name: "Prime Plots",
      count: `${plotsCount} listing${plotsCount === 1 ? "" : "s"}`,
      subtitle: "Residential & Commercial",
      icon: "terrain",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBAWv1B3wntgnk-nGQracJPQSt5suV4VVK7ugQ6q19LBB20hDbAtrz4jOAh2H-DSjF8lJsinyz4lgFUOHM0PjbctSdYfBOiSbRU6fcZ3bi8xNPjjD9wEbotrIGp6j8hllatLch3uzrcAYeuSfHYtY1T1K69x5bNnUytM0mPMLyq790bZJpTYan5Lx99I66DVbiV5jDo5vKHRCW1KjbQK92fO4wwo6B9mOhSgEpWBvM",
    },
  ];

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
                    <p className="text-sm font-bold text-[#191c1e]">
                      {totalAssets} Verified Asset{totalAssets === 1 ? "" : "s"}
                    </p>
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
              {categories.map((cat) => (
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
                <span>Explore All {totalAssets} Verified Listing{totalAssets === 1 ? "" : "s"}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>

            {/* Properties Grid */}
            {featuredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="w-full py-12 bg-white rounded-xl border border-[#e7e8ea] text-center p-8">
                <span className="material-symbols-outlined text-[40px] text-[#8093bb]">
                  real_estate_agent
                </span>
                <h3 className="text-base font-bold text-[#001637] mt-2">
                  No Featured Properties Yet
                </h3>
                <p className="text-xs text-[#44474e] mt-1 max-w-md mx-auto">
                  Database initialized with zero mock data. Real property listings published through the website or admin portal will automatically show up here.
                </p>
                <Link
                  href="/admin/dashboard"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#076a64] text-white text-xs font-semibold rounded-lg hover:bg-[#00201e] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add_business</span>
                  <span>Publish Property in Admin Panel</span>
                </Link>
              </div>
            )}
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
