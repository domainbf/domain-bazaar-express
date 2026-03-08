import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  gateway: string
  amount: number
  currency: string
  domain_id: string
  domain_name: string
  return_url?: string
  buyer_note?: string
}

// PayPal: Create order via REST API
async function createPayPalPayment(config: any, amount: number, currency: string, domainName: string) {
  const baseUrl = config.sandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'

  // Get access token
  const authRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${config.client_id}:${config.client_secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const authData = await authRes.json()
  if (!authData.access_token) throw new Error('PayPal auth failed: ' + JSON.stringify(authData))

  // Create order
  const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        description: `域名购买: ${domainName}`,
        amount: {
          currency_code: currency === 'CNY' ? 'USD' : currency,
          value: amount.toFixed(2),
        },
      }],
      application_context: {
        brand_name: '域见·你',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
      },
    }),
  })
  const orderData = await orderRes.json()
  if (orderData.id) {
    const approveLink = orderData.links?.find((l: any) => l.rel === 'approve')
    return {
      gateway_transaction_id: orderData.id,
      payment_url: approveLink?.href || '',
      gateway_response: orderData,
    }
  }
  throw new Error('PayPal order creation failed: ' + JSON.stringify(orderData))
}

// Alipay: Generate payment page URL
async function createAlipayPayment(config: any, amount: number, orderId: string, domainName: string, returnUrl: string) {
  // Simplified Alipay integration - in production use official SDK
  const params: Record<string, string> = {
    app_id: config.app_id,
    method: 'alipay.trade.page.pay',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    version: '1.0',
    biz_content: JSON.stringify({
      out_trade_no: orderId,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      total_amount: amount.toFixed(2),
      subject: `域名购买: ${domainName}`,
    }),
    return_url: returnUrl,
  }

  const gateway = config.sandbox
    ? 'https://openapi-sandbox.dl.alipaydev.com/gateway.do'
    : 'https://openapi.alipay.com/gateway.do'

  const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')

  return {
    gateway_transaction_id: orderId,
    payment_url: `${gateway}?${queryString}`,
    gateway_response: { params, note: 'Signature generation requires private key processing server-side' },
  }
}

// WeChat Pay: Create native pay order
async function createWechatPayment(config: any, amount: number, orderId: string, domainName: string) {
  // WeChat Pay V3 API
  const baseUrl = 'https://api.mch.weixin.qq.com'
  
  const orderData = {
    appid: config.app_id,
    mchid: config.mch_id,
    description: `域名购买: ${domainName}`,
    out_trade_no: orderId,
    amount: {
      total: Math.round(amount * 100), // convert to cents
      currency: 'CNY',
    },
    notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-callback`,
  }

  return {
    gateway_transaction_id: orderId,
    payment_url: '',
    gateway_response: { 
      ...orderData,
      note: 'WeChat Native Pay requires server-side signature. Configure mch_id and api_key in admin panel.' 
    },
  }
}

// Stripe: Create checkout session
async function createStripePayment(config: any, amount: number, currency: string, domainName: string, returnUrl: string) {
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.secret_key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'mode': 'payment',
      'success_url': `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': returnUrl,
      'line_items[0][price_data][currency]': currency.toLowerCase(),
      'line_items[0][price_data][product_data][name]': `域名: ${domainName}`,
      'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
      'line_items[0][quantity]': '1',
    }),
  })
  const session = await res.json()
  if (session.id) {
    return {
      gateway_transaction_id: session.id,
      payment_url: session.url || '',
      gateway_response: session,
    }
  }
  throw new Error('Stripe session creation failed: ' + JSON.stringify(session))
}

// Bank transfer: return account info
function createBankTransferPayment(config: any, amount: number, orderId: string) {
  return {
    gateway_transaction_id: orderId,
    payment_url: '',
    gateway_response: {
      bank_name: config.bank_name,
      account_name: config.account_name,
      account_number: config.account_number,
      swift_code: config.swift_code,
      amount,
      reference: orderId,
      note: '请在转账时备注订单号',
    },
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Verify user auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '认证失败' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: PaymentRequest = await req.json()
    const { gateway, amount, currency = 'CNY', domain_id, domain_name, return_url = '' } = body

    if (!gateway || !amount || !domain_id) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Load gateway settings from DB
    const { data: gatewaySetting, error: gwError } = await supabase
      .from('payment_gateway_settings')
      .select('*')
      .eq('gateway_name', gateway)
      .eq('is_enabled', true)
      .single()

    if (gwError || !gatewaySetting) {
      return new Response(JSON.stringify({ error: '该支付方式未启用或不存在' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const config = gatewaySetting.config as Record<string, any>
    const fee = amount * (Number(gatewaySetting.fee_rate) || 0)

    // Create pending transaction record
    const { data: txn, error: txnError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        domain_id,
        gateway,
        amount,
        currency,
        fee,
        status: 'pending',
        metadata: { domain_name, return_url },
      })
      .select()
      .single()

    if (txnError) throw txnError

    // Route to appropriate payment gateway
    let result: { gateway_transaction_id: string; payment_url: string; gateway_response: any }

    switch (gateway) {
      case 'paypal':
        result = await createPayPalPayment(config, amount + fee, currency, domain_name)
        break
      case 'alipay':
        result = await createAlipayPayment(config, amount + fee, txn.id, domain_name, return_url)
        break
      case 'wechat_pay':
        result = await createWechatPayment(config, amount + fee, txn.id, domain_name)
        break
      case 'stripe':
        result = await createStripePayment(config, amount + fee, currency, domain_name, return_url)
        break
      case 'bank_transfer':
        result = createBankTransferPayment(config, amount + fee, txn.id)
        break
      default:
        throw new Error(`不支持的支付方式: ${gateway}`)
    }

    // Update transaction with gateway info
    await supabase
      .from('payment_transactions')
      .update({
        gateway_transaction_id: result.gateway_transaction_id,
        payment_url: result.payment_url,
        gateway_response: result.gateway_response,
        status: gateway === 'bank_transfer' ? 'awaiting_transfer' : 'processing',
      })
      .eq('id', txn.id)

    return new Response(JSON.stringify({
      success: true,
      transaction_id: txn.id,
      payment_url: result.payment_url,
      gateway_transaction_id: result.gateway_transaction_id,
      gateway_response: gateway === 'bank_transfer' ? result.gateway_response : undefined,
      fee,
      total: amount + fee,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Payment processing error:', error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : '支付处理失败',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
