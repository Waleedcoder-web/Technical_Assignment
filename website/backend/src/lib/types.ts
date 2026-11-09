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
  landlordId?: string;
  verified?: boolean;
  featured?: boolean;
  imageUrl?: string;
  amenities?: string[];
}

export interface Complaint {
  id: string;
  user_id?: string;
  property_id?: string;
  agreement_id?: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved" | "rejected" | string;
  created_at?: string;
  updated_at?: string;

  // Compatibility aliases
  userId?: string;
  propertyId?: string;
  agreementId?: string;
  category?: "hvac" | "plumbing" | "electrical" | "billing" | "general" | string;
  createdAt?: string;
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
  property_id?: string;
  owner_id?: string;
  tenant_id?: string;
  start_date?: string;
  end_date?: string;
  monthly_rent?: number;
  security_deposit?: number;
  agreement_doc?: string;
  status: "active" | "pending" | "expired" | "terminated" | string;
  created_at?: string;
  updated_at?: string;

  // Compatibility aliases
  propertyId?: string;
  landlordId?: string;
  tenantId?: string;
  monthlyRent?: number;
  monthlyRentFormatted?: string;
  depositEscrow?: number;
  depositEscrowFormatted?: string;
  startDate?: string;
  endDate?: string;
  eSigned?: boolean;
  nextDueDate?: string;
}
