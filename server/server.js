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

class GameManager {
	constructor() {
		this.rooms = new Map();
		this.matchmakingQueue = [];
		this.playerRooms = new Map();
		this.gameTimer = null;
		this.startTimer();
	}

	generateRoomCode() {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		return Array.from(
			{ length: 6 },
			() => chars[Math.floor(Math.random() * chars.length)]
		).join("");
	}

	createGameState(timeControlMinutes) {
		const chess = new Chess();
		const timeInCentiseconds = timeControlMinutes * 60 * 100;
		const now = Date.now();

		return {
			chess,
			fen: chess.fen(),
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
			drawOffers: new Set(),
			surrenderedPlayer: null,
			gameEndedBy: null,
		};
	}

	updateTimer(gameState) {
		if (gameState.isGameOver || gameState.isPaused) return;

		const now = Date.now();
		const elapsed = Math.floor((now - gameState.lastMoveTimestamp) / 10);

		if (gameState.currentPlayer === "white") {
			gameState.whiteTimeRemaining = Math.max(
				0,
				gameState.whiteTimeRemaining - elapsed
			);
		} else {
			gameState.blackTimeRemaining = Math.max(
				0,
				gameState.blackTimeRemaining - elapsed
			);
		}

		gameState.lastMoveTimestamp = now;
	}

	getKingInCheck(chess) {
		if (!chess.inCheck()) return null;

		const board = chess.board();
		const turn = chess.turn();

		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const piece = board[row][col];
				if (piece?.type === "k" && piece.color === turn) {
					return String.fromCharCode(97 + col) + (8 - row);
				}
			}
		}
		return null;
	}

	checkGameOver(room) {
		const { chess } = room.gameState;
		this.updateTimer(room.gameState);

		let reason = null;
		let winner = null;
		let endedBy = "natural";

		// Check surrender
		if (room.gameState.surrenderedPlayer) {
			winner =
				room.gameState.surrenderedPlayer === "white"
					? "black"
					: "white";
			reason = "resignation";
			endedBy = "resignation";
		}
		// Check timeout
		else if (room.gameState.whiteTimeRemaining <= 0) {
			winner = "black";
			reason = "timeout";
			endedBy = "timeout";
		} else if (room.gameState.blackTimeRemaining <= 0) {
			winner = "white";
			reason = "timeout";
			endedBy = "timeout";
		}
		// Check mutual draw
		else if (room.gameState.drawOffers.size === 2) {
			reason = "draw by agreement";
			endedBy = "draw-offer";
		}
		// Natural endings
		else if (chess.isCheckmate()) {
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

		if (reason) {
			Object.assign(room.gameState, {
				isGameOver: true,
				gameOverReason: reason,
				winner,
				gameEndedBy: endedBy,
				isPaused: true,
			});
			return true;
		}

		return false;
	}

	validateMove(room, playerId, moveData) {
		const player = room.players.find((p) => p.id === playerId);
		if (!player) return { valid: false, reason: "Player not found" };
		if (player.color !== room.gameState.currentPlayer)
			return { valid: false, reason: "Not your turn" };
		if (room.gameState.isGameOver)
			return { valid: false, reason: "Game is over" };
		if (this.checkGameOver(room))
			return { valid: false, reason: "Time expired" };

		const moveObject = { from: moveData.from, to: moveData.to };
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
		} catch {
			return { valid: false, reason: "Invalid move" };
		}
	}

	applyMove(room, move) {
		this.updateTimer(room.gameState);

		Object.assign(room.gameState, {
			fen: room.gameState.chess.fen(),
			currentPlayer:
				room.gameState.currentPlayer === "white" ? "black" : "white",
			lastMove: move,
			lastMoveTimestamp: Date.now(),
		});

		room.gameState.moves.push(move);
		room.gameState.drawOffers.clear();
		this.checkGameOver(room);
	}

	getGameStateForBroadcast(room) {
		this.updateTimer(room.gameState);
		const kingInCheck = this.getKingInCheck(room.gameState.chess);

		return {
			fen: room.gameState.fen,
			currentPlayer: room.gameState.currentPlayer,
			moves: room.gameState.moves,
			isGameOver: room.gameState.isGameOver,
			gameOverReason: room.gameState.gameOverReason,
			winner: room.gameState.winner,
			gameEndedBy: room.gameState.gameEndedBy,
			whiteTimeRemaining: room.gameState.whiteTimeRemaining,
			blackTimeRemaining: room.gameState.blackTimeRemaining,
			lastMove: room.gameState.lastMove,
			kingInCheck,
			drawOffers: Array.from(room.gameState.drawOffers),
			surrenderedPlayer: room.gameState.surrenderedPlayer,
			timestamp: Date.now(),
		};
	}

	broadcastGameState(roomCode) {
		const room = this.rooms.get(roomCode);
		if (!room) return;

		const gameState = this.getGameStateForBroadcast(room);
		io.to(roomCode).emit("gameState", { gameState, players: room.players });
	}

	removeFromQueue(socketId) {
		const index = this.matchmakingQueue.findIndex(
			(p) => p.socketId === socketId
		);
		if (index !== -1) {
			this.matchmakingQueue.splice(index, 1);
			return true;
		}
		return false;
	}

	startTimer() {
		this.gameTimer = setInterval(() => {
			for (const [roomCode, room] of this.rooms.entries()) {
				if (!room.gameState.isGameOver && !room.gameState.isPaused) {
					if (this.checkGameOver(room)) {
						this.broadcastGameState(roomCode);
					} else {
						const gameState = this.getGameStateForBroadcast(room);
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
	}

	cleanup() {
		if (this.gameTimer) {
			clearInterval(this.gameTimer);
		}
	}
}

class SocketHandler {
	constructor(gameManager) {
		this.gm = gameManager;
	}

	handleJoinRoom(socket, { roomCode, playerName, flag }) {
		const room = this.gm.rooms.get(roomCode);
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

		if (player.id !== socket.id) {
			this.gm.playerRooms.delete(player.id);
			player.id = socket.id;
		}
		if (flag) player.flag = flag.toLowerCase();

		socket.join(roomCode);
		this.gm.playerRooms.set(socket.id, roomCode);

		const gameState = this.gm.getGameStateForBroadcast(room);
		const opponent = room.players.find((p) => p.id !== socket.id);

		setTimeout(() => {
			socket.emit("gameInitialized", {
				gameState,
				playerColor: player.color,
				opponent: opponent
					? {
							name: opponent.name,
							color: opponent.color,
							flag: opponent.flag,
					  }
					: null,
				roomCode,
			});

			socket.to(roomCode).emit("playerJoined", {
				playerName: player.name,
				playerColor: player.color,
				flag: player.flag,
			});
		}, 100);
	}

	handleRejoinRoom(socket, { roomCode, flag }) {
		const room =
			this.gm.rooms.get(roomCode) ||
			this.gm.rooms.get(this.gm.playerRooms.get(socket.id));
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

		if (flag) player.flag = flag.toLowerCase();

		socket.join(room.roomCode);
		this.gm.playerRooms.set(socket.id, room.roomCode);

		if (room.gameState.isPaused && !room.gameState.isGameOver) {
			room.gameState.isPaused = false;
			room.gameState.lastMoveTimestamp = Date.now();
		}

		const gameState = this.gm.getGameStateForBroadcast(room);
		const opponent = room.players.find((p) => p.id !== socket.id);

		setTimeout(() => {
			socket.emit("gameInitialized", {
				gameState,
				playerColor: player.color,
				opponent: opponent
					? {
							name: opponent.name,
							color: opponent.color,
							flag: opponent.flag,
					  }
					: null,
				roomCode: room.roomCode,
			});
		}, 100);
	}

	handleMakeMove(socket, { roomCode, move }) {
		const room =
			this.gm.rooms.get(roomCode) ||
			this.gm.rooms.get(this.gm.playerRooms.get(socket.id));
		if (!room) {
			socket.emit("moveRejected", { reason: "Room not found" });
			return;
		}

		const validation = this.gm.validateMove(room, socket.id, move);
		if (!validation.valid) {
			socket.emit("moveRejected", { reason: validation.reason });
			return;
		}

		this.gm.applyMove(room, validation.move);
		this.gm.broadcastGameState(room.roomCode);
	}

	handleFindMatch(socket, { timeControl, playerName, flag }) {
		const existingRoom = this.gm.playerRooms.get(socket.id);
		if (existingRoom) {
			this.gm.playerRooms.delete(socket.id);
			socket.leave(existingRoom);
		}
		this.gm.removeFromQueue(socket.id);

		const opponentIndex = this.gm.matchmakingQueue.findIndex(
			(p) => p.timeControl === timeControl && p.socketId !== socket.id
		);

		if (opponentIndex === -1) {
			this.gm.matchmakingQueue.push({
				socketId: socket.id,
				playerName,
				timeControl,
				flag: flag?.toLowerCase(),
				timestamp: Date.now(),
			});

			socket.emit("queueJoined", {
				position: this.gm.matchmakingQueue.length,
				timeControl,
			});
			return;
		}

		const opponent = this.gm.matchmakingQueue[opponentIndex];
		this.gm.matchmakingQueue.splice(opponentIndex, 1);

		const roomCode = this.gm.generateRoomCode();
		const gameState = this.gm.createGameState(timeControl);
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
					flag: opponent.flag,
				},
				{
					id: socket.id,
					name: playerName,
					color: colors[1],
					flag: flag?.toLowerCase(),
				},
			],
			timeControl,
			createdAt: Date.now(),
			rematchRequests: new Set(),
		};

		this.gm.rooms.set(roomCode, room);
		this.gm.playerRooms.set(opponent.socketId, roomCode);
		this.gm.playerRooms.set(socket.id, roomCode);

		const opponentSocket = io.sockets.sockets.get(opponent.socketId);

		if (!opponentSocket?.connected || !socket.connected) {
			this.gm.rooms.delete(roomCode);
			this.gm.playerRooms.delete(opponent.socketId);
			this.gm.playerRooms.delete(socket.id);

			if (socket.connected) {
				this.gm.matchmakingQueue.push({
					socketId: socket.id,
					playerName,
					timeControl,
					flag: flag?.toLowerCase(),
					timestamp: Date.now(),
				});
				socket.emit("queueJoined", {
					position: this.gm.matchmakingQueue.length,
					timeControl,
				});
			}
			return;
		}

		socket.join(roomCode);
		opponentSocket.join(roomCode);

		const baseGameState = this.gm.getGameStateForBroadcast(room);

		opponentSocket.emit("matchFound", {
			roomCode,
			yourColor: colors[0],
			opponent: {
				name: playerName,
				color: colors[1],
				flag: flag?.toLowerCase(),
			},
			timeControl,
			gameState: baseGameState,
		});

		socket.emit("matchFound", {
			roomCode,
			yourColor: colors[1],
			opponent: {
				name: opponent.playerName,
				color: colors[0],
				flag: opponent.flag,
			},
			timeControl,
			gameState: baseGameState,
		});
	}

	handleSurrender(socket, { roomCode }) {
		const room =
			this.gm.rooms.get(roomCode) ||
			this.gm.rooms.get(this.gm.playerRooms.get(socket.id));
		if (!room) {
			socket.emit("error", { message: "Room not found" });
			return;
		}

		const player = room.players.find((p) => p.id === socket.id);
		if (!player || room.gameState.isGameOver) {
			socket.emit("error", { message: "Invalid surrender request" });
			return;
		}

		room.gameState.surrenderedPlayer = player.color;
		this.gm.checkGameOver(room);
		this.gm.broadcastGameState(room.roomCode);

		io.to(room.roomCode).emit("playerSurrendered", {
			playerName: player.name,
			playerColor: player.color,
			winner: player.color === "white" ? "black" : "white",
		});
	}

	handleDrawOffer(socket, { roomCode }) {
		const room =
			this.gm.rooms.get(roomCode) ||
			this.gm.rooms.get(this.gm.playerRooms.get(socket.id));
		if (!room) {
			socket.emit("error", { message: "Room not found" });
			return;
		}

		const player = room.players.find((p) => p.id === socket.id);
		if (!player || room.gameState.isGameOver) {
			socket.emit("error", { message: "Invalid draw offer" });
			return;
		}

		room.gameState.drawOffers.add(player.color);

		if (room.gameState.drawOffers.size === 2) {
			this.gm.checkGameOver(room);
			this.gm.broadcastGameState(room.roomCode);
		} else {
			const opponent = room.players.find((p) => p.id !== socket.id);
			if (opponent) {
				io.to(opponent.id).emit("drawOffered", {
					from: player.name,
					fromColor: player.color,
				});
			}
		}
	}

	handleAcceptDraw(socket, { roomCode }) {
		const room =
			this.gm.rooms.get(roomCode) ||
			this.gm.rooms.get(this.gm.playerRooms.get(socket.id));
		if (!room) return;

		const player = room.players.find((p) => p.id === socket.id);
		if (!player || room.gameState.isGameOver) return;

		room.gameState.drawOffers.add(player.color);

		if (room.gameState.drawOffers.size === 2) {
			this.gm.checkGameOver(room);
			this.gm.broadcastGameState(room.roomCode);
		}
	}

	handleDeclineDraw(socket, { roomCode }) {
		const room =
			this.gm.rooms.get(roomCode) ||
			this.gm.rooms.get(this.gm.playerRooms.get(socket.id));
		if (!room) return;

		const player = room.players.find((p) => p.id === socket.id);
		if (!player) return;

		room.gameState.drawOffers.clear();

		const opponent = room.players.find((p) => p.id !== socket.id);
		if (opponent) {
			io.to(opponent.id).emit("drawDeclined", {
				by: player.name,
				byColor: player.color,
			});
		}
	}

	handleRematchRequest(socket, { roomCode }) {
		const room =
			this.gm.rooms.get(roomCode) ||
			this.gm.rooms.get(this.gm.playerRooms.get(socket.id));
		if (!room) return;

		const player = room.players.find((p) => p.id === socket.id);
		if (!player || !room.gameState.isGameOver) return;

		room.rematchRequests.add(player.color);

		if (room.rematchRequests.size === 2) {
			// Reset game state
			room.gameState = this.gm.createGameState(room.timeControl / 6000);

			// Swap colors
			const [player1, player2] = room.players;
			[player1.color, player2.color] = [player2.color, player1.color];

			room.rematchRequests.clear();

			this.gm.broadcastGameState(room.roomCode);

			io.to(room.roomCode).emit("rematchStarted", {
				players: room.players.map((p) => ({
					name: p.name,
					color: p.color,
					flag: p.flag,
				})),
			});
		} else {
			const opponent = room.players.find((p) => p.id !== socket.id);
			if (opponent) {
				io.to(opponent.id).emit("rematchRequested", {
					from: player.name,
					fromColor: player.color,
				});
			}
		}
	}

	handleDisconnect(socket) {
		const roomCode = this.gm.playerRooms.get(socket.id);
		if (roomCode) {
			const room = this.gm.rooms.get(roomCode);
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

		this.gm.removeFromQueue(socket.id);
	}
}

const gameManager = new GameManager();
const socketHandler = new SocketHandler(gameManager);

// Socket connection handling
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
