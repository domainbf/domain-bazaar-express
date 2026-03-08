import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    }

    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the caller is admin
    const authHeader = req.headers.get("authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    
    if (!token) {
      return new Response(JSON.stringify({ error: "未授权" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userError } = await userSupabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "用户验证失败" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check admin status via admin_roles table
    const { data: isAdmin } = await adminSupabase
      .from("admin_roles")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "无管理员权限" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { action, email, password, user_id } = await req.json();
    console.log(`Admin password action: ${action} by ${userData.user.email}`);

    switch (action) {
      case "change_own_password": {
        const { error } = await adminSupabase.auth.admin.updateUserById(
          userData.user.id,
          { password }
        );
        if (error) throw new Error(`修改密码失败: ${error.message}`);
        return new Response(
          JSON.stringify({ success: true, message: "密码已更新" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "change_user_password": {
        if (!user_id && !email) throw new Error("需要提供用户ID或邮箱");
        
        let targetUserId = user_id;
        if (!targetUserId && email) {
          const { data: users } = await adminSupabase.auth.admin.listUsers();
          const found = users?.users?.find((u) => u.email === email);
          if (!found) throw new Error("未找到该用户");
          targetUserId = found.id;
        }

        const { error } = await adminSupabase.auth.admin.updateUserById(
          targetUserId,
          { password }
        );
        if (error) throw new Error(`修改用户密码失败: ${error.message}`);
        return new Response(
          JSON.stringify({ success: true, message: "用户密码已更新" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "ensure_admin": {
        // Ensure admin email is in admin_roles
        if (!email) throw new Error("需要提供邮箱");
        const { data: users } = await adminSupabase.auth.admin.listUsers();
        const found = users?.users?.find((u) => u.email === email);
        if (!found) throw new Error("未找到该用户");

        const { error } = await adminSupabase
          .from("admin_roles")
          .upsert({ user_id: found.id, role: "admin", created_by: userData.user.id }, { onConflict: "user_id,role" });

        // Note: admin_roles doesn't have unique(user_id, role), so use insert with conflict handling
        if (error) {
          // Try insert instead
          await adminSupabase
            .from("admin_roles")
            .insert({ user_id: found.id, role: "admin", created_by: userData.user.id });
        }

        return new Response(
          JSON.stringify({ success: true, message: "管理员已设置" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "无效操作" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }
  } catch (error: any) {
    console.error("Admin password error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "操作失败" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
