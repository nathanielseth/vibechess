import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { joinRoom } from "./utils.js";
class SocketManager {
	constructor(io) {
		this.io = io;
		this.rooms = {};
		this.matchmakingQueues = [];
		this.characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	}
	
	init() {
		const app = express();
		const httpServer = createServer(app);
		this.io = new Server(httpServer, {
			cors: {
				origin: "http://localhost:3000",
				methods: ["GET", "POST"],
			},
		});

		app.use(cors());

		this.setupEventListeners();
		httpServer.listen(5000, () => {
			console.log("Server listening on port 5000");
		});
	}

	setupEventListeners() {
		this.io.on("connection", (socket) => {
			try {
				const { username } = socket.handshake.query;
				console.log(`${username} (${socket.id}) connected`);

				socket.on("createRoom", ({ roomCode, timeControl }) =>
					this.setupRoom(socket, roomCode, username, timeControl)
				);

				socket.on("joinRoom", (roomCode) =>
					joinRoom(this.io, socket, this.rooms, roomCode, username)
				);

				socket.on("disconnect", () => {
					const { roomCode } = socket;
					if (roomCode) {
						this.io.in(roomCode).emit("playerHasLeft");
						if (this.rooms[roomCode]) {
							this.rooms[roomCode].activePlayers--;
							if (this.rooms[roomCode].activePlayers <= 0) {
								this.rooms[roomCode] = null;
							}
						}
					}
					console.log(`${username} (${socket.id}) disconnected`);
				});
			} catch (err) {
				console.log(`ERROR: ${err}`);
				this.io
					.in(socket.roomCode)
					.to(socket.id)
					.emit("errorOccurred", err);
			}
		});
	}
}

const socketManager = new SocketManager(new Server());
socketManager.init();
