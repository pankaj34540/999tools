import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Wallet, LogOut, LayoutDashboard, ShoppingBag, 
  Zap, FileText, Search, ChevronRight, Plus, Loader2, ArrowDownLeft, ArrowUpRight,
  Landmark, Building2, ScrollText, Smartphone
} from 'lucide-react';
import PassbookGenerator from '../vle/services/PassbookGenerator';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Services', icon: ShoppingBag },
  { id: 'banking', label: 'Banking', icon: Landmark },
  { id: 'government', label: 'Government', icon: Building2 },
  { id: 'certificates', label: 'Certificates', icon: ScrollText },
  { id: 'utility', label: 'Utility', icon: Smartphone },
];

const ESuvidhaPortal: React.FC = () => {
  const { currentUser, vleLogout, showNotification } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'wallet'>('dashboard');
  const [showPassbook, setShowPassbook] = useState(false);
  const [selectedBank, setSelectedBank] = useState<'Airtel' | 'Paytm' | 'Fino'>('Airtel');
  
  // 🆕 Category Filter
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [addAmount, setAddAmount] = useState(50);
  const [adding, setAdding] = useState(false);

  // Fetch Wallet Data
  useEffect(() => {
    const fetchWallet = async () => {
      if (!currentUser) return;
      try {
        const userRef = doc(db, 'userAccounts', currentUser.id);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setWalletBalance(data.walletBalance || 0);
        }

        const txRef = collection(db, 'walletTransactions');
        const q = query(txRef, where('userId', '==', currentUser.id), orderBy('createdAt', 'desc'));
        const txSnap = await getDocs(q);
        
        const txList: Transaction[] = [];
        txSnap.forEach((d) => {
          txList.push({ ...d.data() as Transaction, id: d.id });
        });
        setTransactions(txList);
      } catch (err) {
        console.error('Error fetching wallet:', err);
      } finally {
        setLoadingWallet(false);
      }
    };

    fetchWallet();
  }, [currentUser]);

  const handleLogout = async () => {
    await vleLogout();
    window.location.href = '/';
  };

  const handleAddMoney = async () => {
    if (!currentUser) return;
    if (addAmount < 50) {
      showNotification('Minimum add amount is ₹50');
      return;
    }

    setAdding(true);
    try {
      const orderId = `WALLET_${Date.now()}`;
      const res = await fetch('/api/cashfree-create-wallet-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: addAmount,
          userId: currentUser.id,
          userEmail: currentUser.email,
          userMobile: currentUser.mobile || '',
          userName: currentUser.name || '',
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      const { load } = await import('@cashfreepayments/cashfree-js');
      const cashfree = await load({
        mode: data.environment === 'production' ? 'production' : 'sandbox',
      });

      const result = await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: '_self',
      });

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }
    } catch (err: any) {
      console.error('Add money error:', err);
      showNotification(err.message || 'Failed to add money');
    } finally {
      setAdding(false);
    }
  };

  // 🆕 Mock Services for Filtering
  const allServices = [
    { id: 'airtel', name: 'Airtel Payments Bank Passbook', desc: 'Front page print for Airtel Payments Bank customers.', price: 5, category: 'banking', bank: 'Airtel', icon: FileText, color: 'red' },
    { id: 'paytm', name: 'Paytm Payments Bank Passbook', desc: 'Front page print for Paytm Payments Bank customers.', price: 5, category: 'banking', bank: 'Paytm', icon: FileText, color: 'blue' },
    { id: 'fino', name: 'Fino Payments Bank', desc: 'Coming soon...', price: 5, category: 'banking', bank: 'Fino', icon: FileText, color: 'slate', comingSoon: true },
  ];

  const filteredServices = allServices.filter(s => {
    const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-auto md:h-screen z-20 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl">E</div>
          <div>
            <h1 className="font-black text-slate-900 leading-tight">E SUVIDHA</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">VLE Portal</p>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-20"><Wallet className="w-16 h-16" /></div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1 mb-1">
              <Wallet className="w-3 h-3" /> Wallet Balance
            </div>
            <div className="text-2xl font-black font-mono">₹{walletBalance.toLocaleString()}</div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('services')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'services' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <ShoppingBag className="w-5 h-5" /> All Services
          </button>
          <button onClick={() => setActiveTab('wallet')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'wallet' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Wallet className="w-5 h-5" /> Wallet & History
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{currentUser.vleData?.centerName || 'VLE Center'}</div>
              <div className="text-[10px] text-slate-500 font-mono">{currentUser.vleData?.vleId || 'N/A'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg text-xs transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-black text-slate-900">
            Welcome, {currentUser.vleData?.centerName || 'E Suvidha Kendra'}
          </h2>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             Online
          </div>
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Quick Actions
                </h3>
                <p className="text-sm text-slate-500">E SUVIDHA Dashboard mein aapka swagat hai.</p>
              </div>
            </div>
          )}

          {/* ALL SERVICES (With Categories) */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-black text-slate-900">All Services</h2>
                <div className="relative w-full sm:w-64">
                   <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search services..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                   />
                </div>
              </div>

              {/* 🆕 Category Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                        selectedCategory === cat.id 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-400">
                    No services found in this category.
                  </div>
                ) : (
                  filteredServices.map((service) => {
                    const Icon = service.icon;
                    const colorClass = service.color === 'red' ? 'red' : service.color === 'blue' ? 'blue' : 'slate';
                    return (
                      <div key={service.id} className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-${colorClass}-400 transition group ${service.comingSoon ? 'opacity-60' : ''}`}>
                         <div className="flex items-start justify-between mb-4">
                           <div className={`w-12 h-12 rounded-xl bg-${colorClass}-100 flex items-center justify-center`}>
                              <Icon className={`w-6 h-6 text-${colorClass}-600`} />
                           </div>
                           <span className={`px-2 py-1 bg-${colorClass}-50 text-${colorClass}-700 text-[10px] font-bold rounded-full uppercase`}>
                             {service.category}
                           </span>
                         </div>
                         <h3 className="font-bold text-slate-900 text-base">{service.name}</h3>
                         <p className="text-xs text-slate-500 mt-1 mb-4">{service.desc}</p>
                         <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                           <span className="font-black text-slate-900">₹{service.price}</span>
                           {!service.comingSoon && (
                             <button 
                               onClick={() => { setSelectedBank(service.bank as any); setShowPassbook(true); }}
                               className={`flex items-center gap-1 text-xs font-bold text-${colorClass}-600 group-hover:translate-x-1 transition`}
                             >
                               Open <ChevronRight className="w-3 h-3" />
                             </button>
                           )}
                         </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* WALLET TAB */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" /> Add Money to Wallet
                </h3>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-slate-500 font-bold">Amount (Min ₹50)</label>
                    <input
                      type="number"
                      min={50}
                      value={addAmount}
                      onChange={(e) => setAddAmount(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-lg font-black focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddMoney}
                    disabled={adding || addAmount < 50}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {adding ? 'Processing...' : 'Add Money'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900">Transaction History</h3>
                </div>
                
                {loadingWallet ? (
                  <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold">No transactions yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{tx.description}</div>
                            <div className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                        <div className={`font-black font-mono ${tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {showPassbook && (
        <PassbookGenerator 
          bankName={selectedBank}
          onClose={() => setShowPassbook(false)} 
        />
      )}
    </div>
  );
};

export default ESuvidhaPortal;
