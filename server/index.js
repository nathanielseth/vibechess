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

io.on("connection", (socket) => {
	console.log("hi");
});

httpServer.listen(3000, () => {
	console.log("Server listening on port 3000");
});
