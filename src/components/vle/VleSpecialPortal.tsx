import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search, ShoppingCart, Wallet, Upload, X, CheckCircle2,
  Loader2, FileText, AlertCircle, ArrowLeft, Clock, User,
  Phone, Check, Gift, Briefcase, Zap,
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { uploadVleDocument } from '../../config/supabase';
import { createVleOrder, subscribeToVleOrders } from '../../services/vleOrderService';
import { ServiceDefinition, ServiceField, VleOrder } from '../../types';

interface VleSpecialPortalProps {
  onClose?: () => void;
}

const VleSpecialPortal: React.FC<VleSpecialPortalProps> = () => {
  const { activeVle, showNotification, vles, updateVleWallet } = useApp();
  
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [orders, setOrders] = useState<VleOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Customer form data
  const [customerData, setCustomerData] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});
  
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load VLE special services
  useEffect(() => {
    const q = query(collection(db, 'services'), where('forVle', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      const list: ServiceDefinition[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.enabled !== false) {
          list.push({ ...(data as ServiceDefinition), id: d.id });
        }
      });
      setServices(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Subscribe to VLE orders
  useEffect(() => {
    if (!activeVle) return;
    const unsub = subscribeToVleOrders(activeVle.id, setOrders);
    return () => unsub();
  }, [activeVle]);

  const vleWallet = vles.find(v => v.id === activeVle?.id)?.walletBalance || 0;

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenService = (service: ServiceDefinition) => {
    setSelectedService(service);
    setCustomerData({});
    setUploadedFiles({});
    setUploadedUrls({});
    setUploadProgress({});
    setError('');
    setShowOrderModal(true);
  };

  const handleFileUpload = async (fieldId: string, file: File) => {
    if (!activeVle) return;
    setUploadProgress(p => ({ ...p, [fieldId]: true }));
    
    const result = await uploadVleDocument(file, activeVle.vleId, fieldId);
    
    if (result.success && result.url) {
      setUploadedFiles(p => ({ ...p, [fieldId]: file }));
      setUploadedUrls(p => ({ ...p, [fieldId]: result.url! }));
      showNotification('✅ File uploaded');
    } else {
      showNotification(`❌ Upload failed: ${result.error || 'Unknown error'}`);
      setError(`File upload failed: ${result.error}`);
    }
    
    setUploadProgress(p => ({ ...p, [fieldId]: false }));
  };

  const handleSubmitOrder = async () => {
    if (!selectedService || !activeVle) return;

    setError('');

    // Validate required fields
    for (const field of selectedService.fields || []) {
      if (field.required) {
        if (field.type === 'file') {
          if (!uploadedUrls[field.id]) {
            setError(`${field.label} is required`);
            return;
          }
        } else {
          if (!customerData[field.id] || !customerData[field.id].trim()) {
            setError(`${field.label} is required`);
            return;
          }
        }
      }
    }

    // Wallet check
    if (vleWallet < selectedService.price) {
      setError(`Insufficient wallet balance. Need ₹${selectedService.price}, you have ₹${vleWallet}`);
      return;
    }

    setSubmitting(true);

    try {
      // Find customer name/mobile for order
      const customerNameField = selectedService.fields?.find(f => 
        f.label.toLowerCase().includes('name') && !f.label.toLowerCase().includes('father')
      );
      const customerMobileField = selectedService.fields?.find(f =>
        f.label.toLowerCase().includes('mobile') || f.label.toLowerCase().includes('phone')
      );

      const customerName = customerNameField ? customerData[customerNameField.id] : 'N/A';
      const customerMobile = customerMobileField ? customerData[customerMobileField.id] : 'N/A';

      const orderId = await createVleOrder({
        vleId: activeVle.id,
        vleEmail: activeVle.email,
        vleCenterName: activeVle.centerName,
        vleMobile: activeVle.mobile,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceCategory: selectedService.category,
        customerName: customerName || 'N/A',
        customerMobile: customerMobile || 'N/A',
        customerData: { ...customerData },
        documentUrls: { ...uploadedUrls },
        paidFromWallet: selectedService.price,
        walletBalanceAfter: vleWallet - selectedService.price,
        status: 'pending',
        ownerNotes: '',
      });

      if (!orderId) {
        setError('Failed to create order');
        setSubmitting(false);
        return;
      }

      // Deduct from wallet
      updateVleWallet(
        activeVle.id,
        selectedService.price,
        'debit',
        `VLE Order: ${selectedService.name}`
      );

      showNotification(`✅ Order placed! ₹${selectedService.price} deducted from wallet.`);
      setShowOrderModal(false);
      setSelectedService(null);
    } catch (err: any) {
      console.error('Order error:', err);
      setError(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeVle) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">VLE Login Required</h2>
        <p className="text-sm text-slate-500">Please login as VLE to access VLE Special portal</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full w-fit mb-2">
              <Zap className="w-3.5 h-3.5" /> VLE Special Portal
            </div>
            <h1 className="text-2xl font-black">Services for Customers</h1>
            <p className="text-sm text-pink-100 mt-1">
              {activeVle.centerName} • {activeVle.vleId}
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-pink-100 mb-1">
              <Wallet className="w-3.5 h-3.5" /> Wallet Balance
            </div>
            <div className="text-3xl font-black">₹{vleWallet.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-2">Loading services...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-800 mb-1">No services available</h3>
          <p className="text-xs text-slate-500">Owner ne abhi koi VLE service enable nahi ki hai</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => {
            const canAfford = vleWallet >= service.price;
            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl border-2 border-slate-200 p-5 hover:border-purple-400 transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full uppercase">
                    {service.category?.replace('_', ' ') || 'Service'}
                  </span>
                </div>
                
                <h3 className="font-bold text-slate-900 text-sm mb-1">{service.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                  {service.description || 'Professional service'}
                </p>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-500">Price</div>
                    <div className="text-lg font-black text-slate-900">₹{service.price}</div>
                  </div>
                  <button
                    onClick={() => handleOpenService(service)}
                    disabled={!canAfford}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                      canAfford
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Order Now' : 'Low Balance'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" /> Recent Orders
          </h3>
          <div className="space-y-2">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-xs">
                <div>
                  <div className="font-bold text-slate-800">{order.serviceName}</div>
                  <div className="text-slate-500">{order.customerName} • {order.createdAt?.split('T')[0]}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">₹{order.servicePrice}</div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && selectedService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900">{selectedService.name}</h3>
                <p className="text-xs text-slate-500">Service Order Form</p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {(selectedService.fields || []).map((field) => (
                <div key={field.id}>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number' ? (
                    <input
                      type={field.type}
                      value={customerData[field.id] || ''}
                      onChange={(e) => setCustomerData({ ...customerData, [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  ) : field.type === 'date' ? (
                    <input
                      type="date"
                      value={customerData[field.id] || ''}
                      onChange={(e) => setCustomerData({ ...customerData, [field.id]: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={customerData[field.id] || ''}
                      onChange={(e) => setCustomerData({ ...customerData, [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={customerData[field.id] || ''}
                      onChange={(e) => setCustomerData({ ...customerData, [field.id]: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Select --</option>
                      {(field.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'file' ? (
                    <div>
                      <input
                        ref={(el) => { fileInputRefs.current[field.id] = el; }}
                        type="file"
                        accept={field.accept || '*/*'}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(field.id, file);
                        }}
                        className="hidden"
                      />
                      {uploadedFiles[field.id] ? (
                        <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs text-emerald-700 font-semibold flex-1 truncate">
                            {uploadedFiles[field.id].name}
                          </span>
                          <button
                            onClick={() => {
                              setUploadedFiles(p => { const n = { ...p }; delete n[field.id]; return n; });
                              setUploadedUrls(p => { const n = { ...p }; delete n[field.id]; return n; });
                            }}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : uploadProgress[field.id] ? (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          <span className="text-xs text-blue-700">Uploading...</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => fileInputRefs.current[field.id]?.click()}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-700"
                        >
                          <Upload className="w-4 h-4" /> Upload File
                        </button>
                      )}
                      {field.helpText && (
                        <p className="text-[10px] text-slate-500 mt-1">{field.helpText}</p>
                      )}
                    </div>
                  ) : null}

                  {field.helpText && field.type !== 'file' && (
                    <p className="text-[10px] text-slate-500 mt-1">{field.helpText}</p>
                  )}
                </div>
              ))}

              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Service Price:</span>
                  <span className="font-bold text-slate-900">₹{selectedService.price}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-slate-600">Current Balance:</span>
                  <span className="font-bold text-emerald-700">₹{vleWallet}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1 pt-1 border-t border-purple-200">
                  <span className="text-slate-700 font-bold">After Order:</span>
                  <span className="font-black text-purple-700">₹{vleWallet - selectedService.price}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={submitting || vleWallet < selectedService.price}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-md hover:from-purple-500 hover:to-pink-500 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</>
                ) : (
                  <><ShoppingCart className="w-4 h-4" /> Confirm Order - ₹{selectedService.price}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VleSpecialPortal;
