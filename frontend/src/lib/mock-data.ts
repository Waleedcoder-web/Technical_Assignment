export interface Property {
  id: string;
  title: string;
  category: "villas" | "apartments" | "flats" | "plots";
  transactionType: "rent" | "sale";
  price: number;
  priceFormatted: string;
  pricePeriod?: string;
  location: string;
  city: string;
  beds: number;
  baths: number;
  size: string;
  sizeCategory: string;
  featured: boolean;
  verified: boolean;
  imageUrl: string;
  imageAlt: string;
  description: string;
  landlord: {
    name: string;
    initials: string;
    verified: boolean;
    rating: number;
    phone: string;
    email: string;
  };
  amenities: string[];
}

export const mockProperties: Property[] = [
  {
    id: "lumina-sky-karachi",
    title: "The Lumina Sky Residence",
    category: "apartments",
    transactionType: "rent",
    price: 380000,
    priceFormatted: "PKR 380,000",
    pricePeriod: "/ mo",
    location: "Clifton Block 4, Karachi",
    city: "Karachi",
    beds: 4,
    baths: 5,
    size: "1 Kanal (4,500 sq ft)",
    sizeCategory: "1-kanal",
    featured: true,
    verified: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDB2zpoWyl8ZcxyZ9VTBmFnJeOqr2YddS6o6SLXrvuRvseNAmS3xoQSGB8k_vY-hA1XZgefrIb33z0cnS8Sku2G_vqjGUakGorvgncrREPjor6Dwog7GWHryfDglOCx7zujV6EkB2G3K6YXem0f0V138qVfm-y-eaPxeXFJYu1BqO8EcnFseQIrgIT236znyncit7FVaY7Y9FFeaJOy3sRJ2gwLjOPuZ-3DHnmL7Vo",
    imageAlt: "Interior luxury penthouse overlooking Karachi Arabian sea coast",
    description:
      "Panoramic Arabian Sea vistas, automated climate control, dedicated service entrance, and 2 private basement parking spots.",
    landlord: {
      name: "Ahmed Khan",
      initials: "AK",
      verified: true,
      rating: 4.9,
      phone: "+92 300 1234567",
      email: "ahmed.khan@havenkey.pk",
    },
    amenities: [
      "Sea View Balcony",
      "Central HVAC",
      "Smart Home Automation",
      "2 Covered Parking",
      "24/7 Concierge",
      "Backup Generator",
    ],
  },
  {
    id: "meadowbrook-dha-lahore",
    title: "Meadowbrook Modern Villa",
    category: "villas",
    transactionType: "sale",
    price: 78500000,
    priceFormatted: "PKR 78,500,000",
    location: "DHA Phase 6, Sector J, Lahore",
    city: "Lahore",
    beds: 5,
    baths: 6,
    size: "10 Marla (2,250 sq ft)",
    sizeCategory: "10-marla",
    featured: true,
    verified: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCjp4ouN5hN4TFGSXHGIl9pauc-GKzbYmmtkn101f2H9QxMf0MZQw7yDDJn2CFEzLH1yxn3H4XYpajkvO29eoFmsxD7uQlGxQJ-AQMHXcfEVuxD9T2xn_NNa17O4cB5HlqFGr4keQhjq74l9Vk7BGalJMovK_4ub7amUtOPZ32R5m0tyMIhhUQ58dkr8e9f5aUh0sk_age9yyYfLGLjBaXarxSYh9H3SP0UqYKfpsg",
    imageAlt: "Exterior facade of a modern architectural villa in DHA Lahore with plunge pool",
    description:
      "Double-height glass atrium, integrated smart automation, imported Italian kitchen fittings, and solar backup power.",
    landlord: {
      name: "Salman Raza",
      initials: "SR",
      verified: true,
      rating: 5.0,
      phone: "+92 321 9876543",
      email: "salman.raza@havenkey.pk",
    },
    amenities: [
      "Infinity Plunge Pool",
      "Solar 15kW System",
      "Italian Kitchen",
      "Servant Quarters",
      "Lush Lawn",
      "CCTV Security",
    ],
  },
  {
    id: "margalla-ridge-islamabad",
    title: "Margalla Ridge Penthouse",
    category: "apartments",
    transactionType: "rent",
    price: 450000,
    priceFormatted: "PKR 450,000",
    pricePeriod: "/ mo",
    location: "Sector F-7/2, Islamabad",
    city: "Islamabad",
    beds: 3,
    baths: 4,
    size: "14 Marla (3,150 sq ft)",
    sizeCategory: "1-kanal",
    featured: true,
    verified: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDWEKqQ6EzDRn8ZnLIWTUqbfXDGyOFnHLa0mNs6D98xMoDP3bkf42dCQ6z3buSiKT_hFqn5oyvd97M74caoX3pGQCeA90JNS4nKxYkgaLG7fREE59AusRiTYJqMXN5CLA9OeG6hWoCBVWM1l6zSqFc6Z0qPSKd-9sDdcM4ipER3MN5h7tXe7bkAHGHC1NMUyrM6WhwQ1xEjKnT6ixttM7hhLerTAdyvLBOHVNcz8kg",
    imageAlt: "Luxury modern penthouse terrace in Islamabad with Margalla Hills view",
    description:
      "Unobstructed mountain line panoramic exposure, private elevator lobby, wraparound deck, and biometric access.",
    landlord: {
      name: "Tariq Mahmood",
      initials: "TM",
      verified: true,
      rating: 4.8,
      phone: "+92 333 5551234",
      email: "tariq.m@havenkey.pk",
    },
    amenities: [
      "Margalla Mountain Views",
      "Private High-Speed Lift",
      "Fire Pit Terrace",
      "Biometric Access",
      "Gym & Sauna",
      "Valet Parking",
    ],
  },
  {
    id: "bahria-sanctuary-flat",
    title: "The Scandinavian Studio Flat",
    category: "flats",
    transactionType: "rent",
    price: 180000,
    priceFormatted: "PKR 180,000",
    pricePeriod: "/ mo",
    location: "Bahria Town Phase 8, Rawalpindi",
    city: "Rawalpindi",
    beds: 2,
    baths: 2,
    size: "5 Marla (1,125 sq ft)",
    sizeCategory: "5-marla",
    featured: false,
    verified: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAuhCd8y5D67ZcQ8dx5AyvygB9uKVZyBWtH1ObbS54HY8uWlwy8yE_BK_PwcsBm1z3EXKFWHduEhmI4p-meuym6AlmX6Ibr6bM3-oysJZTSDxwsYzdB-VUY9bVBTrJ8ydbaUbW56oq3hgqgqxYUJPXyrHyV_7fYfDdDaR8_KFBvZjBrh8g-_-r4kyUsXQ9v3sI78eNR07ug9n9vX_nDRAihkKc1YpAombcRxyPUxn4",
    imageAlt: "Scandinavian interior design studio flat with oak wood floors",
    description:
      "Minimalist oak interior, walk-in closets, floor-to-ceiling double-glazed windows, and high efficiency appliances.",
    landlord: {
      name: "Fatima Noor",
      initials: "FN",
      verified: true,
      rating: 4.9,
      phone: "+92 301 4448899",
      email: "fatima.noor@havenkey.pk",
    },
    amenities: [
      "Designer Furnished",
      "Fiber Internet Ready",
      "Smart Thermostat",
      "Secure Lobby",
      "Rooftop BBQ Lounge",
    ],
  },
  {
    id: "dha9-prism-plot",
    title: "1 Kanal Corner Commercial Plot",
    category: "plots",
    transactionType: "sale",
    price: 32000000,
    priceFormatted: "PKR 32,000,000",
    location: "DHA Phase 9 Prism, Lahore",
    city: "Lahore",
    beds: 0,
    baths: 0,
    size: "1 Kanal (4,500 sq ft)",
    sizeCategory: "1-kanal",
    featured: false,
    verified: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBAWv1B3wntgnk-nGQracJPQSt5suV4VVK7ugQ6q19LBB20hDbAtrz4jOAh2H-DSjF8lJsinyz4lgFUOHM0PjbctSdYfBOiSbRU6fcZ3bi8xNPjjD9wEbotrIGp6j8hllatLch3uzrcAYeuSfHYtY1T1K69x5bNnUytM0mPMLyq790bZJpTYan5Lx99I66DVbiV5jDo5vKHRCW1KjbQK92fO4wwo6B9mOhSgEpWBvM",
    imageAlt: "Wide aerial topography view of demarcated luxury residential plots in DHA",
    description:
      "Direct boulevard access, 100ft wide main road frontage, clear title deed with instant DHA transfer authorization.",
    landlord: {
      name: "Zubair Hashmi",
      initials: "ZH",
      verified: true,
      rating: 5.0,
      phone: "+92 302 7772211",
      email: "zubair.h@havenkey.pk",
    },
    amenities: [
      "Main Boulevard Corner",
      "Underground Electrification",
      "Immediate Possession",
      "Verified Land Registry",
    ],
  },
];

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
