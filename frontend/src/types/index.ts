export type EmailStatus = 'QUEUED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RESCHEDULED';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  slackConnection?: {
    id: string;
    teamName?: string | null;
    slackUserId?: string | null;
    createdAt: string;
  } | null;
}

export interface EmailItem {
  id: string;
  campaignId?: string | null;
  userId: string;
  recipient: string;
  sender: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string | null;
  jobId?: string | null;
  idempotencyKey: string;
  etherealPreviewUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleCampaignPayload {
  fromEmail: string;
  recipients?: string[];
  recipientContent?: string;
  subject: string;
  body: string;
  delayBetweenMs?: number;
  hourlyLimit?: number;
  scheduledStartTime?: string;
}

export interface ParseCSVResponse {
  validEmails: string[];
  detectedCount: number;
  invalidCount: number;
}
