import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  res.json({ status: 'ok', service: 'ServeIQ API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`ServeIQ API running on http://localhost:${PORT}`);
  console.log('Demo credentials: demo@serveiq.com / password');
});
