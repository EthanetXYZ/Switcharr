# Game Shop Server

This is a Node.js server application for managing and serving game files to a Nintendo Switch using Tinfoil. It scans a directory for game files and provides an API for listing and downloading them.

## Features

- Download and serve a title database from a specified URL.
- Scan a directory for game files with specific extensions.
- Provide an API to list available game files.
- Serve game files for download through HTTP requests.
- Display a success message the first time the shop is loaded.

## Requirements

- Node.js v12 or later
- npm (Node Package Manager)
- Tinfoil (for the Nintendo Switch)

## Installation

1. Clone the repository:

```bash
   git clone https://github.com/yourusername/game-shop-server.git
   cd game-shop-server
```
2. Install dependencies:

 ```bash
npm install
```
3. Create a .env file in the root directory with the following content:

```ini
TITLE_DB_URL=https://github.com/blawar/titledb/raw/master/AU.en.json
SUCCESS_MESSAGE=Operation Successful
HOST=0.0.0.0
PORT=9000
```


### Usage

Start the server:

```bash
npm start
```

The server will start running at the specified host and port, defaulting to http://0.0.0.0:9000.

Access the game list endpoint from your browser or Tinfoil:

```arduino
http://your-server-ip:9000/
```

This will return a JSON response with the list of available game files and directories.

Download a specific game file using the following endpoint:

```bash
http://your-server-ip:9000/download/<filename>
```

Replace <filename> with the name of the game file you want to download.

### Configuration

    TITLE_DB_URL: The URL to download the title database from.
    SUCCESS_MESSAGE: The message displayed when the shop is loaded for the first time.
    HOST: The host address for the server.
    PORT: The port number for the server.

Logging

The application uses the winston logging library for logging. Log messages are printed to the console in a colored format.
> [!Note]
> Ensure the /games directory exists and contains your game files (.nsp, .nsz, .xci, .xcz).
> The success message is shown only once per session to avoid redundancy.