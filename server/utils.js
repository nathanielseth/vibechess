const gameDuration = 300;

const exitRoom = (socket, roomData) => {
	if (socket.roomCode) {
		const oldRoom = socket.roomCode;
		socket.leave(oldRoom);
		const currentRoom = roomData[oldRoom];
		if (currentRoom) {
			currentRoom.activeCount--;
			if (currentRoom.activeCount <= 0) {
				roomData[oldRoom] = null;
			}
		}
	}
};

const setupRoom = (socket, roomData, roomCode, username, timeControl) => {
	exitRoom(socket, roomData);

	const currentRoomSize = (roomData[roomCode]?.participants || []).length;
	if (currentRoomSize === 0) {
		socket.join(roomCode);
		socket.roomCode = roomCode;
		console.log(`${username} entered room - ${roomCode}`);

		roomData[roomCode] = {
			fen: null,
			participants: [{ id: socket.id, username }],
			activeParticipant: null,
			activeCount: 1,
			remainingTime: {
				white: timeControl || gameDuration,
				black: timeControl || gameDuration,
			},
			totalTime: timeControl || gameDuration,
		};
	}
};

const joinRoom = (io, socket, roomData, roomCode, username) => {
	exitRoom(socket, roomData);

	const currentRoomSize = (roomData[roomCode]?.participants || []).length;
	if (currentRoomSize === 1) {
		if (roomData[roomCode].participants[0].username === username) {
			return;
		}

		socket.join(roomCode);
		console.log(`${username} entered room - ${roomCode}`);
		socket.roomCode = roomCode;
		io.to(socket.id).emit("roomJoined");

		startGame(io, roomData, roomCode);
	} else {
		socket.emit("invalidRoom");
	}
};

const startGame = (io, roomData, roomCode) => {
	const randomIndex = Math.round(Math.random());
	const activeParticipant = roomData[roomCode].participants[randomIndex];
	const inactiveParticipant = roomData[roomCode].participants[+!randomIndex];

	activeParticipant.color = "white";
	inactiveParticipant.color = "black";
	roomData[roomCode].activeParticipant = activeParticipant;
	roomData[roomCode].activeCount++;

	io.in(roomCode).emit("gameStart", {
		white: activeParticipant,
		black: inactiveParticipant,
		roomCode,
		time: roomData[roomCode].totalTime,
	});
};

export { joinRoom, setupRoom };
