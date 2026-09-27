// Vercel Serverless — Cashfree Create VLE Registration Order
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
    applicationId,
    userName,
    userEmail,
    userMobile,
    centerName,
  } = req.body;

  if (!amount || !applicationId || !userMobile) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    return res.status(500).json({ error: 'Cashfree keys not configured' });
  }

  const orderId = `VLE_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

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
          customer_id: `VLE_${userMobile}`,
          customer_name: userName || 'VLE Applicant',
          customer_email: userEmail || 'noreply@tools999.store',
          customer_phone: userMobile,
        },
        order_meta: {
          return_url: `https://tools999.store/payment-success?order_id={order_id}&type=vle_registration`,
          notify_url: `https://tools999.store/api/cashfree-webhook`,
        },
        order_note: `VLE Registration — ${centerName}`,
        order_tags: {
          type: 'vle_registration',
          applicationId: applicationId,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree VLE create error:', data);
      return res.status(response.status).json({
        error: data.message || 'Failed to create VLE order',
      });
    }

    // Link Cashfree order ID to VLE application
    try {
      const db = getFirestore();
      await db.collection('vleApplications').doc(applicationId).update({
        cashfreeOrderId: data.order_id,
        cashfreeOrderCreatedAt: new Date().toISOString(),
      });
      console.log('✅ VLE app linked to Cashfree order:', orderId);
    } catch (dbErr) {
      console.error('⚠️ Firestore link failed:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      environment:
        process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
    });
  } catch (error) {
    console.error('VLE create error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
