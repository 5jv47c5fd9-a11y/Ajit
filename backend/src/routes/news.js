import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { fetchLatestNews } from '../services/newsService.js';

export const newsRouter = Router();

newsRouter.get('/:company', requireAuth, async (req, res, next) => {
  try {
    const news = await fetchLatestNews(req.params.company);
    res.json({ company: req.params.company, news });
  } catch (err) {
    next(err);
  }
});
