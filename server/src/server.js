import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import { GameManager } from "./GameManager.js";
import { SocketHandler } from "./SocketHandler.js";
import { ChatManager } from "./ChatManager.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(",") || [
	"http://localhost:3000",
];

const app = express();
const httpServer = createServer(app);

app.use(
	cors({
		origin: CORS_ORIGIN,
		credentials: true,
	})
);

const io = new Server(httpServer, {
	cors: {
		origin: CORS_ORIGIN,
		methods: ["GET", "POST"],
		credentials: true,
	},
});

const gameManager = new GameManager(io);
const chatManager = new ChatManager(gameManager);
const socketHandler = new SocketHandler(gameManager);

gameManager.setChatManager(chatManager);
chatManager.gm = gameManager;

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
	socket.on("updateRoomSettings", (data) =>
		socketHandler.handleUpdateRoomSettings(socket, data)
	);
	socket.on("disconnect", () => socketHandler.handleDisconnect(socket));
	socket.on("ping", () => socket.emit("pong"));
	socket.on("chatMessage", (data) =>
		chatManager.handleChatMessage(socket, data)
	);
});

process.on("SIGINT", () => {
	gameManager.cleanup();
	chatManager.cleanup();
	httpServer.close(() => {
		console.log("Server closed gracefully");
		process.exit(0);
	});
});

httpServer.listen(PORT, () => {
	console.log(`♟️ Chess server listening on port ${PORT}`);
	console.log(`🌐 Allowed origins: ${CORS_ORIGIN.join(", ")}`);
});
