import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ImportantLink } from '../../types';
import { 
  Globe, 
  Plus, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Check, 
  X, 
  ArrowRight,
  Eye,
  Shield
} from 'lucide-react';

export const ImportantLinksManager: React.FC = () => {
  const { 
    importantLinks, 
    addImportantLink, 
    updateImportantLink, 
    deleteImportantLink, 
    resetImportantLinks,
    showNotification 
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLink, setEditingLink] = useState<ImportantLink | null>(null);

  const [formState, setFormState] = useState<Omit<ImportantLink, 'id'>>({
    title: '',
    desc: '',
    url: 'https://',
    badge: 'Central Portal',
    category: 'central_govt',
    active: true,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.url) {
      showNotification('Title and URL are required.');
      return;
    }
    addImportantLink(formState);
    setShowAddModal(false);
    setFormState({
      title: '',
      desc: '',
      url: 'https://',
      badge: 'Central Portal',
      category: 'central_govt',
      active: true,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;
    updateImportantLink(editingLink);
    setEditingLink(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span>Important Links & Official Government Sites Editor</span>
          </h3>
          <p className="text-xs text-slate-500">
            Edit, add, or toggle the official government portals and job portals displayed at the bottom of the User Portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetImportantLinks}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Restore default UIDAI, NSDL, Parivahan links"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restore Defaults</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Portal / Link</span>
          </button>
        </div>
      </div>

      {/* Grid of Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {importantLinks.map((link) => (
          <div
            key={link.id}
            className={`bg-white rounded-2xl border p-5 transition flex flex-col justify-between shadow-sm relative group ${
              link.active !== false ? 'border-slate-200 hover:border-blue-400' : 'border-dashed border-slate-300 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                  {link.badge || 'Portal'}
                </span>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={() => updateImportantLink({ ...link, active: link.active === false ? true : false })}
                    className={`p-1 rounded-lg text-xs font-bold ${
                      link.active !== false ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                    }`}
                    title={link.active !== false ? 'Active (Click to Hide)' : 'Hidden (Click to Show)'}
                  >
                    {link.active !== false ? <Eye className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 line-through" />}
                  </button>
                  <button
                    onClick={() => setEditingLink(link)}
                    className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                    title="Edit Link"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${link.title}" portal link?`)) {
                        deleteImportantLink(link.id);
                      }
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete Link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span>{link.title}</span>
                {link.active === false && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-normal">
                    Hidden
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                {link.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                {link.url}
              </span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-bold hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Visit</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ADD LINK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <span>Add Important Government / Utility Site</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Portal / Website Title *</label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="e.g. DigiLocker or UP Police Constable Results"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Services Offered</label>
                <input
                  type="text"
                  value={formState.desc}
                  onChange={(e) => setFormState({ ...formState, desc: e.target.value })}
                  placeholder="e.g. Download digital certificates, driving license & Aadhaar documents"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Website URL (HTTPS) *</label>
                <input
                  type="url"
                  required
                  value={formState.url}
                  onChange={(e) => setFormState({ ...formState, url: e.target.value })}
                  placeholder="https://www.digilocker.gov.in/"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={formState.badge}
                    onChange={(e) => setFormState({ ...formState, badge: e.target.value })}
                    placeholder="e.g. MeitY, Central, Job Update"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="central_govt">Central Government</option>
                    <option value="state_services">State Government</option>
                    <option value="exam_jobs">Exams & Jobs</option>
                    <option value="utility_forms">Utility & Forms</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition"
                >
                  Save & Publish Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LINK MODAL */}
      {editingLink && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Edit Government / Job Portal</h3>
              <button
                onClick={() => setEditingLink(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Portal / Website Title *</label>
                <input
                  type="text"
                  required
                  value={editingLink.title}
                  onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Services Offered</label>
                <input
                  type="text"
                  value={editingLink.desc}
                  onChange={(e) => setEditingLink({ ...editingLink, desc: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Website URL (HTTPS) *</label>
                <input
                  type="url"
                  required
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={editingLink.badge}
                    onChange={(e) => setEditingLink({ ...editingLink, badge: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingLink.category || 'central_govt'}
                    onChange={(e) => setEditingLink({ ...editingLink, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="central_govt">Central Government</option>
                    <option value="state_services">State Government</option>
                    <option value="exam_jobs">Exams & Jobs</option>
                    <option value="utility_forms">Utility & Forms</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition"
                >
                  Update Portal Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
