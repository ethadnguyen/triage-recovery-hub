'use client';

import { Ticket, TicketUrgency, TicketStatus, TicketCategory } from '@/lib/api';

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
}

const urgencyColors: Record<string, string> = {
  HIGH: 'border-l-red-500 bg-red-50 dark:bg-red-900/20',
  MEDIUM: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  LOW: 'border-l-green-500 bg-green-50 dark:bg-green-900/20',
};

const urgencyBadgeColors: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  TRIAGED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  FAILED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

const categoryLabels: Record<string, string> = {
  BILLING: 'Billing',
  TECHNICAL: 'Technical',
  FEATURE_REQUEST: 'Feature Request',
  GENERAL: 'General',
  UNKNOWN: 'Unknown',
};

export default function TicketCard({ ticket, onClick }: TicketCardProps) {
  const urgencyClass = ticket.urgency ? urgencyColors[ticket.urgency] : 'border-l-gray-300';
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      onClick={onClick}
      className={`border-l-4 ${urgencyClass} rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              #{ticket.id}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>
              {ticket.status}
            </span>
            {ticket.urgency && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${urgencyBadgeColors[ticket.urgency]}`}>
                {ticket.urgency}
              </span>
            )}
            {ticket.category && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {categoryLabels[ticket.category]}
              </span>
            )}
          </div>
          
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {ticket.subject}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {ticket.customerName} &bull; {ticket.customerEmail}
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">
            {ticket.originalText}
          </p>
        </div>
        
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(ticket.createdAt)}
          </p>
          {ticket.sentimentScore !== null && (
            <div className="mt-2">
              <SentimentIndicator score={ticket.sentimentScore} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SentimentIndicator({ score }: { score: number }) {
  const getColor = () => {
    if (score <= 3) return 'bg-red-500';
    if (score <= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-500">Sentiment</span>
      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} rounded-full`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {score.toFixed(1)}
      </span>
    </div>
  );
}
