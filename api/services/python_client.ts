import { getPythonApiUrl } from '../config/env';

export interface PythonPredictInput {
  previousNoShows?: string;
  commuteDistance?: string;
  bookingMethod?: string;
  appointmentType?: string;
  requestedSlot?: string;
}

export interface PythonPredictOutput {
  bookingRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  bookingRiskScore: number;
  bookingRiskJustification: string;
}

export interface PythonChatInput {
  messages: Array<{ role: string; content: string }>;
}

export interface PythonChatOutput {
  reply: string;
}

/**
 * Communicates with the external FastAPI Python service over HTTP.
 */
export async function queryPythonPredict(input: PythonPredictInput): Promise<PythonPredictOutput | null> {
  const baseUrl = getPythonApiUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/api/python/predict`;

  try {
    console.log(`[Python Client] Requesting prediction from: ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      console.warn(`[Python Client] Prediction request failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (
      data &&
      typeof data.bookingRisk === 'string' &&
      typeof data.bookingRiskScore === 'number' &&
      typeof data.bookingRiskJustification === 'string'
    ) {
      return data as PythonPredictOutput;
    }

    console.warn('[Python Client] Prediction response format invalid:', data);
    return null;
  } catch (error: any) {
    console.warn(`[Python Client] Error connecting to Python prediction service: ${error.message || error}`);
    return null;
  }
}

export async function queryPythonChat(input: PythonChatInput): Promise<PythonChatOutput | null> {
  const baseUrl = getPythonApiUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/api/python/chat`;

  try {
    console.log(`[Python Client] Requesting chat from: ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      console.warn(`[Python Client] Chat request failed with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data && typeof data.reply === 'string') {
      return data as PythonChatOutput;
    }

    console.warn('[Python Client] Chat response format invalid:', data);
    return null;
  } catch (error: any) {
    console.warn(`[Python Client] Error connecting to Python chat service: ${error.message || error}`);
    return null;
  }
}
