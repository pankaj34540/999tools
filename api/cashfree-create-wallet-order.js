import { getFirestore } from './_firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, amount, userId, userEmail, userMobile, userName } = req.body;

  if (!orderId || !amount || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
    const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
    const ENV = process.env.CASHFREE_ENV || 'production';

    const baseUrl = ENV === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

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
          customer_id: userId,
          customer_name: userName || 'VLE User',
          customer_email: userEmail,
          customer_phone: userMobile || '9999999999',
        },
        order_meta: {
          return_url: `https://tools999.store/payment-success?order_id={order_id}`,
          notify_url: `https://tools999.store/api/cashfree-wallet-webhook`,
        },
        order_note: `Wallet Recharge`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Payment initialization failed' });
    }

    // Save Order to Firestore (Pending)
    const db = getFirestore();
    await db.collection('walletOrders').doc(orderId).set({
      orderId,
      userId,
      amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      paymentSessionId: data.payment_session_id,
      orderId,
      environment: ENV,
    });
  } catch (err) {
    console.error('Cashfree wallet error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
