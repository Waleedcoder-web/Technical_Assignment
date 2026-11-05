export interface Property {
  id: string;
  owner_id?: string;
  title: string;
  description: string;
  property_type: "villas" | "apartments" | "flats" | "plots" | string;
  listing_type: "rent" | "sale" | string;
  price: number;
  area_value: number;
  area_unit: "Marla" | "Kanal" | "Sq Ft" | string;
  bedroom: number;
  bathroom: number;
  location: string;
  address: string;
  status: "available" | "rented" | "sold" | "pending" | string;
  image_url?: string;
  images?: string[];
  created_at?: string;
  updated_at?: string;

  // Compatibility aliases
  category?: "villas" | "apartments" | "flats" | "plots" | string;
  transactionType?: "rent" | "sale" | string;
  priceFormatted?: string;
  pricePeriod?: string;
  city?: string;
  beds?: number;
  baths?: number;
  size?: string;
  sizeCategory?: string;
  featured?: boolean;
  verified?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  landlord?: {
    name: string;
    initials: string;
    verified: boolean;
    rating: number;
    phone: string;
    email: string;
  };
  amenities?: string[];
}
export const mockProperties: Property[] = [];


export const mockCategories = [
  {
    id: "houses",
    name: "Houses & Villas",
    count: "4,120 listings",
    subtitle: "Independent Estates",
    icon: "villa",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAExGAZu9bjGZfBZuKeg2v80L2uTkQN5uPxYd5OvjIX4vnFIJ7swxpQLQaPoACbCFAgRrQckFPI4nAtLvyLf62LN9hlpd9e2EJf81POrnesjp7uGz1g4-jeZ-pt0A5it-gAtDzruihO5Jfv2TwTfNg1HjBvpAoPIP2OTvDjOw2j-v79E2qGB2mc4cSo3xoyboDl8FJaT1QsH5xdQdgboB6bwRLI6sh2R_q6Xe3NUTQ",
  },
  {
    id: "apartments",
    name: "Apartments",
    count: "2,840 listings",
    subtitle: "High-Rise Complexes",
    icon: "apartment",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCJhKcNxUOfL6-Y4VmklswhpN0T0BXa_7MfbvcOcA5ynslw0iREIolQCg_woiKUWRSAWhcxFwOaeVFl4M0-Ul2QyzS8a-YluVBY2ivvU2ac1ZS4lj-btoPXwJiZ4YlqA4h2N_dY18SNcU5TowTmuO_pyVKdle4tpBZZkosdMnngjk7p3ljDWbVhTIoFJzVQq127w1BtEl890dYNFicQNJm4blcwVmo9hCOak_sODp4",
  },
  {
    id: "flats",
    name: "Modern Flats",
    count: "1,950 listings",
    subtitle: "Urban Living Studios",
    icon: "home_work",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAuhCd8y5D67ZcQ8dx5AyvygB9uKVZyBWtH1ObbS54HY8uWlwy8yE_BK_PwcsBm1z3EXKFWHduEhmI4p-meuym6AlmX6Ibr6bM3-oysJZTSDxwsYzdB-VUY9bVBTrJ8ydbaUbW56oq3hgqgqxYUJPXyrHyV_7fYfDdDaR8_KFBvZjBrh8g-_-r4kyUsXQ9v3sI78eNR07ug9n9vX_nDRAihkKc1YpAombcRxyPUxn4",
  },
  {
    id: "plots",
    name: "Prime Plots",
    count: "890 listings",
    subtitle: "Residential & Commercial",
    icon: "terrain",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBAWv1B3wntgnk-nGQracJPQSt5suV4VVK7ugQ6q19LBB20hDbAtrz4jOAh2H-DSjF8lJsinyz4lgFUOHM0PjbctSdYfBOiSbRU6fcZ3bi8xNPjjD9wEbotrIGp6j8hllatLch3uzrcAYeuSfHYtY1T1K69x5bNnUytM0mPMLyq790bZJpTYan5Lx99I66DVbiV5jDo5vKHRCW1KjbQK92fO4wwo6B9mOhSgEpWBvM",
  },
];

export const mockAdminStats = {
  activeProperties: "12,480",
  verifiedLandlords: "3,892",
  pendingApprovals: "24",
  monthlyEscrow: "PKR 482.5M",
  occupancyRate: "94.6%",
  complianceScore: "99.2%",
};

export const mockKycQueue = [
  {
    id: "KYC-8821",
    landlord: "Malik Usman Arshad",
    property: "1 Kanal Villa, Sector F-8/3, Islamabad",
    documentType: "Biometric CNIC + Registry Deed",
    submittedAt: "12 mins ago",
    status: "Pending Review",
    trustScore: "98%",
  },
  {
    id: "KYC-8820",
    landlord: "Dr. Ayesha Siddiqui",
    property: "Lumina Penthouse 14B, Clifton, Karachi",
    documentType: "FBR Active Taxpayer + Title Deed",
    submittedAt: "45 mins ago",
    status: "Under Audit",
    trustScore: "95%",
  },
  {
    id: "KYC-8819",
    landlord: "Farhan Qureshi",
    property: "DHA Phase 5 Commercial Plaza, Lahore",
    documentType: "LDA Approval + Nadra Verification",
    submittedAt: "2 hours ago",
    status: "Verified",
    trustScore: "99%",
  },
];

export const mockCustomerLeases = [
  {
    id: "LEASE-PK-2026-44",
    propertyTitle: "The Lumina Sky Residence",
    unit: "Apartment 1402, Clifton Block 4, Karachi",
    landlordName: "Ahmed Khan",
    monthlyRent: "PKR 380,000",
    nextDueDate: "15 Nov 2026",
    daysRemaining: 12,
    leaseExpiry: "31 Dec 2027",
    status: "Active",
    depositProtected: "PKR 760,000 in Escrow",
  },
];

export const getStoredProperties = (): Property[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("havenkey_properties");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveStoredProperties = (items: Property[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("havenkey_properties", JSON.stringify(items));
    window.dispatchEvent(new Event("havenkey_properties_change"));
  } catch (e) {
    console.error("Failed to save properties to localStorage", e);
  }
};
