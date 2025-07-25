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
		this.chatManager = null;
		this.startTimer();
	}

	createGameState(timeControlMinutes, increment = 0) {
		const chess = new Chess();
		const timeInCentiseconds = timeControlMinutes * 60 * 100;
		const incrementInCentiseconds = increment * 100;
		const now = Date.now();

		return {
			chess,
			fen: chess.fen(),
			currentPlayer: "white",
			moves: [],
			increment: incrementInCentiseconds,
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

	createPrivateRoom(
		timeControl,
		increment,
		playerName,
		preferredColor,
		flag,
		socketId
	) {
		const roomCode = generateRoomCode();
		const gameState = this.createGameState(timeControl, increment);

		const room = {
			roomCode,
			gameState,
			increment,
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
			const host = room.players.find((p) => p.isHost);
			const hostColor = host ? host.color : room.hostPreferredColor;
			const opponentColor = hostColor === "white" ? "black" : "white";

			room.players.push({
				id: socketId,
				name: playerName,
				color: opponentColor,
				flag: flag?.toLowerCase(),
				isHost: false,
			});

			room.gameState.increment = room.increment * 100;

			room.waitingForOpponent = false;
			this.playerRooms.set(socketId, roomCode);

			return { success: true, room, isHost: false, gameReady: true };
		}

		this.playerRooms.set(socketId, roomCode);
		return { success: true, room, isHost: false, gameReady: true };
	}

	createMatchmakingRoom(player1, player2, timeControl, roomCode) {
		const gameState = this.createGameState(timeControl, 0);
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
			increment: 0,
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
			room.gameState.isGameOver = true;
			room.gameState.gameOverReason = reason;
			room.gameState.winner = winner;
			room.gameState.gameEndedBy = endedBy;
			room.gameState.isPaused = true;
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
		room.gameState.fen = room.gameState.chess.fen();

		const currentPlayer = room.gameState.currentPlayer;
		const increment = room.gameState.increment || 0;

		if (currentPlayer === "white") {
			room.gameState.whiteTimeRemaining += increment;
		} else {
			room.gameState.blackTimeRemaining += increment;
		}

		room.gameState.currentPlayer =
			room.gameState.currentPlayer === "white" ? "black" : "white";
		room.gameState.lastMove = move;
		room.gameState.lastMoveTimestamp = Date.now();
		room.gameState.moves.push(move);
		room.gameState.drawOffers.clear();
	}

	getGameStateForBroadcast(room) {
		const kingInCheck = getKingInCheck(room.gameState.chess);

		return {
			fen: room.gameState.fen,
			currentPlayer: room.gameState.currentPlayer,
			moves: room.gameState.moves,
			increment: room.gameState.increment,
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

	broadcastTimeUpdate(room) {
		this.io.to(room.roomCode).emit("timeUpdate", {
			whiteTimeRemaining: room.gameState.whiteTimeRemaining,
			blackTimeRemaining: room.gameState.blackTimeRemaining,
			currentPlayer: room.gameState.currentPlayer,
			timestamp: Date.now(),
		});
	}

	removeFromQueue(socketId) {
		const originalLength = this.matchmakingQueue.length;
		this.matchmakingQueue = this.matchmakingQueue.filter(
			(player) => player.socketId !== socketId
		);
		return this.matchmakingQueue.length !== originalLength;
	}

	findMatchingOpponent(timeControl, currentSocketId) {
		return this.matchmakingQueue.findIndex((queuedPlayer) => {
			return (
				queuedPlayer.timeControl === timeControl &&
				queuedPlayer.socketId !== currentSocketId
			);
		});
	}

	addToQueue(socketId, playerName, timeControl, flag) {
		this.removeFromQueue(socketId);

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
			const activeRooms = Array.from(this.rooms.values()).filter(
				(room) => !room.gameState.isGameOver && !room.gameState.isPaused
			);

			if (activeRooms.length === 0) return;

			activeRooms.forEach((room) => {
				this.updateTimer(room.gameState);

				if (this.checkGameOver(room)) {
					this.broadcastGameState(room.roomCode);
				} else {
					this.broadcastTimeUpdate(room);
				}
			});
		}, 100);
	}

	updateRoomSettings(roomCode, increment, preferredColor) {
		const room = this.rooms.get(roomCode);
		if (!room || !room.waitingForOpponent) return false;

		room.increment = increment;
		room.gameState.increment = increment * 100;

		room.hostPreferredColor = preferredColor;

		const hostPlayer = room.players.find((p) => p.isHost);
		if (hostPlayer) {
			hostPlayer.color = preferredColor;
		}

		return true;
	}

	setChatManager(chatManager) {
		this.chatManager = chatManager;
	}

	cleanup() {
		if (this.gameTimer) {
			clearInterval(this.gameTimer);
		}
	}
}
