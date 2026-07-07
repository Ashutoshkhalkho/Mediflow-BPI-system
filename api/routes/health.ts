import { Router } from 'express';

const router = Router();

// Health Check Endpoint
router.get('/', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default router;
