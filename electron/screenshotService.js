const screenshot = require('screenshot-desktop');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { powerMonitor, app } = require('electron');

let cycleTimeout = null;
let scheduledTimeouts = [];
let heartbeatInterval = null;
let authToken = null;

// Use app.getPath('temp') for production safety
const getScreenshotPath = (filename) => {
  const baseDir = app.isPackaged ? app.getPath('temp') : __dirname;
  return path.join(baseDir, filename);
};
const BACKEND_URL = 'https://team-logger.onrender.com';
const CYCLE_DURATION = 15 * 60 * 1000; // 15 minutes
const SCREENSHOTS_PER_CYCLE = 2;
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds
const IDLE_THRESHOLD_SECONDS = 5 * 60; // 5 minutes

console.log('Backend URL set to:', BACKEND_URL);

const sendHeartbeat = async () => {
  if (!authToken) return;
  
  try {
    const idleTime = powerMonitor.getSystemIdleTime();
    const status = idleTime > IDLE_THRESHOLD_SECONDS ? 'idle' : 'active';
    
    console.log(`Sending heartbeat (status: ${status}, idle: ${idleTime}s)`);
    await axios.post(`${BACKEND_URL}/api/activity/heartbeat`, { status }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
  } catch (error) {
    console.error('Heartbeat failed:', error.message);
  }
};

const captureAndUpload = async () => {
  if (!authToken) {
    console.log('No auth token, skipping screenshot');
    return;
  }

  const filename = `screenshot-${Date.now()}.png`;
  const filepath = getScreenshotPath(filename);

  try {
    console.log("Starting screenshot capture...");
    console.log("Target path:", filepath);
    console.log("Directory exists:", fs.existsSync(path.dirname(filepath)));
    
    await screenshot({ filename: filepath });
    console.log("Screenshot captured successfully");

    const form = new FormData();
    form.append('screenshot', fs.createReadStream(filepath));

    console.log("Uploading screenshot to Render backend...");
    console.log("URL:", `${BACKEND_URL}/api/screenshots/upload`);
    
    const response = await axios.post(`${BACKEND_URL}/api/screenshots/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('Upload success:', response.data);
  } catch (error) {
    console.error('Screenshot process failed!');
    if (error.code === 'ENOENT') {
      console.error('File not found error (likely capture failed):', error.message);
    } else if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('General Error:', error.message);
      if (error.stack) console.error(error.stack);
    }
  } finally {
    if (fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
        console.log("Local file deleted:", filepath);
      } catch (e) {
        console.error("Failed to delete local file:", e.message);
      }
    }
  }
};

const scheduleRandomCycle = () => {
  // Clear any existing timeouts in the current cycle
  scheduledTimeouts.forEach(t => clearTimeout(t));
  scheduledTimeouts = [];

  console.log(`Starting new 15-minute cycle. Scheduling ${SCREENSHOTS_PER_CYCLE} random screenshots.`);

  for (let i = 0; i < SCREENSHOTS_PER_CYCLE; i++) {
    const randomDelay = Math.floor(Math.random() * CYCLE_DURATION);
    console.log(`Screenshot ${i + 1} scheduled in ${Math.round(randomDelay / 1000)}s`);
    
    const timeout = setTimeout(captureAndUpload, randomDelay);
    scheduledTimeouts.push(timeout);
  }

  // Schedule the next cycle
  cycleTimeout = setTimeout(scheduleRandomCycle, CYCLE_DURATION);
};

const startScreenshotService = (token) => {
  // Always clear any existing service before starting
  stopScreenshotService();
  authToken = token;

  console.log('Starting screenshot service (Randomized: 2 screenshots per 15 mins)');
  
  // Trigger one screenshot immediately on start for verification in production
  console.log('Triggering initial screenshot for verification...');
  captureAndUpload();

  scheduleRandomCycle();

  // Start activity heartbeats
  sendHeartbeat(); // initial
  heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
};

const stopScreenshotService = () => {
  if (cycleTimeout) {
    clearTimeout(cycleTimeout);
    cycleTimeout = null;
  }

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  scheduledTimeouts.forEach(t => clearTimeout(t));
  scheduledTimeouts = [];
  
  console.log('Screenshot service stopped');
};

const setToken = (token) => {
  authToken = token;
};

module.exports = {
  startScreenshotService,
  stopScreenshotService,
  setToken
};
