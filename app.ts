import express from 'express';
import healthRouter from './server/routes/health';
import triageRouter from './server/routes/triage';
import chatRouter from './server/routes/chat';

const app = express();

app.use(express.json());

// Route Registrations
app.use('/api/health', healthRouter);
app.use('/api/triage', triageRouter);
app.use('/api/chat', chatRouter);

export default app;
