
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

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { action, email, password } = await req.json();
    console.log(`Processing admin provisioning action: ${action}`);

    switch (action) {
      case "create_admin":
        // Check if admin already exists with this email
        const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers();
        
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
        
        // Create admin user
        const { data, error } = await supabase.auth.admin.createUser({
          email: email,
          password: password || undefined,
          email_confirm: true,
          app_metadata: { role: 'admin' },
          user_metadata: { is_first_login: true },
        });
        
        if (error) {
          throw new Error(`Error creating admin user: ${error.message}`);
        }
        
        // Generate one-time password if needed
        let oneTimePassword = null;
        if (!password) {
          oneTimePassword = Math.random().toString(36).substring(2, 10);
          
          // Update user with hashed one-time password
          const { error: updateError } = await supabase.auth.admin.updateUserById(
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
            oneTimePassword: oneTimePassword 
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
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw new Error(`Error getting user: ${userError.message}`);
        }
        
        const isAdmin = userData?.user?.app_metadata?.role === 'admin';
        
        return new Response(
          JSON.stringify({ 
            is_admin: isAdmin,
            user: userData.user
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
