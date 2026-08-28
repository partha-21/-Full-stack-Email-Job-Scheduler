import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { EmailItem } from '../types';
import { emailService } from '../services/api';
import { ArrowLeft, ExternalLink, Clock, CheckCircle2, AlertCircle, Trash2, Star } from 'lucide-react';

export const EmailDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState<EmailItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      emailService
        .getEmailById(id)
        .then((data) => setEmail(data.email))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 bg-white border-l border-slate-200">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 bg-white">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to list</span>
          </button>

          <div className="flex items-center space-x-3">
            {email?.etherealPreviewUrl && (
              <a
                href={email.etherealPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Ethereal Mail Preview</span>
              </a>
            )}
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
              <Star className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
              Loading email record details...
            </div>
          ) : !email ? (
            <div className="text-center text-slate-500 py-12">Email record not found.</div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Subject */}
              <div className="flex items-start justify-between">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{email.subject}</h1>
                <span className="text-xs px-2.5 py-1 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {email.status}
                </span>
              </div>

              {/* Sender / Recipient Metadata Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {email.sender.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      From: <span className="font-normal text-slate-700">{email.sender}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 mt-0.5">
                      To: <span className="font-normal text-slate-700">{email.recipient}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <div>
                    {email.sentAt
                      ? `Sent at ${new Date(email.sentAt).toLocaleString()}`
                      : `Scheduled for ${new Date(email.scheduledAt).toLocaleString()}`}
                  </div>
                  {email.jobId && (
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Job ID: {email.jobId}
                    </div>
                  )}
                </div>
              </div>

              {/* Email Body Content */}
              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans min-h-[200px]">
                {email.body}
              </div>

              {/* Ethereal Mail Banner */}
              {email.etherealPreviewUrl && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
                  <div className="text-xs text-indigo-900">
                    <span className="font-bold">Ethereal SMTP Sandbox:</span> View exact HTML rendered output in Nodemailer Ethereal web inbox.
                  </div>
                  <a
                    href={email.etherealPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center space-x-1"
                  >
                    <span>Inspect Mail Inbox</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
