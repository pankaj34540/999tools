import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, MapPin, Send } from 'lucide-react';

const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Open mailto with pre-filled data
    const subject = encodeURIComponent(`Contact from ${form.name}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`);
    window.location.href = `mailto:support@tools999.store?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

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
          <Mail className="text-indigo-400" size={32} />
          <h1 className="text-3xl font-bold text-white">Contact Us</h1>
        </div>

        <p className="text-slate-400 mb-8">
          Have a question, issue, or feedback? We'd love to hear from you.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <Mail className="text-indigo-400 mb-2" size={24} />
            <h3 className="font-semibold text-white mb-1">Email</h3>
            <a href="mailto:support@tools999.store" className="text-indigo-400 text-sm">
              support@tools999.store
            </a>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <MessageCircle className="text-green-400 mb-2" size={24} />
            <h3 className="font-semibold text-white mb-1">WhatsApp</h3>
            <a href="https://wa.me/919124231432" target="_blank" rel="noopener noreferrer" className="text-green-400 text-sm">
              +91 9124231432
            </a>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <MapPin className="text-orange-400 mb-2" size={24} />
            <h3 className="font-semibold text-white mb-1">Location</h3>
            <p className="text-slate-400 text-sm">India</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <Send className="text-purple-400 mb-2" size={24} />
            <h3 className="font-semibold text-white mb-1">Response Time</h3>
            <p className="text-slate-400 text-sm">Within 24 hours</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Send us a Message</h2>

          {submitted ? (
            <div className="bg-green-900/30 border border-green-700 text-green-300 rounded-lg p-4">
              ✅ Thank you! Your email client should open now. We'll respond within 24 hours.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Message</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 outline-none resize-none"
                  placeholder="Describe your issue or feedback..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Send size={18} /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
