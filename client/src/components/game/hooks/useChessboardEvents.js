import { useCallback, useMemo } from "react";
import { moveOptionsHandler } from "../utils/chessboardUtils";

export const useChessboardEvents = (
	chessGame,
	gameMode,
	playerColor,
	roomCode,
	emit
) => {
	const HIGHLIGHT_COLOR = "rgba(252, 220, 77, 0.4)";

	const getMoveOptions = useMemo(
		() =>
			moveOptionsHandler(
				chessGame.game,
				chessGame.currentIndex,
				chessGame.history,
				chessGame.setOptionSquares,
				chessGame.setHighlightedSquares,
				HIGHLIGHT_COLOR
			),
		[
			chessGame.game,
			chessGame.currentIndex,
			chessGame.history,
			chessGame.setOptionSquares,
			chessGame.setHighlightedSquares,
		]
	);

	const gameState = useMemo(
		() => ({
			isMultiplayer: gameMode === "multiplayer",
			isVersusBot: gameMode === "versus-bot",
			currentTurn: chessGame.game.turn() === "w" ? "white" : "black",
			isAtCurrentPosition:
				chessGame.currentIndex === chessGame.history.length - 1,
			hasConnection: gameMode !== "multiplayer" || (roomCode && emit),
		}),
		[
			gameMode,
			chessGame.game,
			chessGame.currentIndex,
			chessGame.history.length,
			roomCode,
			emit,
		]
	);

	const checkTurnPermission = useCallback(() => {
		if (gameState.isMultiplayer && playerColor) {
			return gameState.currentTurn === playerColor;
		}
		if (gameState.isVersusBot && playerColor) {
			return chessGame.isPlayerTurn;
		}
		return true;
	}, [
		gameState.isMultiplayer,
		gameState.isVersusBot,
		gameState.currentTurn,
		playerColor,
		chessGame.isPlayerTurn,
	]);

	const canMakeMove = useCallback(() => {
		return (
			!chessGame.isGameOver &&
			checkTurnPermission() &&
			gameState.isAtCurrentPosition &&
			gameState.hasConnection &&
			(!gameState.isVersusBot || !chessGame.isThinking)
		);
	}, [
		chessGame.isGameOver,
		chessGame.isThinking,
		checkTurnPermission,
		gameState,
	]);

	const clearUIState = useCallback(() => {
		chessGame.setMoveFrom("");
		chessGame.setOptionSquares({});
		chessGame.setRightClickedSquares({});
	}, [chessGame]);

	const sendMoveToServer = useCallback(
		(moveData) => {
			if (gameState.isMultiplayer && roomCode && emit) {
				emit("makeMove", { roomCode, move: moveData });
			}
		},
		[gameState.isMultiplayer, roomCode, emit]
	);

	const createMoveData = useCallback(
		(from, to, piece = null) => {
			const moveData = { from, to };
			const movingPiece = chessGame.game.get(from);

			if (movingPiece?.type === "p") {
				const isPromotion =
					(movingPiece.color === "w" && to[1] === "8") ||
					(movingPiece.color === "b" && to[1] === "1");
				if (isPromotion) {
					moveData.promotion = piece?.[1]?.toLowerCase() || "q";
				}
			}

			return moveData;
		},
		[chessGame.game]
	);

	const addPremove = useCallback(
		(sourceSquare, targetSquare, piece, moveData) => {
			const premove = { sourceSquare, targetSquare, piece, moveData };
			chessGame.premovesRef.current.push(premove);
			chessGame.setPremoves([...chessGame.premovesRef.current]);
			clearUIState();
		},
		[chessGame, clearUIState]
	);

	const executeMove = useCallback(
		(moveData, targetSquare) => {
			if (gameState.isMultiplayer) {
				sendMoveToServer(moveData);
				clearUIState();
				return true;
			}

			const move = chessGame.makeMove(
				moveData.from,
				moveData.to,
				moveData.promotion
			);
			if (move) {
				getMoveOptions(targetSquare);
				clearUIState();
			}
			return !!move;
		},
		[
			gameState.isMultiplayer,
			sendMoveToServer,
			clearUIState,
			chessGame,
			getMoveOptions,
		]
	);

	const isValidPieceDrag = useCallback(
		(piece) => {
			if (!canMakeMove()) return false;

			const pieceColor = piece[0];
			const pieceColorName = pieceColor === "w" ? "white" : "black";

			if (gameState.isVersusBot) {
				const actualPlayerColor = playerColor || chessGame.playerColor;
				const playerPieceColor =
					actualPlayerColor === "white" ? "w" : "b";

				return (
					pieceColor === playerPieceColor &&
					chessGame.currentPlayer === actualPlayerColor &&
					!chessGame.isThinking
				);
			}

			if (gameState.isMultiplayer && playerColor) {
				return pieceColorName === playerColor;
			}

			return true;
		},
		[
			canMakeMove,
			gameState.isVersusBot,
			gameState.isMultiplayer,
			playerColor,
			chessGame.currentPlayer,
			chessGame.isThinking,
			chessGame.playerColor,
		]
	);

	const onPieceDragBegin = useCallback(
		(piece, sourceSquare) => {
			if (!isValidPieceDrag(piece)) return false;
			getMoveOptions(sourceSquare);
			return true;
		},
		[isValidPieceDrag, getMoveOptions]
	);

	const onDrop = useCallback(
		(sourceSquare, targetSquare, piece) => {
			if (!targetSquare || sourceSquare === targetSquare) return false;

			const moveData = createMoveData(sourceSquare, targetSquare, piece);

			// Handle multiplayer premoves
			if (gameState.isMultiplayer && playerColor) {
				const pieceColor = piece[0] === "w" ? "white" : "black";
				if (pieceColor !== playerColor) return false;

				const isPlayerTurn = gameState.currentTurn === playerColor;
				if (!isPlayerTurn) {
					addPremove(sourceSquare, targetSquare, piece, moveData);
					return true;
				}
			}

			// Handle bot premoves
			if (!canMakeMove() && gameState.isVersusBot) {
				const pieceColor = piece[0];
				const currentTurn = chessGame.game.turn();

				if (pieceColor !== currentTurn) {
					addPremove(sourceSquare, targetSquare, piece, moveData);
					return true;
				}
				return false;
			}

			if (!canMakeMove()) return false;

			return executeMove(moveData, targetSquare);
		},
		[
			gameState,
			playerColor,
			chessGame.game,
			canMakeMove,
			createMoveData,
			addPremove,
			executeMove,
		]
	);

	const handlePieceSelection = useCallback(
		(square, clickedPiece) => {
			if (gameState.isVersusBot && playerColor) {
				const playerPieceColor = playerColor === "white" ? "w" : "b";
				const isPlayerPiece = clickedPiece?.color === playerPieceColor;

				if (clickedPiece && !isPlayerPiece) {
					clearUIState();
					return false;
				}
			}

			const isOwnPiece = clickedPiece?.color === chessGame.game.turn();
			if (!isOwnPiece) return false;

			const hasMoveOptions = getMoveOptions(square);
			if (hasMoveOptions) {
				chessGame.setMoveFrom(square);
			} else {
				clearUIState();
			}
			return true;
		},
		[
			gameState.isVersusBot,
			playerColor,
			chessGame,
			getMoveOptions,
			clearUIState,
		]
	);

	const handleMoveExecution = useCallback(
		(targetSquare) => {
			if (!chessGame.moveFrom) {
				clearUIState();
				return;
			}

			const moveData = createMoveData(chessGame.moveFrom, targetSquare);
			executeMove(moveData, targetSquare);
		},
		[chessGame.moveFrom, createMoveData, executeMove, clearUIState]
	);

	const onSquareClick = useCallback(
		(square) => {
			chessGame.setRightClickedSquares({});

			if (!canMakeMove() || !gameState.isAtCurrentPosition) {
				clearUIState();
				return;
			}

			const clickedPiece = chessGame.game.get(square);

			if (handlePieceSelection(square, clickedPiece)) {
				return;
			}

			handleMoveExecution(square);
		},
		[
			canMakeMove,
			gameState.isAtCurrentPosition,
			chessGame,
			handlePieceSelection,
			handleMoveExecution,
			clearUIState,
		]
	);

	return {
		onDrop,
		onSquareClick,
		onPieceDragBegin,
		getMoveOptions,
	};
};
