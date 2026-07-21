import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 智谱 CogView-3-Flash：免费图像生成模型
// 文档：https://open.bigmodel.cn/dev/api/image-model/cogview
const ZHIPU_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/images/generations";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ZHIPU_API_KEY = Deno.env.get("ZHIPU_API_KEY");
    if (!ZHIPU_API_KEY) throw new Error("ZHIPU_API_KEY 未配置");

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

    const prompt = buildLogoPrompt(domainName, category);

    // 调用智谱 CogView-3-Flash（免费）
    const aiRes = await fetch(ZHIPU_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ZHIPU_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "cogview-3-flash",
        prompt,
        size: "1024x1024",
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("智谱 API 错误:", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: `智谱 API 错误: ${aiRes.status}`, details: errText }),
        { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    // 智谱返回格式：{ data: [{ url: "https://..." }], created: ... }
    const remoteUrl: string | undefined = aiData?.data?.[0]?.url;
    if (!remoteUrl) {
      console.error("智谱返回结构异常:", JSON.stringify(aiData));
      throw new Error("智谱未返回图片 URL");
    }

    // 智谱返回的是临时 URL，需拉取后上传到 Supabase 存储，保证长期可访问
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

    const { data: publicUrlData } = supabase.storage
      .from("domain-logos")
      .getPublicUrl(filePath);
    const logoUrl = publicUrlData.publicUrl + `?t=${Date.now()}`;

    const { error: upsertError } = await supabase
      .from("site_settings")
      .upsert(
        { key: `domain_logo_${domainId}`, value: logoUrl, section: "logos", type: "text" },
        { onConflict: "key" }
      );
    if (upsertError) console.error("写入 site_settings 失败:", upsertError);

    return new Response(JSON.stringify({ logoUrl, provider: "zhipu:cogview-3-flash" }), {
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

// ─── Prompt builder（针对方形气泡卡片优化：中心构图、极简、纯黑白）──
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
