import React, { useState } from 'react';
import { Plus, Trash2, X, Save, Briefcase, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import { ServiceDefinition, ServiceField, ServiceFieldType } from '../../types';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useApp } from '../../context/AppContext';

interface ServiceFieldsBuilderProps {
  existingService?: ServiceDefinition | null;
  onClose: () => void;
  onSuccess: () => void;
}

const FIELD_TYPES: { value: ServiceFieldType; label: string }[] = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Mobile/Phone' },
  { value: 'textarea', label: 'Text Area (long text)' },
  { value: 'select', label: 'Dropdown' },
  { value: 'file', label: 'File Upload' },
];

const ServiceFieldsBuilder: React.FC<ServiceFieldsBuilderProps> = ({ 
  existingService, 
  onClose, 
  onSuccess 
}) => {
  const { showNotification } = useApp();
  
  const [serviceName, setServiceName] = useState(existingService?.name || '');
  const [description, setDescription] = useState(existingService?.description || '');
  const [category, setCategory] = useState(existingService?.category || 'pan_aadhaar');
  const [price, setPrice] = useState(existingService?.price || 99);
  const [processingDays, setProcessingDays] = useState(existingService?.processingDays || 3);
  const [forVle, setForVle] = useState(existingService?.forVle || false);
  const [enabled, setEnabled] = useState(existingService?.enabled ?? true);
  const [fields, setFields] = useState<ServiceField[]>(existingService?.fields || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addField = () => {
    setFields([
      ...fields,
      {
        id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        helpText: '',
      },
    ]);
  };

  const updateField = (id: string, updates: Partial<ServiceField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSave = async () => {
    if (!serviceName.trim()) {
      setError('Service name is required');
      return;
    }
    if (price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    // Validate fields
    for (const f of fields) {
      if (!f.label.trim()) {
        setError('All fields must have a label');
        return;
      }
      if (f.type === 'select' && (!f.options || f.options.length === 0)) {
        setError(`Field "${f.label}" (Dropdown) needs at least one option`);
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      const now = new Date().toISOString();
      const serviceId = existingService?.id || `srv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const serviceData: ServiceDefinition = {
        id: serviceId,
        name: serviceName.trim(),
        description: description.trim(),
        category,
        price,
        processingDays,
        icon: 'Briefcase',
        enabled,
        forVle,
        fields,
        createdAt: existingService?.createdAt || now,
        updatedAt: now,
      };

      if (existingService) {
        await updateDoc(doc(db, 'services', serviceId), serviceData as any);
        showNotification('✅ Service updated');
      } else {
        await setDoc(doc(db, 'services', serviceId), serviceData);
        showNotification('✅ Service created');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {existingService ? 'Edit Service' : 'Create New Service'}
            </h2>
            <p className="text-xs text-slate-500">VLE Special ke liye service configure karo</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* Basic Info */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Basic Information</h3>
            
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Service Name *</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. PAN Card Apply"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Short description for VLE"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="pan_aadhaar">PAN & Aadhaar</option>
                  <option value="photo_tools">Photo Tools</option>
                  <option value="govt_schemes">Govt Schemes</option>
                  <option value="certificates">Certificates</option>
                  <option value="exam_admit">Exam & Admit Card</option>
                  <option value="banking_utility">Banking & Utility</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Processing Days</label>
                <input
                  type="number"
                  value={processingDays}
                  onChange={(e) => setProcessingDays(parseInt(e.target.value) || 3)}
                  min={1}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Price (₹) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  min={1}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Status</label>
                  <button
                    type="button"
                    onClick={() => setEnabled(!enabled)}
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                      enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {enabled ? <><ToggleRight className="w-4 h-4" /> Enabled</> : <><ToggleLeft className="w-4 h-4" /> Disabled</>}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-purple-900">Enable for VLE Special</div>
                <div className="text-[10px] text-purple-700">VLE portal mein ye service dikhegi</div>
              </div>
              <button
                type="button"
                onClick={() => setForVle(!forVle)}
                className={`relative w-12 h-6 rounded-full transition ${
                  forVle ? 'bg-purple-600' : 'bg-slate-300'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  forVle ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>

          {/* Dynamic Fields Builder */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Form Fields ({fields.length})
              </h3>
              <button
                onClick={addField}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> Add Field
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
                <p className="text-xs text-slate-500">Koi field add nahi ki. "Add Field" click karo.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="bg-white rounded-lg border border-blue-200 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-700 uppercase">Field {idx + 1}</span>
                      <button
                        onClick={() => removeField(field.id)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Label *</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder="e.g. Full Name"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Type</label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value as ServiceFieldType })}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                        >
                          {FIELD_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Placeholder</label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          placeholder="Optional placeholder"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            className="rounded accent-blue-600"
                          />
                          <span className="text-xs font-bold text-slate-700">Required</span>
                        </label>
                      </div>
                    </div>

                    {field.type === 'select' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Options (comma separated)</label>
                        <input
                          type="text"
                          value={(field.options || []).join(', ')}
                          onChange={(e) => updateField(field.id, { 
                            options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                          })}
                          placeholder="Option 1, Option 2, Option 3"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                    )}

                    {field.type === 'file' && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Accepted Types</label>
                        <select
                          value={field.accept || 'image/*,application/pdf'}
                          onChange={(e) => updateField(field.id, { accept: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                        >
                          <option value="image/*">Image only</option>
                          <option value="application/pdf">PDF only</option>
                          <option value="image/*,application/pdf">Image + PDF</option>
                          <option value="*/*">Any file</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Help Text</label>
                      <input
                        type="text"
                        value={field.helpText || ''}
                        onChange={(e) => updateField(field.id, { helpText: e.target.value })}
                        placeholder="e.g. Blue/black pen se sign karo"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700">
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-xl shadow-md hover:from-purple-500 hover:to-pink-500 disabled:from-slate-400 disabled:to-slate-400 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {existingService ? 'Update Service' : 'Create Service'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceFieldsBuilder;
