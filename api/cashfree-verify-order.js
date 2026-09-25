// Vercel Serverless — Cashfree Verify Order Status

const CASHFREE_BASE =
  process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const orderId = req.query.order_id;
  if (!orderId) {
    return res.status(400).json({ error: 'order_id required' });
  }

  try {
    const response = await fetch(`${CASHFREE_BASE}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree verify error:', data);
      return res.status(response.status).json({
        error: data.message || 'Failed to fetch order',
      });
    }

    return res.status(200).json({
      success: true,
      orderId: data.order_id,
      status: data.order_status, // PAID | ACTIVE | EXPIRED | CANCELLED
      amount: data.order_amount,
      customerName: data.customer_details?.customer_name,
      customerPhone: data.customer_details?.customer_phone,
      customerEmail: data.customer_details?.customer_email,
      note: data.order_note,
      serviceId: data.order_tags?.serviceId || '',
      serviceName: data.order_tags?.serviceName || '',
    });
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
