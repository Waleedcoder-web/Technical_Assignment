export type UserRole = "tenant" | "landlord" | "admin" | string;

export interface Role {
  id: number;
  role_name: string;
}

export interface User {
  id: string;
  fullname: string;
  name?: string; // compatibility alias
  email: string;
  phone_no: string;
  phone?: string; // compatibility alias
  CNIC: string;
  cnic?: string; // compatibility alias
  password?: string;
  adress: string;
  postal_code: string;
  role: string;
  isVerified?: boolean;
  created_at?: string;
  createdAt?: string;
}

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
  landlordId: string;
  verified: boolean;
  featured: boolean;
  imageUrl: string;
  description: string;
  amenities: string[];
}

export interface Complaint {
  id: string;
  userId: string;
  propertyId: string;
  title: string;
  description: string;
  category: "hvac" | "plumbing" | "electrical" | "billing" | "general";
  status: "pending" | "in_progress" | "resolved";
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId?: string;
  sender: "user" | "ai" | "support";
  text: string;
  timestamp: string;
  propertyRecommendations?: Property[];
}

export interface Agreement {
  id: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  monthlyRent: number;
  monthlyRentFormatted: string;
  depositEscrow: number;
  depositEscrowFormatted: string;
  status: "active" | "pending" | "expired" | "terminated";
  startDate: string;
  endDate: string;
  eSigned: boolean;
  nextDueDate?: string;
}
