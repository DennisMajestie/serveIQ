import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import OpenAI from 'openai';
import { seedDatabase } from './db';
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import usersRoutes from './routes/users';
import businessRoutes from './routes/business';
import branchesRoutes from './routes/branches';
import menuRoutes from './routes/menu';
import tablesRoutes from './routes/tables';
import tabsRoutes from './routes/tabs';
import ordersRoutes from './routes/orders';
import billsRoutes from './routes/bills';

const app = express();
const PORT = process.env.PORT || 4205;

// Initialize OpenAI client for Nemotron
const openai = new OpenAI({
  apiKey: process.env.NEMOTRON_API_KEY,
  baseURL: process.env.NEMOTRON_BASE_URL || 'https://integrate.api.nvidia.com/v1'
});

// Middleware
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4201',
  'https://serve-iq-one.vercel.app',
  'https://waiter-serveiq.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(null, true); // Fallback to allow for now, but explicit is better
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.options('*', cors());
app.use(express.json());

// Seed database
seedDatabase();

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/branches', branchesRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/tables', tablesRoutes);
app.use('/api/v1/tabs', tabsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/bills', billsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ServeIQ Unified API' });
});

// Streaming reasoning endpoint (Nemotron)
app.post('/api/v1/chat/completions', async (req, res) => {
  try {
    const { messages, model, temperature, top_p, max_tokens, reasoning_budget, chat_template_kwargs, stream } = req.body;

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completion: any = await openai.chat.completions.create({
        model: model || 'nvidia/nemotron-3-ultra-550b-a55b',
        messages,
        temperature: temperature || 0.6,
        top_p: top_p || 0.95,
        max_tokens: max_tokens || 16384,
        reasoning_budget: reasoning_budget || 16384,
        chat_template_kwargs: chat_template_kwargs || { enable_thinking: true },
        stream: true
      } as any);

      for await (const chunk of completion) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const completion = await openai.chat.completions.create({
        model: model || 'nvidia/nemotron-3-ultra-550b-a55b',
        messages,
        temperature: temperature || 0.6,
        top_p: top_p || 0.95,
        max_tokens: max_tokens || 16384,
        reasoning_budget: reasoning_budget || 16384,
        chat_template_kwargs: chat_template_kwargs || { enable_thinking: true },
        stream: false
      } as any);
      res.json(completion);
    }
  } catch (error) {
    console.error('Error in Nemotron API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`ServeIQ API running on http://localhost:${PORT}`);
  console.log('Demo credentials: demo@serveiq.com / password');
});
