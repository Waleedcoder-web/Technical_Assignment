import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password, role } = body;

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Email, Mobile or CNIC is required." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Password is required." },
        { status: 400 }
      );
    }

    let user: any = null;

    // Check Supabase if table exists
    try {
      const cleanId = identifier.trim();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .or(`email.ilike.${cleanId},phone_no.eq.${cleanId},cnic.eq.${cleanId}`)
        .limit(1);

      if (!error && data && data.length > 0) {
        user = data[0];
      }
    } catch {
      // Supabase table not created yet
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account not found in database. Please register an account first." },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, message: "No password configured for this account. Please reset your password." },
        { status: 401 }
      );
    }

    // Verify password with bcrypt hash
    const isBcrypt = user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$");
    let isValid = false;

    if (isBcrypt) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      isValid = password === user.password;
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials. Please verify your password." },
        { status: 401 }
      );
    }

    // Do not return password hash
    const { password: _, ...userSafe } = user;

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token: `hk_jwt_${user.id}_${Date.now()}`,
      data: userSafe,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to authenticate." },
      { status: 500 }
    );
  }
}
