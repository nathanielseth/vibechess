import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { GameManager } from "./GameManager.js";
import { SocketHandler } from "./SocketHandler.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
		methods: ["GET", "POST"],
		credentials: true,
	},
});

app.use(cors());

const gameManager = new GameManager(io);
const socketHandler = new SocketHandler(gameManager);

io.on("connection", (socket) => {
	socket.on("joinRoom", (data) => socketHandler.handleJoinRoom(socket, data));
	socket.on("rejoinRoom", (data) =>
		socketHandler.handleRejoinRoom(socket, data)
	);
	socket.on("makeMove", (data) => socketHandler.handleMakeMove(socket, data));
	socket.on("findMatch", (data) =>
		socketHandler.handleFindMatch(socket, data)
	);
	socket.on("surrender", (data) =>
		socketHandler.handleSurrender(socket, data)
	);
	socket.on("offerDraw", (data) =>
		socketHandler.handleDrawOffer(socket, data)
	);
	socket.on("acceptDraw", (data) =>
		socketHandler.handleAcceptDraw(socket, data)
	);
	socket.on("declineDraw", (data) =>
		socketHandler.handleDeclineDraw(socket, data)
	);
	socket.on("requestRematch", (data) =>
		socketHandler.handleRematchRequest(socket, data)
	);
	socket.on("createRoom", (data) =>
		socketHandler.handleCreateRoom(socket, data)
	);
	socket.on("disconnect", () => socketHandler.handleDisconnect(socket));
	socket.on("ping", () => socket.emit("pong"));
});

process.on("SIGINT", () => {
	gameManager.cleanup();
	httpServer.close(() => {
		console.log("Server closed gracefully");
		process.exit(0);
	});
});

httpServer.listen(5000, () => {
	console.log("Chess server listening on port 5000");
});
