import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

serve(async (req) => {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const payload = await req.json()
    console.log('Webhook payload received:', payload)

    // TODO: Verify ClickPesa checksum here using your configured ClickPesa Secret Key
    // e.g. const secret = Deno.env.get('CLICKPESA_SECRET_KEY')
    // const hash = generateHMAC(payload, secret)
    // if (hash !== payload.checksum) throw Error('Invalid signature')

    // Extract relevant data from ClickPesa payload
    // Adjust field names based on actual ClickPesa webhook schema
    const orderReference = payload.orderReference || payload.transactionId;
    const status = payload.status || payload.transactionStatus;

    if (!orderReference) {
      return new Response('No order reference found', { status: 400 })
    }

    // Connect to Supabase using the SERVICE_ROLE_KEY to bypass RLS
    // This allows the server to safely credit the wallet
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Only process successful payments
    if (status === 'SUCCESS' || status === 'COMPLETED' || payload.code === 200) {
      
      // 1. Get the pending transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', orderReference)
        .single()

      if (txError || !transaction) {
        throw new Error(`Transaction ${orderReference} not found`)
      }

      // If it's already completed, do nothing to prevent double-crediting
      if (transaction.status === 'completed') {
        return new Response('Already processed', { status: 200 })
      }

      // 2. Get the user's wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', transaction.wallet_id)
        .single()

      if (walletError || !wallet) {
        throw new Error(`Wallet ${transaction.wallet_id} not found`)
      }

      // 3. Update the transaction status to completed
      const { error: updateTxError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id)

      if (updateTxError) throw updateTxError

      // 4. Safely update the wallet balance
      const newBalance = Number(wallet.balance) + Number(transaction.amount)
      const { error: updateWalletError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id)

      if (updateWalletError) throw updateWalletError

      console.log(`Successfully credited wallet ${wallet.id} with ${transaction.amount}`)
      
      return new Response(JSON.stringify({ message: 'Success' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })

    } else if (status === 'FAILED' || status === 'CANCELLED') {
      
      // Handle failed/cancelled transactions
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', orderReference)
        
      return new Response(JSON.stringify({ message: 'Payment marked as failed' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200, // Return 200 so ClickPesa knows we received the webhook
      })
    }

    // Unhandled status
    return new Response(JSON.stringify({ message: 'Unhandled status' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200, 
    })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
