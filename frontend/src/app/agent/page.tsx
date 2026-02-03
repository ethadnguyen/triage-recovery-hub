'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  healthCheck, getTickets, getTicketStats, getTicket,
  HealthStatus, Ticket, TicketStats 
} from '@/lib/api';
import TicketCard from '@/components/TicketCard';
import TicketDetail from '@/components/TicketDetail';
import StatsPanel from '@/components/StatsPanel';
import Link from 'next/link';

export default function AgentDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    status: '',
    urgency: '',
    category: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [healthData, ticketsData, statsData] = await Promise.all([
        healthCheck(),
        getTickets({
          status: filters.status || undefined,
          urgency: filters.urgency || undefined,
          category: filters.category || undefined,
        }),
        getTicketStats(),
      ]);
      
      setHealth(healthData);
      setTickets(ticketsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError('Failed to connect to backend. Make sure all services are running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleTicketClick = async (ticket: Ticket) => {
    try {
      const freshTicket = await getTicket(ticket.id);
      setSelectedTicket(freshTicket);
    } catch (err) {
      console.error('Error fetching ticket:', err);
      setSelectedTicket(ticket);
    }
  };

  const handleTicketUpdate = (updatedTicket: Ticket) => {
    setSelectedTicket(updatedTicket);
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    loadData();
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Agent Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI Support Triage Hub
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Health indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  health?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {health?.status === 'healthy' ? 'System Online' : 'System Offline'}
                </span>
              </div>

              <Link 
                href="/" 
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Customer Portal
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-sm underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Panel */}
        <StatsPanel stats={stats} loading={loading} />

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input w-auto"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="TRIAGED">Triaged</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="FAILED">Failed</option>
            </select>

            <select
              value={filters.urgency}
              onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
              className="input w-auto"
            >
              <option value="">All Urgency</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input w-auto"
            >
              <option value="">All Categories</option>
              <option value="BILLING">Billing</option>
              <option value="TECHNICAL">Technical</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="GENERAL">General</option>
            </select>

            {(filters.status || filters.urgency || filters.category) && (
              <button
                onClick={() => setFilters({ status: '', urgency: '', category: '' })}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
            
            <button
              onClick={loadData}
              className="ml-auto btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Tickets List */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Incoming Tickets ({tickets.length})
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Auto-refreshes every 5 seconds
            </span>
          </div>
          
          {loading && tickets.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse border-l-4 border-gray-200 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No tickets in queue
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Waiting for customer submissions...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => handleTicketClick(ticket)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleTicketUpdate}
        />
      )}
    </main>
  );
}
