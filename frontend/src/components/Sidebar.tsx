import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Send, Plus, LogOut, ChevronDown, Slack, Layers } from 'lucide-react';

interface SidebarProps {
  scheduledCount?: number;
  sentCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ scheduledCount = 0, sentCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSlackConnect = () => {
    window.location.href = 'http://localhost:5000/api/slack/connect';
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col justify-between flex-shrink-0 select-none">
      {/* Top Section */}
      <div>
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-100 px-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div className="font-semibold text-slate-900 text-sm tracking-tight">
              ReachInbox <span className="text-xs font-normal px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 ml-1">ONB</span>
            </div>
          </div>
        </div>

        {/* User Account Card */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60 hover:bg-slate-100/80 transition-colors">
            <div className="flex items-center space-x-3 overflow-hidden">
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
                }
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
              />
              <div className="overflow-hidden text-left">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {user?.name || 'Alex Morgan'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {user?.email || 'alex@reachinbox.ai'}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>
        </div>

        {/* Compose Button */}
        <div className="p-4">
          <button
            onClick={() => navigate('/compose')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm py-2.5 px-4 rounded-lg shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Compose</span>
          </button>
        </div>

        {/* Navigation Core */}
        <div className="px-3 py-2">
          <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            CORE
          </div>
          <nav className="space-y-1">
            <NavLink
              to="/scheduled"
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Scheduled</span>
              </div>
              <span className="bg-slate-200/70 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                {scheduledCount}
              </span>
            </NavLink>

            <NavLink
              to="/sent"
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Send className="w-4 h-4 text-slate-500" />
                <span>Sent</span>
              </div>
              <span className="bg-slate-200/70 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                {sentCount}
              </span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Bottom Footer Section: Slack & Logout */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {/* Slack Status / Connect */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
              <Slack className="w-4 h-4 text-emerald-600" />
              <span>Slack Integration</span>
            </div>
            {user?.slackConnection ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Connected"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-300"></span>
            )}
          </div>
          {user?.slackConnection ? (
            <div className="text-[11px] text-slate-500 truncate">
              Connected: <span className="font-medium text-slate-700">{user.slackConnection.teamName || 'Workspace'}</span>
            </div>
          ) : (
            <button
              onClick={handleSlackConnect}
              className="w-full text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 py-1.5 px-2 rounded font-medium transition-colors flex items-center justify-center space-x-1"
            >
              <span>Connect Slack</span>
            </button>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
