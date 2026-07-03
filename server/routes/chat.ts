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

    // Map incoming messages to Gemini parts format
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const reply = await runChatbotSession(contents);
    res.json({ reply });
  } catch (error: any) {
    console.error('Chat Error:', error);
    res.status(500).json({
      error: error.message || 'An unexpected error occurred during chat.',
    });
  }
});

export default router;
