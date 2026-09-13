import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LifeBuoy,
  Plus,
  Search,
  X,
  Check,
  AlertCircle,
  MessageSquare,
  Phone,
  Mail,
  Send,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Loader2,
  HelpCircle,
  FileText,
  User,
  Info,
  ShoppingBag,
  CreditCard,
  Wrench,
  Package,
  ExternalLink,
  Filter
} from 'lucide-react';
import { SupportTicket, FAQItem, SupportTicketCategory } from '../../types';

interface SupportCenterProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

export const SupportCenter: React.FC<SupportCenterProps> = ({ 
  isOpen = true, 
  onClose, 
  embedded = false 
}) => {
  const { 
    currentUser, 
    siteConfig, 
    showNotification,
    setRole,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'faq' | 'tickets' | 'new' | 'contact'>('faq');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // New ticket form
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState<SupportTicketCategory>('technical');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [formMessage, setFormMessage] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);

  // Load FAQs
  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const { subscribeToFAQs } = await import('../../services/supportService');
        const unsub = subscribeToFAQs((fetchedFaqs) => {
          setFaqs(fetchedFaqs);
          setLoading(false);
        });
        return unsub;
      } catch (error) {
        setLoading(false);
        return undefined;
      }
    };

    const unsubPromise = loadFaqs();
    return () => { unsubPromise.then(u => u && u()); };
  }, []);

  // Load user tickets
  useEffect(() => {
    if (!currentUser?.id) return;

    const loadTickets = async () => {
      try {
        const { subscribeToUserTickets } = await import('../../services/supportService');
        const unsub = subscribeToUserTickets(currentUser.id, (fetchedTickets) => {
          setTickets(fetchedTickets);
        });
        return unsub;
      } catch (error) {
        return undefined;
      }
    };

    const unsubPromise = loadTickets();
    return () => { unsubPromise.then(u => u && u()); };
  }, [currentUser?.id]);

  const filteredFaqs = faqs.filter(f => 
    !faqSearch ||
    f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      showNotification('Please signup or login to create a ticket');
      return;
    }

    if (!formSubject.trim() || !formMessage.trim()) {
      showNotification('Please fill subject and message');
      return;
    }

    setFormSaving(true);

    try {
      const { createSupportTicket, generateTicketNumber } = await import('../../services/supportService');
      
      const ticketNumber = generateTicketNumber(tickets.length);
      const newTicket = await createSupportTicket({
        ticketNumber,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        userMobile: currentUser.mobile,
        userRole: currentUser.plan === 'vle' ? 'vle' : 'user',
        subject: formSubject.trim(),
        category: formCategory,
        priority: formPriority,
        message: formMessage.trim(),
      });

      if (newTicket) {
        setSubmittedTicket(newTicket);
        setFormSubject('');
        setFormMessage('');
        setFormCategory('technical');
        setFormPriority('medium');
        showNotification(`✅ Ticket ${newTicket.ticketNumber} created!`);
      } else {
        showNotification('❌ Failed to create ticket. Try again.');
      }
    } catch (error: any) {
      console.error('Ticket error:', error);
      showNotification('❌ Error: ' + (error.message || 'Try again'));
    } finally {
      setFormSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'in_progress': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'closed': return 'bg-slate-100 text-slate-600 border-slate-300';
      default: return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'technical': return Wrench;
      case 'billing': return CreditCard;
      case 'account': return User;
      case 'tool_request': return Package;
      case 'vle_issue': return ShoppingBag;
      case 'payment': return CreditCard;
      default: return HelpCircle;
    }
  };

  const content = (
    <div className={embedded ? "space-y-6" : "space-y-6"}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-2">
              <LifeBuoy className="w-3 h-3" />
              Support Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              🎧 Help & Support
            </h1>
            <p className="text-sm text-blue-200 mt-1">
              Get help, report issues, or browse FAQs
            </p>
          </div>

          {!embedded && onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2">
          {[
            { id: 'faq', label: 'FAQ', icon: HelpCircle },
            { id: 'new', label: 'New Ticket', icon: Plus },
            { id: 'tickets', label: `My Tickets (${tickets.length})`, icon: FileText },
            { id: 'contact', label: 'Contact Us', icon: Phone },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-white text-blue-950 shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB: FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search FAQs..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading FAQs...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">No FAQs found</h4>
              <p className="text-xs text-slate-500 mt-1">Try a different search keyword</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-blue-300 transition"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                            {faq.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {faq.question}
                        </h4>
                      </div>
                    </div>
                    {expandedFaq === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {expandedFaq === faq.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: NEW TICKET */}
      {activeTab === 'new' && (
        <div className="space-y-4">
          {submittedTicket ? (
            <div className="bg-white rounded-3xl border border-emerald-200 shadow-lg p-8 text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">
                  Ticket Created! 🎉
                </h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  We've received your ticket. Our team will respond within 2-24 hours.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 max-w-sm mx-auto text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ticket No:</span>
                  <span className="font-mono font-bold text-blue-700">{submittedTicket.ticketNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subject:</span>
                  <span className="font-bold text-slate-900 text-right">{submittedTicket.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold text-slate-900 capitalize">{submittedTicket.category.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Priority:</span>
                  <span className="font-bold text-slate-900 capitalize">{submittedTicket.priority}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
                <button
                  onClick={() => {
                    setSubmittedTicket(null);
                    setActiveTab('tickets');
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                >
                  View My Tickets
                </button>
                <button
                  onClick={() => {
                    setSubmittedTicket(null);
                    setFormSubject('');
                    setFormMessage('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Create Another
                </button>
              </div>
            </div>
          ) : !currentUser ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Login Required</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Please signup or login to create a support ticket. It takes less than 30 seconds.
              </p>
            </div>
          ) : (
            <form onSubmit={handleCreateTicket} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-1">Create Support Ticket</h3>
                <p className="text-xs text-slate-500">Describe your issue and we'll help you out</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g. Bill not printing correctly"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as SupportTicketCategory)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="technical">🔧 Technical Issue</option>
                    <option value="billing">💳 Billing / Subscription</option>
                    <option value="account">👤 Account</option>
                    <option value="tool_request">📦 Tool Request</option>
                    <option value="vle_issue">🏪 VLE / Cyber Cafe Issue</option>
                    <option value="payment">💰 Payment Problem</option>
                    <option value="other">📝 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Priority *
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Message *
                </label>
                <textarea
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  rows={6}
                  placeholder="Describe your issue in detail. Include steps to reproduce if it's a bug..."
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  <strong>Response Time:</strong> Our team typically responds within 2-24 hours. Urgent tickets get priority. You'll receive a notification when we reply.
                </p>
              </div>

              <button
                type="submit"
                disabled={formSaving}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {formSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Ticket</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB: MY TICKETS */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {!currentUser ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Login Required</h3>
              <p className="text-xs text-slate-500">Please login to view your tickets</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">No Tickets Yet</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                You haven't created any support tickets yet.
              </p>
              <button
                onClick={() => setActiveTab('new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Your First Ticket</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {ticket.ticketNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                          {ticket.category.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">
                        {ticket.subject}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {ticket.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <span>📅 {new Date(ticket.createdAt).toLocaleString('en-IN')}</span>
                      {ticket.responses.length > 0 && (
                        <span className="text-blue-600 font-semibold">
                          💬 {ticket.responses.length} responses
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: CONTACT */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/${siteConfig.supportWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I need support with 999tools')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-400 transition group"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">WhatsApp Support</h3>
            <p className="text-xs text-slate-500 mb-3">
              Fastest way to reach us. Chat with our team.
            </p>
            <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
              {siteConfig.supportWhatsApp}
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Phone */}
          <a
            href={`tel:${siteConfig.supportPhone.replace(/\D/g, '')}`}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-400 transition group"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Phone className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Phone Support</h3>
            <p className="text-xs text-slate-500 mb-3">
              Call us during business hours (9 AM - 9 PM)
            </p>
            <div className="text-sm font-bold text-blue-600 flex items-center gap-1.5">
              {siteConfig.supportPhone}
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Email */}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-amber-400 transition group"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Mail className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Email Support</h3>
            <p className="text-xs text-slate-500 mb-3">
              For detailed issues and attachments
            </p>
            <div className="text-sm font-bold text-amber-600 flex items-center gap-1.5">
              {siteConfig.supportEmail}
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Create Ticket */}
          <button
            onClick={() => setActiveTab('new')}
            className="bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl shadow-md hover:shadow-lg transition group text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Plus className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Create Ticket</h3>
            <p className="text-xs text-blue-100 mb-3">
              Best for technical issues and tracking
            </p>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              Open Support Ticket
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[95] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {selectedTicket.ticketNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1">
                  {selectedTicket.subject}
                </h3>
                <div className="text-[11px] text-slate-500">
                  📅 {new Date(selectedTicket.createdAt).toLocaleString('en-IN')}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              
              {/* Original Message */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                    {selectedTicket.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{selectedTicket.userName}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(selectedTicket.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.message}
                </p>
              </div>

              {/* Responses */}
              {selectedTicket.responses.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Conversation ({selectedTicket.responses.length})
                  </div>
                  {selectedTicket.responses.map((response) => (
                    <div
                      key={response.id}
                      className={`rounded-2xl p-4 ${
                        response.responderRole === 'owner'
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                          response.responderRole === 'owner'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}>
                          {response.responderName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            {response.responderName}
                            {response.responderRole === 'owner' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white uppercase">
                                Owner
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(response.createdAt).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {response.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {selectedTicket.responses.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                  <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-xs text-amber-900 font-semibold">
                    Waiting for response...
                  </p>
                  <p className="text-[10px] text-amber-700 mt-1">
                    Our team will reply within 2-24 hours
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // If embedded, return content directly
  if (embedded) return content;

  // If modal mode
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[85] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-slate-100 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 my-8">
        <div className="p-4 sm:p-6">
          {content}
        </div>
      </div>
    </div>
  );
};
