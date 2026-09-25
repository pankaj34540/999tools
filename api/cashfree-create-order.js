// Vercel Serverless — Cashfree Create Order (v2023-08-01)

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
    serviceId,
    serviceName,
    customerName,
    customerPhone,
    customerEmail,
  } = req.body;

  if (!amount || !customerName || !customerPhone) {
    return res.status(400).json({ error: 'Amount, name, and phone are required' });
  }

  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    return res.status(500).json({ error: 'Cashfree keys not configured' });
  }

  const orderId = `T999_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

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
          customer_id: `CUST_${customerPhone}`,
          customer_name: customerName,
          customer_email: customerEmail || 'noreply@tools999.store',
          customer_phone: customerPhone,
        },
        order_meta: {
          return_url: `https://tools999.store/payment-success?order_id={order_id}`,
          notify_url: `https://tools999.store/api/cashfree-webhook`,
        },
        order_note: `${serviceName || 'Service'} — 999tools`,
        order_tags: {
          serviceId: serviceId || '',
          serviceName: serviceName || '',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree create order error:', data);
      return res.status(response.status).json({
        error: data.message || 'Failed to create Cashfree order',
      });
    }

    return res.status(200).json({
      success: true,
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      environment: process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
    });
  } catch (error) {
    console.error('Cashfree create error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
