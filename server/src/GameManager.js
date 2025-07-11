import { Chess } from "chess.js";
import { generateRoomCode } from "./utils/roomUtils.js";
import { getKingInCheck } from "./utils/gameUtils.js";

export class GameManager {
	constructor(io) {
		this.io = io;
		this.rooms = new Map();
		this.matchmakingQueue = [];
		this.playerRooms = new Map();
		this.gameTimer = null;
		this.startTimer();
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

	createPrivateRoom(timeControl, playerName, preferredColor, flag, socketId) {
		const roomCode = generateRoomCode();
		const gameState = this.createGameState(timeControl);

		const room = {
			roomCode,
			gameState,
			players: [
				{
					id: socketId,
					name: playerName,
					color: preferredColor,
					flag: flag?.toLowerCase(),
					isHost: true,
				},
			],
			timeControl,
			createdAt: Date.now(),
			isPrivate: true,
			hostPreferredColor: preferredColor,
			waitingForOpponent: true,
			rematchRequests: new Set(),
		};

		this.rooms.set(roomCode, room);
		this.playerRooms.set(socketId, roomCode);

		return { roomCode, room, player: room.players[0] };
	}

	joinPrivateRoom(roomCode, playerName, flag, socketId) {
		const room = this.rooms.get(roomCode);
		if (!room) return { success: false, reason: "Room not found" };

		const existingPlayer = room.players.find(
			(p) => p.id === socketId || p.name === playerName
		);
		if (existingPlayer) {
			existingPlayer.id = socketId;
			this.playerRooms.set(socketId, roomCode);
			return { success: true, room, isHost: existingPlayer.isHost };
		}

		if (room.players.length >= 2) {
			return { success: false, reason: "Room is full" };
		}

		if (room.isPrivate) {
			const opponentColor =
				room.hostPreferredColor === "white" ? "black" : "white";
			room.players.push({
				id: socketId,
				name: playerName,
				color: opponentColor,
				flag: flag?.toLowerCase(),
				isHost: false,
			});

			room.waitingForOpponent = false;
			this.playerRooms.set(socketId, roomCode);

			return { success: true, room, isHost: false, gameReady: true };
		}

		this.playerRooms.set(socketId, roomCode);
		return { success: true, room, isHost: false, gameReady: true };
	}

	createMatchmakingRoom(player1, player2, timeControl, roomCode) {
		const gameState = this.createGameState(timeControl);
		const colors =
			Math.random() < 0.5 ? ["white", "black"] : ["black", "white"];

		const room = {
			roomCode,
			gameState,
			players: [
				{
					id: player1.socketId,
					name: player1.playerName,
					color: colors[0],
					flag: player1.flag,
				},
				{
					id: player2.socketId,
					name: player2.playerName,
					color: colors[1],
					flag: player2.flag,
				},
			],
			timeControl,
			createdAt: Date.now(),
			isPrivate: false,
			waitingForOpponent: false,
			rematchRequests: new Set(),
		};

		this.rooms.set(roomCode, room);
		this.playerRooms.set(player1.socketId, roomCode);
		this.playerRooms.set(player2.socketId, roomCode);

		return room;
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

	checkGameOver(room) {
		const { chess } = room.gameState;
		this.updateTimer(room.gameState);

		let reason = null;
		let winner = null;
		let endedBy = "natural";

		if (room.gameState.surrenderedPlayer) {
			winner =
				room.gameState.surrenderedPlayer === "white"
					? "black"
					: "white";
			reason = "resignation";
			endedBy = "resignation";
		} else if (room.gameState.whiteTimeRemaining <= 0) {
			winner = "black";
			reason = "timeout";
			endedBy = "timeout";
		} else if (room.gameState.blackTimeRemaining <= 0) {
			winner = "white";
			reason = "timeout";
			endedBy = "timeout";
		} else if (room.gameState.drawOffers.size === 2) {
			reason = "draw by agreement";
			endedBy = "draw-offer";
		} else if (chess.isCheckmate()) {
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
		if (player.color !== room.gameState.currentPlayer) {
			return { valid: false, reason: "Not your turn" };
		}
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
		const kingInCheck = getKingInCheck(room.gameState.chess);

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
		this.io
			.to(roomCode)
			.emit("gameState", { gameState, players: room.players });
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

	findMatchingOpponent(timeControl, socketId) {
		return this.matchmakingQueue.findIndex(
			(p) => p.timeControl === timeControl && p.socketId !== socketId
		);
	}

	addToQueue(socketId, playerName, timeControl, flag) {
		this.matchmakingQueue.push({
			socketId,
			playerName,
			timeControl,
			flag: flag?.toLowerCase(),
			timestamp: Date.now(),
		});
	}

	startTimer() {
		this.gameTimer = setInterval(() => {
			for (const [roomCode, room] of this.rooms.entries()) {
				if (!room.gameState.isGameOver && !room.gameState.isPaused) {
					if (this.checkGameOver(room)) {
						this.broadcastGameState(roomCode);
					} else {
						const gameState = this.getGameStateForBroadcast(room);
						this.io.to(roomCode).emit("timeUpdate", {
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
