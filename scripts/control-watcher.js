const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const CONTROL_FILE = path.resolve(process.cwd(), '.bad');
const APP_NAME = 'goldhome';
const CHECK_INTERVAL = 2000; // ms

let last = null;

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

function runCmd(cmd, cb) {
  exec(cmd, { cwd: process.cwd(), env: process.env }, (err, stdout, stderr) => {
    if (err) {
      log(`CMD ERR: ${cmd}`, err.message);
    }
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    if (cb) cb(err, stdout, stderr);
  });
}

function ensurePm2App() {
  // If dist/index.js exists, ensure pm2 has it started (but not restart if already online)
  const dist = path.resolve(process.cwd(), 'dist', 'index.js');
  if (fs.existsSync(dist)) {
    // Check pm2 list for the app
    runCmd(`npx pm2 describe ${APP_NAME}`, (err, out) => {
      if (err || !out || out.indexOf('online') === -1) {
        log('Starting production app under pm2 (dist/index.js)');
        runCmd(`npx pm2 start ${dist} --name ${APP_NAME} --update-env`);
      } else {
        log('Production app already online');
      }
    });
  } else {
    log('dist/index.js not found; build the project before using production mode');
  }
}

function act(value) {
  value = (value || '').toLowerCase().trim();
  if (!value) return;
  if (value === last) return;
  last = value;
  log('control-watcher detected command:', value);

  if (value === 'start') {
    ensurePm2App();
  } else if (value === 'stop') {
    log('Stopping pm2 app:', APP_NAME);
    runCmd(`npx pm2 stop ${APP_NAME} || true`);
  } else if (value === 'restart') {
    log('Restarting pm2 app:', APP_NAME);
    runCmd(`npx pm2 restart ${APP_NAME} || npx pm2 start dist/index.js --name ${APP_NAME} --update-env`);
  } else {
    log('Unknown command in .bad:', value);
  }
}

function readControlFile() {
  try {
    if (!fs.existsSync(CONTROL_FILE)) {
      return null;
    }
    const v = fs.readFileSync(CONTROL_FILE, 'utf8').toString().trim();
    return v;
  } catch (err) {
    log('Error reading control file', err.message);
    return null;
  }
}

// Initial run
const initial = readControlFile();
if (initial) {
  act(initial);
} else {
  log('.bad not present or empty; will wait for commands');
}

// Periodic check
const timer = setInterval(() => {
  const v = readControlFile();
  if (v && v !== last) {
    act(v);
  }
}, CHECK_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  log('control-watcher shutting down');
  clearInterval(timer);
  process.exit(0);
});
