import dotenv from 'dotenv';

// Load environment variables in development
dotenv.config();

export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY environment variable is not configured or holds a placeholder value. Please configure it in your Secrets settings.'
    );
  }
  return apiKey;
}
