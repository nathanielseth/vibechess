import { useReducer, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import { toast } from "react-toastify";
import {
	isKingInCheck as checkKingInCheck,
	generatePGN,
	moveSound,
	captureSound,
	notifySound,
} from "../../../data/utils.js";
import {
	createInitialState,
	gameReducer,
} from "../../game/utils/botGameLogic.js";
import { EngineService } from "../../game/utils/engineService.js";

export const useVersusBot = (playerColor = "white", difficulty = 18) => {
	const [state, dispatch] = useReducer(
		gameReducer,
		createInitialState(playerColor)
	);

	const engineServiceRef = useRef(null);
	const toastId = useRef(null);
	const premovesRef = useRef([]);

	useEffect(() => {
		if (!engineServiceRef.current) {
			engineServiceRef.current = new EngineService();
			engineServiceRef.current.initializeEngines();
		}
	}, []);

	useEffect(() => {
		return () => {
			if (engineServiceRef.current) {
				engineServiceRef.current.cleanupEngines();
			}
		};
	}, []);

	const isPlayerTurn = useCallback(
		() => state.currentPlayer === playerColor,
		[state.currentPlayer, playerColor]
	);

	const isBotTurn = useCallback(
		() => state.currentPlayer !== playerColor,
		[state.currentPlayer, playerColor]
	);

	const executeBotMove = useCallback(
		(gameCopy, move, from, to) => {
			dispatch({
				type: "MAKE_MOVE",
				payload: {
					game: gameCopy,
					move,
					sourceSquare: from,
					targetSquare: to,
					newPlayer: playerColor,
				},
			});

			moveSound.play();
			if (move.captured) captureSound.play();
		},
		[playerColor]
	);

	const makeBotMove = useCallback(() => {
		if (!engineServiceRef.current) return;

		const callbacks = {
			dispatch,
			executeBotMove,
			isBotTurn,
		};

		engineServiceRef.current.makeBotMove(state, difficulty, callbacks);
	}, [state, difficulty, executeBotMove, isBotTurn]);

	const startPondering = useCallback(async () => {
		if (!engineServiceRef.current) return;

		const callbacks = {
			dispatch,
			isPlayerTurn,
		};

		await engineServiceRef.current.startPondering(
			state,
			difficulty,
			callbacks
		);
	}, [state, difficulty, isPlayerTurn]);

	const stopAllOperations = useCallback(() => {
		if (engineServiceRef.current) {
			engineServiceRef.current.stopAllOperations();
		}
		dispatch({ type: "SET_THINKING", payload: false });
		dispatch({ type: "SET_PONDERING", payload: false });
	}, []);

	useEffect(() => {
		if (
			isBotTurn() &&
			!state.isGameOver &&
			state.currentIndex === state.history.length - 1 &&
			!state.isThinking
		) {
			makeBotMove();
		}
	}, [
		isBotTurn,
		state.isGameOver,
		state.currentIndex,
		state.history.length,
		state.isThinking,
		makeBotMove,
	]);

	useEffect(() => {
		if (
			isPlayerTurn() &&
			!state.isGameOver &&
			state.currentIndex === state.history.length - 1 &&
			!state.isThinking
		) {
			startPondering();
		}
	}, [
		isPlayerTurn,
		state.isGameOver,
		state.currentIndex,
		state.history.length,
		state.isThinking,
		startPondering,
	]);

	const checkGameOver = useCallback(() => {
		let reason = null;

		if (state.game.isCheckmate()) {
			const winner = state.game.turn() === "w" ? "Black" : "White";
			const isPlayerWin = winner.toLowerCase() === playerColor;
			const moves = state.history.length - 1;
			reason = isPlayerWin
				? `You won by checkmate in ${moves} moves!`
				: `Bot won by checkmate in ${moves} moves`;
		} else if (state.game.isStalemate()) {
			reason = "Game ended in stalemate";
		} else if (state.game.isDraw() || state.game.isThreefoldRepetition()) {
			reason = "Game ended in a draw";
		}

		if (reason) {
			dispatch({ type: "SET_GAME_OVER", payload: reason });
			toastId.current = toast.info(reason, {
				position: toast.POSITION.TOP_CENTER,
				autoClose: 3000,
			});
		}
	}, [state.game, state.history, playerColor]);

	useEffect(() => {
		checkGameOver();
		dispatch({
			type: "UPDATE_PGN",
			payload: generatePGN(state.history, "versus-bot"),
		});
	}, [state.game, state.history, checkGameOver]);

	useEffect(() => {
		if (state.isGameOver) {
			stopAllOperations();
			notifySound.play();
		}
	}, [state.isGameOver, stopAllOperations]);

	const makeMove = useCallback(
		(sourceSquare, targetSquare, promotion = "q") => {
			if (
				state.currentIndex !== state.history.length - 1 ||
				state.isGameOver ||
				!isPlayerTurn() ||
				state.isThinking
			) {
				return false;
			}

			if (engineServiceRef.current?.ponderEngineRef) {
				engineServiceRef.current.ponderEngineRef.stop();
			}
			dispatch({ type: "SET_PONDERING", payload: false });

			const gameCopy = new Chess(state.game.fen());
			const move = gameCopy.move({
				from: sourceSquare,
				to: targetSquare,
				promotion: promotion.toLowerCase(),
			});

			if (move) {
				dispatch({
					type: "MAKE_MOVE",
					payload: {
						game: gameCopy,
						move,
						sourceSquare,
						targetSquare,
						newPlayer: playerColor === "white" ? "black" : "white",
					},
				});

				moveSound.play();
				if (move.captured) captureSound.play();

				return move;
			}

			return false;
		},
		[
			state.currentIndex,
			state.history,
			state.isGameOver,
			state.game,
			state.isThinking,
			playerColor,
			isPlayerTurn,
		]
	);

	const resetGame = useCallback(() => {
		stopAllOperations();
		dispatch({ type: "RESET_GAME", payload: { playerColor } });

		if (engineServiceRef.current) {
			engineServiceRef.current.ponderState.reset();
		}
		premovesRef.current = [];

		toastId.current = toast.info("New game started against bot", {
			position: toast.POSITION.TOP_CENTER,
			autoClose: 2000,
		});
	}, [stopAllOperations, playerColor]);

	const executePremove = useCallback(() => {
		if (premovesRef.current.length > 0 && isPlayerTurn()) {
			const nextPremove = premovesRef.current[0];
			premovesRef.current = premovesRef.current.slice(1);

			const move = makeMove(
				nextPremove.sourceSquare,
				nextPremove.targetSquare,
				nextPremove.moveData.promotion
			);

			if (!move) {
				premovesRef.current = [];
			}

			dispatch({
				type: "SET_PREMOVES",
				payload: [...premovesRef.current],
			});
		}
	}, [makeMove, isPlayerTurn]);

	useEffect(() => {
		if (isPlayerTurn() && state.currentIndex === state.history.length - 1) {
			executePremove();
		}
	}, [
		isPlayerTurn,
		executePremove,
		state.currentIndex,
		state.history.length,
	]);

	const undoMove = useCallback(() => {
		if (state.currentIndex > 1 && !state.isThinking) {
			stopAllOperations();

			const newHistory = state.history.slice(0, -2);
			const newIndex = state.currentIndex - 2;

			const newGame = new Chess();
			for (let i = 1; i <= newIndex; i++) {
				newGame.move(state.history[i].lastMove);
			}

			dispatch({
				type: "UNDO_MOVE",
				payload: { newGame, newHistory, newIndex, playerColor },
			});
		}
	}, [
		state.currentIndex,
		state.history,
		state.isThinking,
		playerColor,
		stopAllOperations,
	]);

	const navigateMove = useCallback(
		(moveIndex) => {
			if (state.isThinking) return;

			stopAllOperations();

			dispatch({
				type: "NAVIGATE_MOVE",
				payload: {
					moveIndex,
					history: state.history,
					lastMove: state.lastMove,
				},
			});
		},
		[state.history, state.lastMove, state.isThinking, stopAllOperations]
	);

	const toggleBoardOrientation = useCallback(() => {
		dispatch({
			type: "SET_BOARD_ORIENTATION",
			payload: state.boardOrientation === "white" ? "black" : "white",
		});
	}, [state.boardOrientation]);

	const setPremoves = useCallback((newPremoves) => {
		premovesRef.current = newPremoves;
		dispatch({ type: "SET_PREMOVES", payload: newPremoves });
	}, []);

	const clearPremoves = useCallback(() => {
		premovesRef.current = [];
		dispatch({ type: "SET_PREMOVES", payload: [] });
	}, []);

	return {
		game: state.game,
		lastMove: state.lastMove,
		history: state.history,
		currentIndex: state.currentIndex,
		kingInCheck: state.kingInCheck,
		isGameOver: state.isGameOver,
		gameEndReason: state.gameEndReason,
		pgn: state.pgn,
		currentPlayer: state.currentPlayer,
		isThinking: state.isThinking,
		isPondering: state.isPondering,
		playerColor,

		highlightedSquares: state.highlightedSquares,
		optionSquares: state.optionSquares,
		moveFrom: state.moveFrom,
		rightClickedSquares: state.rightClickedSquares,
		boardOrientation: state.boardOrientation,

		premoves: state.premoves,
		premovesRef,
		setPremoves,
		clearPremoves,

		makeMove,
		resetGame,
		undoMove,
		navigateMove,
		toggleBoardOrientation,

		setHighlightedSquares: (squares) =>
			dispatch({ type: "SET_HIGHLIGHTED_SQUARES", payload: squares }),
		setOptionSquares: (squares) =>
			dispatch({ type: "SET_OPTION_SQUARES", payload: squares }),
		setMoveFrom: (square) =>
			dispatch({ type: "SET_MOVE_FROM", payload: square }),
		setRightClickedSquares: (squares) =>
			dispatch({ type: "SET_RIGHT_CLICKED_SQUARES", payload: squares }),
		setIsGameOver: (reason) =>
			dispatch({ type: "SET_GAME_OVER", payload: reason }),

		isKingInCheck: checkKingInCheck(state.game),
		isPlayerTurn: isPlayerTurn(),
	};
};
