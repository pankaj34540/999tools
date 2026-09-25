// Vercel Serverless — Cashfree Webhook
// Payment success hone par Cashfree ye endpoint hit karega
// Firestore mein order status update karega (browser band hone pe bhi)
import { getFirestore } from './_firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const eventType = req.body?.type;
    const data = req.body?.data;

    console.log('🔔 Cashfree Webhook received:', eventType);
    console.log('  Body:', JSON.stringify(req.body, null, 2));

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = data?.order?.order_id;
      const paymentId = data?.payment?.cf_payment_id;

      if (!orderId) {
        console.warn('⚠️ No order_id in webhook');
        return res.status(200).json({ success: true });
      }

      try {
        const db = getFirestore();
        const orderRef = db.collection('serviceOrders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (orderDoc.exists) {
          const currentData = orderDoc.data();
          // Already paid? Skip duplicate update
          if (currentData?.paymentStatus === 'paid') {
            console.log('ℹ️ Order already marked paid, skipping');
            return res.status(200).json({ success: true });
          }

          await orderRef.update({
            paymentStatus: 'paid',
            cashfreePaymentId: paymentId || '',
            webhookReceivedAt: new Date().toISOString(),
            ownerNotes: `Cashfree auto-verified via webhook. Payment ID: ${paymentId || 'N/A'}`,
            updatedAt: new Date().toISOString(),
          });
          console.log('✅ Firestore order updated via webhook:', orderId);
        } else {
          // Order nahi mila — rare case, create a basic record
          console.log('⚠️ Order not found, creating minimal record:', orderId);
          await orderRef.set({
            cashfreeOrderId: orderId,
            serviceId: data?.order?.order_tags?.serviceId || '',
            serviceName: data?.order?.order_tags?.serviceName || 'Service',
            price: Number(data?.order?.order_amount || 0),
            customerName: data?.customer_details?.customer_name || 'Customer',
            customerPhone: data?.customer_details?.customer_phone || '',
            customerEmail: data?.customer_details?.customer_email || '',
            customerAddress: '',
            aadhaarNumber: '',
            panNumber: '',
            dateOfBirth: '',
            fatherName: '',
            motherName: '',
            gender: '',
            category: '',
            additionalData: {},
            documentLinks: [],
            paymentMethod: 'cashfree',
            paymentStatus: 'paid',
            paymentReference: orderId,
            paymentAmount: Number(data?.order?.order_amount || 0),
            cashfreePaymentId: paymentId || '',
            orderStatus: 'pending',
            ownerNotes: `Created via webhook. Payment ID: ${paymentId || 'N/A'}`,
            webhookReceivedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          console.log('✅ Minimal order created:', orderId);
        }
      } catch (dbErr) {
        console.error('❌ Firestore update failed:', dbErr.message);
        // Still return 200 so Cashfree doesn't retry endlessly
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
