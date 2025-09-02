
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    // Initialize Supabase client with service role key for admin operations
    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // For user-based operations, get the auth token from request
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Create a client using the user token if available
    const supabase = token 
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } })
      : adminSupabase;
    
    const reqBody = await req.json();
    const { action, email, password } = reqBody;
    console.log(`Processing admin provisioning action: ${action}`);

    switch (action) {
      case "create_admin":
        // Check if admin already exists with this email
        const { data: existingUsers, error: searchError } = await adminSupabase.auth.admin.listUsers();
        
        if (searchError) {
          throw new Error(`Error searching users: ${searchError.message}`);
        }
        
        const adminExists = existingUsers.users.some(user => 
          user.email === email && user.app_metadata?.role === 'admin'
        );
        
        if (adminExists) {
          return new Response(
            JSON.stringify({ message: "Admin user already exists" }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            }
          );
        }
        
        // Create admin user with specific credentials for 9208522@qq.com
        const adminPassword = email === '9208522@qq.com' ? 'lijiawei' : (password || Math.random().toString(36).substring(2, 15));
        
        const { data, error } = await adminSupabase.auth.admin.createUser({
          email: email,
          password: adminPassword,
          email_confirm: true,
          app_metadata: { role: 'admin', is_admin: true },
          user_metadata: { is_first_login: false },
        });
        
        if (error) {
          throw new Error(`Error creating admin user: ${error.message}`);
        }
        
        // For the main admin account 9208522@qq.com, password is already set
        let oneTimePassword = null;
        if (!password && email !== '9208522@qq.com') {
          oneTimePassword = Math.random().toString(36).substring(2, 10);
          
          // Update user with hashed one-time password
          const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
            data.user.id,
            { password: oneTimePassword }
          );
          
          if (updateError) {
            throw new Error(`Error setting one-time password: ${updateError.message}`);
          }

          // Send one-time password via email
          await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              type: "admin_login",
              recipient: email,
              data: { oneTimePassword }
            }),
          });
        }
        
        return new Response(
          JSON.stringify({ 
            message: "Admin user created successfully", 
            user: data.user,
            password: email === '9208522@qq.com' ? 'lijiawei' : oneTimePassword 
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
        
      case "verify_admin":
        // First try to get the current user from the token
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw new Error(`Error getting user: ${userError.message}`);
        }
        
        let isAdmin = false;
        
        if (userData?.user) {
          // Check if user has admin role in app_metadata
          isAdmin = userData.user.app_metadata?.role === 'admin';
          
          // If not found in app_metadata, check direct admin list
          if (!isAdmin && email) {
            // This is a fallback for admins created through other means
            const adminEmails = ['9208522@qq.com']; // Add known admin emails
            isAdmin = adminEmails.includes(userData.user.email || '');
          }
          
          // If admin found, ensure metadata is set correctly
          if (isAdmin && !userData.user.app_metadata?.role) {
            // Update the user metadata to include the admin role
            await adminSupabase.auth.admin.updateUserById(userData.user.id, {
              app_metadata: { role: 'admin', is_admin: true }
            });
          }
        }
        
        return new Response(
          JSON.stringify({ 
            is_admin: isAdmin,
            user: userData?.user || null
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
        
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
    }
  } catch (error) {
    console.error("Error in admin-provisioning function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
