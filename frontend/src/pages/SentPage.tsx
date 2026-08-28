import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { EmailRow } from '../components/EmailRow';
import { EmailItem } from '../types';
import { emailService } from '../services/api';
import { Search, Send, RefreshCw } from 'lucide-react';

export const SentPage: React.FC = () => {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const data = await emailService.getSentEmails();
      setEmails(data.emails || []);

      const schedData = await emailService.getScheduledEmails();
      setScheduledCount(schedData.total || 0);
    } catch (error) {
      console.error('Failed to fetch sent emails:', error);
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
          ['SENT', 'FAILED'].includes(item.status)
        );
        setEmails(filtered);
      } catch (err) {
        console.error('Elasticsearch search error:', err);
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
      <Sidebar scheduledCount={scheduledCount} sentCount={emails.length} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white border-l border-slate-200">
        {/* Search Header */}
        <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search sent email archive (Elasticsearch)..."
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
              title="Refresh list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <Send className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Sent Emails</h2>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {emails.length}
            </span>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {loading && emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs">Loading sent email history...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-slate-400 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">No Sent Emails Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Emails dispatched through Ethereal SMTP will appear here along with live mail preview links.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {emails.map((email) => (
                <EmailRow key={email.id} email={email} type="sent" />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
