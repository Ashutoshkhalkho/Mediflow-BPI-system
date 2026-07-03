import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface PredictorInput {
  previousNoShows?: string;
  commuteDistance?: string;
  bookingMethod?: string;
  appointmentType?: string;
  requestedSlot?: string;
}

export interface PredictorOutput {
  bookingRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  bookingRiskScore: number;
  bookingRiskJustification: string;
}

const PYTHON_SERVICE_DIR = path.join(process.cwd(), 'python_service');
const VENV_DIR = path.join(PYTHON_SERVICE_DIR, '.venv');

const isWindows = process.platform === 'win32';
const pythonExe = isWindows
  ? path.join(VENV_DIR, 'Scripts', 'python.exe')
  : path.join(VENV_DIR, 'bin', 'python');

const SCRIPT_PATH = path.join(PYTHON_SERVICE_DIR, 'train_model.py');
const MAX_BUFFER_SIZE = 64 * 1024; // 64 KB limit to prevent memory bottlenecks
const TIMEOUT_MS = 7000; // 7 seconds timeout for Python execution (handles cold starts)

/**
 * Direct TS Fallback Heuristics Engine in case the Python model pipeline fails.
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
 * Spawns train_model.py as a child process to perform ML prediction via stdin/stdout.
 */
export async function predictBookingRisk(input: PredictorInput): Promise<PredictorOutput> {
  // Guard: If Python venv or script doesn't exist, fall back immediately without spawning
  if (!fs.existsSync(pythonExe) || !fs.existsSync(SCRIPT_PATH)) {
    console.warn('[ML Predictor] Python executable or script missing. Falling back to TypeScript rules.');
    return getFallbackPrediction(input);
  }

  return new Promise<PredictorOutput>((resolve) => {
    let resolved = false;
    
    // Spawn Python script with --predict flag securely without shell dependency
    const pyProcess = spawn(pythonExe, [SCRIPT_PATH, '--predict'], {
      cwd: PYTHON_SERVICE_DIR,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdoutBuffer = '';
    let stderrBuffer = '';

    // Enforce Timeout
    const timeoutTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn(`[ML Predictor] Python process timed out after ${TIMEOUT_MS}ms. Killing process and falling back.`);
        try {
          if (isWindows) {
            // Taskkill for Windows to clean shell/subprocesses
            const { execSync } = require('child_process');
            execSync(`taskkill /pid ${pyProcess.pid} /f /t`);
          } else {
            pyProcess.kill('SIGKILL');
          }
        } catch (killErr) {
          pyProcess.kill();
        }
        resolve(getFallbackPrediction(input));
      }
    }, TIMEOUT_MS);

    // Write input JSON payload to stdin
    try {
      const payload = JSON.stringify(input);
      pyProcess.stdin?.write(payload + '\n');
      pyProcess.stdin?.end();
    } catch (writeErr) {
      console.error('[ML Predictor] Stdin write serialization error:', writeErr);
      cleanupAndResolve(getFallbackPrediction(input));
      return;
    }

    // Read stdout
    pyProcess.stdout?.on('data', (data: Buffer) => {
      stdoutBuffer += data.toString();
      if (stdoutBuffer.length > MAX_BUFFER_SIZE) {
        console.warn('[ML Predictor] Exceeded maximum stdout buffer size. Restricting output stream.');
        pyProcess.stdout?.destroy();
      }
    });

    // Read stderr
    pyProcess.stderr?.on('data', (data: Buffer) => {
      stderrBuffer += data.toString();
      if (stderrBuffer.length > MAX_BUFFER_SIZE) {
        pyProcess.stderr?.destroy();
      }
    });

    // Handle process errors (e.g. spawning failures)
    pyProcess.on('error', (err) => {
      console.error('[ML Predictor] Child process execution error:', err);
      cleanupAndResolve(getFallbackPrediction(input));
    });

    // Handle exit
    pyProcess.on('close', (code) => {
      if (resolved) return;
      
      clearTimeout(timeoutTimer);
      resolved = true;

      if (code !== 0) {
        console.warn(`[ML Predictor] Python process exited with non-zero code ${code}. Stderr: ${stderrBuffer.trim()}`);
        resolve(getFallbackPrediction(input));
        return;
      }

      try {
        const parsed = JSON.parse(stdoutBuffer.trim());
        
        if (parsed.error) {
          console.warn('[ML Predictor] Python prediction error returned:', parsed.error);
          resolve(getFallbackPrediction(input));
          return;
        }

        // Validate payload matches our expected types
        if (
          typeof parsed.bookingRisk === 'string' &&
          typeof parsed.bookingRiskScore === 'number' &&
          typeof parsed.bookingRiskJustification === 'string'
        ) {
          resolve({
            bookingRisk: parsed.bookingRisk as 'HIGH' | 'MEDIUM' | 'LOW',
            bookingRiskScore: parsed.bookingRiskScore,
            bookingRiskJustification: parsed.bookingRiskJustification
          });
        } else {
          console.warn('[ML Predictor] Invalid payload structure returned from Python script. Standardizing.');
          resolve(getFallbackPrediction(input));
        }
      } catch (parseErr) {
        console.error('[ML Predictor] Failed to parse Python stdout JSON:', parseErr);
        resolve(getFallbackPrediction(input));
      }
    });

    function cleanupAndResolve(fallbackValue: PredictorOutput) {
      if (!resolved) {
        clearTimeout(timeoutTimer);
        resolved = true;
        try {
          pyProcess.kill();
        } catch (_) {}
        resolve(fallbackValue);
      }
    }
  });
}
