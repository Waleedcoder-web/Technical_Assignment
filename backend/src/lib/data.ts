import { User, Property, Complaint, ChatMessage, Agreement, Role } from "./types";

export const roles: Role[] = [
  { id: 1, role_name: "tenant" },
  { id: 2, role_name: "landlord" },
  { id: 3, role_name: "admin" },
];

export const users: User[] = [
  {
    id: "usr-01",
    fullname: "Waleed Hassan",
    name: "Waleed Hassan",
    email: "waleed@havenkey.pk",
    phone_no: "+92 300 1234567",
    phone: "+92 300 1234567",
    CNIC: "61101-1234567-1",
    cnic: "61101-1234567-1",
    password: "demo_hashed_pass_123",
    adress: "House 42, Street 10, F-7/2",
    postal_code: "44000",
    role: "tenant",
    isVerified: true,
    created_at: "2026-01-10T09:00:00Z",
    createdAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "usr-02",
    fullname: "Ahmed Khan",
    name: "Ahmed Khan",
    email: "ahmed.khan@havenkey.pk",
    phone_no: "+92 300 7654321",
    phone: "+92 300 7654321",
    CNIC: "42201-9876543-1",
    cnic: "42201-9876543-1",
    password: "demo_hashed_pass_123",
    adress: "Villa 18, Block 4, Clifton, Karachi",
    postal_code: "75600",
    role: "landlord",
    isVerified: true,
    created_at: "2026-01-12T14:30:00Z",
    createdAt: "2026-01-12T14:30:00Z",
  },
  {
    id: "usr-03",
    fullname: "admin admin",
    name: "admin admin",
    email: "admin@gmail.com",
    phone_no: "+92 300 0000000",
    phone: "+92 300 0000000",
    CNIC: "61101-0000000-1",
    cnic: "61101-0000000-1",
    password: "$2b$10$ZrXXjspsIEcv5zEOA.7D.OQ3gY4b1IFN1ZGiCUvbVYq.MADIvs37e", // Admin@12345
    adress: "HavenKey Operations HQ, Islamabad",
    postal_code: "44000",
    role: "admin",
    isVerified: true,
    created_at: "2026-01-01T08:00:00Z",
    createdAt: "2026-01-01T08:00:00Z",
  },
  {
    id: "usr-04",
    fullname: "Admin Operator",
    name: "Admin Operator",
    email: "admin@havenkey.pk",
    phone_no: "+92 300 0000000",
    phone: "+92 300 0000000",
    CNIC: "61101-0000000-0",
    cnic: "61101-0000000-0",
    password: "admin_secure_pass_999",
    adress: "HavenKey HQ, Blue Area, Islamabad",
    postal_code: "44000",
    role: "admin",
    isVerified: true,
    created_at: "2025-12-01T08:00:00Z",
    createdAt: "2025-12-01T08:00:00Z",
  },
];

export const properties: Property[] = [];


export const complaints: Complaint[] = [
  {
    id: "CMP-101",
    userId: "usr-01",
    propertyId: "lumina-sky-karachi",
    title: "Central HVAC Seasonal Service",
    description: "Routine filter change and airflow pressure calibration for the master bedroom unit.",
    category: "hvac",
    status: "resolved",
    createdAt: "2026-10-25T11:00:00Z",
  },
  {
    id: "CMP-102",
    userId: "usr-01",
    propertyId: "lumina-sky-karachi",
    title: "Master Bath Shower Pressure Calibration",
    description: "Cold water booster pump pressure needs calibration in master bath.",
    category: "plumbing",
    status: "in_progress",
    createdAt: "2026-11-03T08:30:00Z",
  },
];

export const chatsmessages: ChatMessage[] = [
  {
    id: "msg-01",
    userId: "usr-01",
    sender: "ai",
    text: "Hello Waleed! I'm your HavenKey AI Real Estate Advisor. I can search through 9,900+ biometric verified properties, calculate tenancy escrow deposits, compare cap rates, and review lease compliance.",
    timestamp: "11:30 AM",
  },
  {
    id: "msg-02",
    userId: "usr-01",
    sender: "user",
    text: "Show me top verified rental properties in Karachi Clifton with luxury amenities.",
    timestamp: "11:31 AM",
  },
  {
    id: "msg-03",
    userId: "usr-01",
    sender: "ai",
    text: "I found prime verified properties in Karachi Clifton matching your criteria with direct owner leases and biometric escrow protection:",
    timestamp: "11:31 AM",
    propertyRecommendations: [properties[0]],
  },
];

export const agreements: Agreement[] = [
  {
    id: "AGR-PK-2026-44",
    tenantId: "usr-01",
    landlordId: "usr-02",
    propertyId: "lumina-sky-karachi",
    monthlyRent: 380000,
    monthlyRentFormatted: "PKR 380,000",
    depositEscrow: 760000,
    depositEscrowFormatted: "PKR 760,000",
    status: "active",
    startDate: "2026-01-01",
    endDate: "2027-12-31",
    nextDueDate: "2026-11-15",
    eSigned: true,
  },
];
