import axios from 'axios';
import { ScheduleCampaignPayload, ParseCSVResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('reachinbox_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('reachinbox_token');
    }
  },
};

export const emailService = {
  parseCSV: async (content: string): Promise<ParseCSVResponse> => {
    const res = await api.post('/emails/parse-csv', { content });
    return res.data;
  },
  scheduleCampaign: async (payload: ScheduleCampaignPayload) => {
    const res = await api.post('/emails/schedule', payload);
    return res.data;
  },
  getScheduledEmails: async () => {
    const res = await api.get('/emails/scheduled');
    return res.data;
  },
  getSentEmails: async () => {
    const res = await api.get('/emails/sent');
    return res.data;
  },
  getEmailById: async (id: string) => {
    const res = await api.get(`/emails/${id}`);
    return res.data;
  },
  searchEmails: async (query: string) => {
    const res = await api.get(`/emails/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },
};

export const slackService = {
  getStatus: async () => {
    const res = await api.get('/slack/status');
    return res.data;
  },
  disconnect: async () => {
    const res = await api.post('/slack/disconnect');
    return res.data;
  },
};
