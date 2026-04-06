import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    }

    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === email);

    if (existing) {
      // Update password for existing user
      const { error } = await adminSupabase.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      });
      if (error) throw error;

      // Ensure admin role exists
      await adminSupabase
        .from("admin_roles")
        .upsert({ user_id: existing.id, role: "admin" }, { onConflict: "user_id" });

      // Ensure profile exists
      await adminSupabase
        .from("profiles")
        .upsert({ id: existing.id, full_name: email.split("@")[0] }, { onConflict: "id" });

      return new Response(
        JSON.stringify({ success: true, message: "User password updated", userId: existing.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create new user
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw createError;

    const userId = newUser.user.id;

    // Add admin role
    await adminSupabase
      .from("admin_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id" });

    // Create profile
    await adminSupabase
      .from("profiles")
      .upsert({ id: userId, full_name: email.split("@")[0] }, { onConflict: "id" });

    return new Response(
      JSON.stringify({ success: true, message: "Admin user created", userId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Operation failed" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
