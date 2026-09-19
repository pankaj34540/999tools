import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsPage: React.FC = () => {
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
          <FileText className="text-indigo-400" size={32} />
          <h1 className="text-3xl font-bold text-white">Terms & Conditions</h1>
        </div>

        <p className="text-sm text-slate-400 mb-6">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>

        <div className="space-y-6 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using <strong>999tools</strong> (https://tools999.store), you agree 
              to be bound by these Terms & Conditions. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. Description of Service</h2>
            <p>
              999tools provides online tools for image processing, document conversion, and 
              utility services for Indian students, CSC VLE operators, and cyber cafe owners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide accurate information during registration.</li>
              <li>You are responsible for maintaining the security of your account.</li>
              <li>You must be at least 13 years old to use our services.</li>
              <li>One person may not maintain multiple free accounts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Upload illegal, harmful, or copyrighted content without permission.</li>
              <li>Attempt to hack, reverse-engineer, or disrupt our services.</li>
              <li>Use automated bots to abuse free limits.</li>
              <li>Resell our services without authorization.</li>
              <li>Use our tools for fraudulent documents or illegal activities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Subscriptions & Payments</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Free Plan:</strong> Limited features with premium tool usage limits.</li>
              <li><strong>Premium Plan:</strong> ₹49/month or ₹399/year — unlimited premium tools, no ads.</li>
              <li><strong>VLE Plan:</strong> ₹199/month or ₹1499/year — all features + CRM + Khatabook + Billing.</li>
              <li>Payments are accepted via UPI. Manual verification may take up to 24 hours.</li>
              <li>Subscriptions auto-expire; no auto-renewal without your consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. Intellectual Property</h2>
            <p>
              All content, code, design, and trademarks on 999tools are owned by us. 
              You may not copy, modify, or distribute without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. Limitation of Liability</h2>
            <p>
              999tools is provided "as is" without warranties. We are not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Any data loss or file corruption during processing.</li>
              <li>Service interruptions or downtime.</li>
              <li>Any indirect or consequential damages.</li>
              <li>Misuse of tools by users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, 
              without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">9. Governing Law</h2>
            <p>
              These terms are governed by the laws of India. Any disputes shall be subject to 
              the jurisdiction of courts in India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">10. Contact</h2>
            <p>
              📧 Email: <a href="mailto:support@tools999.store" className="text-indigo-400">support@tools999.store</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
