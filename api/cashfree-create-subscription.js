// Vercel Serverless — Cashfree Create Subscription Order
import { getFirestore } from './_firebase.js';

const CASHFREE_BASE =
  process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    amount,
    plan,            // 'premium' | 'vle'
    billingCycle,    // 'monthly' | 'yearly'
    userId,
    userName,
    userEmail,
    userMobile,
  } = req.body;

  if (!amount || !plan || !billingCycle || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    return res.status(500).json({ error: 'Cashfree keys not configured' });
  }

  const orderId = `SUB_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    const response = await fetch(`${CASHFREE_BASE}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(amount),
        order_currency: 'INR',
        customer_details: {
          customer_id: userId,
          customer_name: userName || 'Customer',
          customer_email: userEmail || 'noreply@tools999.store',
          customer_phone: userMobile || '9999999999',
        },
        order_meta: {
          return_url: `https://tools999.store/payment-success?order_id={order_id}&type=subscription`,
          notify_url: `https://tools999.store/api/cashfree-webhook`,
        },
        order_note: `${plan.toUpperCase()} ${billingCycle} subscription`,
        order_tags: {
          type: 'subscription',
          userId: userId,
          plan: plan,
          billingCycle: billingCycle,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree create sub error:', data);
      return res.status(response.status).json({
        error: data.message || 'Failed to create subscription order',
      });
    }

    // Save to paymentRequests
    try {
      const db = getFirestore();
      await db.collection('paymentRequests').doc(orderId).set({
        id: orderId,
        cashfreeOrderId: orderId,
        userId: userId,
        userEmail: userEmail || '',
        userName: userName || '',
        userMobile: userMobile || '',
        plan: plan,
        billingCycle: billingCycle,
        amount: Number(amount),
        status: 'pending',
        requestedAt: new Date().toISOString(),
        cashfreeOrderIdSetAt: new Date().toISOString(),
      });
      console.log('✅ Pending subscription saved:', orderId);
    } catch (dbErr) {
      console.error('⚠️ Firestore save failed:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      environment:
        process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
    });
  } catch (error) {
    console.error('Subscription create error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
