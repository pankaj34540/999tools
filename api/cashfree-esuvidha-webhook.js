// ============================================
// E SUVIDHA WEBHOOK — Payment Success Handler
// ============================================
import { getFirestore } from './_firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = req.body;
    
    if (!data || !data.order || data.order.order_status !== 'PAID') {
      return res.status(200).json({ status: 'ignored' });
    }

    const orderId = data.order.order_id;
    const db = getFirestore();

    // 1. Find Application by Cashfree Order ID
    const appsSnap = await db
      .collection('vleApplications')
      .where('cashfreeOrderId', '==', orderId)
      .limit(1)
      .get();

    if (appsSnap.empty) {
      return res.status(200).json({ status: 'application_not_found' });
    }

    const appDoc = appsSnap.docs[0];
    const appData = appDoc.data();

    // 2. Update Application Status
    await appDoc.ref.update({
      paymentStatus: 'paid',
      status: 'approved',
      cashfreePaymentId: data.payment.cf_payment_id,
      webhookReceivedAt: new Date().toISOString(),
      approvedDate: new Date().toLocaleString('en-IN'),
    });

    // 3. Update User Account (eSuvidhaAccess: true)
    if (appData.userId) {
      await db.collection('userAccounts').doc(appData.userId).update({
        eSuvidhaAccess: true,
        eSuvidhaPaidAt: new Date().toISOString(),
        subscriptionStatus: 'active',
      });
    }

    return res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}
