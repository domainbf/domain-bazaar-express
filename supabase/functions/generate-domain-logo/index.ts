import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 智谱 CogView-3-Flash 免费图像生成
const ZHIPU_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/images/generations";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let domainId = "";
  let domainName = "";
  let triggeredBy = "auto";

  try {
    const body = await req.json();
    domainId = body.domainId;
    domainName = body.domainName;
    const category = body.category;
    const force = !!body.force;
    triggeredBy = body.triggeredBy || "auto";

    if (!domainId || !domainName) {
      return json({ error: "domainId and domainName required" }, 400);
    }

    // ─── 1. 缓存命中：已有 Logo 直接复用（非 force 时）─────────────
    if (!force) {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", `domain_logo_${domainId}`)
        .maybeSingle();
      if (existing?.value) {
        await logAttempt(supabase, {
          domainId, domainName, status: "cache_hit", logoUrl: existing.value,
          provider: "cache", durationMs: Date.now() - startedAt, cacheHit: true,
          fallbackUsed: false, triggeredBy,
        });
        return json({ logoUrl: existing.value, provider: "cache", cacheHit: true });
      }
    }

    // ─── 2. 尝试智谱 CogView-3-Flash ──────────────────────────
    const ZHIPU_API_KEY = Deno.env.get("ZHIPU_API_KEY");
    let logoUrl: string | null = null;
    let provider = "zhipu:cogview-3-flash";
    let fallbackUsed = false;
    let errorMessage: string | null = null;

    if (ZHIPU_API_KEY) {
      try {
        const prompt = buildLogoPrompt(domainName, category);
        const aiRes = await fetch(ZHIPU_ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${ZHIPU_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "cogview-3-flash", prompt, size: "1024x1024" }),
        });
        if (!aiRes.ok) {
          const errText = await aiRes.text();
          throw new Error(`智谱 API ${aiRes.status}: ${errText.slice(0, 300)}`);
        }
        const aiData = await aiRes.json();
        const remoteUrl: string | undefined = aiData?.data?.[0]?.url;
        if (!remoteUrl) throw new Error("智谱未返回图片 URL");

        const imgRes = await fetch(remoteUrl);
        if (!imgRes.ok) throw new Error(`拉取生成图片失败: ${imgRes.status}`);
        const contentType = imgRes.headers.get("content-type") || "image/png";
        const ext = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
        const buffer = new Uint8Array(await imgRes.arrayBuffer());

        const filePath = `${domainId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("domain-logos")
          .upload(filePath, buffer, { contentType, upsert: true });
        if (uploadError) throw new Error(`上传存储失败: ${uploadError.message}`);
        const { data: pu } = supabase.storage.from("domain-logos").getPublicUrl(filePath);
        logoUrl = pu.publicUrl + `?t=${Date.now()}`;
      } catch (e) {
        errorMessage = e instanceof Error ? e.message : String(e);
        console.error("智谱生成失败，将启用降级:", errorMessage);
      }
    } else {
      errorMessage = "ZHIPU_API_KEY 未配置";
    }

    // ─── 3. 降级方案：生成首字母 SVG 上传 ─────────────────────
    if (!logoUrl) {
      const svg = buildFallbackSvg(domainName);
      const filePath = `${domainId}.svg`;
      const { error: uploadError } = await supabase.storage
        .from("domain-logos")
        .upload(filePath, new TextEncoder().encode(svg), { contentType: "image/svg+xml", upsert: true });
      if (uploadError) {
        // 存储也失败：记录错误后返回失败
        await logAttempt(supabase, {
          domainId, domainName, status: "failed",
          errorMessage: `${errorMessage || "生成失败"}; 降级上传失败: ${uploadError.message}`,
          durationMs: Date.now() - startedAt, cacheHit: false, fallbackUsed: true, triggeredBy,
        });
        return json({ error: "生成与降级均失败", details: uploadError.message }, 500);
      }
      const { data: pu } = supabase.storage.from("domain-logos").getPublicUrl(filePath);
      logoUrl = pu.publicUrl + `?t=${Date.now()}`;
      provider = "fallback:initial-svg";
      fallbackUsed = true;
    }

    // ─── 4. 写入 site_settings ─────────────────────
    await supabase
      .from("site_settings")
      .upsert(
        { key: `domain_logo_${domainId}`, value: logoUrl, section: "logos", type: "text" },
        { onConflict: "key" }
      );

    await logAttempt(supabase, {
      domainId, domainName,
      status: fallbackUsed ? "fallback" : "success",
      logoUrl, provider, errorMessage,
      durationMs: Date.now() - startedAt,
      cacheHit: false, fallbackUsed, triggeredBy,
    });

    return json({ logoUrl, provider, fallbackUsed, cacheHit: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("generate-domain-logo error:", msg);
    try {
      await logAttempt(supabase, {
        domainId, domainName, status: "failed", errorMessage: msg,
        durationMs: Date.now() - startedAt, cacheHit: false, fallbackUsed: false, triggeredBy,
      });
    } catch { /* noop */ }
    return json({ error: msg }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logAttempt(supabase: any, row: {
  domainId: string; domainName: string; status: string;
  logoUrl?: string | null; provider?: string; errorMessage?: string | null;
  durationMs: number; cacheHit: boolean; fallbackUsed: boolean; triggeredBy: string;
}) {
  await supabase.from("domain_logo_generation_logs").insert({
    domain_id: row.domainId || null,
    domain_name: row.domainName,
    status: row.status,
    provider: row.provider ?? null,
    logo_url: row.logoUrl ?? null,
    error_message: row.errorMessage ?? null,
    duration_ms: row.durationMs,
    cache_hit: row.cacheHit,
    fallback_used: row.fallbackUsed,
    triggered_by: row.triggeredBy,
  });
}

function buildFallbackSvg(domainName: string): string {
  const base = (domainName.split(".")[0] || "?").toUpperCase();
  const letter = base.slice(0, 2);
  const fontSize = letter.length === 1 ? 520 : 380;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#ffffff"/>
  <rect x="64" y="64" width="896" height="896" fill="none" stroke="#000000" stroke-width="12"/>
  <text x="512" y="512" text-anchor="middle" dominant-baseline="central"
    font-family="Helvetica, Arial, sans-serif" font-weight="900"
    font-size="${fontSize}" fill="#000000" letter-spacing="-8">${escapeXml(letter)}</text>
</svg>`;
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!));
}

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
    single: "极简单字母雕塑标志，几何构图，纯黑色实体形态置于纯白背景",
    premium: "顶级奢华字母组合印章，纤细线条，古典徽章现代化设计，纯白和深黑",
    tech: "精密技术字母组合，电路启发的几何构造，像素完美黑白，开发者品牌风格",
    short: "粗体字母对标记，几何构造，标志性符号构图，纯黑白，一眼可辨的高端单色标识",
    numeric: "粗体数字构图，超大数字作为建筑元素，重黑白，金融行业品牌精度",
    general: "干净专业的字标，平衡的新式无衬线字体，域名注册商品牌可信度，纯黑白，值得信赖的单色标识",
  };
  const style = styles[type] || styles.general;
  const subject = `为域名 "${domainName}" 设计，突出 "${base}"${tld ? `，配 TLD ".${tld}"` : ""}`;
  return `${style}，${subject}。要求：纯黑白（#000000 与 #FFFFFF），1:1 方形，白色背景，中心构图，矢量风格 Logo，无色彩、无渐变、无阴影、无 3D 渲染、无真实照片。`;
}
