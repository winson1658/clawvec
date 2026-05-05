#!/usr/bin/env node
/**
 * Clawvec MCP Server — npm wrapper
 *
 * This Node.js script bootstraps the Python-based Clawvec MCP Server:
 * 1. Checks for Python 3.11+
 * 2. Creates a virtual environment if needed
 * 3. Installs Python dependencies
 * 4. Launches server.py with stdio transport
 *
 * Usage:
 *   npx clawvec-mcp              # Run the server
 *   npx clawvec-mcp --setup-only # Just set up, don't run
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Paths ────────────────────────────────────────────────────────────
const SCRIPT_DIR = __dirname;
const SERVER_PY = path.join(SCRIPT_DIR, 'server.py');
const REQUIREMENTS = path.join(SCRIPT_DIR, 'requirements.txt');
const VENV_DIR = path.join(SCRIPT_DIR, '.venv');
const VENV_PYTHON = os.platform() === 'win32'
  ? path.join(VENV_DIR, 'Scripts', 'python.exe')
  : path.join(VENV_DIR, 'bin', 'python');
const VENV_PIP = os.platform() === 'win32'
  ? path.join(VENV_DIR, 'Scripts', 'pip.exe')
  : path.join(VENV_DIR, 'bin', 'pip');

// ── Colors ───────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(msg) { console.error(`${C.dim}[clawvec-mcp]${C.reset} ${msg}`); }
function ok(msg) { console.error(`${C.dim}[clawvec-mcp]${C.reset} ${C.green}✓${C.reset} ${msg}`); }
function warn(msg) { console.error(`${C.dim}[clawvec-mcp]${C.reset} ${C.yellow}⚠${C.reset} ${msg}`); }
function err(msg) { console.error(`${C.dim}[clawvec-mcp]${C.reset} ${C.red}✗${C.reset} ${msg}`); }

// ── Python detection ─────────────────────────────────────────────────
function findPython() {
  const candidates = os.platform() === 'win32'
    ? ['python3.11', 'python3.12', 'python3.13', 'python3', 'python']
    : ['python3.11', 'python3.12', 'python3.13', 'python3', 'python'];

  for (const cmd of candidates) {
    try {
      const version = execSync(`${cmd} --version`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
      const match = version.match(/Python (\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        if (major > 3 || (major === 3 && minor >= 11)) {
          return { cmd, version: `${major}.${minor}` };
        }
      }
    } catch {
      // not found
    }
  }
  return null;
}

// ── Setup ────────────────────────────────────────────────────────────
function setup() {
  log(`${C.cyan}Clawvec MCP Server v0.2.0${C.reset}`);
  log('Checking environment...');

  // 1. Check Python
  const python = findPython();
  if (!python) {
    err('Python 3.11+ is required but not found.');
    err('Please install Python 3.11 or later: https://python.org/downloads');
    process.exit(1);
  }
  ok(`Python ${python.version} found (${python.cmd})`);

  // 2. Check server.py exists
  if (!fs.existsSync(SERVER_PY)) {
    err(`server.py not found at ${SERVER_PY}`);
    process.exit(1);
  }

  // 3. Create venv if needed
  if (!fs.existsSync(VENV_DIR)) {
    log('Creating virtual environment...');
    try {
      execSync(`${python.cmd} -m venv "${VENV_DIR}"`, { stdio: 'inherit' });
      ok('Virtual environment created');
    } catch (e) {
      err('Failed to create virtual environment');
      process.exit(1);
    }
  } else {
    ok('Virtual environment exists');
  }

  // 4. Install dependencies
  log('Installing Python dependencies...');
  try {
    execSync(`"${VENV_PIP}" install --upgrade pip`, { stdio: 'inherit' });
    if (fs.existsSync(REQUIREMENTS)) {
      execSync(`"${VENV_PIP}" install -r "${REQUIREMENTS}"`, { stdio: 'inherit' });
    } else {
      // Fallback: install known deps
      execSync(`"${VENV_PIP}" install mcp>=1.0.0 supabase python-dotenv`, { stdio: 'inherit' });
    }
    ok('Dependencies installed');
  } catch (e) {
    err('Failed to install dependencies');
    process.exit(1);
  }

  // 5. Check .env
  const envPath = path.join(SCRIPT_DIR, '.env');
  if (!fs.existsSync(envPath)) {
    const envExample = path.join(SCRIPT_DIR, '.env.example');
    if (fs.existsSync(envExample)) {
      warn('.env not found. Copying from .env.example');
      fs.copyFileSync(envExample, envPath);
      warn('Please edit .env and add your credentials');
    }
  }

  ok('Setup complete!');
  return true;
}

// ── Run server ───────────────────────────────────────────────────────
function runServer() {
  if (!fs.existsSync(VENV_PYTHON)) {
    err('Virtual environment not found. Run setup first.');
    process.exit(1);
  }

  log('Starting Clawvec MCP Server...');

  // Pass through stdio
  const child = spawn(VENV_PYTHON, [SERVER_PY], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: { ...process.env },
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', (e) => {
    err(`Failed to start server: ${e.message}`);
    process.exit(1);
  });

  // Forward SIGINT/SIGTERM
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

// ── Main ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const setupOnly = args.includes('--setup-only');

if (setupOnly) {
  setup();
  process.exit(0);
}

// Auto-setup on first run
if (!fs.existsSync(VENV_DIR)) {
  setup();
}

runServer();
