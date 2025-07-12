export class ChatManager {
	constructor(gameManager) {
		this.gm = gameManager;
		this.io = gameManager.io;
		this.chatHistory = new Map();
	}

	handleChatMessage(socket, { roomCode, message }) {
		const room =
			this.gm.rooms.get(roomCode) ||
			this.gm.rooms.get(this.gm.playerRooms.get(socket.id));
		if (!room) {
			socket.emit("error", { message: "Room not found" });
			return;
		}
		const player = room.players.find((p) => p.id === socket.id);
		if (!player) {
			socket.emit("error", { message: "Player not found" });
			return;
		}
		if (
			!message ||
			typeof message !== "string" ||
			message.trim().length === 0
		) {
			return;
		}
		const trimmedMessage = message.trim();
		if (trimmedMessage.length > 100) {
			socket.emit("error", { message: "Message too long" });
			return;
		}

		const now = new Date();
		const chatMessage = {
			id: (Date.now() + Math.random()).toString(),
			playerId: socket.id,
			playerName: player.name,
			playerColor: player.color,
			message: trimmedMessage,
			timestamp: now.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			}),
			createdAt: now.toISOString(),
		};

		if (!this.chatHistory.has(room.roomCode)) {
			this.chatHistory.set(room.roomCode, []);
		}
		const history = this.chatHistory.get(room.roomCode);
		history.push(chatMessage);
		if (history.length > 50) {
			history.shift();
		}
		this.io.to(room.roomCode).emit("chatMessage", chatMessage);
	}

	getChatHistory(roomCode) {
		return this.chatHistory.get(roomCode) || [];
	}

	clearChatHistory(roomCode) {
		this.chatHistory.delete(roomCode);
	}

	cleanup() {
		this.chatHistory.clear();
	}
}
