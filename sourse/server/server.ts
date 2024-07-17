import express from 'express';
import { spawn } from 'node:child_process';
import * as fsPromises from'node:fs/promises';
import * as path from'node:path';
import * as http from 'node:http';
import { Server, Socket } from 'socket.io';

const LS: string = "ls";
const CURR_DIR: string = __dirname;
const DATA_DIR : string= path.join(__dirname, '..');
const FORBIDDEN_OPTIONS: string[] = ["&&", ";", "|", "`", ",", "'", '"'];
const ALLOWED_SHORT_OPTIONS: string = "aAbBcCdDfFgGhHiIlLmMnNoOpPqQrRsStTuUvVwWxX1Z";
const ALLOWED_LONG_OPTIONS: string[] = [
  "--all", "--almost-all", "--author", "--escape", "--block-size", "--ignore-backups",
  "--directory", "--dired", "--classify", "--file-type", "--format", "--full-time",
  "--group-directories-first", "--no-group", "--human-readable", "--si",
  "--dereference-command-line", "--dereference-command-line-symlink-to-dir",
  "--hide", "--hyperlink", "--indicator-style", "--inode", "--ignore",
  "--kibibytes", "--literal", "--hide-control-chars", "--show-control-chars",
  "--quote-name", "--quoting-style", "--reverse", "--recursive", "--size",
  "--sort", "--time", "--time-style", "--tabsize", "--width", "--context",
  "--zero", "--help", "--version"
];

function validateCommand(command: string): boolean {
  const parts = command.trim().split(" ");
  if (parts[0] !== LS) {
    return false;
  }
  for (let i = 1; i < parts.length; i++) {
    for (const forbidden of FORBIDDEN_OPTIONS) {
      if (parts[i].includes(forbidden)) {
        return false;
      }
    }
    if (parts[i].startsWith("--")) {
      if (!ALLOWED_LONG_OPTIONS.includes(parts[i])) {
        return false;
      }
    } else if (parts[i].startsWith("-")) {
      for (let j = 1; j < parts[i].length; j++) {
        if (!ALLOWED_SHORT_OPTIONS.includes(parts[i][j])) {
          return false;
        }
      }
    } else {
      continue;
    }
  }
  return true;
}

async function checkIfPathExist(dirPath: string): Promise<boolean> {
  console.log(dirPath)
  try {
    await fsPromises.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

async function checkIfDirectory(dirPath: string): Promise<boolean> {
  console.log(`dirPath from check if directory ${dirPath}`)
  const stat = await fsPromises.stat(dirPath);
  return stat.isDirectory();
}

async function performLsCommand(command: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const commandOptions: string[] = command.split(" ").slice(1);
    const dirPath: string = commandOptions.find((option) => !option.startsWith("-")) || DATA_DIR;
    if (!(await checkIfPathExist(dirPath))) {
      return reject("Error: Directory or file does not exist");
    }
    if (!(await checkIfDirectory(dirPath))) {
      return reject("Error: Invalid path or not a directory");
    }
    const ls = spawn(LS, commandOptions);
    let dataRes: string = '';
    let errRes: string = '';
    ls.stdout.on("data", (data: Buffer) => { dataRes += data });
    ls.stderr.on("data", (err: Buffer) => { errRes += err });
    ls.on('exit', () => {
      if (errRes) {
        reject(errRes);
      } else {
        resolve(dataRes);
      }
    });
  });
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

//app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket: Socket) => {  
  socket.emit(`welcome', 'Hello from the server! & dataDir=${DATA_DIR}`);
  socket.on('command', async (command: string): Promise<void> => {
    try {
      if (!validateCommand(command)) {
        console.log(command)
        socket.emit('message', 'Invalid command. Only "ls" commands are allowed and no special characters.');
        return;
      }
      const result: string = await performLsCommand(command);
      console.log(result);
      socket.emit('message', result);
    } catch (err) {
      socket.emit('message', err);
    }
  });
  socket.onAny((event, ...args) => {
    console.log(`Event received: ${event}, with args: ${args}`);
  });


  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


server.listen(3001, () => {
  console.log(`Server is listening on port 3001`);
});
