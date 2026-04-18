import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { intelligenceRouter } from './routes/intelligence.js';
import { watchlistRouter } from './routes/watchlist.js';
import { alertsRouter } from './routes/alerts.js';
import { compareRouter } from './routes/compare.js';
import { newsRouter } from './routes/news.js';
import { benchmarkRouter } from './routes/benchmark.js';
import { forecastRouter } from './routes/forecast.js';
import { heatmapRouter } from './routes/heatmap.js';
import { dealRouter } from './routes/deal.js';
import { trendRouter } from './routes/trend.js';
import { exportRouter } from './routes/export.js';
import { crmRouter } from './routes/crm.js';
import { teamRouter } from './routes/team.js';
import { authRouter } from './routes/auth.js';
import { apiRouter } from './routes/enterpriseApi.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startScheduler } from './scheduler/index.js';
import { logger } from './lib/logger.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/health', (_req, res) => res.json({ ok: true, service: 'outsight-ai', ts: Date.now() }));

app.use('/auth', authRouter);
app.use('/intelligence', intelligenceRouter);
app.use('/watchlist', watchlistRouter);
app.use('/alerts', alertsRouter);
app.use('/compare', compareRouter);
app.use('/news', newsRouter);
app.use('/benchmark', benchmarkRouter);
app.use('/forecast', forecastRouter);
app.use('/heatmap', heatmapRouter);
app.use('/deal', dealRouter);
app.use('/trend', trendRouter);
app.use('/export', exportRouter);
app.use('/crm', crmRouter);
app.use('/team', teamRouter);
app.use('/v1', apiRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`Outsight AI backend listening on :${PORT}`);
  startScheduler();
});
