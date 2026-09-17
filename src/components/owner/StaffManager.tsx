import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users, UserPlus, Mail, Phone, Shield, X, Check, Loader2,
  Trash2, Edit2, Power, Key, AlertCircle, Clock,
  Search, Filter, MessageSquare,
} from 'lucide-react';
import {
  Staff,
  StaffRole,
  STAFF_ROLE_LABELS,
  STAFF_ROLE_PERMISSIONS,
  AuditLog,
} from '../../types';
import {
  createStaffAccount,
  updateStaff,
  deleteStaff,
  toggleStaffActive,
  subscribeToAllStaff,
  subscribeToAuditLogs,
  sendStaffPasswordReset,
} from '../../services/staffService';

// ============================================
// ROLE COLORS
// ============================================
const ROLE_COLORS: Record<StaffRole, { bg: string; text: string; border: string }> = {
  support: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  vle: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  payment: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  recharge: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  content: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
};

const ALL_ROLES: StaffRole[] = ['support', 'vle', 'payment', 'recharge', 'content'];

// ============================================
// MAIN COMPONENT
// ============================================
export const StaffManager: React.FC = () => {
  const { ownerEmail, showNotification } = useApp();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  // Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [busy, setBusy] = useState(false);

  // Form
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<StaffRole>('support');
  const [formNotes, setFormNotes] = useState('');

  // ============================================
  // SUBSCRIBE
  // ============================================
  useEffect(() => {
    const unsubStaff = subscribeToAllStaff((list) => {
      setStaff(list);
      setLoading(false);
    });
    const unsubLogs = subscribeToAuditLogs((logs) => {
      setAuditLogs(logs);
    });
    return () => { unsubStaff(); unsubLogs(); };
  }, []);

  // ============================================
  // FILTER
  // ============================================
  const filteredStaff = staff.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q)
    );
  });

  // ============================================
  // OPEN MODALS
  // ============================================
  const openAddModal = () => {
    setEditingStaff(null);
    setFormName('');
    setFormEmail('');
    setFormMobile('');
    setFormPassword('');
    setFormRole('support');
    setFormNotes('');
    setShowFormModal(true);
  };

  const openEditModal = (s: Staff) => {
    setEditingStaff(s);
    setFormName(s.name);
    setFormEmail(s.email);
    setFormMobile(s.mobile || '');
    setFormRole(s.role);
    setFormNotes(s.notes || '');
    setFormPassword('');
    setShowFormModal(true);
  };

  // ============================================
  // SAVE — Create or Update
  // ============================================
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showNotification('⚠️ Name and Email are required');
      return;
    }

    setBusy(true);
    try {
      if (editingStaff) {
        // UPDATE
        const success = await updateStaff(editingStaff.id, {
          name: formName.trim(),
          mobile: formMobile.trim() || undefined,
          role: formRole,
          notes: formNotes.trim() || undefined,
        });
        if (success) {
          showNotification('✅ Staff updated');
          setShowFormModal(false);
        } else {
          showNotification('❌ Update failed');
        }
      } else {
        // CREATE
        if (!formPassword || formPassword.length < 6) {
          showNotification('⚠️ Password must be at least 6 characters');
          setBusy(false);
          return;
        }

        const result = await createStaffAccount(
          formEmail.trim(),
          formPassword,
          formName.trim(),
          formRole,
          formMobile.trim() || undefined,
          ownerEmail || 'owner@999tools.store',
          formNotes.trim() || undefined
        );

        if (result.success) {
          showNotification(`✅ Staff created: ${formName}`);
          setShowFormModal(false);
        } else {
          showNotification(`❌ ${result.error}`);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  // ============================================
  // DELETE
  // ============================================
  const handleDelete = async () => {
    if (!deletingStaff) return;
    setBusy(true);
    try {
      const success = await deleteStaff(deletingStaff.id);
      if (success) {
        showNotification(`🗑️ ${deletingStaff.name} removed`);
        setDeletingStaff(null);
      } else {
        showNotification('❌ Failed to delete');
      }
    } finally {
      setBusy(false);
    }
  };

  // ============================================
  // TOGGLE ACTIVE
  // ============================================
  const handleToggleActive = async (s: Staff) => {
    const success = await toggleStaffActive(s.id, !s.active);
    if (success) {
      showNotification(s.active ? `⏸️ ${s.name} deactivated` : `▶️ ${s.name} activated`);
    }
  };

  // ============================================
  // SEND PASSWORD RESET
  // ============================================
  const handlePasswordReset = async (s: Staff) => {
    const success = await sendStaffPasswordReset(s.email);
    if (success) {
      showNotification(`📧 Password reset email sent to ${s.email}`);
    } else {
      showNotification('❌ Failed to send reset email');
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Staff Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Add staff members with role-based access. Ye staff tumhare kaam karenge bina tere bhi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              showLogs ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{showLogs ? 'Show Staff' : 'Audit Logs'}</span>
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* ═══ SEARCH ═══ */}
      {!showLogs && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* ═══ STATS ═══ */}
      {!showLogs && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl text-white shadow-md">
            <Users className="w-5 h-5 opacity-80 mb-1" />
            <div className="text-2xl font-black">{staff.length}</div>
            <div className="text-[10px] opacity-90">Total Staff</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl text-white shadow-md">
            <Power className="w-5 h-5 opacity-80 mb-1" />
            <div className="text-2xl font-black">{staff.filter((s) => s.active).length}</div>
            <div className="text-[10px] opacity-90">Active</div>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-4 rounded-2xl text-white shadow-md">
            <AlertCircle className="w-5 h-5 opacity-80 mb-1" />
            <div className="text-2xl font-black">{staff.filter((s) => !s.active).length}</div>
            <div className="text-[10px] opacity-90">Inactive</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl text-white shadow-md">
            <Shield className="w-5 h-5 opacity-80 mb-1" />
            <div className="text-2xl font-black">{new Set(staff.map((s) => s.role)).size}</div>
            <div className="text-[10px] opacity-90">Roles Used</div>
          </div>
        </div>
      )}

      {/* ═══ LOADING ═══ */}
      {loading && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-bold">Loading staff...</p>
        </div>
      )}

      {/* ═══ STAFF LIST ═══ */}
      {!loading && !showLogs && (
        <>
          {filteredStaff.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-base font-black text-slate-800 mb-1">
                {staff.length === 0 ? 'No staff yet' : 'No matching staff'}
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                {staff.length === 0
                  ? 'Add your first staff member to delegate work.'
                  : 'Try different search.'}
              </p>
              {staff.length === 0 && (
                <button
                  onClick={openAddModal}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add First Staff
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStaff.map((s) => {
                const roleColors = ROLE_COLORS[s.role];
                return (
                  <div
                    key={s.id}
                    className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition p-5 ${
                      s.active ? 'border-slate-200' : 'border-rose-200 bg-rose-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${roleColors.bg} ${roleColors.text} shrink-0`}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-slate-900 truncate">{s.name}</h3>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {s.email}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${roleColors.bg} ${roleColors.text} border ${roleColors.border} shrink-0`}>
                        {STAFF_ROLE_LABELS[s.role]}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 mb-3 text-xs">
                      {s.mobile && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono">{s.mobile}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Shield className="w-3 h-3 text-slate-400" />
                        <span>{s.permissions.length} permissions</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px]">
                          {s.lastLoginAt
                            ? `Last login: ${new Date(s.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                            : 'Never logged in'}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {s.active ? '● Active' : '● Inactive'}
                      </span>
                      {s.notes && (
                        <span className="text-[10px] text-slate-500 italic truncate">
                          {s.notes}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => openEditModal(s)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleToggleActive(s)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                          s.active
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{s.active ? 'Pause' : 'Activate'}</span>
                      </button>
                      <button
                        onClick={() => handlePasswordReset(s)}
                        className="py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition"
                        title="Send password reset email"
                      >
                        <Key className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeletingStaff(s)}
                        className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition"
                        title="Delete staff"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ AUDIT LOGS ═══ */}
      {!loading && showLogs && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Staff Activity Logs
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Last {auditLogs.length} actions by staff members
              </p>
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-base font-black text-slate-800 mb-1">No activity yet</h3>
              <p className="text-xs text-slate-500">
                Staff actions will appear here once they start using the panel.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {auditLogs.map((log) => {
                const roleColors = ROLE_COLORS[log.staffRole];
                return (
                  <div key={log.id} className="p-4 hover:bg-slate-50 transition">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${roleColors.bg} ${roleColors.text} flex items-center justify-center text-xs font-black shrink-0`}>
                        {log.staffName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">{log.staffName}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${roleColors.bg} ${roleColors.text}`}>
                            {log.staffRole}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 mt-1">
                          <span className="font-bold text-slate-900">{log.action}</span>
                          {log.targetName && (
                            <>
                              {' → '}
                              <span className="text-slate-600">{log.targetName}</span>
                            </>
                          )}
                        </div>
                        {log.details && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            {log.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ ADD/EDIT MODAL ═══ */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full my-8 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {editingStaff ? <Edit2 className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-blue-600" />}
                <h3 className="text-base font-black text-slate-900">
                  {editingStaff ? 'Edit Staff' : 'Add New Staff'}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Mobile (optional)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  disabled={!!editingStaff}
                  placeholder="staff@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                {editingStaff && (
                  <p className="text-[10px] text-slate-500 mt-1">Email cannot be changed</p>
                )}
              </div>

              {!editingStaff && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    💡 Ye password staff ko bhejna hoga. Staff login ke baad change kar sakta hai.
                  </p>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-2">
                  Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormRole(r)}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        formRole === r
                          ? `${ROLE_COLORS[r].bg} ${ROLE_COLORS[r].text} ${ROLE_COLORS[r].border}`
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-black">{STAFF_ROLE_LABELS[r]}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        {STAFF_ROLE_PERMISSIONS[r].length} permissions
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-700 mb-1">Permissions auto-assigned:</p>
                  <div className="flex flex-wrap gap-1">
                    {STAFF_ROLE_PERMISSIONS[formRole].map((p) => (
                      <span key={p} className="text-[9px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Any internal notes about this staff member..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </form>

            <div className="p-5 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave as any}
                disabled={busy}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingStaff ? 'Save Changes' : 'Create Staff'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE MODAL ═══ */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">Delete Staff?</h3>
            <p className="text-xs text-slate-500 mb-5">
              <strong>{deletingStaff.name}</strong> ({deletingStaff.email}) permanently hat jayega.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-left">
              <p className="text-[11px] text-amber-900 leading-relaxed">
                ⚠️ <strong>Important:</strong> Staff ka Firebase Auth account delete nahi hoga automatically. 
                Manually delete karne ke liye Firebase Console → Authentication → Users mein jaake email dhundo aur delete karo.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDeletingStaff(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
