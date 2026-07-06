import { spawn, execSync, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const PYTHON_SERVICE_DIR = path.join(process.cwd(), 'python_service');
const VENV_DIR = path.join(PYTHON_SERVICE_DIR, '.venv');

// Detect Python executable paths based on OS (Windows vs Posix)
const isWindows = process.platform === 'win32';
const pythonExe = isWindows
  ? path.join(VENV_DIR, 'Scripts', 'python.exe')
  : path.join(VENV_DIR, 'bin', 'python');
const pipExe = isWindows
  ? path.join(VENV_DIR, 'Scripts', 'pip.exe')
  : path.join(VENV_DIR, 'bin', 'pip');

let pythonProcess: ChildProcess | null = null;

export async function startPythonService(): Promise<void> {
  console.log('[Python Runner] Initializing Python backend service...');

  try {
    // 1. Check/Create Virtual Environment
    if (!fs.existsSync(VENV_DIR)) {
      console.log('[Python Runner] Creating Python virtual environment (.venv)...');
      execSync('python -m venv .venv', { cwd: PYTHON_SERVICE_DIR, stdio: 'inherit' });
      console.log('[Python Runner] Virtual environment created successfully.');
    }

    // 2. Install Dependencies
    console.log('[Python Runner] Checking/Installing dependencies from requirements.txt...');
    execSync(`"${pipExe}" install -r requirements.txt`, {
      cwd: PYTHON_SERVICE_DIR,
      stdio: 'inherit',
    });
    console.log('[Python Runner] Python dependencies verified.');

    // 3. Train ML Model if missing
    const modelPath = path.join(PYTHON_SERVICE_DIR, 'booking_risk_model.pkl');
    if (!fs.existsSync(modelPath)) {
      console.log('[Python Runner] ML model not found. Training scikit-learn model...');
      execSync(`"${pythonExe}" train_model.py`, {
        cwd: PYTHON_SERVICE_DIR,
        stdio: 'inherit',
      });
      console.log('[Python Runner] ML model trained and saved.');
    }

    // 4. Spawn FastAPI Server
    const PYTHON_PORT = process.env.PYTHON_PORT || '8009';
    console.log(`[Python Runner] Starting FastAPI server on port ${PYTHON_PORT}...`);
    pythonProcess = spawn(`"${pythonExe}"`, ['api_service.py'], {
      cwd: PYTHON_SERVICE_DIR,
      shell: true,
      stdio: 'pipe',
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        PORT: PYTHON_PORT,
      },
    });

    // Handle output logs
    pythonProcess.stdout?.on('data', (data) => {
      console.log(`[FastAPI stdout]: ${data.toString().trim()}`);
    });

    pythonProcess.stderr?.on('data', (data) => {
      console.error(`[FastAPI stderr]: ${data.toString().trim()}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`[Python Runner] FastAPI server process exited with code ${code}`);
      pythonProcess = null;
    });

    // Wait briefly for the server to spin up and respond to a health check
    let attempts = 0;
    const maxAttempts = 15;
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`http://127.0.0.1:${PYTHON_PORT}/api/python/health`);
        if (response.ok) {
          const health = await response.json();
          console.log('[Python Runner] FastAPI health check passed:', health);
          break;
        }
      } catch (err) {
        // Server not ready yet
      }
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (attempts >= maxAttempts) {
      console.warn('[Python Runner] Warning: FastAPI server did not pass health check in time. Node.js backend will run with TS fallbacks.');
    } else {
      console.log('[Python Runner] FastAPI server is fully ready.');
    }
  } catch (error) {
    console.error('[Python Runner] Failed to start Python service:', error);
    console.warn('[Python Runner] Node.js will fallback to native TS/JS Gemini assessments.');
  }
}

export function stopPythonService(): void {
  if (pythonProcess) {
    console.log('[Python Runner] Stopping FastAPI server...');
    if (isWindows) {
      // On Windows, taskkill is more reliable for stopping shell-spawned processes
      try {
        execSync(`taskkill /pid ${pythonProcess.pid} /f /t`);
      } catch (err) {
        pythonProcess.kill();
      }
    } else {
      pythonProcess.kill();
    }
    pythonProcess = null;
    console.log('[Python Runner] FastAPI server stopped.');
  }
}

// Ensure cleanup on process exit
process.on('exit', () => {
  stopPythonService();
});
process.on('SIGINT', () => {
  stopPythonService();
  process.exit();
});
process.on('SIGTERM', () => {
  stopPythonService();
  process.exit();
});
