import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ToolDefinition } from '../../types';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Code2, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Layers, 
  Sparkles,
  Info,
  Trash2,
  Sliders
} from 'lucide-react';

export const ToolsManager: React.FC = () => {
  const { allTools, customTools, addCustomTool, deleteCustomTool, showNotification, setActiveTool } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCodeGuide, setShowCodeGuide] = useState(false);

  // New Tool Form State
  const [newToolForm, setNewToolForm] = useState({
    num: allTools.length + 1,
    name: '',
    category: 'photo' as ToolDefinition['category'],
    desc: '',
    badge: 'New Tool',
    iconName: 'Wrench',
    popular: false,
    componentKey: 'CustomWebUtility',
    externalUrl: '',
    freeForVle: true,
  });

  const filteredTools = allTools.filter((t) => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.num.toString().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolForm.name) {
      showNotification('Tool name is required.');
      return;
    }

    addCustomTool({
      num: Number(newToolForm.num),
      name: newToolForm.name,
      category: newToolForm.category,
      desc: newToolForm.desc || 'Custom tool added by owner.',
      badge: newToolForm.badge || undefined,
      iconName: newToolForm.iconName,
      popular: newToolForm.popular,
      componentKey: newToolForm.componentKey,
      externalUrl: newToolForm.externalUrl || undefined,
      freeForVle: newToolForm.freeForVle,
      active: true,
    });

    setShowAddModal(false);
    setNewToolForm({
      num: allTools.length + 2,
      name: '',
      category: 'photo',
      desc: '',
      badge: 'New Tool',
      iconName: 'Wrench',
      popular: false,
      componentKey: 'CustomWebUtility',
      externalUrl: '',
      freeForVle: true,
    });
  };

  const copyCodeSnippet = () => {
    const snippet = `// 1. Create component file: src/components/tools/MyCustomTool.tsx
import React, { useState } from 'react';

export const MyCustomTool: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200">
      <h3 className="text-xl font-bold">My Cyber Cafe Tool</h3>
      <p className="text-sm text-slate-500">Add your tool inputs and processing logic here.</p>
    </div>
  );
};

// 2. Add entry to TOOLS_REGISTRY in src/data/toolsRegistry.ts:
{
  id: 'my_custom_tool',
  num: 51,
  name: 'My Custom Tool',
  category: 'photo',
  desc: 'Fast custom generator for Cyber Cafe operations.',
  badge: 'NEW',
  iconName: 'Sparkles',
  componentKey: 'MyCustomTool',
  freeForVle: true,
  active: true,
}`;
    navigator.clipboard.writeText(snippet);
    showNotification('Code template copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <span>Tools Registry & Cyber Cafe Suite Manager</span>
          </h3>
          <p className="text-xs text-slate-500">
            View all 50+ built-in utilities, add custom online tools, or review the developer guide to create custom React components.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCodeGuide(!showCodeGuide)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Code2 className="w-4 h-4 text-purple-600" />
            <span>{showCodeGuide ? 'Hide Code Guide' : 'How to Add Tools (Guide)'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tool to Registry</span>
          </button>
        </div>
      </div>

      {/* DEVELOPER GUIDE DROPDOWN ACCORDION */}
      {showCodeGuide && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl shadow-xl border border-slate-800 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-sm text-white">
                Developer Guide: How to Add More Tools to 999tools
              </h4>
            </div>
            <button
              onClick={copyCodeSnippet}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span>Copy Code Snippet</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm mb-2">
                1
              </div>
              <h5 className="font-bold text-white mb-1">Create Tool Component</h5>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Create a new file in <code className="text-amber-300">src/components/tools/YourTool.tsx</code>. Implement your canvas, crop, file upload, or calculation logic using standard React and Tailwind.
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm mb-2">
                2
              </div>
              <h5 className="font-bold text-white mb-1">Register in Registry</h5>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Open <code className="text-amber-300">src/data/toolsRegistry.ts</code> and add an object to <code className="text-emerald-300">TOOLS_REGISTRY</code> with unique <code className="text-emerald-300">id</code>, <code className="text-emerald-300">num</code>, name, and <code className="text-emerald-300">componentKey</code>.
              </p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm mb-2">
                3
              </div>
              <h5 className="font-bold text-white mb-1">Connect in Modal Switcher</h5>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                In <code className="text-amber-300">src/components/tools/ToolsExplorer.tsx</code>, import your component and render it inside the <code className="text-purple-300">renderActiveToolModal()</code> switch statement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All Tools' },
            { id: 'photo', label: 'Photo & Sign' },
            { id: 'pdf', label: 'PDF Suite' },
            { id: 'card', label: 'ID Cards & PVC' },
            { id: 'office', label: 'Office & Text' },
            { id: 'online', label: 'Govt & Utility' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tools by title or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className={`bg-white rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition group hover:shadow-md ${
              tool.isCustom ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-blue-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center font-mono">
                  #{tool.num}
                </span>
                <div className="flex items-center gap-1">
                  {tool.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {tool.badge}
                    </span>
                  )}
                  {tool.isCustom && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-800">
                      Custom
                    </span>
                  )}
                  {tool.isCustom && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove custom tool #${tool.num} "${tool.name}"?`)) {
                          deleteCustomTool(tool.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete Custom Tool"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">{tool.name}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {tool.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 capitalize">
                Category: {tool.category}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (tool.externalUrl) {
                    window.open(tool.externalUrl, '_blank');
                  } else {
                    setActiveTool(tool.id);
                  }
                }}
                className="font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Launch</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD TOOL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                <span>Add Tool to 999tools Registry</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Tool #</label>
                  <input
                    type="number"
                    required
                    value={newToolForm.num}
                    onChange={(e) => setNewToolForm({ ...newToolForm, num: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newToolForm.category}
                    onChange={(e) => setNewToolForm({ ...newToolForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="photo">Photo & Signature Tools</option>
                    <option value="pdf">PDF Editing Suite</option>
                    <option value="card">ID Cards & PVC Maker</option>
                    <option value="office">Office & Text Formatter</option>
                    <option value="online">Online Govt & Utility</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tool Name *</label>
                <input
                  type="text"
                  required
                  value={newToolForm.name}
                  onChange={(e) => setNewToolForm({ ...newToolForm, name: e.target.value })}
                  placeholder="e.g. UPSC CSE Photo & Sign Resizer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newToolForm.desc}
                  onChange={(e) => setNewToolForm({ ...newToolForm, desc: e.target.value })}
                  placeholder="e.g. Resizes photos to 350x350 px and under 40 KB for UPSC applications."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={newToolForm.badge}
                    onChange={(e) => setNewToolForm({ ...newToolForm, badge: e.target.value })}
                    placeholder="e.g. Free, AI, New"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Component Key</label>
                  <input
                    type="text"
                    value={newToolForm.componentKey}
                    onChange={(e) => setNewToolForm({ ...newToolForm, componentKey: e.target.value })}
                    placeholder="e.g. PassportPhotoTool"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  External Utility URL (Optional - if linking to an external portal)
                </label>
                <input
                  type="url"
                  value={newToolForm.externalUrl}
                  onChange={(e) => setNewToolForm({ ...newToolForm, externalUrl: e.target.value })}
                  placeholder="https://example.com/tool"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-700"
                />
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
                  Register Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
