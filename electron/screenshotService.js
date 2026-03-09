const screenshot = require('screenshot-desktop');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

let screenshotInterval = null;
let authToken = null;
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:5000';
console.log('Backend URL set to:', BACKEND_URL);

const captureAndUpload = async () => {
  if (!authToken) {
    console.log('No auth token, skipping screenshot');
    return;
  }

  try {
    const filename = `screenshot-${Date.now()}.png`;
    const filepath = path.join(__dirname, filename);

    console.log("Capturing screenshot:", filepath);
    // Capture screenshot
    await screenshot({ filename: filepath });

    // Upload to backend
    const form = new FormData();
    form.append('screenshot', fs.createReadStream(filepath));

    console.log("Uploading to:", `${BACKEND_URL}/api/screenshots/upload`);
    const response = await axios.post(`${BACKEND_URL}/api/screenshots/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Upload success:', response.data);

    // Delete local temporary file
    fs.unlinkSync(filepath);
    console.log("Local file deleted:", filepath);
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.response?.data || error.message;
    console.error('Upload failed:', errorMsg);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
};

const startScreenshotService = (token) => {
  authToken = token;
  if (screenshotInterval) return;

  console.log('Starting screenshot service (every 60s)');
  // Capture immediately then every 60 seconds
  captureAndUpload();
  screenshotInterval = setInterval(captureAndUpload, 60000);
};

const stopScreenshotService = () => {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
    console.log('Screenshot service stopped');
  }
};

const setToken = (token) => {
  authToken = token;
};

module.exports = {
  startScreenshotService,
  stopScreenshotService,
  setToken
};
