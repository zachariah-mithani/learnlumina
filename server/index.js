import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import pathsRoutes from './routes/paths.js';
import achievementsRoutes from './routes/achievements.js';
import aiRoutes from './routes/ai.js';
import statsRoutes from './routes/stats.js';
import { apiLimiter, authLimiter, aiLimiter } from './middleware/rateLimiter.js';
import config, { validateConfig } from './config.js';

// Validate configuration
validateConfig();

const app = express();

// Trust proxy - required for rate limiting behind Render/Vercel/etc
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased for path data

// Apply rate limiters
app.use('/api/', apiLimiter); // General limiter for all API routes

// Routes with specific limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/paths', pathsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║     ATTENTIO SERVER INITIALIZED         ║
  ╠═══════════════════════════════════════╣
  ║  → Port: ${config.port}                         ║
  ║  → Mode: ${config.isDev ? 'DEVELOPMENT' : 'PRODUCTION'}                 ║
  ║  → Status: ONLINE                     ║
  ╚═══════════════════════════════════════╝
  `);
});

