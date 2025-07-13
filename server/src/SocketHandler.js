import { generateRoomCode } from "./utils/roomUtils.js";
import {
	validatePlayerName,
	validateTimeControl,
	validateColor,
	normalizeFlag,
} from "./utils/roomUtils.js";

export class SocketHandler {
	constructor(gameManager) {
		this.gm = gameManager;
		this.io = gameManager.io;
	}
	/**
	 * @param {string} roomCode - The room code to look up
	 * @param {string} socketId - The socket ID for fallback lookup
	 * @returns {Object|null} - The room object or null if not found
	 */
	findRoom(roomCode, socketId) {
		if (roomCode) {
			const room = this.gm.rooms.get(roomCode);
			if (room) return room;
		}

		const playerRoomCode = this.gm.playerRooms.get(socketId);
		return playerRoomCode ? this.gm.rooms.get(playerRoomCode) : null;
	}
	/**
	 * @param {Object} socket - The socket object
	 * @param {string} roomCode - The room code
	 * @param {string} errorEvent - Event name for error emission
	 * @param {string} errorMessage - Error message for room not found
	 * @param {Function} callback - Function to execute if room is found
	 */
	withRoom(socket, roomCode, errorEvent, errorMessage, callback) {
		const room = this.findRoom(roomCode, socket.id);
		if (!room) {
			socket.emit(errorEvent, { message: errorMessage });
			return;
		}
		callback(room);
	}

	/**
	 * @param {Object} room - The room object
	 * @param {string} socketId - The socket ID
	 * @param {Object} socket - The socket object
	 * @param {string} errorEvent - Event name for error emission
	 * @param {string} errorMessage - Error message for player not found
	 * @param {Function} callback - Function to execute if player is found
	 */
	withPlayer(room, socketId, socket, errorEvent, errorMessage, callback) {
		const player = room.players.find((p) => p.id === socketId);
		if (!player) {
			socket.emit(errorEvent, { message: errorMessage });
			return;
		}
		callback(player);
	}

	handleCreateRoom(
		socket,
		{ timeControl, increment, playerName, preferredColor, flag }
	) {
		if (
			!validateTimeControl(timeControl) ||
			!validatePlayerName(playerName) ||
			!validateColor(preferredColor)
		) {
			socket.emit("error", { message: "Invalid room parameters" });
			return;
		}

		const result = this.gm.createPrivateRoom(
			timeControl,
			increment,
			playerName,
			preferredColor,
			flag,
			socket.id
		);

		socket.join(result.roomCode);

		socket.emit("roomCreated", {
			roomCode: result.roomCode,
			playerColor: result.player.color,
			isHost: true,
			room: {
				roomCode: result.roomCode,
				timeControl: result.room.timeControl,
				waitingForOpponent: result.room.waitingForOpponent,
				players: result.room.players,
			},
		});
	}

	handleJoinRoom(socket, { roomCode, playerName, flag }) {
		const room = this.gm.rooms.get(roomCode);
		if (!room) {
			socket.emit("roomNotFound", { message: "Room not found" });
			return;
		}

		const result = this.gm.joinPrivateRoom(
			roomCode,
			playerName,
			flag,
			socket.id
		);

		if (!result.success) {
			socket.emit("initializationError", { message: result.reason });
			return;
		}

		socket.join(roomCode);

		const gameState = this.gm.getGameStateForBroadcast(room);
		const player = room.players.find((p) => p.id === socket.id);
		const opponent = room.players.find((p) => p.id !== socket.id);

		if (result.gameReady) {
			this.io.to(roomCode).emit("gameStarted", {
				roomCode,
				gameState,
				players: room.players,
			});
		} else {
			socket.emit("gameInitialized", {
				gameState,
				playerColor: player.color,
				increment: room.increment,
				opponent: opponent
					? {
							name: opponent.name,
							color: opponent.color,
							flag: opponent.flag,
					  }
					: null,
				roomCode,
			});
			socket.emit("chatHistory", {
				messages:
					this.gm.chatManager?.getChatHistory(room.roomCode) || [],
			});
		}
	}

	handleRejoinRoom(socket, { roomCode, flag }) {
		this.withRoom(
			socket,
			roomCode,
			"initializationError",
			"Room not found",
			(room) => {
				this.withPlayer(
					room,
					socket.id,
					socket,
					"initializationError",
					"Player not found in room",
					(player) => {
						if (flag) player.flag = normalizeFlag(flag);

						socket.join(room.roomCode);
						this.gm.playerRooms.set(socket.id, room.roomCode);

						if (
							room.gameState.isPaused &&
							!room.gameState.isGameOver
						) {
							room.gameState.isPaused = false;
							room.gameState.lastMoveTimestamp = Date.now();
						}

						const gameState =
							this.gm.getGameStateForBroadcast(room);
						const opponent = room.players.find(
							(p) => p.id !== socket.id
						);

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
							socket.emit("chatHistory", {
								messages:
									this.gm.chatManager?.getChatHistory(
										room.roomCode
									) || [],
							});
						}, 100);
					}
				);
			}
		);
	}

	handleMakeMove(socket, { roomCode, move }) {
		this.withRoom(
			socket,
			roomCode,
			"moveRejected",
			"Room not found",
			(room) => {
				const validation = this.gm.validateMove(room, socket.id, move);
				if (!validation.valid) {
					socket.emit("moveRejected", { reason: validation.reason });
					return;
				}

				this.gm.applyMove(room, validation.move);
				this.gm.broadcastGameState(room.roomCode);
			}
		);
	}

	handleFindMatch(socket, { timeControl, playerName, flag }) {
		if (
			!validateTimeControl(timeControl) ||
			!validatePlayerName(playerName)
		) {
			socket.emit("error", { message: "Invalid match parameters" });
			return;
		}

		const existingRoom = this.gm.playerRooms.get(socket.id);
		if (existingRoom) {
			this.gm.playerRooms.delete(socket.id);
			socket.leave(existingRoom);
		}
		this.gm.removeFromQueue(socket.id);

		const opponentIndex = this.gm.findMatchingOpponent(
			timeControl,
			socket.id
		);

		if (opponentIndex === -1) {
			this.gm.addToQueue(socket.id, playerName, timeControl, flag);
			socket.emit("queueJoined", {
				position: this.gm.matchmakingQueue.length,
				timeControl,
			});
			return;
		}

		const opponent = this.gm.matchmakingQueue[opponentIndex];
		this.gm.matchmakingQueue.splice(opponentIndex, 1);

		const roomCode = generateRoomCode();
		const room = this.gm.createMatchmakingRoom(
			opponent,
			{ socketId: socket.id, playerName, flag: normalizeFlag(flag) },
			timeControl,
			roomCode
		);

		const opponentSocket = this.io.sockets.sockets.get(opponent.socketId);

		if (!opponentSocket?.connected || !socket.connected) {
			this.gm.rooms.delete(roomCode);
			this.gm.playerRooms.delete(opponent.socketId);
			this.gm.playerRooms.delete(socket.id);

			if (socket.connected) {
				this.gm.addToQueue(socket.id, playerName, timeControl, flag);
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
		const [player1, player2] = room.players;

		opponentSocket.emit("matchFound", {
			roomCode,
			yourColor: player1.color,
			opponent: {
				name: player2.name,
				color: player2.color,
				flag: player2.flag,
			},
			timeControl,
			gameState: baseGameState,
		});

		socket.emit("matchFound", {
			roomCode,
			yourColor: player2.color,
			opponent: {
				name: player1.name,
				color: player1.color,
				flag: player1.flag,
			},
			timeControl,
			gameState: baseGameState,
		});
	}

	handleSurrender(socket, { roomCode }) {
		this.withRoom(socket, roomCode, "error", "Room not found", (room) => {
			this.withPlayer(
				room,
				socket.id,
				socket,
				"error",
				"Invalid surrender request",
				(player) => {
					if (room.gameState.isGameOver) {
						socket.emit("error", {
							message: "Invalid surrender request",
						});
						return;
					}

					room.gameState.surrenderedPlayer = player.color;
					this.gm.checkGameOver(room);
					this.gm.broadcastGameState(room.roomCode);

					this.io.to(room.roomCode).emit("playerSurrendered", {
						playerName: player.name,
						playerColor: player.color,
						winner: player.color === "white" ? "black" : "white",
					});
				}
			);
		});
	}

	handleDrawOffer(socket, { roomCode }) {
		this.withRoom(socket, roomCode, "error", "Room not found", (room) => {
			this.withPlayer(
				room,
				socket.id,
				socket,
				"error",
				"Invalid draw offer",
				(player) => {
					if (room.gameState.isGameOver) {
						socket.emit("error", { message: "Invalid draw offer" });
						return;
					}

					room.gameState.drawOffers.add(player.color);

					if (room.gameState.drawOffers.size === 2) {
						this.gm.checkGameOver(room);
						this.gm.broadcastGameState(room.roomCode);
					} else {
						const opponent = room.players.find(
							(p) => p.id !== socket.id
						);
						if (opponent) {
							this.io.to(opponent.id).emit("drawOffered", {
								from: player.name,
								fromColor: player.color,
							});
						}
					}
				}
			);
		});
	}

	handleAcceptDraw(socket, { roomCode }) {
		this.withRoom(socket, roomCode, "error", "Room not found", (room) => {
			this.withPlayer(
				room,
				socket.id,
				socket,
				"error",
				"Invalid draw acceptance",
				(player) => {
					if (room.gameState.isGameOver) return;

					room.gameState.drawOffers.add(player.color);

					if (room.gameState.drawOffers.size === 2) {
						this.gm.checkGameOver(room);
						this.gm.broadcastGameState(room.roomCode);
					}
				}
			);
		});
	}

	handleDeclineDraw(socket, { roomCode }) {
		this.withRoom(socket, roomCode, "error", "Room not found", (room) => {
			this.withPlayer(
				room,
				socket.id,
				socket,
				"error",
				"Invalid draw decline",
				(player) => {
					room.gameState.drawOffers.clear();

					const opponent = room.players.find(
						(p) => p.id !== socket.id
					);
					if (opponent) {
						this.io.to(opponent.id).emit("drawDeclined", {
							by: player.name,
							byColor: player.color,
						});
					}
				}
			);
		});
	}

	handleRematchRequest(socket, { roomCode }) {
		this.withRoom(socket, roomCode, "error", "Room not found", (room) => {
			this.withPlayer(
				room,
				socket.id,
				socket,
				"error",
				"Invalid rematch request",
				(player) => {
					if (!room.gameState.isGameOver) return;

					room.rematchRequests.add(player.color);

					if (room.rematchRequests.size === 2) {
						room.gameState = this.gm.createGameState(
							room.timeControl / 6000
						);

						const [player1, player2] = room.players;
						[player1.color, player2.color] = [
							player2.color,
							player1.color,
						];

						room.rematchRequests.clear();

						this.gm.broadcastGameState(room.roomCode);

						this.io.to(room.roomCode).emit("rematchStarted", {
							players: room.players.map((p) => ({
								name: p.name,
								color: p.color,
								flag: p.flag,
							})),
						});
					} else {
						const opponent = room.players.find(
							(p) => p.id !== socket.id
						);
						if (opponent) {
							this.io.to(opponent.id).emit("rematchRequested", {
								from: player.name,
								fromColor: player.color,
							});
						}
					}
				}
			);
		});
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
