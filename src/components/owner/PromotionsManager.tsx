import React, { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Edit3, Trash2, X, Save, Loader2,
  CheckCircle, AlertCircle, ExternalLink, Eye, EyeOff,
  Image as ImageIcon, Link as LinkIcon, Type, FileText,
  Sparkles,
} from 'lucide-react';
import {
  subscribeToPromotions,
  createPromotion,
  upsertPromotion,
  togglePromotionActive,
  deletePromotion,
} from '../../services/promotionService';
import { Promotion } from '../../types';

const CATEGORIES = [
  { id: 'telegram', label: '📢 Telegram Channel' },
  { id: 'youtube', label: '🎥 YouTube Video' },
  { id: 'affiliate', label: '🛒 Affiliate Product' },
  { id: 'service', label: '💼 Own Service' },
  { id: 'digital', label: '📦 Digital Product' },
  { id: 'other', label: '🔗 Other' },
];

const DISPLAY_MODES = [
  { id: 'side-by-side', label: 'Side by Side (Ad + Promotion)' },
  { id: 'replace', label: 'Replace (Only Promotion)' },
  { id: 'fallback', label: 'Fallback (Only if Ad fails)' },
];

const PromotionsManager: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState<Partial<Promotion>>({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    ctaText: 'Join Now',
    active: true,
    displayMode: 'side-by-side',
    category: 'telegram',
    priority: 5,
  });

  useEffect(() => {
    const unsub = subscribeToPromotions((list) => setPromotions(list));
    return () => unsub();
  }, []);

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddNew = () => {
    setEditingPromo(null);
    setForm({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      ctaText: 'Join Now',
      active: true,
      displayMode: 'side-by-side',
      category: 'telegram',
      priority: 5,
    });
    setShowForm(true);
  };

  const handleEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setForm(promo);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title?.trim() || !form.linkUrl?.trim()) {
      showNotif('error', 'Title and Link URL are required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingPromo) {
        await upsertPromotion({
          ...editingPromo,
          ...form,
        } as Promotion);
        showNotif('success', 'Promotion updated!');
      } else {
        await createPromotion({
          title: form.title!.trim(),
          description: form.description?.trim() || '',
          imageUrl: form.imageUrl?.trim() || '',
          linkUrl: form.linkUrl!.trim(),
          ctaText: form.ctaText?.trim() || 'Learn More',
          active: form.active ?? true,
          displayMode: form.displayMode as any || 'side-by-side',
          category: form.category || 'other',
          priority: Number(form.priority) || 5,
        });
        showNotif('success', 'Promotion created!');
      }
      setShowForm(false);
    } catch (err) {
      console.error(err);
      showNotif('error', 'Failed to save promotion');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (promo: Promotion) => {
    if (!confirm(`Delete promotion "${promo.title}"?`)) return;
    try {
      await deletePromotion(promo.id);
      showNotif('success', 'Promotion deleted');
    } catch (err) {
      showNotif('error', 'Failed to delete');
    }
  };

  const handleToggle = async (promo: Promotion) => {
    try {
      await togglePromotionActive(promo.id, !promo.active);
      showNotif('success', promo.active ? 'Promotion disabled' : 'Promotion enabled');
    } catch (err) {
      showNotif('error', 'Failed to toggle');
    }
  };

  const activeCount = promotions.filter((p) => p.active).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-pink-600" />
            Promotions Manager
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Custom promotions shown in download popup (Telegram, Affiliate links, etc.)
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> Add Promotion
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 flex gap-3">
        <Sparkles className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
        <div className="text-xs text-pink-900">
          <div className="font-bold mb-1">💡 How it works</div>
          <div className="text-pink-700 leading-relaxed">
            Ye promotions <strong>download popup</strong> mein Adsterra ads ke saath dikhengi.
            Ek se zyada active ho to rotate hongi. Free users ko dikhegi, premium users ko nahi.
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-semibold ${
          notification.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Promotions</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{promotions.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</div>
        </div>
      </div>

      {/* Promotions List */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-bold text-slate-900 mb-4">All Promotions ({promotions.length})</h3>

        {promotions.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No promotions yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add Promotion" to create your first one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {promotions.map((promo) => (
              <div key={promo.id} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {promo.imageUrl ? (
                    <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{promo.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      promo.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {promo.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      {promo.displayMode}
                    </span>
                    <span className="text-[10px] text-slate-500">Priority: {promo.priority}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{promo.description}</p>
                  <a href={promo.linkUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                    <ExternalLink className="w-2.5 h-2.5" /> {promo.linkUrl}
                  </a>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(promo)}
                    className={`p-2 rounded-lg transition ${promo.active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-200'}`}
                    title={promo.active ? 'Disable' : 'Enable'}
                  >
                    {promo.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(promo)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(promo)}
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

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-slate-900">
                {editingPromo ? 'Edit Promotion' : 'Add New Promotion'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Join Our Telegram Channel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-pink-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-pink-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="text"
                  value={form.imageUrl || ''}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-pink-500 outline-none"
                />
                {form.imageUrl && (
                  <div className="mt-2 bg-slate-100 rounded-lg p-2">
                    <img src={form.imageUrl} alt="preview" className="max-h-32 mx-auto rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Link URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.linkUrl || ''}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="https://t.me/yourchannel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-pink-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={form.ctaText || ''}
                  onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                  placeholder="Join Now, Buy Now, Learn More..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-pink-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={form.category || 'other'}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-pink-500 outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Priority (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.priority ?? 5}
                    onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-pink-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Display Mode</label>
                <select
                  value={form.displayMode || 'side-by-side'}
                  onChange={(e) => setForm({ ...form, displayMode: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-pink-500 outline-none"
                >
                  {DISPLAY_MODES.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active ?? true}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 accent-pink-600"
                  />
                  <span className="text-xs font-bold text-slate-700">Active (show in download popup)</span>
                </label>
              </div>

            </div>

            {/* Modal Footer */}
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
                className="flex items-center gap-2 px-5 py-2 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-400 text-white text-sm font-bold rounded-lg transition"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> {editingPromo ? 'Update' : 'Create'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsManager;
