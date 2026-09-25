import React, { useState, useEffect } from 'react';
import {
  Plus, Edit3, Trash2, Save, X, ToggleLeft, ToggleRight,
  Link as LinkIcon, CreditCard, UserCheck, Vote, ShoppingBasket,
  Heart, Shield, Award, Package, FileText, RefreshCw, Loader2,
  AlertCircle, CheckCircle, ExternalLink,
} from 'lucide-react';
import {
  subscribeToServices,
  subscribeToSettings,
  upsertService,
  deleteService,
  toggleServiceEnabled,
  updateServiceSettings,
} from '../../services/serviceCatalogService';
import { ServiceDefinition, ServiceSettings } from '../../types';

// Available icons for services
const ICON_OPTIONS = [
  { id: 'CreditCard', label: 'Credit Card', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'UserCheck', label: 'User Check', icon: <UserCheck className="w-4 h-4" /> },
  { id: 'Vote', label: 'Vote', icon: <Vote className="w-4 h-4" /> },
  { id: 'ShoppingBasket', label: 'Ration', icon: <ShoppingBasket className="w-4 h-4" /> },
  { id: 'Heart', label: 'Health', icon: <Heart className="w-4 h-4" /> },
  { id: 'Shield', label: 'Shield', icon: <Shield className="w-4 h-4" /> },
  { id: 'Award', label: 'Award', icon: <Award className="w-4 h-4" /> },
  { id: 'Package', label: 'Package', icon: <Package className="w-4 h-4" /> },
  { id: 'FileText', label: 'Document', icon: <FileText className="w-4 h-4" /> },
];

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

const CATEGORIES = [
  { id: 'govt_id', label: '🆔 Government ID' },
  { id: 'certificate', label: '📜 Certificate' },
  { id: 'utility', label: '🔧 Utility' },
  { id: 'other', label: '📦 Other' },
];

const ServiceSettingsManager: React.FC = () => {
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [settings, setSettings] = useState<ServiceSettings | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDefinition | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ServiceDefinition>>({
    id: '',
    name: '',
    description: '',
    category: 'govt_id',
    price: 0,
    processingDays: 7,
    icon: 'CreditCard',
    enabled: true,
    googleFormUrl: '',
    serviceFieldId: '',
  });

  // Settings form
  const [settingsForm, setSettingsForm] = useState<Partial<ServiceSettings>>({});

  // Subscribe to services
  useEffect(() => {
    const unsub = subscribeToServices((list) => setServices(list));
    return () => unsub();
  }, []);

  // Subscribe to settings
  useEffect(() => {
    const unsub = subscribeToSettings((s) => {
      setSettings(s);
      setSettingsForm(s);
    });
    return () => unsub();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Open add form ──
  const handleAddNew = () => {
    setEditingService(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      category: 'govt_id',
      price: 0,
      processingDays: 7,
      icon: 'CreditCard',
      enabled: true,
      googleFormUrl: '',
      serviceFieldId: '',
    });
    setShowForm(true);
  };

  // ── Open edit form ──
  const handleEdit = (service: ServiceDefinition) => {
    setEditingService(service);
    setFormData(service);
    setShowForm(true);
  };

  // ── Save service ──
  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.description?.trim()) {
      showNotification('error', 'Please fill name and description');
      return;
    }

    const serviceId =
      editingService?.id ||
      formData.id?.trim() ||
      formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    if (!serviceId) {
      showNotification('error', 'Invalid service name');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await upsertService({
        id: serviceId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category || 'other',
        price: Number(formData.price) || 0,
        processingDays: Number(formData.processingDays) || 1,
        icon: formData.icon || 'FileText',
        enabled: formData.enabled ?? true,
        googleFormUrl: formData.googleFormUrl?.trim() || '',
        serviceFieldId: formData.serviceFieldId?.trim() || '',
        createdAt: editingService?.createdAt || now,
        updatedAt: now,
      });
      showNotification('success', editingService ? 'Service updated!' : 'Service added!');
      setShowForm(false);
    } catch (err) {
      console.error(err);
      showNotification('error', 'Failed to save service');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete service ──
  const handleDelete = async (service: ServiceDefinition) => {
    if (!confirm(`Delete "${service.name}"? This cannot be undone.`)) return;

    try {
      await deleteService(service.id);
      showNotification('success', 'Service deleted');
    } catch (err) {
      showNotification('error', 'Failed to delete service');
    }
  };

  // ── Toggle enabled ──
  const handleToggle = async (service: ServiceDefinition) => {
    try {
      await toggleServiceEnabled(service.id, !service.enabled);
      showNotification('success', service.enabled ? 'Service disabled' : 'Service enabled');
    } catch (err) {
      showNotification('error', 'Failed to toggle service');
    }
  };

  // ── Save settings ──
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateServiceSettings(settingsForm);
      showNotification('success', 'Settings saved!');
    } catch (err) {
      showNotification('error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            ⚙️ Service Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage services, Google Form URLs, and payment settings
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {notification.message}
        </div>
      )}

      {/* ── Global Settings ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-blue-500" />
          Global Settings (Fallback)
        </h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          💡 Ye fallback URL hai. Agar kisi service mein apna Google Form URL nahi hai, to ye use hoga.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Default Google Form URL
            </label>
            <input
              type="text"
              value={settingsForm.googleFormUrl || ''}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, googleFormUrl: e.target.value })
              }
              placeholder="https://docs.google.com/forms/d/e/.../viewform"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Default Form Field ID
            </label>
            <input
              type="text"
              value={settingsForm.serviceFieldId || ''}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, serviceFieldId: e.target.value })
              }
              placeholder="entry.1234567890"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Owner UPI ID
            </label>
            <input
              type="text"
              value={settingsForm.ownerUpiId || ''}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, ownerUpiId: e.target.value })
              }
              placeholder="9124231432@mairtel"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Owner WhatsApp Number
            </label>
            <input
              type="text"
              value={settingsForm.ownerWhatsapp || ''}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, ownerWhatsapp: e.target.value })
              }
              placeholder="919124231432"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white text-sm font-bold rounded-lg transition"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Settings</>
          )}
        </button>
      </div>

      {/* ── Services List ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-500" />
          Services ({services.length})
        </h3>

        {services.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-bold">No services yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add Service" to create your first one</p>
          </div>
        ) : (
          <div className="space-y-2">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  {ICON_MAP[service.icon] || <FileText className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900">{service.name}</p>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      ₹{service.price}
                    </span>
                    {!service.enabled && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        DISABLED
                      </span>
                    )}
                    {service.googleFormUrl ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> Own Form
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        Uses Global Form
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{service.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    ID: {service.id} • {service.processingDays} days
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(service)}
                    className={`p-2 rounded-lg transition ${
                      service.enabled
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-slate-400 hover:bg-slate-200'
                    }`}
                    title={service.enabled ? 'Disable' : 'Enable'}
                  >
                    {service.enabled ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add/Edit Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-slate-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. PAN Card Apply"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {/* 🆕 Google Form URL for THIS service */}
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-800">
                  <ExternalLink className="w-4 h-4" />
                  This Service's Google Form (Optional)
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Google Form URL
                  </label>
                  <input
                    type="text"
                    value={formData.googleFormUrl || ''}
                    onChange={(e) => setFormData({ ...formData, googleFormUrl: e.target.value })}
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Leave empty to use Global Settings URL
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Form Field ID (for pre-fill)
                  </label>
                  <input
                    type="text"
                    value={formData.serviceFieldId || ''}
                    onChange={(e) => setFormData({ ...formData, serviceFieldId: e.target.value })}
                    placeholder="entry.1234567890"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Leave empty to use Global Settings field ID
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category || 'govt_id'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Processing Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.processingDays || 7}
                    onChange={(e) =>
                      setFormData({ ...formData, processingDays: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.price || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Enabled
                  </label>
                  <button
                    onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition ${
                      formData.enabled
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {formData.enabled ? (
                      <><ToggleRight className="w-4 h-4" /> Enabled</>
                    ) : (
                      <><ToggleLeft className="w-4 h-4" /> Disabled</>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Icon
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFormData({ ...formData, icon: opt.id })}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition text-left ${
                        formData.icon === opt.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {opt.icon}
                      <span className="text-[11px] font-bold truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white text-sm font-bold rounded-lg transition"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> {editingService ? 'Update' : 'Add'} Service</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSettingsManager;
