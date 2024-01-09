const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer);

io.on("connection", (socket) => {
	socket.on("createRoom", (code) => {
		socket.join(code);
	});

	socket.on("joinRoom", (code) => {
		socket.join(code);
		socket.to(code).emit("playerJoined");
	});
});

httpServer.listen(3000, () => {
	console.log("Server is running on port 3000");
});
