'use client';

import { useState } from 'react';
import { createTicket } from '@/lib/api';
import Link from 'next/link';

export default function CustomerPortal() {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    subject: '',
    originalText: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || !formData.subject || !formData.originalText) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.originalText.length < 10) {
      setError('Please provide more details about your issue (at least 10 characters)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ticket = await createTicket(formData);
      setTicketId(ticket.id);
      setSubmitted(true);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string; errors?: Array<{ field: string; message: string }> } } };
        if (axiosError.response?.data?.errors) {
          setError(axiosError.response.data.errors.map(e => e.message).join(', '));
        } else if (axiosError.response?.data?.message) {
          setError(axiosError.response.data.message);
        } else {
          setError('Failed to submit your request. Please try again.');
        }
      } else {
        setError('Failed to submit your request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewTicket = () => {
    setSubmitted(false);
    setTicketId(null);
    setFormData({
      customerName: '',
      customerEmail: '',
      subject: '',
      originalText: '',
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Customer Support
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We're here to help
              </p>
            </div>
            <Link 
              href="/agent" 
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Agent Portal
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {submitted ? (
          /* Success Message */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Request Submitted Successfully!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for contacting us. Your request has been received and our support team will respond as soon as possible.
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Your Ticket Number</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">#{ticketId}</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>1. Our support team is reviewing your request</li>
                <li>2. You'll receive a response via email shortly</li>
              </ul>
            </div>

            <button 
              onClick={handleNewTicket}
              className="btn-primary"
            >
              Submit Another Request
            </button>
          </div>
        ) : (
          /* Ticket Form */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
              <h2 className="text-2xl font-bold mb-2">Submit a Support Request</h2>
              <p className="text-blue-100">
                Describe your issue and our team will get back to you as soon as possible.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Your Name <span className="text-red-500">*</span>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input"
                  placeholder="Brief summary of your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  How can we help? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.originalText}
                  onChange={(e) => setFormData({ ...formData, originalText: e.target.value })}
                  className="textarea h-40"
                  placeholder="Please describe your issue in detail. Include any relevant information such as order numbers, dates, or error messages..."
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full btn-primary py-3 text-lg font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                By submitting, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
        <p>AI Support Triage Hub - Demo Application</p>
      </footer>
    </main>
  );
}
