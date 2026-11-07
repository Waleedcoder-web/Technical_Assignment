import { supabaseAdmin } from "@/lib/supabase";

export interface LogChatMessageParams {
  sessionId: string;
  userId?: string | null;
  input: string;
  output: string;
  status?: "success" | "clarification_needed" | "unauthorized" | "error" | string;
}

export interface ChatLogRecord {
  id: string;
  session_id: string;
  user_id: string | null;
  input: string;
  output: string;
  status: string;
  created_at: string;
}

// Regex to check if a string is a valid UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Persists an AI chat exchange into the Supabase chat_logs table.
 * Designed to be resilient: catches all errors so chat flow is never blocked.
 */
export async function logChatMessage({
  sessionId,
  userId,
  input,
  output,
  status = "success",
}: LogChatMessageParams): Promise<ChatLogRecord | null> {
  try {
    if (!sessionId || !input || !output) {
      console.warn("[ChatLogger] Missing required fields for logging chat message");
      return null;
    }

    // Sanitize user_id: PostgreSQL UUID column requires a valid UUID format or null
    let sanitizedUserId: string | null = null;
    if (userId && typeof userId === "string" && UUID_REGEX.test(userId.trim())) {
      sanitizedUserId = userId.trim();
    }

    const { data, error } = await supabaseAdmin
      .from("chat_logs")
      .insert([
        {
          session_id: sessionId,
          user_id: sanitizedUserId,
          input: input.trim(),
          output: output.trim(),
          status: status,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[ChatLogger] Supabase insert error:", error.message);
      return null;
    }

    return data as ChatLogRecord;
  } catch (err: any) {
    console.error("[ChatLogger] Unexpected exception while logging chat message:", err?.message || err);
    return null;
  }
}
