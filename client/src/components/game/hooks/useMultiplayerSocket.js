import { useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";

export const useMultiplayerSocket = (
	socket,
	isConnected,
	on,
	gameMode,
	chessGame,
	playerColor,
	roomCode,
) => {
	const handleGameState = useCallback(
		(data) => {
			if (!data?.gameState) return;

			const { gameState, players } = data;

			chessGame.syncGameState(gameState);
			if (players) {
				chessGame.setPlayers(players);
			}
		},
		[chessGame],
	);

	// move rejection from server
	const handleMoveRejected = useCallback(
		(data) => {
			Promise.resolve().then(() => {
				toast.error(`Move rejected: ${data.reason}`, {
					position: "top-center",
					autoClose: 3000,
				});
			});

			chessGame.setMoveFrom("");
			chessGame.setOptionSquares({});
			chessGame.setRightClickedSquares({});
		},
		[chessGame],
	);

	const handlePlayerDisconnected = useCallback((data) => {
		const playerName = data.playerName || data.username || "Player";
		toast.warning(`${playerName} disconnected`, {
			position: "top-center",
			autoClose: 3000,
		});
	}, []);

	const handleGameOver = useCallback((data) => {
		if (
			data.reason === "resignation" ||
			data.gameOverReason === "resignation"
		) {
			// game ended by resignation - server will broadcast gameState
		}
	}, []);

	const handleDrawOffer = useCallback(
		(data) => {
			const { from, playerColor } = data;

			chessGame.setDrawOfferData({
				from,
				playerColor,
				isVisible: true,
			});
		},
		[chessGame],
	);

	const handleDrawDeclined = useCallback((data) => {
		toast.info(`${data.from} declined the draw offer`, {
			position: "top-center",
			autoClose: 3000,
		});
	}, []);

	const handleError = useCallback((data) => {
		toast.error(`Error: ${data.message}`, {
			position: "top-center",
			autoClose: 3000,
		});
	}, []);

	const handleReconnected = useCallback(() => {
		toast.success("Reconnected to game", {
			position: "top-center",
			autoClose: 2000,
		});
	}, []);

	const handleDisconnect = useCallback(() => {
		toast.warning("Connection lost. Attempting to reconnect...", {
			position: "top-center",
			autoClose: 3000,
		});
	}, []);

	// setup event listeners when connected to multiplayer game
	useEffect(() => {
		if (!socket || !isConnected || gameMode !== "multiplayer") return;

		const eventHandlers = [
			{ event: "gameState", handler: handleGameState },
			{ event: "moveRejected", handler: handleMoveRejected },
			{ event: "playerDisconnected", handler: handlePlayerDisconnected },
			{ event: "drawOffer", handler: handleDrawOffer },
			{ event: "drawDeclined", handler: handleDrawDeclined },
			{ event: "gameOver", handler: handleGameOver },
			{ event: "error", handler: handleError },
			{ event: "reconnected", handler: handleReconnected },
			{ event: "disconnect", handler: handleDisconnect },
		];

		const cleanupFunctions = eventHandlers.map(({ event, handler }) =>
			on(event, handler),
		);

		return () => {
			cleanupFunctions.forEach((cleanup) => cleanup?.());
		};
	}, [
		socket,
		isConnected,
		on,
		gameMode,
		handleGameState,
		handleMoveRejected,
		handlePlayerDisconnected,
		handleDrawOffer,
		handleDrawDeclined,
		handleGameOver,
		handleError,
		handleReconnected,
		handleDisconnect,
	]);

	const rejoinRoomRef = useRef(null);
	const rejoinRoom = useCallback(() => {
		if (socket && roomCode && gameMode === "multiplayer") {
			if (rejoinRoomRef.current) {
				clearTimeout(rejoinRoomRef.current);
			}
			rejoinRoomRef.current = setTimeout(() => {
				socket.emit("rejoinRoom", { roomCode });
			}, 50);
		}
	}, [socket, roomCode, gameMode]);

	const resign = useCallback(() => {
		if (socket && roomCode && gameMode === "multiplayer") {
			socket.emit("resign", { roomCode });
		}
	}, [socket, roomCode, gameMode]);

	const offerDraw = useCallback(() => {
		if (socket && roomCode && gameMode === "multiplayer") {
			socket.emit("drawOffer", { roomCode });
		}
	}, [socket, roomCode, gameMode]);

	const respondToDraw = useCallback(
		(accepted) => {
			if (socket && roomCode && gameMode === "multiplayer") {
				socket.emit("drawResponse", { roomCode, accepted });
			}
		},
		[socket, roomCode, gameMode],
	);

	useEffect(() => {
		if (socket && isConnected && roomCode && gameMode === "multiplayer") {
			rejoinRoom();
		}

		return () => {
			if (rejoinRoomRef.current) {
				clearTimeout(rejoinRoomRef.current);
			}
		};
	}, [socket, isConnected, roomCode, gameMode, rejoinRoom]);

	return { rejoinRoom, resign, offerDraw, respondToDraw };
};