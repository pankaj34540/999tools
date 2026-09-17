import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Construction, Users } from 'lucide-react';

export const AdminPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-20 h-20 mx-auto bg-blue-500/20 border border-blue-400/40 rounded-3xl flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-blue-400" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-4">
          <Construction className="w-3 h-3" />
          Coming Soon
        </div>

        <h1 className="text-2xl font-black text-white mb-3">Admin Panel</h1>

        <p className="text-sm text-blue-200 mb-2">
          Staff members ke liye dedicated panel — role-based access ke saath.
        </p>

        <p className="text-xs text-blue-300/80 mb-8">
          Ye feature Phase 2 mein build hoga. Owner apne staff accounts create kar payega, permissions assign kar payega.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">Planned Admin Roles:</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-blue-200">
            <div>• 🎧 Support Admin — Customer queries</div>
            <div>• 🏪 VLE Admin — VLE approvals</div>
            <div>• 💳 Payment Admin — Payment verifications</div>
            <div>• 📱 Recharge Admin — Order processing</div>
            <div>• 📝 Content Admin — Tools & links update</div>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};
