import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("Missing Supabase env vars for keepalive");
      return new Response(
        JSON.stringify({ ok: false, error: "missing env" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Lightweight DB ping (public, cheap, RLS allows SELECT true)
    const start = Date.now();
    const { data, error } = await supabase
      .from("site_settings")
      .select("id")
      .limit(1);

    const duration = Date.now() - start;

    if (error) {
      console.warn("Keepalive DB ping error:", error.message);
    }

    return new Response(
      JSON.stringify({ ok: true, ts: new Date().toISOString(), ms: duration, rows: data?.length ?? 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Keepalive unexpected error:", e?.message);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
