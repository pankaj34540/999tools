// ============================================
// VERIFY PAYMENT & UPDATE FIRESTORE
// ============================================
import { getFirestore } from './_firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID required' });
  }

  try {
    const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
    const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
    const ENV = process.env.CASHFREE_ENV || 'production';

    const baseUrl = ENV === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';

    // 1. Cashfree se order status check karo
    const response = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Failed to fetch order' });
    }

    // 2. Agar payment PAID hai, toh Firestore update karo
    if (data.order_status === 'PAID') {
      const db = getFirestore();
      
      // Application dhundo
      const appsSnap = await db
        .collection('vleApplications')
        .where('cashfreeOrderId', '==', orderId)
        .limit(1)
        .get();

      if (!appsSnap.empty) {
        const appDoc = appsSnap.docs[0];
        const appData = appDoc.data();

        // Application update
        await appDoc.ref.update({
          paymentStatus: 'paid',
          status: 'approved',
          cashfreePaymentId: data.payments?.[0]?.cf_payment_id || '',
          webhookReceivedAt: new Date().toISOString(),
          approvedDate: new Date().toLocaleString('en-IN'),
        });

        // User Account update
        if (appData.userId) {
          await db.collection('userAccounts').doc(appData.userId).update({
            eSuvidhaAccess: true,
            eSuvidhaPaidAt: new Date().toISOString(),
            subscriptionStatus: 'active',
          });
        }

        return res.status(200).json({ success: true, status: 'paid', updated: true });
      } else {
        return res.status(200).json({ success: true, status: 'paid', updated: false, message: 'Application not found' });
      }
    }

    return res.status(200).json({ success: true, status: data.order_status, updated: false });
  } catch (err) {
    console.error('Verify API error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
