"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_child_process_1 = require("node:child_process");
const fsPromises = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const http = __importStar(require("node:http"));
const socket_io_1 = require("socket.io");
const LS = "ls";
const CURR_DIR = __dirname;
const DATA_DIR = path.resolve(CURR_DIR, "data");
const FORBIDDEN_OPTIONS = ["&&", ";", "|", "`", ",", "'", '"'];
const ALLOWED_SHORT_OPTIONS = "aAbBcCdDfFgGhHiIlLmMnNoOpPqQrRsStTuUvVwWxX1Z";
const ALLOWED_LONG_OPTIONS = [
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
function validateCommand(command) {
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
        }
        else if (parts[i].startsWith("-")) {
            for (let j = 1; j < parts[i].length; j++) {
                if (!ALLOWED_SHORT_OPTIONS.includes(parts[i][j])) {
                    return false;
                }
            }
        }
        else {
            continue;
        }
    }
    return true;
}
function checkIfPathExist(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fsPromises.access(dirPath);
            return true;
        }
        catch (_a) {
            return false;
        }
    });
}
function checkIfDirectory(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const stat = yield fsPromises.stat(dirPath);
        return stat.isDirectory();
    });
}
function performLsCommand(command) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const commandOptions = command.split(" ").slice(1);
            const dirPath = commandOptions.find((option) => !option.startsWith("-")) || DATA_DIR;
            if (!(yield checkIfPathExist(dirPath))) {
                return reject("Error: Directory or file does not exist");
            }
            if (!(yield checkIfDirectory(dirPath))) {
                return reject("Error: Invalid path or not a directory");
            }
            const ls = (0, node_child_process_1.spawn)(LS, commandOptions);
            let dataRes = '';
            let errRes = '';
            ls.stdout.on("data", (data) => { dataRes += data; });
            ls.stderr.on("data", (err) => { errRes += err; });
            ls.on('exit', () => {
                if (errRes) {
                    reject(errRes);
                }
                else {
                    resolve(dataRes);
                }
            });
        }));
    });
}
const app = (0, express_1.default)();
const server = http.createServer(app);
const io = new socket_io_1.Server(server);
//app.use(express.static(path.join(__dirname, 'public')));
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('command', (command) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!validateCommand(command)) {
                socket.emit('result', 'Invalid command. Only "ls" commands are allowed and no special characters.');
                return;
            }
            const result = yield performLsCommand(command);
            socket.emit('result', result);
        }
        catch (err) {
            socket.emit('result', err);
        }
    }));
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
server.listen(3001, () => {
    console.log(`Server is listening on port 3001`);
});
