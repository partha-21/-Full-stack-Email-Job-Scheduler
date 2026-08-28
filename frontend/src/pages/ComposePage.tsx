import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { SendLaterModal } from '../components/SendLaterModal';
import { emailService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Paperclip,
  Clock,
  Send,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const ComposePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fromEmail, setFromEmail] = useState<string>(user?.email || 'alex@reachinbox.ai');
  const [toInput, setToInput] = useState<string>('');
  const [detectedEmails, setDetectedEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [delayBetweenMs, setDelayBetweenMs] = useState<number>(2000);
  const [hourlyLimit, setHourlyLimit] = useState<number>(100);

  const [scheduledStartTime, setScheduledStartTime] = useState<Date | null>(null);
  const [isSendLaterOpen, setIsSendLaterOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToInputChange = async (value: string) => {
    setToInput(value);
    if (value.trim()) {
      try {
        const res = await emailService.parseCSV(value);
        setDetectedEmails(res.validEmails);
      } catch (err) {
        console.error(err);
      }
    } else {
      setDetectedEmails([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setToInput(text);
        const res = await emailService.parseCSV(text);
        setDetectedEmails(res.validEmails);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (overrideTime?: Date) => {
    setErrorMsg(null);
    if (detectedEmails.length === 0) {
      setErrorMsg('Please enter or upload at least one valid recipient email address.');
      return;
    }
    if (!subject.trim()) {
      setErrorMsg('Subject line is required.');
      return;
    }
    if (!body.trim()) {
      setErrorMsg('Email body content is required.');
      return;
    }

    setSubmitting(true);
    try {
      const startTime = overrideTime || scheduledStartTime || new Date();
      await emailService.scheduleCampaign({
        fromEmail,
        recipients: detectedEmails,
        subject,
        body,
        delayBetweenMs,
        hourlyLimit,
        scheduledStartTime: startTime.toISOString(),
      });

      navigate('/scheduled');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Scheduling failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 bg-white border-l border-slate-200">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-slate-900">Compose New Email</h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="Attach File"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsSendLaterOpen(true)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                scheduledStartTime
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Schedule send time"
            >
              <Clock className="w-4 h-4" />
              <span>
                {scheduledStartTime
                  ? scheduledStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Schedule'}
              </span>
            </button>

            <button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-sm flex items-center space-x-1.5 transition-all active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{scheduledStartTime ? 'Schedule Campaign' : 'Send Now'}</span>
            </button>
          </div>
        </header>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* From Input */}
            <div className="flex items-center border-b border-slate-200 pb-2">
              <label className="w-20 text-xs font-semibold text-slate-500">From:</label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="flex-1 text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>

            {/* To Input + CSV Upload */}
            <div className="border-b border-slate-200 pb-3 space-y-2">
              <div className="flex items-start justify-between">
                <label className="w-20 text-xs font-semibold text-slate-500 pt-1">To:</label>
                <div className="flex-1 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Paste email list or upload a CSV / TXT file
                  </div>
                  <label className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload CSV / TXT</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <textarea
                rows={3}
                value={toInput}
                onChange={(e) => handleToInputChange(e.target.value)}
                placeholder="john@example.com, alex@outreach.io, test@company.com"
                className="w-full text-xs p-3 bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
              />

              {/* Detected Emails Badge */}
              {detectedEmails.length > 0 && (
                <div className="flex items-center space-x-2 pt-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    {detectedEmails.length} email address{detectedEmails.length > 1 ? 'es' : ''} detected
                  </span>
                </div>
              )}
            </div>

            {/* Subject Input */}
            <div className="flex items-center border-b border-slate-200 pb-2">
              <label className="w-20 text-xs font-semibold text-slate-500">Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Quick question regarding your outreach strategy"
                className="flex-1 text-xs font-semibold text-slate-900 focus:outline-none"
              />
            </div>

            {/* Settings Row: Delay & Hourly Limit */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delay Between Emails (ms)
                </label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={delayBetweenMs}
                  onChange={(e) => setDelayBetweenMs(Number(e.target.value))}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Hourly Sender Limit
                </label>
                <input
                  type="number"
                  min={1}
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(Number(e.target.value))}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Email Body Editor */}
            <div className="pt-2">
              <textarea
                rows={12}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Hi {{first_name}},\n\nI noticed your team is expanding sales operations..."
                className="w-full text-sm p-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Send Later Scheduling Modal */}
      <SendLaterModal
        isOpen={isSendLaterOpen}
        onClose={() => setIsSendLaterOpen(false)}
        onSelectTime={(time) => {
          setScheduledStartTime(time);
          handleSubmit(time);
        }}
      />
    </div>
  );
};
