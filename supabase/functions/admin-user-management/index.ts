
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { action } = body;
    
    let result;
    
    switch (action) {
      case 'get_user_emails':
        // This function gets emails for user IDs
        const { user_ids } = body;
        if (!user_ids || !Array.isArray(user_ids)) {
          return new Response(
            JSON.stringify({ error: 'user_ids is required and must be an array' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
          return new Response(
            JSON.stringify({ error: usersError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        const filteredUsers = users.users.filter(user => user_ids.includes(user.id));
        result = { users: filteredUsers.map(u => ({ id: u.id, email: u.email })) };
        break;
        
      case 'delete_user':
        const { user_id } = body;
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: 'user_id is required' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
        
        if (deleteError) {
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        result = { success: true, message: 'User deleted successfully' };
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
