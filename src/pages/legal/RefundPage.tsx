import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';

const RefundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="flex items-center gap-3 mb-6">
          <RotateCcw className="text-indigo-400" size={32} />
          <h1 className="text-3xl font-bold text-white">Refund & Cancellation Policy</h1>
        </div>

        <p className="text-sm text-slate-400 mb-6">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>

        <div className="space-y-6 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Overview</h2>
            <p>
              At 999tools, we strive to provide high-quality digital services. This policy outlines 
              the conditions under which refunds are provided for our paid subscriptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. Refund Eligibility</h2>
            <p>Refunds are provided only in the following cases:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Duplicate Payment:</strong> If you accidentally paid twice for the same subscription.</li>
              <li><strong>Service Not Delivered:</strong> If your subscription was not activated within 48 hours of payment (despite correct UPI transaction ID).</li>
              <li><strong>Technical Failure:</strong> If a critical service failure prevents you from using the features you paid for, and we cannot resolve it within 7 days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. Non-Refundable Cases</h2>
            <p>Refunds will NOT be provided for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Change of mind after purchase.</li>
              <li>Failure to use the service during the subscription period.</li>
              <li>Account termination due to violation of Terms & Conditions.</li>
              <li>Partial month/year usage.</li>
              <li>Issues caused by user's device, browser, or internet connection.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. Refund Request Process</h2>
            <p>To request a refund:</p>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Email us at <a href="mailto:support@tools999.store" className="text-indigo-400">support@tools999.store</a> within <strong>7 days</strong> of payment.</li>
              <li>Include your registered email, UPI transaction ID, payment date, and reason.</li>
              <li>We will review and respond within 3-5 business days.</li>
              <li>Approved refunds will be processed within 7-10 business days to the original payment method.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Cancellation Policy</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Subscriptions are prepaid and do not auto-renew.</li>
              <li>You may choose not to renew at the end of your subscription period.</li>
              <li>No cancellation charges apply.</li>
              <li>Access continues until the end of the paid period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. Chargebacks</h2>
            <p>
              Please contact us before initiating a chargeback. Fraudulent chargebacks may result 
              in permanent account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. Contact</h2>
            <p>
              📧 Email: <a href="mailto:support@tools999.store" className="text-indigo-400">support@tools999.store</a>
              <br />
              📱 WhatsApp: +91 9124231432
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundPage;
