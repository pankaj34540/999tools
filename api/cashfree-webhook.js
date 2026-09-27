// Vercel Serverless — Cashfree Webhook
// Handles: service orders, subscriptions, VLE registrations
import { getFirestore } from './_firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const eventType = req.body?.type;
    const data = req.body?.data;

    console.log('🔔 Cashfree Webhook:', eventType);

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = data?.order?.order_id;
      const paymentId = data?.payment?.cf_payment_id;
      const tags = data?.order?.order_tags || {};
      const orderType = tags.type || 'service_order';
      const db = getFirestore();

      if (!orderId) {
        console.warn('⚠️ No order_id in webhook');
        return res.status(200).json({ success: true });
      }

      // ═══════════════════════════════════════
      // CASE 1: SERVICE ORDER
      // ═══════════════════════════════════════
      if (orderType === 'service_order') {
        const orderRef = db.collection('serviceOrders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (orderDoc.exists) {
          const cur = orderDoc.data();
          if (cur?.paymentStatus === 'paid') {
            console.log('ℹ️ Service order already paid');
          } else {
            await orderRef.update({
              paymentStatus: 'paid',
              cashfreePaymentId: paymentId || '',
              webhookReceivedAt: new Date().toISOString(),
              ownerNotes: `Cashfree webhook verified. Payment ID: ${paymentId}`,
              updatedAt: new Date().toISOString(),
            });
            console.log('✅ Service order updated via webhook:', orderId);
          }
        } else {
          console.log('⚠️ Service order not found:', orderId);
        }
      }

      // ═══════════════════════════════════════
      // CASE 2: SUBSCRIPTION
      // ═══════════════════════════════════════
      else if (orderType === 'subscription') {
        const userId = tags.userId;
        const plan = tags.plan;
        const billingCycle = tags.billingCycle;

        const reqRef = db.collection('paymentRequests').doc(orderId);
        const reqDoc = await reqRef.get();

        if (reqDoc.exists) {
          const cur = reqDoc.data();
          if (cur?.status === 'approved') {
            console.log('ℹ️ Subscription already activated');
          } else {
            await reqRef.update({
              status: 'approved',
              verifiedAt: new Date().toISOString(),
              verifiedVia: 'cashfree_webhook',
              cashfreePaymentId: paymentId || '',
              webhookReceivedAt: new Date().toISOString(),
              validUntil: new Date(
                Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 86400000
              ).toISOString(),
            });

            if (userId && plan) {
              const userRef = db.collection('userAccounts').doc(userId);
              const userDoc = await userRef.get();

              if (userDoc.exists) {
                const now = new Date();
                const endDate = new Date(
                  now.getTime() + (billingCycle === 'monthly' ? 30 : 365) * 86400000
                );
                await userRef.update({
                  plan: plan,
                  subscriptionStart: now.toISOString(),
                  subscriptionEnd: endDate.toISOString(),
                  subscriptionStatus: 'active',
                });
                console.log(`✅ Subscription activated: ${plan} ${billingCycle} for ${userId}`);
              } else {
                console.warn('⚠️ User account not found:', userId);
              }
            }
          }
        } else {
          console.log('⚠️ Subscription paymentRequest not found:', orderId);
        }
      }

      // ═══════════════════════════════════════
      // CASE 3: VLE REGISTRATION
      // ═══════════════════════════════════════
      else if (orderType === 'vle_registration') {
        const applicationId = tags.applicationId;
        if (!applicationId) {
          console.warn('⚠️ No applicationId in VLE webhook');
        } else {
          const appRef = db.collection('vleApplications').doc(applicationId);
          const appDoc = await appRef.get();
          if (appDoc.exists) {
            const cur = appDoc.data();
            if (cur?.paymentStatus === 'paid') {
              console.log('ℹ️ VLE app already paid');
            } else {
              await appRef.update({
                paymentStatus: 'paid',
                cashfreePaymentId: paymentId || '',
                cashfreeOrderId: orderId,
                webhookReceivedAt: new Date().toISOString(),
              });
              console.log('✅ VLE registration paid:', applicationId);
            }
          } else {
            console.log('⚠️ VLE app not found:', applicationId);
          }
        }
      }

      else {
        console.log('ℹ️ Unknown order type:', orderType);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ success: true });
  }
}
