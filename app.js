const express = require('express');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

const app = express();

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

// Environment variables for configuration
const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT, 10) || 9000;
const EXTERNAL_URL = process.env.EXTERNAL_URL || `http://${HOST}:${PORT}`; // Use HOST and PORT for full external URL

const DIRECTORY = '/games';

let messageShown = false; // Initialize messageShown here

function getGameUrl(filePath) {
  return `${EXTERNAL_URL}/download/${encodeURIComponent(path.basename(filePath))}`; // Encode URL component
}

function scanGames(directory) {
  logger.info(`Scanning directory: ${directory}`);
  const files = [];
  const filenames = fs.readdirSync(directory);

  filenames.forEach((filename) => {
    if (filename.endsWith('.nsp') || filename.endsWith('.nsz') || filename.endsWith('.xci') || filename.endsWith('.xcz')) {
      const gamePath = path.join(directory, filename);
      logger.info(`Found game file: ${filename}`);
      const fileSize = fs.statSync(gamePath).size; // Get file size
      const gameUrl = getGameUrl(gamePath);
      files.push({
        url: gameUrl,
        size: fileSize
      });
    }
  });

  logger.info(`Total files found: ${files.length}`);
  return files;
}

app.get('/', (req, res) => {
  logger.info(`Incoming request: ${req.method} ${req.url} from ${req.ip}`);
  logger.info(`Headers: ${JSON.stringify(req.headers)}`);

  const files = scanGames(DIRECTORY);

  const response = {
    files: files,
    directories: files.map(file => file.url), // Assuming directories are the same as file URLs for this case
  };

  if (!messageShown) {
    response.success = process.env.SUCCESS_MESSAGE || "Operation Successful";
    messageShown = true;
    logger.info(`Success message sent: ${response.success}`);
  }

  logger.info(`Response being sent: ${JSON.stringify(response)}`);
  res.json(response);
});

app.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const file = path.join(DIRECTORY, filename);

  if (fs.existsSync(file)) {
    logger.info(`File found: ${filename}, serving the file.`);

    // Serve the whole file
    res.download(file, filename, (err) => {
      if (err) {
        logger.error(`Error occurred while sending file: ${err.message}`);
        res.status(500).send('Error occurred while downloading the file');
      } else {
        logger.info(`File ${filename} successfully sent.`);
      }
    });
  } else {
    logger.warn(`File not found: ${filename}`);
    res.status(404).send('File not found');
  }
});

app.listen(PORT, HOST, () => {
  logger.info('Starting server');
  logger.info(`Server running at http://${HOST}:${PORT}/`);
});
