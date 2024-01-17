import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
	},
});

app.use(cors());

const rooms = {};

io.on("connection", (socket) => {
	console.log("A user connected");

	socket.on("join", (roomCode) => {
		if (!rooms[roomCode]) {
			rooms[roomCode] = [];
		}
		rooms[roomCode].push(socket);
		console.log(`User joined room ${roomCode}`);
	});

	socket.on("disconnect", () => {
		for (let roomCode in rooms) {
			const index = rooms[roomCode].indexOf(socket);
			if (index !== -1) {
				rooms[roomCode].splice(index, 1);
				console.log(`User left room ${roomCode}`);
			}
		}
	});
});

httpServer.listen(5000, () => {
	console.log("Server listening on port 5000");
});
