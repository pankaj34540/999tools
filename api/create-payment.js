// Vercel Serverless Function — Instamojo v2.0 Payment Request
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const CLIENT_ID = process.env.INSTAMOJO_CLIENT_ID;
  const CLIENT_SECRET = process.env.INSTAMOJO_CLIENT_SECRET;

  const res = await fetch('https://api.instamojo.com/oauth2/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Token failed');

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 50 * 60 * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, purpose, buyerName, email, phone, serviceId } = req.body;

  if (!amount || !purpose) {
    return res.status(400).json({ error: 'Amount and purpose required' });
  }

  try {
    const token = await getAccessToken();

    const response = await fetch('https://api.instamojo.com/v2/payment_requests/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        purpose: purpose,
        buyer_name: buyerName || '',
        email: email || '',
        phone: phone || '',
        send_email: 'False',
        send_sms: 'False',
        allow_repeated_payments: 'False',
        redirect_url: `https://tools999.store/payment-success?serviceId=${serviceId || ''}`,
        webhook: `https://tools999.store/api/instamojo-webhook`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || data.error || 'Failed to create payment request',
      });
    }

    return res.status(200).json({
      success: true,
      paymentUrl: data.longurl || (data.payment_request && data.payment_request.longurl),
    });
  } catch (error) {
    console.error('Instamojo error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
