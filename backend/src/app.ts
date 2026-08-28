import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import authRoutes from './routes/auth.routes';
import emailRoutes from './routes/email.routes';
import slackRoutes from './routes/slack.routes';
import { errorHandler } from './middleware/error.middleware';
import { emailQueue } from './queues/email.queue';
import { setupElasticsearchIndex } from './config/elasticsearch';

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
  helmet({
    contentSecurityPolicy: false, // Allow BullBoard UI script inline loading
  })
);

app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'reachinbox_session_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue as any) as any],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ReachInbox Backend API Engine</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px 20px; background: #f8fafc; color: #0f172a; }
          .card { max-width: 540px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
          .badge { display: inline-block; padding: 4px 12px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; border-radius: 9999px; font-weight: 600; font-size: 12px; margin-bottom: 16px; }
          h1 { color: #0f172a; margin: 0 0 8px 0; font-size: 22px; font-weight: 700; }
          p { color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 24px; }
          ul { list-style: none; padding: 0; margin: 0; }
          li { padding: 12px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
          li:last-child { border-bottom: none; }
          .label { font-size: 13px; font-weight: 500; color: #334155; }
          a { color: #4f46e5; text-decoration: none; font-weight: 600; font-size: 13px; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">● Backend Service Active</span>
          <h1>ReachInbox Email Scheduler API</h1>
          <p>The Express.js REST API & BullMQ Queue Worker engine is running.</p>
          <ul>
            <li><span class="label">Frontend Web App</span> <a href="${FRONTEND_URL}">${FRONTEND_URL}</a></li>
            <li><span class="label">BullMQ Live Queue Dashboard</span> <a href="/admin/queues">/admin/queues</a></li>
            <li><span class="label">API Health Check</span> <a href="/health">/health</a></li>
            <li><span class="label">Google OAuth Endpoint</span> <a href="/api/auth/google">/api/auth/google</a></li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'ReachInbox Email Job Scheduler API',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/slack', slackRoutes);

app.use(errorHandler);

setupElasticsearchIndex().catch(() => {});

export default app;
