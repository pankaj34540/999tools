import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Mail, MessageCircle, Shield, FileText, RotateCcw, Home } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* ── Brand ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">999tools</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              All-in-one online tools platform for Indian students, CSC VLE operators, and cyber cafe owners.
            </p>
          </div>

          {/* ── Quick Links ── */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition">
                  <Home className="w-3 h-3" /> Home
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition">
                  <Shield className="w-3 h-3" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition">
                  <FileText className="w-3 h-3" /> Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund" className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition">
                  <RotateCcw className="w-3 h-3" /> Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition">
                  <Mail className="w-3 h-3" /> Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Portals ── */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Portals</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-slate-400 hover:text-indigo-400 transition">
                  👤 User Panel
                </Link>
              </li>
              <li>
                <Link to="/" className="text-slate-400 hover:text-indigo-400 transition">
                  🏪 CSC VLE Portal
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-slate-400 hover:text-indigo-400 transition">
                  🔒 Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Contact ── */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3 uppercase tracking-wider">Get in Touch</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="mailto:support@tools999.store"
                  className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition"
                >
                  <Mail className="w-3 h-3" /> support@tools999.store
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/919124231432"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-slate-400 hover:text-green-400 transition"
                >
                  <MessageCircle className="w-3 h-3" /> +91 9124231432
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            © {currentYear} <span className="text-slate-300 font-semibold">999tools</span>. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 text-center sm:text-right">
            Made with ❤️ in India
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
