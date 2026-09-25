// Vercel Serverless Function — Instamojo Payment Request
export default async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, purpose, buyerName, email, phone, serviceId, orderId } = req.body;

  // Validate
  if (!amount || !purpose) {
    return res.status(400).json({ error: 'Amount and purpose required' });
  }

  // Instamojo API credentials (Vercel Environment Variables se aayenge)
  const API_KEY = process.env.INSTAMOJO_API_KEY;
  const AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN;
  const API_URL = process.env.INSTAMOJO_API_URL || 'https://www.instamojo.com/api/1.1/';

  if (!API_KEY || !AUTH_TOKEN) {
    return res.status(500).json({ error: 'Instamojo credentials not configured' });
  }

  try {
    // Instamojo API call
    const response = await fetch(`${API_URL}payment-requests/`, {
      method: 'POST',
      headers: {
        'X-Api-Key': API_KEY,
        'X-Auth-Token': AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        purpose: purpose,
        amount: amount.toString(),
        buyer_name: buyerName || '',
        email: email || '',
        phone: phone || '',
        send_email: 'False',
        send_sms: 'False',
        allow_repeated_payments: 'False',
        redirect_url: `https://tools999.store/payment-success?orderId=${orderId || ''}&serviceId=${serviceId || ''}`,
        webhook: `https://tools999.store/api/instamojo-webhook`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'Failed to create payment request',
      });
    }

    // Return longurl (payment page URL)
    return res.status(200).json({
      success: true,
      paymentUrl: data.payment_request.longurl,
      paymentRequestId: data.payment_request.id,
    });
  } catch (error) {
    console.error('Instamojo error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
