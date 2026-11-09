import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullname, name, email, phone_no, phone, CNIC, cnic, password, adress, postal_code, role } = body;

    const userFullName = (fullname || name || "").trim();
    const userEmail = (email || "").trim().toLowerCase();
    const userPhone = (phone_no || phone || "").trim();
    const userCNIC = (CNIC || cnic || "").trim();
    const userAddress = (adress || "").trim();
    const userPostal = (postal_code || "").trim();

    // 1. Full Legal Name: strictly letters A-Z, a-z and blank spaces ONLY (no numbers, no symbols)
    const nameRegex = /^[a-zA-Z ]+$/;
    if (!userFullName) {
      return NextResponse.json(
        { success: false, message: "Full legal name is required." },
        { status: 400 }
      );
    }
    if (!nameRegex.test(userFullName)) {
      return NextResponse.json(
        { success: false, message: "Full name can only contain alphabetic letters and blank spaces (no numbers or special characters allowed)." },
        { status: 400 }
      );
    }
    if (userFullName.length < 3 || userFullName.length > 50) {
      return NextResponse.json(
        { success: false, message: "Full name must be between 3 and 50 characters." },
        { status: 400 }
      );
    }

    // 2. Email Address
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!userEmail) {
      return NextResponse.json(
        { success: false, message: "Email address is required." },
        { status: 400 }
      );
    }
    if (!emailRegex.test(userEmail) || userEmail.includes("..")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address (e.g. name@domain.com)." },
        { status: 400 }
      );
    }

    // 3. Mobile Phone Number (Pakistani mobile format: 03XXXXXXXXX or +923XXXXXXXXX)
    const phoneClean = userPhone.replace(/[\s-]/g, "");
    const phoneRegex = /^(\+923[0-9]{9}|03[0-9]{9})$/;
    if (!userPhone) {
      return NextResponse.json(
        { success: false, message: "Mobile phone number is required." },
        { status: 400 }
      );
    }
    if (!phoneRegex.test(phoneClean)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)." },
        { status: 400 }
      );
    }

    // 4. CNIC: 13 digits in standard format XXXXX-XXXXXXX-X
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!userCNIC) {
      return NextResponse.json(
        { success: false, message: "CNIC / Smart National ID is required." },
        { status: 400 }
      );
    }
    if (!cnicRegex.test(userCNIC)) {
      return NextResponse.json(
        { success: false, message: "CNIC must follow 13-digit standard format (e.g. 61101-1234567-1)." },
        { status: 400 }
      );
    }

    // 5. Residential / Physical Address
    if (!userAddress) {
      return NextResponse.json(
        { success: false, message: "Physical address is required." },
        { status: 400 }
      );
    }
    if (userAddress.length < 5 || userAddress.length > 200 || !/[a-zA-Z]/.test(userAddress)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid address of at least 5 characters containing letters." },
        { status: 400 }
      );
    }

    // 6. Postal Code: Exactly 5 numeric digits
    const postalRegex = /^\d{5}$/;
    if (!userPostal) {
      return NextResponse.json(
        { success: false, message: "Postal code is required." },
        { status: 400 }
      );
    }
    if (!postalRegex.test(userPostal)) {
      return NextResponse.json(
        { success: false, message: "Postal code must be exactly 5 numeric digits (e.g. 44000)." },
        { status: 400 }
      );
    }

    // 7. Password: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
    if (!password) {
      return NextResponse.json(
        { success: false, message: "Password is required." },
        { status: 400 }
      );
    }
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
        },
        { status: 400 }
      );
    }

    // Hash the password securely with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: `usr-${Date.now()}`,
      fullname: userFullName,
      name: userFullName,
      email: email.toLowerCase().trim(),
      phone_no: userPhone,
      phone: userPhone,
      cnic: userCNIC,
      CNIC: userCNIC,
      password: hashedPassword, // Stored as bcrypt hash, never plain text
      adress: adress || "Pakistan",
      postal_code: postal_code || "44000",
      role: role || "tenant",
      isVerified: true,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // 8. Check if user with this email or CNIC already exists in Supabase (No Duplicates Allowed)
    const dbClient = supabaseAdmin || supabase;
    try {
      // 8a. Check duplicate Email
      const { data: existingEmail } = await dbClient
        .from("users")
        .select("id, email")
        .eq("email", userEmail)
        .maybeSingle();

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            field: "email",
            message: "An account with this email address already exists. Please log in or use another email.",
          },
          { status: 409 }
        );
      }

      // 8b. Check duplicate CNIC
      const { data: existingCnic } = await dbClient
        .from("users")
        .select("id, cnic")
        .eq("cnic", userCNIC)
        .maybeSingle();

      if (existingCnic) {
        return NextResponse.json(
          {
            success: false,
            field: "cnic",
            message: "An account with this CNIC number already exists. Each citizen CNIC can only be registered once.",
          },
          { status: 409 }
        );
      }
    } catch (checkErr: any) {
      console.warn("Supabase user pre-check notice:", checkErr?.message);
    }

    // 9. Insert directly into Supabase users table
    const { data: insertedData, error: insertError } = await dbClient
      .from("users")
      .insert([
        {
          fullname: userFullName,
          email: userEmail,
          phone_no: userPhone,
          cnic: userCNIC,
          password: hashedPassword, // bcrypt hash
          adress: userAddress || "Pakistan",
          postal_code: userPostal || "44000",
          role: role || "tenant",
        },
      ])
      .select();

    if (insertError) {
      console.error("Supabase user insert error:", insertError);
      return NextResponse.json(
        {
          success: false,
          message: insertError.message || "Failed to save user in Supabase database.",
        },
        { status: 400 }
      );
    }

    if (insertedData && insertedData.length > 0) {
      newUser.id = insertedData[0].id;
    }

    // Do not return password hash in response
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully with encrypted credentials.",
        data: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to register user." },
      { status: 500 }
    );
  }
}
