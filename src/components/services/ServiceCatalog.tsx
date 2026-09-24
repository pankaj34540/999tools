import React, { useState, useEffect } from 'react';
import {
  X, ArrowRight, FileText, Loader2, Sparkles,
  CreditCard, UserCheck, Vote, ShoppingBasket, Heart,
  Shield, Award, Package, AlertCircle,
} from 'lucide-react';
import {
  subscribeToServices,
  subscribeToSettings,
  seedDefaultServices,
} from '../../services/serviceCatalogService';
import { ServiceDefinition, ServiceSettings } from '../../types';

interface ServiceCatalogProps {
  onClose: () => void;
  onSelectService: (service: ServiceDefinition, settings: ServiceSettings) => void;
}

// Icon map — service ke icon name ke hisaab se render
const ICON_MAP: Record<string, React.ReactNode> = {
  CreditCard: <CreditCard className="w-5 h-5" />,
  UserCheck: <UserCheck className="w-5 h-5" />,
  Vote: <Vote className="w-5 h-5" />,
  ShoppingBasket: <ShoppingBasket className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  Award: <Award className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
};

const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ onClose, onSelectService }) => {
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [settings, setSettings] = useState<ServiceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Seed defaults first time
  useEffect(() => {
    seedDefaultServices();
  }, []);

  // Subscribe services
  useEffect(() => {
    const unsub = subscribeToServices((list) => {
      setServices(list.filter((s) => s.enabled));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Subscribe settings
  useEffect(() => {
    const unsub = subscribeToSettings((s) => setSettings(s));
    return () => unsub();
  }, []);

  const handleSelect = (service: ServiceDefinition) => {
    if (!settings) {
      return;
    }
    onSelectService(service, settings);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Order a Service
                  <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> NEW
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Government ID, certificates, and more</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">

            {/* Info banner */}
            <div className="bg-indigo-900/20 border border-indigo-800/50 rounded-lg p-3 text-xs text-indigo-200 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>How it works:</strong> Select a service → Fill form → Pay via UPI → We process your order.
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading services...</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && services.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-bold">No services available</p>
                <p className="text-xs text-slate-500 mt-1">Please check back later</p>
              </div>
            )}

            {/* Services list */}
            {!loading && services.length > 0 && (
              <div className="space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleSelect(service)}
                    className="w-full flex items-center gap-3 p-4 bg-slate-950 hover:bg-slate-900 border-2 border-slate-800 hover:border-indigo-500 rounded-xl transition text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-400 group-hover:bg-indigo-500/20 transition">
                      {ICON_MAP[service.icon] || <FileText className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{service.name}</h3>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          ₹{service.price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{service.description}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        ⏱ {service.processingDays} day{service.processingDays === 1 ? '' : 's'} processing
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
                  </button>
                ))}
              </div>
            )}

            {/* Footer note */}
            <div className="text-center pt-3 border-t border-slate-800">
              <p className="text-[10px] text-slate-500">
                All orders are processed by our team. Contact support for urgent requests.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCatalog;
