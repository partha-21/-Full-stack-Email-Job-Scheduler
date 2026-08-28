import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmailItem } from '../types';
import { Clock, ExternalLink, Star, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EmailRowProps {
  email: EmailItem;
  type: 'scheduled' | 'sent';
}

export const EmailRow: React.FC<EmailRowProps> = ({ email, type }) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    switch (email.status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Queued
          </span>
        );
      case 'RESCHEDULED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200" title="Hourly limit reached. Delayed to next window.">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rescheduled
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
            Processing...
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Sent
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const displayTime = type === 'scheduled' ? email.scheduledAt : email.sentAt || email.createdAt;
  const formattedTime = new Date(displayTime).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onClick={() => navigate(`/email/${email.id}`)}
      className="group flex items-center justify-between px-6 py-4 border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors"
    >
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        {/* Recipient Avatar */}
        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-xs flex items-center justify-center flex-shrink-0">
          {email.recipient.charAt(0).toUpperCase()}
        </div>

        {/* Info Stack */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-3 mb-0.5">
            <span className="text-sm font-semibold text-slate-900 truncate">
              {email.recipient}
            </span>
            {getStatusBadge()}
          </div>
          <div className="text-xs text-slate-500 truncate flex items-center space-x-2">
            <span className="font-medium text-slate-700">{email.subject}</span>
            <span>—</span>
            <span className="text-slate-400 truncate">{email.body.substring(0, 80)}</span>
          </div>
        </div>
      </div>

      {/* Right Side: Timestamp & Actions */}
      <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
        <span className="text-xs text-slate-400 font-medium">{formattedTime}</span>

        {/* Ethereal SMTP Preview Link button if present */}
        {email.etherealPreviewUrl && (
          <a
            href={email.etherealPreviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open Ethereal SMTP Mail Preview"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-slate-300 hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Star className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
