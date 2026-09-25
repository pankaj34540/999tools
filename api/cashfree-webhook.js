// Vercel Serverless — Cashfree Webhook
// Payment success hone par Cashfree ye endpoint hit karega

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const timestamp = req.headers['x-webhook-timestamp'];
    const signature = req.headers['x-webhook-signature'];
    const rawBody = JSON.stringify(req.body);

    console.log('🔔 Cashfree Webhook received:');
    console.log('  Timestamp:', timestamp);
    console.log('  Signature:', signature ? 'present' : 'missing');
    console.log('  Body:', JSON.stringify(req.body, null, 2));

    // Optional: signature verification (Cashfree docs)
    // Filhaal log kar rahe hain, verify endpoint se status check ho raha hai

    const eventType = req.body?.type;
    const data = req.body?.data;

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      console.log('💰 PAYMENT SUCCESS:', {
        orderId: data?.order?.order_id,
        amount: data?.order?.order_amount,
        customerName: data?.customer_details?.customer_name,
        customerPhone: data?.customer_details?.customer_phone,
        paymentId: data?.payment?.cf_payment_id,
      });
      // Order update success page se hoga (verify API se)
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
