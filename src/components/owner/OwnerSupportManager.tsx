import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LifeBuoy,
  Search,
  X,
  Check,
  AlertCircle,
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  Loader2,
  User,
  Filter,
  TrendingUp,
  AlertTriangle,
  Zap,
  MessageCircle,
  Eye,
  Trash2,
  RefreshCw,
  Flag
} from 'lucide-react';
import { SupportTicket, SupportTicketStatus, SupportTicketPriority } from '../../types';

export const OwnerSupportManager: React.FC = () => {
  const { 
    currentUser,
    showNotification,
    ownerEmail,
  } = useApp();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | SupportTicketStatus>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | SupportTicketPriority>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);

  // Load all tickets
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadTickets = async () => {
      try {
        const { subscribeToAllTickets } = await import('../../services/supportService');
        unsubscribe = subscribeToAllTickets((fetchedTickets) => {
          setTickets(fetchedTickets);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error loading tickets:', error);
        setLoading(false);
      }
    };

    loadTickets();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const today = new Date(now.getTime() + istOffset).toISOString().split('T')[0];

    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length,
      today: tickets.filter(t => t.createdAt.startsWith(today)).length,
    };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.userMobile || '').includes(q);
      return matchStatus && matchPriority && matchSearch;
    });
  }, [tickets, filterStatus, filterPriority, searchQuery]);

  // Handle response
  const handleSendResponse = async () => {
    if (!selectedTicket || !responseText.trim()) return;

    setSendingResponse(true);
    try {
      const { addTicketResponse } = await import('../../services/supportService');
      const success = await addTicketResponse(selectedTicket.id, {
        responderId: 'owner',
        responderName: 'Owner Support',
        responderRole: 'owner',
        message: responseText.trim(),
      });

      if (success) {
        showNotification('✅ Response sent!');
        setResponseText('');
        
        // Update local selected ticket
        const updatedTicket: SupportTicket = {
          ...selectedTicket,
          responses: [
            ...selectedTicket.responses,
            {
              id: 'temp_' + Date.now(),
              ticketId: selectedTicket.id,
              responderId: 'owner',
              responderName: 'Owner Support',
              responderRole: 'owner',
              message: responseText.trim(),
              createdAt: new Date().toISOString(),
            },
          ],
          status: 'in_progress',
        };
        setSelectedTicket(updatedTicket);
      } else {
        showNotification('❌ Failed to send response');
      }
    } finally {
      setSendingResponse(false);
    }
  };

  // Change status
  const handleStatusChange = async (ticketId: string, status: SupportTicketStatus) => {
    try {
      const { updateTicketStatus } = await import('../../services/supportService');
      const success = await updateTicketStatus(ticketId, status);
      if (success) {
        showNotification(`✅ Status changed to ${status.replace('_', ' ')}`);
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status });
        }
      }
    } catch (error) {
      showNotification('❌ Failed to update status');
    }
  };

  // Delete ticket
  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Delete this ticket permanently?')) return;
    try {
      const { deleteTicket } = await import('../../services/supportService');
      const success = await deleteTicket(ticketId);
      if (success) {
        showNotification('✅ Ticket deleted');
        setSelectedTicket(null);
      }
    } catch (error) {
      showNotification('❌ Failed to delete');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-rose-100 text-rose-700 border-rose-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      default: return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading support tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-2">
              <LifeBuoy className="w-3 h-3" />
              Support Management
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              🎧 Support Tickets
            </h2>
            <p className="text-sm text-blue-200 mt-1">
              Manage user queries, respond to tickets, track issues
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Open Tickets
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700">{stats.open}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Need response
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              In Progress
            </span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{stats.inProgress}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Being worked on
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Resolved
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{stats.resolved}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Closed successfully
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Urgent
            </span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">{stats.urgent}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Priority attention
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ticket no, user, subject..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1.5 rounded-lg capitalize transition ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'in_progress' ? 'Progress' : s}
              </button>
            ))}
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white"
          >
            <option value="all">All Priority</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">
            {searchQuery ? 'No tickets found' : 'No Support Tickets'}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery 
              ? 'Try a different search keyword.' 
              : 'No tickets yet. Users can create tickets from Support Center.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-blue-400 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex flex-wrap items-start gap-4">
                
                {/* Priority indicator */}
                <div className={`w-1 h-16 rounded-full shrink-0 ${
                  ticket.priority === 'urgent' ? 'bg-rose-500' :
                  ticket.priority === 'high' ? 'bg-orange-500' :
                  ticket.priority === 'medium' ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`} />

                {/* Ticket Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                      {ticket.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {ticket.subject}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {ticket.message}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {ticket.userName}
                    </span>
                    <span>📧 {ticket.userEmail}</span>
                    {ticket.userMobile && <span>📱 {ticket.userMobile}</span>}
                    <span>📅 {new Date(ticket.createdAt).toLocaleDateString('en-IN')}</span>
                    {ticket.responses.length > 0 && (
                      <span className="text-blue-600 font-semibold">
                        💬 {ticket.responses.length} responses
                      </span>
                    )}
                  </div>
                </div>

                {/* View Button */}
                <div className="shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTicket(ticket);
                    }}
                    className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
                    title="View & Respond"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[95] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
            
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
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1">
                  {selectedTicket.subject}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {selectedTicket.userName}
                  </span>
                  <span>📧 {selectedTicket.userEmail}</span>
                  {selectedTicket.userMobile && <span>📱 {selectedTicket.userMobile}</span>}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Changer */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Change Status:
              </span>
              {(['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(selectedTicket.id, s)}
                  disabled={selectedTicket.status === s}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition border ${
                    selectedTicket.status === s
                      ? getStatusColor(s)
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              
              {/* Original Message */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                    {selectedTicket.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {selectedTicket.userName}
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-600 text-white uppercase">
                        {selectedTicket.userRole}
                      </span>
                    </div>
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
                          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200'
                          : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
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

              {/* Reply Box */}
              <div className="bg-white rounded-2xl border-2 border-blue-200 p-4">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Send Response
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  placeholder="Type your response..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex items-center justify-between mt-3 gap-2">
                  <button
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={handleSendResponse}
                    disabled={sendingResponse || !responseText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center gap-2 disabled:cursor-not-allowed"
                  >
                    {sendingResponse ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Response</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
