import { useCallback } from "react";
import { moveOptionsHandler } from "../utils/chessboardUtils";

export const useChessboardEvents = (
	chessGame,
	gameMode,
	playerColor,
	roomCode,
	emit
) => {
	const yellowSquare = "rgba(252, 220, 77, 0.4)";

	const getMoveOptions = moveOptionsHandler(
		chessGame.game,
		chessGame.currentIndex,
		chessGame.history,
		chessGame.setOptionSquares,
		chessGame.setHighlightedSquares,
		yellowSquare
	);

	const checkTurnPermission = useCallback(() => {
		if (gameMode === "multiplayer" && playerColor) {
			const currentTurn =
				chessGame.game.turn() === "w" ? "white" : "black";
			return currentTurn === playerColor;
		}

		if (gameMode === "versus-bot" && playerColor) {
			return chessGame.isPlayerTurn;
		}

		return true;
	}, [gameMode, playerColor, chessGame.game, chessGame.isPlayerTurn]);

	const canMakeMove = useCallback(() => {
		const gameNotOver = !chessGame.isGameOver;
		const rightTurn = checkTurnPermission();
		const currentPosition =
			chessGame.currentIndex === chessGame.history.length - 1;
		const hasConnection = gameMode !== "multiplayer" || (roomCode && emit);
		const notThinking = gameMode !== "versus-bot" || !chessGame.isThinking;

		return (
			gameNotOver &&
			rightTurn &&
			currentPosition &&
			hasConnection &&
			notThinking
		);
	}, [gameMode, chessGame, roomCode, emit, checkTurnPermission]);

	const sendMoveToServer = useCallback(
		(moveData) => {
			if (gameMode === "multiplayer" && roomCode && emit) {
				console.log("Sending move to server:", moveData);
				emit("makeMove", { roomCode, move: moveData });
			}
		},
		[gameMode, roomCode, emit]
	);

	const clearUIState = useCallback(() => {
		chessGame.setMoveFrom("");
		chessGame.setOptionSquares({});
		chessGame.setRightClickedSquares({});
	}, [chessGame]);

	const onDrop = useCallback(
		(sourceSquare, targetSquare, piece) => {
			if (!canMakeMove()) return false;

			const moveData = {
				from: sourceSquare,
				to: targetSquare,
			};

			// only add promotion if it's actually a promotion
			const movingPiece = chessGame.game.get(sourceSquare);
			const isPromotion =
				movingPiece &&
				movingPiece.type === "p" &&
				((movingPiece.color === "w" && targetSquare[1] === "8") ||
					(movingPiece.color === "b" && targetSquare[1] === "1"));

			if (isPromotion) {
				moveData.promotion = piece ? piece[1].toLowerCase() : "q";
			}

			if (gameMode === "multiplayer") {
				sendMoveToServer(moveData);
				clearUIState();
				return true;
			} else {
				const move = chessGame.makeMove(
					sourceSquare,
					targetSquare,
					moveData.promotion
				);
				if (move) {
					getMoveOptions(targetSquare);
					clearUIState();
				}
				return !!move;
			}
		},
		[
			canMakeMove,
			chessGame,
			getMoveOptions,
			sendMoveToServer,
			gameMode,
			clearUIState,
		]
	);

	const onSquareClick = useCallback(
		(square) => {
			chessGame.setRightClickedSquares({});

			if (!canMakeMove()) {
				console.log("Cannot make move - conditions not met");
				return;
			}

			if (chessGame.currentIndex !== chessGame.history.length - 1) {
				chessGame.setMoveFrom("");
				chessGame.setOptionSquares({});
				return;
			}

			const clickedPiece = chessGame.game.get(square);
			const currentTurn = chessGame.game.turn();

			if (gameMode === "versus-bot" && playerColor) {
				const playerPieceColor = playerColor === "white" ? "w" : "b";
				const isPlayerPiece =
					clickedPiece && clickedPiece.color === playerPieceColor;

				if (clickedPiece && !isPlayerPiece) {
					chessGame.setMoveFrom("");
					chessGame.setOptionSquares({});
					return;
				}
			}

			const isOwnPiece =
				clickedPiece && clickedPiece.color === currentTurn;

			if (isOwnPiece) {
				const hasMoveOptions = getMoveOptions(square);
				if (hasMoveOptions) {
					chessGame.setMoveFrom(square);
					console.log("Selected square:", square);
				} else {
					chessGame.setMoveFrom("");
					chessGame.setOptionSquares({});
					console.log("No moves available from square:", square);
				}
				return;
			}

			if (chessGame.moveFrom) {
				const piece = chessGame.game.get(chessGame.moveFrom);
				const moveData = { from: chessGame.moveFrom, to: square };

				if (
					piece &&
					piece.type === "p" &&
					((piece.color === "w" && square[1] === "8") ||
						(piece.color === "b" && square[1] === "1"))
				) {
					moveData.promotion = "q";
				}

				if (gameMode === "multiplayer") {
					sendMoveToServer(moveData);
					clearUIState();
				} else {
					const move = chessGame.makeMove(
						chessGame.moveFrom,
						square,
						moveData.promotion
					);
					if (move) {
						getMoveOptions(square);
						clearUIState();
					} else {
						console.log("Invalid move attempted");
						chessGame.setMoveFrom("");
						chessGame.setOptionSquares({});
					}
				}
			} else {
				chessGame.setMoveFrom("");
				chessGame.setOptionSquares({});
			}
		},
		[
			canMakeMove,
			chessGame,
			getMoveOptions,
			sendMoveToServer,
			gameMode,
			clearUIState,
			playerColor,
		]
	);

	const onPieceDragBegin = useCallback(
		(piece, sourceSquare) => {
			if (!canMakeMove()) return false;

			if (gameMode === "versus-bot" && playerColor) {
				const playerPieceColor = playerColor === "white" ? "w" : "b";
				const pieceColor = piece[0];

				if (pieceColor !== playerPieceColor) {
					console.log("Cannot drag bot's piece");
					return false;
				}
			}

			getMoveOptions(sourceSquare);
			return true;
		},
		[canMakeMove, getMoveOptions, gameMode, playerColor]
	);

	return {
		onDrop,
		onSquareClick,
		onPieceDragBegin,
		getMoveOptions,
	};
};
