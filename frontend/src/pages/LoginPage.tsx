import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, setToken } = useAuth();
  const [emailInput, setEmailInput] = useState<string>('nithishkumar6442@gmail.com');
  const [passwordInput, setPasswordInput] = useState<string>('••••••••••••');
  const [loading, setLoading] = useState<boolean>(false);

  const handleGoogleClick = () => {
    // Attempt real Google OAuth initiation
    loginWithGoogle();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Authenticate with user's inputted email ID
      const res = await fetch('http://localhost:5000/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim() || 'nithishkumar6442@gmail.com',
          name: emailInput.split('@')[0] || 'User',
        }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Login Container matching reference screenshot */}
      <div className="w-full max-w-[380px] bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-slate-800 text-center mb-6">
          Login
        </h1>

        {/* Login with Google Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          className="w-full bg-[#e8f5e9] hover:bg-[#dcedc8] text-slate-700 font-medium text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors mb-5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Login with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-5">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-normal">
            or sign up through email
          </span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Email ID"
              className="w-full text-xs py-3 px-4 bg-[#f4f6f4] border-none rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              className="w-full text-xs py-3 px-4 bg-[#f4f6f4] border-none rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00a846] hover:bg-[#00923d] text-white font-medium text-xs py-3 px-4 rounded-xl transition-all shadow-sm active:scale-[0.99] mt-2"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};
