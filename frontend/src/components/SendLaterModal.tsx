import React, { useState } from 'react';
import { Calendar, Clock, X, Check } from 'lucide-react';

interface SendLaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTime: (scheduledDate: Date) => void;
}

export const SendLaterModal: React.FC<SendLaterModalProps> = ({
  isOpen,
  onClose,
  onSelectTime,
}) => {
  if (!isOpen) return null;

  // Default to tomorrow 9 AM
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);
  defaultDate.setHours(9, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<string>(
    defaultDate.toISOString().slice(0, 10)
  );
  const [selectedTime, setSelectedTime] = useState<string>('09:00');

  const handleQuickSelect = (offsetMinutes: number, setHours?: number) => {
    const target = new Date();
    if (setHours !== undefined) {
      target.setDate(target.getDate() + (offsetMinutes / (24 * 60)));
      target.setHours(setHours, 0, 0, 0);
    } else {
      target.setMinutes(target.getMinutes() + offsetMinutes);
    }

    setSelectedDate(target.toISOString().slice(0, 10));
    const hours = String(target.getHours()).padStart(2, '0');
    const minutes = String(target.getMinutes()).padStart(2, '0');
    setSelectedTime(`${hours}:${minutes}`);
  };

  const handleDone = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const targetDate = new Date(year, month - 1, day, hours, minutes, 0);

    onSelectTime(targetDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Send Later</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Quick Time Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Quick Options
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect(30)}
                className="text-xs font-medium py-2 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 text-left transition-colors flex items-center space-x-2"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>In 30 minutes</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(120)}
                className="text-xs font-medium py-2 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 text-left transition-colors flex items-center space-x-2"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>In 2 hours</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(24 * 60, 9)}
                className="text-xs font-medium py-2 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 text-left transition-colors flex items-center space-x-2"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tomorrow at 9 AM</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(3 * 24 * 60, 9)}
                className="text-xs font-medium py-2 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 text-left transition-colors flex items-center space-x-2"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Next Monday at 9 AM</span>
              </button>
            </div>
          </div>

          {/* Date & Time Picker */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Custom Date & Time
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Time</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
