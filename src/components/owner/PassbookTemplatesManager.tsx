import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useApp } from '../../context/AppContext';
import { Plus, Edit3, Upload } from 'lucide-react';

interface Template {
  id?: string;
  bankName: string;
  color: string;
  logoUrl: string;
  ifscCode: string;
  templateImage: string; // 🆕 Naya field Image ke liye
  enabled: boolean;
}

const PassbookTemplatesManager: React.FC = () => {
  const { showNotification } = useApp();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState<Template>({
    bankName: '',
    color: '#e31c26',
    logoUrl: '',
    ifscCode: '',
    templateImage: '',
    enabled: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'passbookTemplates'), (snap) => {
      const list: Template[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Template));
      setTemplates(list);
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setForm({ bankName: '', color: '#e31c26', logoUrl: '', ifscCode: '', templateImage: '', enabled: true });
    setEditingId(null);
  };

  // 🆕 File Upload Handler (Base64 mein convert karega)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, templateImage: reader.result as string });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.templateImage) {
      showNotification('❌ Please upload a blank template image first!');
      return;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, 'passbookTemplates', editingId), form);
        showNotification('✅ Template Updated');
      } else {
        await addDoc(collection(db, 'passbookTemplates'), form);
        showNotification('✅ Template Added');
      }
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      showNotification('❌ Error: ' + err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">🎨 Passbook Templates</h2>
          <p className="text-xs text-slate-500">Blank images upload karo jiske upar details print hongi</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4" /> Add Bank Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-12 text-center text-slate-400">
          <p className="font-bold">Koi template nahi hai</p>
          <p className="text-xs mt-1">"Add Bank Template" click karke image upload karo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border">
                    {t.templateImage ? (
                      <img src={t.templateImage} alt={t.bankName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Img</div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setForm(t);
                      setEditingId(t.id!);
                      setShowModal(true);
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <h3 className="font-bold mt-3 text-slate-900">{t.bankName}</h3>
                <p className="text-xs text-slate-500 mt-1">IFSC: {t.ifscCode || 'NA'}</p>
              </div>
              <button
                onClick={async () => {
                  await updateDoc(doc(db, 'passbookTemplates', t.id!), { enabled: !t.enabled });
                }}
                className={`mt-4 py-1.5 rounded-lg text-xs font-bold ${
                  t.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {t.enabled ? '✓ Active' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md my-8">
            <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit' : 'Add'} Template</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              
              <div>
                <label className="text-xs font-bold text-slate-700">Bank Name</label>
                <input required placeholder="e.g. Airtel" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">IFSC Code</label>
                <input required placeholder="e.g. AIRP0000001" value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
              </div>

              {/* 🆕 Image Upload Field */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Blank Template Image (Mandatory)</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-slate-50 cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg" 
                    onChange={handleImageUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-semibold">
                    {uploading ? 'Uploading...' : (form.templateImage ? 'Image Selected ✓' : 'Click to upload image')}
                  </p>
                </div>
                {form.templateImage && (
                  <img src={form.templateImage} alt="Preview" className="mt-2 h-20 object-contain border rounded mx-auto" />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassbookTemplatesManager;
