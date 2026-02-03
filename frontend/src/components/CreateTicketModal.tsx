'use client';

import { useState } from 'react';
import { createTicket, Ticket } from '@/lib/api';

interface CreateTicketModalProps {
  onClose: () => void;
  onCreate: (ticket: Ticket) => void;
}

export default function CreateTicketModal({ onClose, onCreate }: CreateTicketModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    subject: '',
    originalText: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || !formData.subject || !formData.originalText) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.originalText.length < 10) {
      setError('Complaint text must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ticket = await createTicket(formData);
      onCreate(ticket);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string; errors?: Array<{ field: string; message: string }> } } };
        if (axiosError.response?.data?.errors) {
          setError(axiosError.response.data.errors.map(e => e.message).join(', '));
        } else if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message);
        } else {
          setError('Failed to create ticket');
        }
      } else {
        setError('Failed to create ticket');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create New Ticket
          </h2>
          <p className="text-sm text-gray-500">
            Submit a customer complaint for AI triage
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="input"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="input"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="input"
              placeholder="Brief summary of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Complaint Details
            </label>
            <textarea
              value={formData.originalText}
              onChange={(e) => setFormData({ ...formData, originalText: e.target.value })}
              className="textarea h-40"
              placeholder="Describe the customer's complaint in detail..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
