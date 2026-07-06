import { Router } from 'express';
import { runChatbotSession } from '../services/gemini';

const router = Router();

// AI Chatbot Route for Patient Portal
router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    let reply;
    try {
      console.log('[Chat Route] Querying Python FastAPI service...');
      const PYTHON_PORT = process.env.PYTHON_PORT || '8009';
      const pyResponse = await fetch(`http://127.0.0.1:${PYTHON_PORT}/api/python/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      if (pyResponse.ok) {
        const pyResult = await pyResponse.json();
        reply = pyResult.reply;
        console.log('[Chat Route] Successfully obtained response from Python service.');
      } else {
        throw new Error(`Python service returned HTTP ${pyResponse.status}`);
      }
    } catch (pyError: any) {
      console.warn('[Chat Route] Python service failure, falling back to Node.js:', pyError.message || pyError);
      
      // Map incoming messages to Gemini parts format for fallback
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
