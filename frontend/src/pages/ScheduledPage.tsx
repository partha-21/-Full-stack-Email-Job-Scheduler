import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { EmailRow } from '../components/EmailRow';
import { EmailItem } from '../types';
import { emailService } from '../services/api';
import { Search, Clock, RefreshCw, AlertCircle } from 'lucide-react';

export const ScheduledPage: React.FC = () => {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [sentCount, setSentCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const data = await emailService.getScheduledEmails();
      setEmails(data.emails || []);

      const sentData = await emailService.getSentEmails();
      setSentCount(sentData.total || 0);
    } catch (error) {
      console.error('Failed to fetch scheduled emails:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 1) {
      setIsSearching(true);
      try {
        const searchData = await emailService.searchEmails(query);
        const filtered = (searchData.results || []).filter((item: EmailItem) =>
          ['QUEUED', 'RESCHEDULED', 'PROCESSING'].includes(item.status)
        );
        setEmails(filtered);
      } catch (err) {
        console.error('Elasticsearch query error:', err);
      } finally {
        setIsSearching(false);
      }
    } else if (query.trim() === '') {
      fetchEmails();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar scheduledCount={emails.length} sentCount={sentCount} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white border-l border-slate-200">
        {/* Search & Action Bar Header */}
        <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search scheduled emails by recipient, subject or content (Elasticsearch)..."
              className="w-full text-xs py-2 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {isSearching && (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchEmails}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh queue status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* List Section Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Scheduled Emails</h2>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {emails.length}
            </span>
          </div>
        </div>

        {/* Email List Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs">Loading scheduled email queue...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">No Scheduled Emails</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                You have no upcoming email dispatches queued. Click Compose to schedule outreach jobs.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {emails.map((email) => (
                <EmailRow key={email.id} email={email} type="scheduled" />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
