'use client';

import { useState, useEffect } from 'react';
import { Ticket, approveTicket, rejectTicket, retryTriage, getTriageStatus } from '@/lib/api';

interface TicketDetailProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: (ticket: Ticket) => void;
}

export default function TicketDetail({ ticket, onClose, onUpdate }: TicketDetailProps) {
  const [draftReply, setDraftReply] = useState(ticket.aiDraftReply || '');
  const [agentNotes, setAgentNotes] = useState(ticket.agentNotes || '');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(ticket.status === 'PENDING' || ticket.status === 'PROCESSING');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (polling) {
      interval = setInterval(async () => {
        try {
          const status = await getTriageStatus(ticket.id);
          if (['TRIAGED', 'APPROVED', 'REJECTED', 'FAILED'].includes(status.ticketStatus)) {
            setPolling(false);
            window.location.reload();
          }
        } catch (err) {
          console.error('Error polling status:', err);
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [polling, ticket.id]);

  useEffect(() => {
    setDraftReply(ticket.aiDraftReply || '');
    setAgentNotes(ticket.agentNotes || '');
  }, [ticket]);

  const handleApprove = async () => {
    if (!draftReply.trim()) return;
    
    setLoading(true);
    try {
      const updated = await approveTicket(ticket.id, {
        finalReply: draftReply,
        agentNotes: agentNotes || undefined,
      });
      onUpdate(updated);
    } catch (err) {
      console.error('Error approving ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const updated = await rejectTicket(ticket.id);
      onUpdate(updated);
    } catch (err) {
      console.error('Error rejecting ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    try {
      const updated = await retryTriage(ticket.id);
      onUpdate(updated);
      setPolling(true);
    } catch (err) {
      console.error('Error retrying triage:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US');
  };

  const isProcessing = ticket.status === 'PENDING' || ticket.status === 'PROCESSING';
  const canEdit = ticket.status === 'TRIAGED';
  const isResolved = ticket.status === 'APPROVED' || ticket.status === 'REJECTED';
  const isFailed = ticket.status === 'FAILED';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Ticket #{ticket.id}
            </h2>
            <p className="text-sm text-gray-500">{ticket.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <StatusBadge label="Status" value={ticket.status} type="status" />
            {ticket.urgency && <StatusBadge label="Urgency" value={ticket.urgency} type="urgency" />}
            {ticket.category && <StatusBadge label="Category" value={ticket.category} type="category" />}
            {ticket.sentimentScore !== null && (
              <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                <span className="text-gray-500">Sentiment:</span>{' '}
                <span className="font-medium">{ticket.sentimentScore.toFixed(1)}/10</span>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Customer Information
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="font-medium text-gray-900 dark:text-white">{ticket.customerName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.customerEmail}</p>
              <p className="text-xs text-gray-500 mt-2">Created: {formatDate(ticket.createdAt)}</p>
            </div>
          </div>

          {/* Original Complaint */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Original Complaint
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {ticket.originalText}
              </p>
            </div>
          </div>

          {/* Processing indicator */}
          {isProcessing && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    AI is analyzing this ticket...
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    This usually takes a few seconds
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failed indicator */}
          {isFailed && (
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    AI Triage Failed
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-300">
                    The AI was unable to process this ticket after multiple attempts. You can retry or handle it manually.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {ticket.aiAnalysis && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                AI Analysis (Internal)
              </h3>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <p className="text-purple-800 dark:text-purple-200 whitespace-pre-wrap">
                  {ticket.aiAnalysis}
                </p>
              </div>
            </div>
          )}

          {/* Draft Reply */}
          {(ticket.aiDraftReply || canEdit) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {isResolved ? 'Final Reply' : 'AI Draft Reply'} {canEdit && '(Editable)'}
              </h3>
              {canEdit ? (
                <textarea
                  value={draftReply}
                  onChange={(e) => setDraftReply(e.target.value)}
                  className="textarea h-48"
                  placeholder="Edit the AI-generated reply before sending..."
                />
              ) : (
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <p className="text-green-800 dark:text-green-200 whitespace-pre-wrap">
                    {isResolved ? ticket.finalReply : ticket.aiDraftReply}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Agent Notes */}
          {(canEdit || ticket.agentNotes) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Agent Notes
              </h3>
              {canEdit ? (
                <textarea
                  value={agentNotes}
                  onChange={(e) => setAgentNotes(e.target.value)}
                  className="textarea h-24"
                  placeholder="Add internal notes about this ticket..."
                />
              ) : ticket.agentNotes ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    {ticket.agentNotes}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Timeline */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Timeline
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2 text-sm">
              <TimelineItem label="Created" date={ticket.createdAt} />
              <TimelineItem label="Triaged" date={ticket.triagedAt} />
              <TimelineItem label="Resolved" date={ticket.resolvedAt} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t dark:border-gray-700 flex gap-3 justify-end">
          {isProcessing && (
            <button onClick={handleRetry} disabled={loading} className="btn-secondary">
              Cancel & Retry
            </button>
          )}

          {isFailed && (
            <>
              <button onClick={handleRetry} disabled={loading} className="btn-primary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry AI Triage
              </button>
            </>
          )}
          
          {canEdit && (
            <>
              <button onClick={handleReject} disabled={loading} className="btn-danger">
                Reject
              </button>
              <button onClick={handleRetry} disabled={loading} className="btn-secondary">
                Retry AI
              </button>
              <button 
                onClick={handleApprove} 
                disabled={loading || !draftReply.trim()} 
                className="btn-success"
              >
                Approve & Send
              </button>
            </>
          )}
          
          {isResolved && (
            <span className={`px-4 py-2 rounded-lg font-medium ${
              ticket.status === 'APPROVED' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {ticket.status === 'APPROVED' ? 'Approved' : 'Rejected'}
            </span>
          )}
          
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ label, value, type }: { label: string; value: string; type: string }) {
  const getColor = () => {
    if (type === 'urgency') {
      if (value === 'HIGH') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      if (value === 'MEDIUM') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    if (type === 'status') {
      if (value === 'APPROVED') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      if (value === 'REJECTED') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      if (value === 'TRIAGED') return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      if (value === 'PROCESSING') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      if (value === 'FAILED') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const formatValue = (val: string) => {
    return val.replace('_', ' ');
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getColor()}`}>
      {label}: {formatValue(value)}
    </span>
  );
}

function TimelineItem({ label, date }: { label: string; date: string | null }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-gray-800 dark:text-gray-200">
        {date ? new Date(date).toLocaleString('en-US') : '-'}
      </span>
    </div>
  );
}
