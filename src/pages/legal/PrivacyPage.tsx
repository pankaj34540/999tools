import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPage: React.FC = () => {
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
          <Shield className="text-indigo-400" size={32} />
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        </div>

        <p className="text-sm text-slate-400 mb-6">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>

        <div className="space-y-6 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">1. Introduction</h2>
            <p>
              Welcome to <strong>999tools</strong> ("we", "our", "us"), accessible at{' '}
              <a href="https://tools999.store" className="text-indigo-400">https://tools999.store</a>. 
              We are committed to protecting your privacy. This Privacy Policy explains how we collect, 
              use, and safeguard your information when you use our website and tools.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Information:</strong> Name, email, phone number (when you register).</li>
              <li><strong>Usage Data:</strong> Tools used, timestamps, browser type, IP address.</li>
              <li><strong>Files You Upload:</strong> Images/documents processed through our tools are processed in your browser (client-side) and are NOT stored on our servers.</li>
              <li><strong>Payment Information:</strong> UPI transaction IDs (for manual verification). We do NOT store card/bank details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and maintain our services</li>
              <li>To process payments and manage subscriptions</li>
              <li>To improve our tools and user experience</li>
              <li>To send important notifications (service updates, payment confirmations)</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">4. File Processing & Storage</h2>
            <p>
              <strong>Important:</strong> Most of our tools process files directly in your browser 
              (client-side). Your images and documents are NOT uploaded to our servers. 
              We do not store, view, or share your files.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">5. Cookies & Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Google Firebase:</strong> Authentication and database services</li>
              <li><strong>Adsterra:</strong> Advertisement delivery</li>
              <li><strong>Vercel:</strong> Website hosting</li>
            </ul>
            <p className="mt-2">
              These services may collect data as per their own privacy policies. We recommend 
              reviewing their policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">6. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. However, 
              no method of transmission over the internet is 100% secure. We cannot guarantee 
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">7. Children's Privacy</h2>
            <p>
              Our services are not directed to children under 13. We do not knowingly collect 
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Request correction or deletion of your data</li>
              <li>Withdraw consent at any time</li>
              <li>Contact us for any privacy-related concerns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on 
              this page with an updated "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">10. Contact Us</h2>
            <p>
              For any questions regarding this Privacy Policy, contact us at:
              <br />
              📧 Email: <a href="mailto:support@tools999.store" className="text-indigo-400">support@tools999.store</a>
              <br />
              🌐 Website: <a href="https://tools999.store" className="text-indigo-400">https://tools999.store</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
