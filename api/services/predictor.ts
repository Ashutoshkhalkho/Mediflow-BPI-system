import { queryPythonPredict, PythonPredictInput, PythonPredictOutput } from './python_client';

export interface PredictorInput extends PythonPredictInput {}
export interface PredictorOutput extends PythonPredictOutput {}

/**
 * Direct TS Fallback Heuristics Engine in case the Python model pipeline fails or is offline.
 */
export function getFallbackPrediction(input: PredictorInput): PredictorOutput {
  let score = 10;
  
  if (input.previousNoShows === '3+ times') score += 50;
  else if (input.previousNoShows === '1-2 times') score += 25;
  
  const slot = (input.requestedSlot || '').toLowerCase();
  if (slot.includes('friday') || slot.includes('weekend')) {
    score += 15;
  }
  
  const method = (input.bookingMethod || '').toLowerCase();
  if (method.includes('phone') && input.previousNoShows && input.previousNoShows !== 'None') {
    score += 15;
  }
  
  if (input.commuteDistance === '15+ miles') score += 15;
  else if (input.commuteDistance === '5-15 miles') score += 5;
  
  score = Math.max(1, Math.min(99, score));
  
  let risk: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (score >= 70) risk = 'HIGH';
  else if (score >= 35) risk = 'MEDIUM';
  
  const justificationParts: string[] = [];
  if (input.previousNoShows === '3+ times') justificationParts.push('history of repeated no-shows (3+ times)');
  else if (input.previousNoShows === '1-2 times') justificationParts.push('history of 1-2 previous no-shows');
  if (input.commuteDistance === '15+ miles') justificationParts.push('long travel distance (15+ miles)');
  if (slot.includes('friday') || slot.includes('weekend')) justificationParts.push('highly coveted/peak slot request');
  if (method.includes('phone')) justificationParts.push('phone call booking method (lacks email/CC verification)');
  
  const justification = justificationParts.length > 0
    ? `Fallback rule-based engine computed a ${score}% risk score due to: ${justificationParts.join(', ')}.`
    : `Fallback rule-based engine predicted a low no-show probability (${score}%) due to standard booking parameters.`;
    
  return {
    bookingRisk: risk,
    bookingRiskScore: score,
    bookingRiskJustification: justification
  };
}

/**
 * Predicts booking no-show risk by calling the external Python service,
 * falling back to the TypeScript rules engine if offline or unavailable.
 */
export async function predictBookingRisk(input: PredictorInput): Promise<PredictorOutput> {
  // 1. Try querying the Python service
  const pyResult = await queryPythonPredict(input);
  if (pyResult) {
    console.log('[Predictor] Successfully obtained prediction from Python service.');
    return pyResult;
  }

  // 2. If it fails, fallback to local rule-based heuristics immediately (no child_process)
  console.log('[Predictor] Python service unavailable. Falling back to local TypeScript heuristics engine.');
  return getFallbackPrediction(input);
}
