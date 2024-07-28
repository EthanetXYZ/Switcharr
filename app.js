require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const winston = require('winston');

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
const TITLE_DB_URL = process.env.TITLE_DB_URL || 'https://github.com/blawar/titledb/raw/master/AU.en.json';
const SUCCESS_MESSAGE = process.env.SUCCESS_MESSAGE || "Operation Successful";
const HOST = process.env.HOST;
const PORT = parseInt(process.env.PORT, 10) || 9000;

const TITLE_DB_PATH = path.join('/games/title.db');

// Store to track if the message has been shown
let messageShown = false;

async function downloadTitleDb() {
  try {
    const response = await axios.get(TITLE_DB_URL, { responseType: 'arraybuffer' });
    if (response.status === 200) {
      fs.writeFileSync(TITLE_DB_PATH, response.data);
      logger.info('Title database downloaded successfully.');
    } else {
      logger.error(`Failed to download title database. Status code: ${response.status}`);
    }
  } catch (error) {
    logger.error(`An error occurred while downloading title database: ${error.message}`);
  }
}

function getGameMetadata(filePath) {
  logger.info(`Extracting metadata for ${filePath}`);
  return {
    url: `http://${HOST}:${PORT}/download/${path.basename(filePath)}`,
    size: fs.statSync(filePath).size,
  };
}

function scanGames(directory) {
  logger.info(`Scanning directory: ${directory}`);
  const files = [];
  const filenames = fs.readdirSync(directory);

  filenames.forEach((filename) => {
    // Check for both main games and updates/DLCs by file extension
    if (filename.endsWith('.nsp') || filename.endsWith('.nsz') || filename.endsWith('.xci') || filename.endsWith('.xcz')) {
      const gamePath = path.join(directory, filename);
      logger.info(`Found game file: ${filename}`);
      const gameInfo = getGameMetadata(gamePath);
      files.push(gameInfo);
    }
  });

  logger.info(`Total files found: ${files.length}`);
  return files;
}

app.get('/', (req, res) => {
  logger.info('Received request for game list');
  const files = scanGames('/games');

  const response = {
    files: files,
    directories: files.map(file => file.url),
  };

  // Include the success message only if it hasn't been shown yet
  if (!messageShown) {
    response.success = SUCCESS_MESSAGE;
    messageShown = true; // Set the flag to true after showing the message
    logger.info(`Success message sent: ${SUCCESS_MESSAGE}`);
  }
  
  logger.info(`Response being sent: ${JSON.stringify(response)}`);
  res.json(response);
});

app.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  logger.info(`Received request to download file: ${filename}`);
  const file = path.join('/games', filename);
  res.download(file, filename, (err) => {
    if (err) {
      logger.error(`Error occurred while sending file: ${err.message}`);
      res.status(404).send('File not found');
    }
  });
});

app.listen(PORT, HOST, async () => {
  logger.info('Starting server');
  await downloadTitleDb();
  logger.info(SUCCESS_MESSAGE); // Log the success message when the server starts
  logger.info(`Server running at http://${HOST}:${PORT}/`);
});
