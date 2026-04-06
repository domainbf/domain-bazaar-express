import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { domainId, domainName, category } = await req.json();
    if (!domainId || !domainName) {
      return new Response(JSON.stringify({ error: "domainId and domainName required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt
    const prompt = buildLogoPrompt(domainName, category);

    // Generate image via Lovable AI
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, add credits to workspace" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      throw new Error(`AI gateway error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const imageUrl = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error("No image returned from AI");

    // Decode base64 and upload to Supabase storage
    const base64Match = imageUrl.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if (!base64Match) throw new Error("Unexpected image format");

    const mimeType = `image/${base64Match[1]}`;
    const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const binaryStr = atob(base64Match[2]);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const filePath = `${domainId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("domain-logos")
      .upload(filePath, bytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage
      .from("domain-logos")
      .getPublicUrl(filePath);

    const logoUrl = publicUrlData.publicUrl + `?t=${Date.now()}`;

    // Save URL to site_settings
    const { error: upsertError } = await supabase
      .from("site_settings")
      .upsert(
        { key: `domain_logo_${domainId}`, value: logoUrl, section: "logos", type: "text" },
        { onConflict: "key" }
      );

    if (upsertError) console.error("Failed to save logo URL to site_settings:", upsertError);

    return new Response(JSON.stringify({ logoUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-domain-logo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Prompt builder (simplified from frontend version) ──────────────────

function buildLogoPrompt(domainName: string, category?: string): string {
  const parts = domainName.split(".");
  const base = parts[0].toUpperCase();
  const tld = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";

  let type = "general";
  if (category === "premium") type = "premium";
  else if (category === "dev" || category === "tech") type = "tech";
  else if (base.length === 1) type = "single";
  else if (/^\d+$/.test(base)) type = "numeric";
  else if (base.length <= 4) type = "short";

  const styles: Record<string, string> = {
    single: "Monumental single-letter sculpture, architectural gravity, solid black geometric form on pure white, museum-quality typographic installation",
    premium: "Ultra-luxury monogram seal, fine hairline strokes, classical heraldic composition modernized for digital, pristine white and deep black",
    tech: "Precise technical monogram, circuit-trace inspired geometric construction, pixel-perfect black on white, developer-tool brand aesthetic",
    short: "Bold letter-pair mark, geometric construction, iconic symbol-mark composition, pure black on white, instantly recognizable premium monochrome identity",
    numeric: "Bold numeral composition, oversized digit treated as architectural element, heavy black on white, financial-sector brand precision",
    general: "Clean professional wordmark, balanced neo-grotesque typography, domain-registrar brand credibility, pure black on white, trustworthy monochrome identity",
  };

  const style = styles[type] || styles.general;
  const subject = `for the domain "${domainName}", featuring "${base}"${tld ? ` with TLD ".${tld}"` : ""}`;

  return `${style}, created ${subject}. MANDATORY: pure black and white ONLY — solid black (#000000) and solid white (#FFFFFF). Square 1:1 format, white background, professional vector-style logo. Negative: color, gradient, shadow, 3d render, realistic photo.`;
}
