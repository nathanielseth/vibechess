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

app.get("/health", (req, res) => {
	res.status(200).json({
		status: "alive",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

const io = new Server(httpServer, {
	cors: {
		origin: CORS_ORIGIN,
		methods: ["GET", "POST"],
		credentials: true,
	},
});

let gameManager, chatManager, socketHandler;

try {
	gameManager = new GameManager(io);
	chatManager = new ChatManager(gameManager);
	socketHandler = new SocketHandler(gameManager);

	gameManager.setChatManager(chatManager);
	chatManager.gm = gameManager;

	console.log("✅ Managers initialized successfully");
} catch (error) {
	console.error("❌ Failed to initialize managers:", error);
	process.exit(1);
}

const logError = (eventName, error, socketId = null) => {
	const timestamp = new Date().toISOString();
	const socketInfo = socketId ? ` [Socket: ${socketId}]` : "";
	console.error(
		`[${timestamp}] ❌ Error in ${eventName}${socketInfo}:`,
		error
	);
};

const createSocketHandler = (eventName, handler) => {
	return async (socket, data) => {
		try {
			await handler(socket, data);
		} catch (error) {
			logError(eventName, error, socket.id);

			socket.emit("error", {
				event: eventName,
				message: "An error occurred while processing your request",
				timestamp: new Date().toISOString(),
			});
		}
	};
};

io.on("connection", (socket) => {
	console.log(`🔗 Client connected: ${socket.id}`);

	const handlers = {
		joinRoom: createSocketHandler("joinRoom", (socket, data) =>
			socketHandler.handleJoinRoom(socket, data)
		),
		rejoinRoom: createSocketHandler("rejoinRoom", (socket, data) =>
			socketHandler.handleRejoinRoom(socket, data)
		),
		makeMove: createSocketHandler("makeMove", (socket, data) =>
			socketHandler.handleMakeMove(socket, data)
		),
		findMatch: createSocketHandler("findMatch", (socket, data) =>
			socketHandler.handleFindMatch(socket, data)
		),
		cancelMatchmaking: createSocketHandler("cancelMatchmaking", (socket) =>
			socketHandler.handleCancelMatchmaking(socket)
		),
		surrender: createSocketHandler("surrender", (socket, data) =>
			socketHandler.handleSurrender(socket, data)
		),
		offerDraw: createSocketHandler("offerDraw", (socket, data) =>
			socketHandler.handleDrawOffer(socket, data)
		),
		acceptDraw: createSocketHandler("acceptDraw", (socket, data) =>
			socketHandler.handleAcceptDraw(socket, data)
		),
		declineDraw: createSocketHandler("declineDraw", (socket, data) =>
			socketHandler.handleDeclineDraw(socket, data)
		),
		requestRematch: createSocketHandler("requestRematch", (socket, data) =>
			socketHandler.handleRematchRequest(socket, data)
		),
		createRoom: createSocketHandler("createRoom", (socket, data) =>
			socketHandler.handleCreateRoom(socket, data)
		),
		updateRoomSettings: createSocketHandler(
			"updateRoomSettings",
			(socket, data) =>
				socketHandler.handleUpdateRoomSettings(socket, data)
		),
		chatMessage: createSocketHandler("chatMessage", (socket, data) =>
			chatManager.handleChatMessage(socket, data)
		),
		disconnect: createSocketHandler("disconnect", (socket) =>
			socketHandler.handleDisconnect(socket)
		),
	};

	Object.entries(handlers).forEach(([event, handler]) => {
		socket.on(event, (data) => handler(socket, data));
	});

	socket.on("ping", () => {
		try {
			socket.emit("pong");
		} catch (error) {
			logError("ping", error, socket.id);
		}
	});

	socket.on("error", (error) => {
		logError("socket", error, socket.id);
	});

	socket.on("disconnect", (reason) => {
		console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
		handlers.disconnect(socket);
	});
});

io.engine.on("connection_error", (error) => {
	logError("connection", error);
});

function keepAlive() {
	const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

	fetch(`${url}/health`)
		.then((response) => {
			if (response.ok) {
				console.log(
					`✅ Keep-alive ping successful at ${new Date().toISOString()}`
				);
			} else {
				console.log(
					`⚠️ Keep-alive ping failed with status: ${response.status}`
				);
			}
		})
		.catch((error) => {
			console.log(`❌ Keep-alive ping error: ${error.message}`);
		});
}

if (process.env.NODE_ENV === "production") {
	setInterval(keepAlive, 14 * 60 * 1000);
	console.log("🔄 Keep-alive pings enabled");
}

process.on("uncaughtException", (error) => {
	console.error("💥 Uncaught Exception:", error);

	try {
		gameManager?.cleanup();
		chatManager?.cleanup();
	} catch (cleanupError) {
		console.error("❌ Cleanup error:", cleanupError);
	}

	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);

	if (process.env.NODE_ENV !== "production") {
		process.exit(1);
	}
});

process.on("SIGINT", () => {
	console.log("\n🛑 Received SIGINT, shutting down gracefully...");

	try {
		gameManager?.cleanup();
		chatManager?.cleanup();

		httpServer.close(() => {
			console.log("✅ Server closed gracefully");
			process.exit(0);
		});

		setTimeout(() => {
			console.log("⏰ Forcing exit after timeout");
			process.exit(1);
		}, 10000);
	} catch (error) {
		console.error("❌ Error during shutdown:", error);
		process.exit(1);
	}
});

httpServer
	.listen(PORT, () => {
		console.log(`♟️ Chess server listening on port ${PORT}`);
		console.log(`🌐 Allowed origins: ${CORS_ORIGIN.join(", ")}`);
	})
	.on("error", (error) => {
		console.error("❌ Server startup error:", error);
		process.exit(1);
	});

httpServer.on("error", (error) => {
	console.error("❌ HTTP Server error:", error);
});
