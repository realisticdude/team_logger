const screenshot = require('screenshot-desktop');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { powerMonitor } = require('electron');

let cycleTimeout = null;
let scheduledTimeouts = [];
let heartbeatInterval = null;
let authToken = null;
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
  const filepath = path.join(__dirname, filename);

  try {
    console.log("Capturing screenshot:", filepath);
    await screenshot({ filename: filepath });

    const form = new FormData();
    form.append('screenshot', fs.createReadStream(filepath));

    console.log("Uploading screenshot to Render backend:");
    console.log(`${BACKEND_URL}/api/screenshots/upload`);
    console.log("With token:", authToken ? `${authToken.substring(0, 10)}...` : 'null');

    const response = await axios.post(`${BACKEND_URL}/api/screenshots/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Upload success:', response.data);
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data || error.message;
    console.error('Upload failed:', errorMsg);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  } finally {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log("Local file deleted:", filepath);
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
