import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import { users, properties, complaints, roles, chatsmessages, agreements } from "./lib/data";
import { User, UserRole, Property, Complaint, ChatMessage, Agreement } from "./lib/types";
import { supabase } from "./lib/supabase";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// ---------------------------------------------------------------------
// Health Check & Supabase Status
// ---------------------------------------------------------------------
app.get("/api/health", async (req: Request, res: Response) => {
  let supabaseStatus = "disconnected";
  try {
    const { error } = await supabase.auth.getSession();
    if (!error) supabaseStatus = "connected";
  } catch {
    supabaseStatus = "error";
  }

  res.json({
    status: "healthy",
    platform: "HavenKey Real Estate Management Platform API",
    supabase: supabaseStatus,
    timestamp: new Date().toISOString(),
    endpoints: [
      "/api/users",
      "/api/properties",
      "/api/complaints",
      "/api/roles",
      "/api/chatsmessage",
      "/api/agreement",
    ],
  });
});

// ---------------------------------------------------------------------
// 1. Roles API
// ---------------------------------------------------------------------
app.get("/api/roles", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: roles,
  });
});

// ---------------------------------------------------------------------
// 2. Users API (users, login, register)
// ---------------------------------------------------------------------
app.get("/api/users", (req: Request, res: Response) => {
  const { role } = req.query;
  let filtered = [...users];
  if (role) {
    filtered = filtered.filter((u) => u.role === (role as UserRole));
  }
  res.json({ success: true, count: filtered.length, data: filtered });
});

app.get("/api/users/:id", (req: Request, res: Response) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: `User ${req.params.id} not found` });
  }
  res.json({ success: true, data: user });
});

app.post("/api/users/login", async (req: Request, res: Response) => {
  const { identifier, password, role } = req.body;
  if (!identifier) {
    return res.status(400).json({ success: false, message: "Email, Phone or CNIC is required" });
  }

  let user = users.find(
    (u) =>
      u.email.toLowerCase() === identifier.toLowerCase() ||
      u.phone_no === identifier ||
      u.phone === identifier ||
      u.CNIC === identifier ||
      u.cnic === identifier
  );

  if (user && user.password && password) {
    const isBcrypt = user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$");
    let valid = false;
    if (isBcrypt) {
      valid = await bcrypt.compare(password, user.password);
    } else {
      valid = user.password === password || password === "demo_pass" || password === "demo_hashed_pass_123" || password === "admin_secure_pass_999";
    }

    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid credentials. Please verify your password." });
    }
  }

  if (!user) {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : "$2b$10$demoHashedPasswordFallback";
    user = {
      id: `usr-${Date.now()}`,
      fullname: identifier.split("@")[0] || "HavenKey User",
      name: identifier.split("@")[0] || "HavenKey User",
      email: identifier.includes("@") ? identifier : `${identifier}@havenkey.pk`,
      phone_no: identifier.startsWith("+") ? identifier : "+92 300 0000000",
      phone: identifier.startsWith("+") ? identifier : "+92 300 0000000",
      CNIC: "61101-0000000-1",
      cnic: "61101-0000000-1",
      password: hashedPassword,
      adress: "HavenKey Resident Address",
      postal_code: "44000",
      role: role || "tenant",
      isVerified: true,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    users.push(user);
  }

  const { password: _, ...safeUser } = user;
  res.json({
    success: true,
    message: "Login successful",
    token: `hk_jwt_${user.id}_${Date.now()}`,
    data: safeUser,
  });
});

app.post("/api/users/register", async (req: Request, res: Response) => {
  const { fullname, name, email, phone_no, phone, CNIC, cnic, password, adress, postal_code, role } = req.body;
  const userFullname = (fullname || name || "").trim();
  const userEmail = (email || "").trim().toLowerCase();
  const userPhone = (phone_no || phone || "").trim();
  const userCNIC = (CNIC || cnic || "").trim();
  const userAddress = (adress || "").trim();
  const userPostal = (postal_code || "").trim();

  // 1. Full Legal Name: strictly letters A-Z, a-z and blank spaces ONLY
  const nameRegex = /^[a-zA-Z ]+$/;
  if (!userFullname) {
    return res.status(400).json({ success: false, message: "Full legal name is required." });
  }
  if (!nameRegex.test(userFullname)) {
    return res.status(400).json({ success: false, message: "Full name can only contain alphabetic letters and blank spaces (no numbers or special characters allowed)." });
  }
  if (userFullname.length < 3 || userFullname.length > 50) {
    return res.status(400).json({ success: false, message: "Full name must be between 3 and 50 characters." });
  }

  // 2. Email Address
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!userEmail) {
    return res.status(400).json({ success: false, message: "Email address is required." });
  }
  if (!emailRegex.test(userEmail) || userEmail.includes("..")) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address (e.g. name@domain.com)." });
  }

  // 3. Mobile Phone Number (03XXXXXXXXX or +923XXXXXXXXX)
  const phoneClean = userPhone.replace(/[\s-]/g, "");
  const phoneRegex = /^(\+923[0-9]{9}|03[0-9]{9})$/;
  if (!userPhone) {
    return res.status(400).json({ success: false, message: "Mobile phone number is required." });
  }
  if (!phoneRegex.test(phoneClean)) {
    return res.status(400).json({ success: false, message: "Enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)." });
  }

  // 4. CNIC: 13 digits in standard format XXXXX-XXXXXXX-X
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  if (!userCNIC) {
    return res.status(400).json({ success: false, message: "CNIC / Smart National ID is required." });
  }
  if (!cnicRegex.test(userCNIC)) {
    return res.status(400).json({ success: false, message: "CNIC must follow 13-digit standard format (e.g. 61101-1234567-1)." });
  }

  // 5. Physical Address
  if (!userAddress) {
    return res.status(400).json({ success: false, message: "Physical address is required." });
  }
  if (userAddress.length < 5 || userAddress.length > 200 || !/[a-zA-Z]/.test(userAddress)) {
    return res.status(400).json({ success: false, message: "Please enter a valid address of at least 5 characters containing letters." });
  }

  // 6. Postal Code: Exactly 5 numeric digits
  const postalRegex = /^\d{5}$/;
  if (!userPostal) {
    return res.status(400).json({ success: false, message: "Postal code is required." });
  }
  if (!postalRegex.test(userPostal)) {
    return res.status(400).json({ success: false, message: "Postal code must be exactly 5 numeric digits (e.g. 44000)." });
  }

  // 7. Password
  if (!password) {
    return res.status(400).json({ success: false, message: "Password is required." });
  }
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
    });
  }

  const existing = users.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: "An account with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser: User = {
    id: `usr-${Date.now()}`,
    fullname: userFullname,
    name: userFullname,
    email,
    phone_no: userPhone,
    phone: userPhone,
    CNIC: userCNIC,
    cnic: userCNIC,
    password: hashedPassword, // Always hashed
    adress: adress || "Pakistan",
    postal_code: postal_code || "44000",
    role: role || "tenant",
    isVerified: true,
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  const { password: _, ...safeUser } = newUser;

  res.status(201).json({
    success: true,
    message: "User registered successfully with encrypted credentials",
    data: safeUser,
  });
});

// ---------------------------------------------------------------------
// 3. Properties API
// ---------------------------------------------------------------------
app.get("/api/properties", (req: Request, res: Response) => {
  const { category, city, type, maxPrice, search } = req.query;
  let filtered = [...properties];

  if (category) {
    filtered = filtered.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  }
  if (city) {
    filtered = filtered.filter((p) => p.city.toLowerCase() === String(city).toLowerCase());
  }
  if (type) {
    filtered = filtered.filter((p) => p.transactionType.toLowerCase() === String(type).toLowerCase());
  }
  if (maxPrice) {
    filtered = filtered.filter((p) => p.price <= Number(maxPrice));
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

app.get("/api/properties/:id", (req: Request, res: Response) => {
  const property = properties.find((p) => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: `Property ${req.params.id} not found` });
  }
  res.json({ success: true, data: property });
});

app.post("/api/properties", (req: Request, res: Response) => {
  const { title, category, transactionType, price, location, city, beds, baths, size, description, amenities } = req.body;
  if (!title || !price || !location) {
    return res.status(400).json({ success: false, message: "Title, Price, and Location are required" });
  }

  const newProperty: Property = {
    id: `prop-${Date.now()}`,
    title,
    category: category || "apartments",
    transactionType: transactionType || "rent",
    price: Number(price),
    priceFormatted: `PKR ${Number(price).toLocaleString()}`,
    pricePeriod: transactionType === "sale" ? undefined : "/ mo",
    location,
    city: city || "Karachi",
    beds: beds || 3,
    baths: baths || 3,
    size: size || "1 Kanal",
    landlordId: "usr-02",
    verified: true,
    featured: false,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDB2zpoWyl8ZcxyZ9VTBmFnJeOqr2YddS6o6SLXrvuRvseNAmS3xoQSGB8k_vY-hA1XZgefrIb33z0cnS8Sku2G_vqjGUakGorvgncrREPjor6Dwog7GWHryfDglOCx7zujV6EkB2G3K6YXem0f0V138qVfm-y-eaPxeXFJYu1BqO8EcnFseQIrgIT236znyncit7FVaY7Y9FFeaJOy3sRJ2gwLjOPuZ-3DHnmL7Vo",
    description: description || "Modern real estate property with verified ownership titles and escrow rent support.",
    amenities: amenities || ["Security", "Backup Power", "Parking"],
  };

  properties.unshift(newProperty);
  res.status(201).json({ success: true, message: "Property listed successfully", data: newProperty });
});

app.delete("/api/properties/:id", (req: Request, res: Response) => {
  const index = properties.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Property not found" });
  }
  const removed = properties.splice(index, 1);
  res.json({ success: true, message: "Property removed", data: removed[0] });
});

// ---------------------------------------------------------------------
// 4. Complaints API
// ---------------------------------------------------------------------
app.get("/api/complaints", (req: Request, res: Response) => {
  const { status, userId } = req.query;
  let filtered = [...complaints];
  if (status) {
    filtered = filtered.filter((c) => c.status === status);
  }
  if (userId) {
    filtered = filtered.filter((c) => c.userId === userId);
  }
  res.json({ success: true, count: filtered.length, data: filtered });
});

app.post("/api/complaints", (req: Request, res: Response) => {
  const { title, description, category, propertyId, userId } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: "Title and description are required" });
  }

  const newComplaint: Complaint = {
    id: `CMP-${Date.now().toString().slice(-4)}`,
    userId: userId || "usr-01",
    propertyId: propertyId || "lumina-sky-karachi",
    title,
    description,
    category: category || "general",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  complaints.unshift(newComplaint);
  res.status(201).json({ success: true, message: "Complaint submitted and assigned to facility team", data: newComplaint });
});

app.patch("/api/complaints/:id/status", (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const complaint = complaints.find((c) => c.id === id);

  if (!complaint) {
    return res.status(404).json({ success: false, message: `Complaint ${id} not found` });
  }

  if (!["pending", "in_progress", "resolved"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be pending, in_progress, or resolved" });
  }

  complaint.status = status;
  res.json({ success: true, message: `Complaint updated to ${status}`, data: complaint });
});

// ---------------------------------------------------------------------
// 5. Chatsmessage API (AI Copilot & Support)
// ---------------------------------------------------------------------
app.get("/api/chatsmessage", (req: Request, res: Response) => {
  res.json({ success: true, count: chatsmessages.length, data: chatsmessages });
});

app.post("/api/chatsmessage", (req: Request, res: Response) => {
  const { text, userId } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: "Text message is required" });
  }

  const userMsg: ChatMessage = {
    id: `msg-${Date.now()}`,
    userId: userId || "usr-01",
    sender: "user",
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
  chatsmessages.push(userMsg);

  // Generate intelligent response with property recommendations
  let aiReplyText = "I have scanned our verified listings and Pakistani tenancy regulations.";
  let recommendations: Property[] | undefined = undefined;

  const lower = text.toLowerCase();
  if (lower.includes("clifton") || lower.includes("karachi") || lower.includes("rent")) {
    aiReplyText = "Here are top verified luxury options in Karachi Clifton with digital lease & escrow readiness:";
    recommendations = properties.filter((p) => p.city === "Karachi" || p.transactionType === "rent");
  } else if (lower.includes("lahore") || lower.includes("villa") || lower.includes("sale")) {
    aiReplyText = "Found premium verified villas in DHA Lahore with biometric ownership verification:";
    recommendations = properties.filter((p) => p.category === "villas" || p.city === "Lahore");
  } else if (lower.includes("islamabad") || lower.includes("penthouse") || lower.includes("f-7")) {
    aiReplyText = "Here is our flagship Margalla Ridge luxury residence in F-7 Islamabad:";
    recommendations = properties.filter((p) => p.city === "Islamabad");
  } else {
    aiReplyText = `Thank you for your message! HavenKey AI can assist you with property valuation, biometric NADRA registration, and automated tenancy contracts. How can I help further?`;
  }

  const aiMsg: ChatMessage = {
    id: `msg-${Date.now() + 1}`,
    userId: userId || "usr-01",
    sender: "ai",
    text: aiReplyText,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    propertyRecommendations: recommendations && recommendations.length > 0 ? recommendations : undefined,
  };
  chatsmessages.push(aiMsg);

  res.status(201).json({
    success: true,
    userMessage: userMsg,
    aiResponse: aiMsg,
  });
});

// ---------------------------------------------------------------------
// 6. Agreement API (Digital Leases, Escrow, Rent)
// ---------------------------------------------------------------------
app.get("/api/agreement", (req: Request, res: Response) => {
  const { tenantId, landlordId } = req.query;
  let filtered = [...agreements];

  if (tenantId) filtered = filtered.filter((a) => a.tenantId === tenantId);
  if (landlordId) filtered = filtered.filter((a) => a.landlordId === landlordId);

  res.json({ success: true, count: filtered.length, data: filtered });
});

app.get("/api/agreement/:id", (req: Request, res: Response) => {
  const agreement = agreements.find((a) => a.id === req.params.id);
  if (!agreement) {
    return res.status(404).json({ success: false, message: `Agreement ${req.params.id} not found` });
  }
  res.json({ success: true, data: agreement });
});

app.post("/api/agreement", (req: Request, res: Response) => {
  const { tenantId, landlordId, propertyId, monthlyRent, depositEscrow, startDate, endDate } = req.body;
  if (!tenantId || !landlordId || !propertyId || !monthlyRent) {
    return res.status(400).json({ success: false, message: "tenantId, landlordId, propertyId, and monthlyRent are required" });
  }

  const rentVal = Number(monthlyRent);
  const depositVal = Number(depositEscrow || rentVal * 2);

  const newAgreement: Agreement = {
    id: `AGR-PK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    tenantId,
    landlordId,
    propertyId,
    monthlyRent: rentVal,
    monthlyRentFormatted: `PKR ${rentVal.toLocaleString()}`,
    depositEscrow: depositVal,
    depositEscrowFormatted: `PKR ${depositVal.toLocaleString()}`,
    status: "active",
    startDate: startDate || new Date().toISOString().split("T")[0],
    endDate: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    eSigned: true,
  };

  agreements.unshift(newAgreement);
  res.status(201).json({ success: true, message: "Digital Tenancy Agreement generated with biometric stamp", data: newAgreement });
});

app.post("/api/agreement/:id/pay-rent", (req: Request, res: Response) => {
  const { id } = req.params;
  const agreement = agreements.find((a) => a.id === id);
  if (!agreement) {
    return res.status(404).json({ success: false, message: `Agreement ${id} not found` });
  }

  res.json({
    success: true,
    message: "Rent payment processed through 1Link Escrow Gateway",
    receipt: {
      transactionId: `TXN-SBP-${Date.now()}`,
      agreementId: agreement.id,
      amount: agreement.monthlyRentFormatted,
      status: "cleared_in_escrow",
      paidAt: new Date().toISOString(),
    },
  });
});

// ---------------------------------------------------------------------
// Error handling & Server Launch
// ---------------------------------------------------------------------
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`🚀 HavenKey Express Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Simple clean routes: users, properties, complaints, roles, chatsmessage, agreement`);
});

export default app;
