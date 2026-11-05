"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Property } from "@/lib/mock-data";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <article className="group bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_0_rgba(23,43,77,0.04)] hover:shadow-[0_10px_25px_-5px_rgba(23,43,77,0.07)] border border-[#e7e8ea] hover:border-[#c5c6cf] transition-all flex flex-col h-full">
      {/* Image & Overlays */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#edeef0]">
        <img
          src={property.imageUrl || property.image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"}
          alt={property.imageAlt || property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001637]/70 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          {(property.transactionType || property.listing_type) === "rent" ? (
            <span className="px-2.5 py-1 bg-[#001637] text-white rounded-md text-xs font-semibold tracking-wide uppercase">
              For Rent
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-[#076a64] text-white rounded-md text-xs font-semibold tracking-wide uppercase">
              For Sale
            </span>
          )}

          {property.verified && (
            <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md text-[#076a64] rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Verified
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          aria-label="Save Property"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsFavorite(!isFavorite);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors focus:outline-none z-10 ${
            isFavorite
              ? "bg-[#ba1a1a] text-white"
              : "bg-white/80 text-[#191c1e] hover:text-[#ba1a1a] hover:bg-white"
          }`}
        >
          <span
            className={`material-symbols-outlined text-[18px] ${
              isFavorite ? "fill-current-icon" : ""
            }`}
          >
            favorite
          </span>
        </button>

        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 left-3 text-white z-10">
          <span className="text-[11px] uppercase tracking-wider text-[#d7e2ff] font-medium block">
            {property.transactionType === "rent" ? "Monthly Rental" : "Asking Price"}
          </span>
          <p className="text-xl font-bold leading-none mt-0.5 font-plus-jakarta">
            {property.priceFormatted}{" "}
            {property.pricePeriod && (
              <span className="text-xs font-normal text-white/80">
                {property.pricePeriod}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          {/* Location */}
          <div className="flex items-center gap-1 text-[#44474e] text-xs mb-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#076a64]">
              location_on
            </span>
            <span className="truncate">{property.location}</span>
          </div>

          {/* Title */}
          <Link href={`/properties/${property.id}`}>
            <h3 className="text-base font-bold text-[#001637] group-hover:text-[#076a64] transition-colors font-plus-jakarta">
              {property.title}
            </h3>
          </Link>

          {/* Short description */}
          <p className="text-xs text-[#44474e] mt-1 line-clamp-2 leading-relaxed">
            {property.description}
          </p>
        </div>

        {/* Specs Row */}
        <div className="grid grid-cols-3 gap-2 py-2 bg-[#f2f4f6] rounded-lg px-2 text-center text-xs">
          <div className="flex items-center justify-center gap-1 text-[#191c1e]">
            <span className="material-symbols-outlined text-[16px] text-[#75777f]">
              bed
            </span>
            <span className="font-semibold">{property.beds ?? property.bedroom ?? 0}</span>
            <span className="text-[11px] text-[#44474e]">Beds</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-[#191c1e]">
            <span className="material-symbols-outlined text-[16px] text-[#75777f]">
              bathtub
            </span>
            <span className="font-semibold">{property.baths ?? property.bathroom ?? 0}</span>
            <span className="text-[11px] text-[#44474e]">Baths</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-[#191c1e]">
            <span className="material-symbols-outlined text-[16px] text-[#75777f]">
              straighten
            </span>
            <span className="font-semibold truncate">
              {property.sizeCategory || `${property.area_value ?? 10} ${property.area_unit ?? "Marla"}`}
            </span>
          </div>
        </div>

        {/* Landlord & CTA */}
        <div className="flex items-center justify-between pt-1 border-t border-[#edeef0]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#a1f1e9] text-[#076a64] flex items-center justify-center text-xs font-bold">
              {property.landlord?.initials || "PK"}
            </div>
            <span className="text-xs text-[#44474e]">
              {property.landlord?.name || "Verified Landlord"}
            </span>
          </div>

          <Link
            href={`/properties/${property.id}`}
            className="px-3.5 py-1.5 bg-[#172b4d] text-white hover:bg-[#001637] text-xs font-semibold rounded-lg transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
