'use client';

import { TicketStats } from '@/lib/api';

interface StatsPanelProps {
  stats: TicketStats | null;
  loading: boolean;
}

export default function StatsPanel({ stats, loading }: StatsPanelProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Status Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard label="Total" value={stats.total} color="gray" />
        <StatCard label="Pending" value={stats.pending} color="gray" />
        <StatCard label="Processing" value={stats.processing} color="blue" />
        <StatCard label="Triaged" value={stats.triaged} color="purple" />
        <StatCard label="Approved" value={stats.approved} color="green" />
        <StatCard label="Rejected" value={stats.rejected} color="red" />
        <StatCard label="Failed" value={stats.failed} color="orange" />
      </div>

      {/* Urgency & Category Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            By Urgency
          </h3>
          <div className="flex gap-4">
            <UrgencyBadge label="High" count={stats.byUrgency.HIGH || 0} color="red" />
            <UrgencyBadge label="Medium" count={stats.byUrgency.MEDIUM || 0} color="yellow" />
            <UrgencyBadge label="Low" count={stats.byUrgency.LOW || 0} color="green" />
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            By Category
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <span
                key={category}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                {category.replace('_', ' ')}: {count}
              </span>
            ))}
            {Object.keys(stats.byCategory).length === 0 && (
              <span className="text-gray-500 text-sm">No categorized tickets yet</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  };

  return (
    <div className={`rounded-xl p-4 ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function UrgencyBadge({ label, count, color }: { label: string; count: number; color: string }) {
  const colorClasses: Record<string, string> = {
    red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 border-l-4 rounded-r-lg ${colorClasses[color]}`}>
      <span className="font-medium text-gray-800 dark:text-gray-200">{label}</span>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">{count}</span>
    </div>
  );
}
