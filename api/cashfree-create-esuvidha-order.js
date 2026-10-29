// ============================================
// E SUVIDHA PAYMENT API — Cashfree Integration
// ============================================
import { getFirestore } from './_firebase.js';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    applicationId,
    amount,
    userName,
    userEmail,
    userMobile,
    centerName,
  } = req.body;

  if (!applicationId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Cashfree Order Create
    const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
    const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
    const ENV = process.env.CASHFREE_ENV || 'production';

    const baseUrl = ENV === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

    const orderId = `ESUVIDHA_${Date.now()}`;

    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: applicationId,
          customer_name: userName,
          customer_email: userEmail,
          customer_phone: userMobile,
        },
        order_meta: {
          return_url: `${process.env.VERCEL_URL || 'https://tools999.store'}/payment-success?order_id={order_id}`,
          notify_url: `${process.env.VERCEL_URL || 'https://tools999.store'}/api/cashfree-webhook`,
        },
        order_note: `E SUVIDHA Registration - ${centerName}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree error:', data);
      return res.status(500).json({ error: data.message || 'Payment initialization failed' });
    }

    // 2. Update Application with Cashfree Order ID
    const db = getFirestore();
    await db.collection('vleApplications').doc(applicationId).update({
      cashfreeOrderId: orderId,
      paymentStatus: 'pending',
    });

    return res.status(200).json({
      success: true,
      paymentSessionId: data.payment_session_id,
      orderId: orderId,
      environment: ENV,
    });
  } catch (err) {
    console.error('Cashfree API error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
