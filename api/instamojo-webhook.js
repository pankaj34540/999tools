// Vercel Serverless Function — Instamojo v2.0 Webhook
// Ye webhook aane par Instamojo se khud verify karega

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

  const data = req.body;
  console.log('🔔 Webhook received:', JSON.stringify(data, null, 2));

  const paymentRequestId = data.payment_request_id;
  const paymentId = data.payment_id;

  if (!paymentRequestId) {
    return res.status(400).json({ error: 'Missing payment_request_id' });
  }

  try {
    const token = await getAccessToken();

    const verifyRes = await fetch(
      `https://api.instamojo.com/v2/payment_requests/${paymentRequestId}/`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      console.error('❌ Verify failed:', verifyData);
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const paymentStatus = verifyData.status;
    const amount = verifyData.amount;

    console.log('✅ Verified payment:', {
      paymentRequestId,
      paymentId,
      status: paymentStatus,
      amount,
    });

    if (paymentStatus === 'Completed') {
      // TODO: Firestore mein order update karo
      // Filhaal log kar rahe hain
      console.log('💰 PAYMENT COMPLETED — order should be marked as paid');
    }

    return res.status(200).json({ success: true, verified: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
