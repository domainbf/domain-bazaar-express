
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

    const adminClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { action, email } = await req.json();

    if (action === 'create_admin') {
      if (!email) {
        throw new Error("Email is required for admin creation");
      }

      // First check if the user already exists
      const { data: existingUsers, error: userCheckError } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        throw userCheckError;
      }

      if (existingUsers) {
        // Update existing user to admin
        await adminClient
          .from('profiles')
          .update({ 
            is_admin: true,
            updated_at: new Date().toISOString()
          })
          .eq('email', email);
        
        // Also update auth.users metadata if possible
        try {
          const { data: userData } = await adminClient
            .auth
            .admin
            .listUsers({
              filter: `email.eq.${email}`
            });
            
          if (userData && userData.users && userData.users.length > 0) {
            const userId = userData.users[0].id;
            await adminClient.auth.admin.updateUserById(userId, {
              app_metadata: { role: 'admin' }
            });
          }
        } catch (authError) {
          console.error("Error updating auth metadata:", authError);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Admin user already exists and has been updated" 
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }

      // Create new admin user if they don't exist
      const oneTimePassword = generatePassword();
      
      // Create the auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: email,
        password: oneTimePassword,
        email_confirm: true,
        app_metadata: { role: 'admin' },
        user_metadata: { full_name: 'Admin User' }
      });

      if (authError) {
        throw authError;
      }

      // Ensure profile record exists and is marked as admin
      if (authData.user) {
        const { error: profileError } = await adminClient
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: email,
            is_admin: true,
            full_name: 'Admin User',
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          throw profileError;
        }
      }

      // Send admin login notification with one-time password
      try {
        const anonClient = createClient(
          SUPABASE_URL,
          Deno.env.get("SUPABASE_ANON_KEY") || ""
        );
        
        await anonClient.functions.invoke('send-notification', {
          body: {
            type: 'admin_login',
            recipient: email,
            data: {
              oneTimePassword
            }
          }
        });
      } catch (emailError) {
        console.error("Error sending admin notification:", emailError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Admin user created successfully", 
          oneTimePassword
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    } else {
      throw new Error("Invalid action");
    }
  } catch (error) {
    console.error("Error in admin-provisioning function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process admin provisioning request"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
};

function generatePassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

serve(handler);
