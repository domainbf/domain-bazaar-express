import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get all domains that need checking (last_checked older than check_interval)
    const { data: monitoringItems, error: fetchError } = await supabase
      .from('domain_monitoring')
      .select('*')
      .eq('status', 'monitoring')

    if (fetchError) throw fetchError

    if (!monitoringItems || monitoringItems.length === 0) {
      return new Response(JSON.stringify({ message: 'No domains to check', checked: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const now = new Date()
    const results: { domain: string; status: string; responseTime: number }[] = []

    for (const item of monitoringItems) {
      // Check if enough time has passed since last check
      const lastChecked = new Date(item.last_checked || 0)
      const intervalMs = (item.check_interval || 3600) * 1000
      if (now.getTime() - lastChecked.getTime() < intervalMs) continue

      const startTime = Date.now()
      let newStatus = 'monitoring'
      let errorMessage: string | null = null

      try {
        // Check domain via DNS/HTTP
        const domainName = item.domain_name.replace(/^(https?:\/\/)/, '')
        const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domainName)}&type=A`, {
          signal: AbortSignal.timeout(10000),
        })
        const dnsData = await response.json()

        if (dnsData.Answer && dnsData.Answer.length > 0) {
          newStatus = 'registered'
        } else if (dnsData.Status === 3) {
          // NXDOMAIN - domain not found
          newStatus = 'available'
        } else {
          newStatus = 'registered'
        }
      } catch (e) {
        newStatus = 'error'
        errorMessage = e instanceof Error ? e.message : 'Unknown error'
      }

      const responseTime = Date.now() - startTime
      const previousStatus = item.status

      // Update monitoring record
      await supabase
        .from('domain_monitoring')
        .update({
          status: newStatus,
          last_checked: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', item.id)

      // Insert history record (using service role to bypass RLS)
      await supabase
        .from('domain_monitoring_history')
        .insert({
          monitoring_id: item.id,
          status_before: previousStatus,
          status_after: newStatus,
          response_time: responseTime,
          error_message: errorMessage,
        })

      // Send notification if status changed and notifications enabled
      if (previousStatus !== newStatus && item.notifications_enabled) {
        await supabase
          .from('notifications')
          .insert({
            user_id: item.user_id,
            title: '🔔 域名状态变更',
            message: `您监控的域名 ${item.domain_name} 状态已从 "${previousStatus}" 变更为 "${newStatus}"`,
            type: 'monitoring',
            related_id: item.id,
            action_url: '/user-center?tab=tools',
          })
      }

      results.push({ domain: item.domain_name, status: newStatus, responseTime })
    }

    return new Response(
      JSON.stringify({ message: 'Domain monitoring check complete', checked: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Monitoring check error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
