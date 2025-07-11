import { useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Chess } from "chess.js";

export const useMultiplayerSocket = (
	socket,
	isConnected,
	on,
	gameMode,
	chessGame,
	playerColor,
	roomCode
) => {
	const handleGameState = useCallback(
		(data) => {
			if (!data?.gameState) return;

			const { gameState } = data;

			chessGame.game.load(gameState.fen);
			chessGame.setCurrentPlayer(gameState.currentPlayer);

			// this completely resets client timer state
			chessGame.updateServerTimes({
				whiteTime: gameState.whiteTimeRemaining,
				blackTime: gameState.blackTimeRemaining,
				timestamp: gameState.timestamp || Date.now(),
			});

			// build history from server moves
			const newHistory = [{ fen: new Chess().fen(), lastMove: null }];
			if (gameState.moves?.length > 0) {
				const tempGame = new Chess();
				gameState.moves.forEach((move) => {
					const gameMove = tempGame.move(move);
					if (gameMove) {
						newHistory.push({
							fen: tempGame.fen(),
							lastMove: gameMove,
						});
					}
				});
			}

			chessGame.setHistory(newHistory);
			chessGame.setCurrentIndex(newHistory.length - 1);

			if (gameState.lastMove) {
				const highlightColor = "rgba(252, 220, 77, 0.4)";
				chessGame.setLastMove(gameState.lastMove);
				chessGame.setHighlightedSquares({
					[gameState.lastMove.from]: {
						backgroundColor: highlightColor,
					},
					[gameState.lastMove.to]: {
						backgroundColor: highlightColor,
					},
				});
			} else {
				chessGame.setLastMove(null);
				chessGame.setHighlightedSquares({});
			}

			chessGame.setMoveFrom("");
			chessGame.setOptionSquares({});
			chessGame.setRightClickedSquares({});

			chessGame.setKingInCheck(gameState.kingInCheck || null);

			// handle game over state
			if (gameState.isGameOver) {
				chessGame.setIsGameOver(true);
				chessGame.setGameEndReason(gameState.gameOverReason);

				const getGameOverMessage = () => {
					if (!gameState.winner)
						return gameState.gameOverReason || "Game Over";

					const isPlayerWinner = gameState.winner === playerColor;
					const winnerText = isPlayerWinner ? "You" : "Opponent";
					return `${winnerText} won by ${gameState.gameOverReason}`;
				};

				toast.info(getGameOverMessage(), {
					position: "top-center",
					autoClose: 5000,
				});
			} else {
				chessGame.setIsGameOver(false);
				chessGame.setGameEndReason(null);
			}
		},
		[chessGame, playerColor]
	);

	// move rejection from server
	const handleMoveRejected = useCallback(
		(data) => {
			toast.error(`Move rejected: ${data.reason}`, {
				position: "top-center",
				autoClose: 3000,
			});

			chessGame.setMoveFrom("");
			chessGame.setOptionSquares({});
			chessGame.setRightClickedSquares({});
		},
		[chessGame]
	);

	const handlePlayerDisconnected = useCallback((data) => {
		const playerName = data.playerName || data.username || "Player";
		toast.warning(`${playerName} disconnected`, {
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
			{ event: "error", handler: handleError },
			{ event: "reconnected", handler: handleReconnected },
			{ event: "disconnect", handler: handleDisconnect },
		];

		const cleanupFunctions = eventHandlers.map(({ event, handler }) =>
			on(event, handler)
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
		handleError,
		handleReconnected,
		handleDisconnect,
	]);

	const rejoinRoom = useCallback(() => {
		if (socket && roomCode && gameMode === "multiplayer") {
			socket.emit("rejoinRoom", { roomCode });
		}
	}, [socket, roomCode, gameMode]);

	useEffect(() => {
		if (socket && isConnected && roomCode && gameMode === "multiplayer") {
			const timer = setTimeout(rejoinRoom, 100);
			return () => clearTimeout(timer);
		}
	}, [socket, isConnected, roomCode, gameMode, rejoinRoom]);

	return { rejoinRoom };
};
