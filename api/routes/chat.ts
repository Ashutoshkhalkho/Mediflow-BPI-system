import { Router } from 'express';
import { runChatbotSession } from '../services/gemini';
import { queryPythonChat } from '../services/python_client';

const router = Router();

// AI Chatbot Route for Patient Portal
router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    let reply: string | undefined;

    // 1. Attempt to call separate Python service
    try {
      console.log('[Chat Route] Querying Python FastAPI service...');
      const pyResult = await queryPythonChat({ messages });
      if (pyResult && pyResult.reply) {
        reply = pyResult.reply;
        console.log('[Chat Route] Successfully obtained response from Python service.');
      }
    } catch (pyError: any) {
      console.warn('[Chat Route] Python service failure, falling back to Node.js:', pyError.message || pyError);
    }

    // 2. Fall back to Node.js/TS Gemini SDK direct integration if Python is down
    if (!reply) {
      console.log('[Chat Route] Running fallback chat session directly in Node.js...');
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      reply = await runChatbotSession(contents);
    }

    res.json({ reply });
  } catch (error: any) {
    console.error('Chat Error:', error);
    res.status(500).json({
      error: error.message || 'An unexpected error occurred during chat.',
    });
  }
});

export default router;
