import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { Chess } from "chess.js";

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

const rooms = new Map();
const matchmakingQueue = [];
const playerRooms = new Map();

const generateRoomCode = () => {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	return Array.from(
		{ length: 6 },
		() => chars[Math.floor(Math.random() * chars.length)]
	).join("");
};

const createGameState = (timeControlMinutes) => {
	const game = new Chess();
	const timeInCentiseconds = timeControlMinutes * 60 * 100;
	const now = Date.now();

	return {
		chess: game,
		fen: game.fen(),
		currentPlayer: "white",
		moves: [],
		isGameOver: false,
		gameOverReason: null,
		winner: null,
		lastMove: null,
		timeControl: timeInCentiseconds,
		whiteTimeRemaining: timeInCentiseconds,
		blackTimeRemaining: timeInCentiseconds,
		lastMoveTimestamp: now,
		gameStartTime: now,
		isPaused: false,
	};
};

const removeFromQueue = (socketId) => {
	const index = matchmakingQueue.findIndex((p) => p.socketId === socketId);
	if (index !== -1) {
		matchmakingQueue.splice(index, 1);
		return true;
	}
	return false;
};

const updateTimerForCurrentPlayer = (gameState) => {
	if (gameState.isGameOver || gameState.isPaused) {
		return;
	}

	const now = Date.now();
	const elapsedMs = now - gameState.lastMoveTimestamp;
	const elapsedCentiseconds = Math.floor(elapsedMs / 10);

	if (gameState.currentPlayer === "white") {
		gameState.whiteTimeRemaining = Math.max(
			0,
			gameState.whiteTimeRemaining - elapsedCentiseconds
		);
	} else {
		gameState.blackTimeRemaining = Math.max(
			0,
			gameState.blackTimeRemaining - elapsedCentiseconds
		);
	}

	gameState.lastMoveTimestamp = now;
};

const getKingInCheckSquare = (chess) => {
	if (!chess.inCheck()) return null;

	const board = chess.board();
	const currentPlayerColor = chess.turn();

	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const piece = board[row][col];
			if (piece?.type === "k" && piece.color === currentPlayerColor) {
				const file = String.fromCharCode(97 + col);
				const rank = 8 - row;
				return file + rank;
			}
		}
	}
	return null;
};

const checkGameOver = (room) => {
	const { chess } = room.gameState;

	updateTimerForCurrentPlayer(room.gameState);

	let reason = null;
	let winner = null;

	if (room.gameState.whiteTimeRemaining <= 0) {
		winner = "black";
		reason = "timeout";
	} else if (room.gameState.blackTimeRemaining <= 0) {
		winner = "white";
		reason = "timeout";
	}

	// game over conditions
	if (!reason) {
		if (chess.isCheckmate()) {
			winner = chess.turn() === "w" ? "black" : "white";
			reason = "checkmate";
		} else if (chess.isStalemate()) {
			reason = "stalemate";
		} else if (chess.isDraw()) {
			reason = "draw";
		} else if (chess.isThreefoldRepetition()) {
			reason = "threefold repetition";
		} else if (chess.isInsufficientMaterial()) {
			reason = "insufficient material";
		}
	}

	if (reason) {
		room.gameState.isGameOver = true;
		room.gameState.gameOverReason = reason;
		room.gameState.winner = winner;
		room.gameState.isPaused = true;
		return true;
	}

	return false;
};

const validateMove = (room, playerId, moveData) => {
	const player = room.players.find((p) => p.id === playerId);
	if (!player) return { valid: false, reason: "Player not found" };

	if (player.color !== room.gameState.currentPlayer) {
		return { valid: false, reason: "Not your turn" };
	}

	if (room.gameState.isGameOver) {
		return { valid: false, reason: "Game is over" };
	}

	if (checkGameOver(room)) {
		return { valid: false, reason: "Time expired" };
	}

	const moveObject = {
		from: moveData.from,
		to: moveData.to,
	};

	// promotion
	const piece = room.gameState.chess.get(moveData.from);
	const isPromotion =
		piece?.type === "p" &&
		((piece.color === "w" && moveData.to[1] === "8") ||
			(piece.color === "b" && moveData.to[1] === "1"));

	if (isPromotion && moveData.promotion) {
		moveObject.promotion = moveData.promotion;
	}

	try {
		const move = room.gameState.chess.move(moveObject);
		return move
			? { valid: true, move }
			: { valid: false, reason: "Invalid move" };
	} catch (error) {
		return { valid: false, reason: "Invalid move" };
	}
};

const applyMove = (room, move) => {
	const now = Date.now();

	// update time for the player who moved
	updateTimerForCurrentPlayer(room.gameState);

	// apply the move
	room.gameState.fen = room.gameState.chess.fen();
	room.gameState.currentPlayer =
		room.gameState.currentPlayer === "white" ? "black" : "white";
	room.gameState.lastMove = move;
	room.gameState.lastMoveTimestamp = now;
	room.gameState.moves.push(move);

	// check for game over after the move
	checkGameOver(room);
};

const getGameStateForBroadcast = (room) => {
	// ensure timer is up to date
	updateTimerForCurrentPlayer(room.gameState);

	const kingInCheck = getKingInCheckSquare(room.gameState.chess);

	return {
		fen: room.gameState.fen,
		currentPlayer: room.gameState.currentPlayer,
		moves: room.gameState.moves,
		isGameOver: room.gameState.isGameOver,
		gameOverReason: room.gameState.gameOverReason,
		winner: room.gameState.winner,
		whiteTimeRemaining: room.gameState.whiteTimeRemaining,
		blackTimeRemaining: room.gameState.blackTimeRemaining,
		lastMove: room.gameState.lastMove,
		kingInCheck,
		timestamp: Date.now(),
	};
};

const broadcastGameState = (roomCode) => {
	const room = rooms.get(roomCode);
	if (!room) return;

	const gameState = getGameStateForBroadcast(room);
	io.to(roomCode).emit("gameState", { gameState, players: room.players });
};

let gameTimer = setInterval(() => {
	for (const [roomCode, room] of rooms.entries()) {
		if (!room.gameState.isGameOver && !room.gameState.isPaused) {
			// check if time has expired
			if (checkGameOver(room)) {
				broadcastGameState(roomCode);
			} else {
				const gameState = getGameStateForBroadcast(room);
				io.to(roomCode).emit("timeUpdate", {
					whiteTimeRemaining: gameState.whiteTimeRemaining,
					blackTimeRemaining: gameState.blackTimeRemaining,
					currentPlayer: gameState.currentPlayer,
					timestamp: gameState.timestamp,
				});
			}
		}
	}
}, 100);

// socket event handlers
const handleJoinRoom = (socket, { roomCode, playerName, flag }) => {
	const room = rooms.get(roomCode);
	if (!room) {
		socket.emit("roomNotFound", { message: "Room not found" });
		return;
	}

	let player = room.players.find(
		(p) => p.name === playerName || p.id === socket.id
	);
	if (!player) {
		socket.emit("initializationError", {
			message: "Player not found in room",
		});
		return;
	}

	// update player socket ID and flag
	if (player.id !== socket.id) {
		playerRooms.delete(player.id);
		player.id = socket.id;
	}

	// update flag if provided
	if (flag) {
		player.flag = flag;
	}

	socket.join(roomCode);
	playerRooms.set(socket.id, roomCode);

	const gameState = getGameStateForBroadcast(room);
	const opponent = room.players.find((p) => p.id !== socket.id);

	setTimeout(() => {
		socket.emit("gameInitialized", {
			gameState,
			playerColor: player.color,
			opponent,
			roomCode,
		});

		socket.to(roomCode).emit("playerJoined", {
			playerName: player.name,
			playerColor: player.color,
			flag: player.flag,
		});
	}, 100);
};

const handleRejoinRoom = (socket, { roomCode, flag }) => {
	const room = rooms.get(roomCode) || rooms.get(playerRooms.get(socket.id));
	if (!room) {
		socket.emit("initializationError", { message: "Room not found" });
		return;
	}

	const player = room.players.find((p) => p.id === socket.id);
	if (!player) {
		socket.emit("initializationError", {
			message: "Player not found in room",
		});
		return;
	}

	// update flag if provided
	if (flag) {
		player.flag = flag;
	}

	socket.join(room.roomCode);
	playerRooms.set(socket.id, room.roomCode);

	// resume game if paused
	if (room.gameState.isPaused && !room.gameState.isGameOver) {
		room.gameState.isPaused = false;
		room.gameState.lastMoveTimestamp = Date.now();
	}

	const gameState = getGameStateForBroadcast(room);
	const opponent = room.players.find((p) => p.id !== socket.id);

	setTimeout(() => {
		socket.emit("gameInitialized", {
			gameState,
			playerColor: player.color,
			opponent,
			roomCode: room.roomCode,
		});
	}, 100);
};

const handleMakeMove = (socket, { roomCode, move }) => {
	const room = rooms.get(roomCode) || rooms.get(playerRooms.get(socket.id));
	if (!room) {
		socket.emit("moveRejected", { reason: "Room not found" });
		return;
	}

	const player = room.players.find((p) => p.id === socket.id);
	if (!player) {
		socket.emit("moveRejected", { reason: "Player not found in room" });
		return;
	}

	const validation = validateMove(room, socket.id, move);
	if (!validation.valid) {
		socket.emit("moveRejected", { reason: validation.reason });
		return;
	}

	applyMove(room, validation.move);
	broadcastGameState(room.roomCode);
};

const handleFindMatch = (socket, { timeControl, playerName, flag }) => {
	// clean up existing connections
	const existingRoom = playerRooms.get(socket.id);
	if (existingRoom) {
		playerRooms.delete(socket.id);
		socket.leave(existingRoom);
	}
	removeFromQueue(socket.id);

	// find waiting opponent
	const opponentIndex = matchmakingQueue.findIndex(
		(p) => p.timeControl === timeControl && p.socketId !== socket.id
	);

	if (opponentIndex === -1) {
		// join queue
		matchmakingQueue.push({
			socketId: socket.id,
			playerName,
			timeControl,
			flag: flag || "PH", // Default to Philippines flag
			timestamp: Date.now(),
		});

		socket.emit("queueJoined", {
			position: matchmakingQueue.length,
			timeControl,
		});
		return;
	}

	// match found
	const opponent = matchmakingQueue[opponentIndex];
	matchmakingQueue.splice(opponentIndex, 1);

	// create game room
	const roomCode = generateRoomCode();
	const gameState = createGameState(timeControl);
	const colors =
		Math.random() < 0.5 ? ["white", "black"] : ["black", "white"];

	const room = {
		roomCode,
		gameState,
		players: [
			{
				id: opponent.socketId,
				name: opponent.playerName,
				color: colors[0],
				flag: opponent.flag || "PH",
			},
			{
				id: socket.id,
				name: playerName,
				color: colors[1],
				flag: flag || "PH",
			},
		],
		timeControl,
		createdAt: Date.now(),
	};

	rooms.set(roomCode, room);
	playerRooms.set(opponent.socketId, roomCode);
	playerRooms.set(socket.id, roomCode);

	const opponentSocket = io.sockets.sockets.get(opponent.socketId);

	// verify both players connected
	if (!opponentSocket?.connected || !socket.connected) {
		rooms.delete(roomCode);
		playerRooms.delete(opponent.socketId);
		playerRooms.delete(socket.id);

		if (socket.connected) {
			matchmakingQueue.push({
				socketId: socket.id,
				playerName,
				timeControl,
				flag: flag || "PH",
				timestamp: Date.now(),
			});
			socket.emit("queueJoined", {
				position: matchmakingQueue.length,
				timeControl,
			});
		}
		return;
	}

	socket.join(roomCode);
	opponentSocket.join(roomCode);

	const baseGameState = getGameStateForBroadcast(room);

	// send match data to both players
	const createMatchData = (color, opponentData) => ({
		roomCode,
		yourColor: color,
		opponent: opponentData,
		timeControl,
		gameState: baseGameState,
	});

	opponentSocket.emit(
		"matchFound",
		createMatchData(colors[0], {
			name: playerName,
			color: colors[1],
			flag: flag || "PH",
		})
	);

	socket.emit(
		"matchFound",
		createMatchData(colors[1], {
			name: opponent.playerName,
			color: colors[0],
			flag: opponent.flag || "PH",
		})
	);
};

const handleDisconnect = (socket) => {
	const roomCode = playerRooms.get(socket.id);
	if (roomCode) {
		const room = rooms.get(roomCode);
		if (room) {
			const player = room.players.find((p) => p.id === socket.id);
			if (player) {
				socket.to(roomCode).emit("playerDisconnected", {
					playerName: player.name,
					playerColor: player.color,
					flag: player.flag,
				});

				if (!room.gameState.isGameOver) {
					room.gameState.isPaused = true;
				}
			}
		}
	}

	removeFromQueue(socket.id);
};

io.on("connection", (socket) => {
	socket.on("joinRoom", (data) => handleJoinRoom(socket, data));
	socket.on("rejoinRoom", (data) => handleRejoinRoom(socket, data));
	socket.on("makeMove", (data) => handleMakeMove(socket, data));
	socket.on("findMatch", (data) => handleFindMatch(socket, data));
	socket.on("disconnect", () => handleDisconnect(socket));
	socket.on("ping", () => socket.emit("pong"));
});

// cleanup on exit
process.on("SIGINT", () => {
	clearInterval(gameTimer);
	httpServer.close(() => {
		console.log("Server closed");
		process.exit(0);
	});
});

httpServer.listen(5000, () => {
	console.log("Chess server listening on port 5000");
});
