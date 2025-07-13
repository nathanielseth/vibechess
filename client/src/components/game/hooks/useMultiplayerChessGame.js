import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Chess } from "chess.js";
import {
	isKingInCheck as checkKingInCheck,
	generatePGN,
	moveSound,
	captureSound,
	notifySound,
} from "../../../data/utils.js";

export const useMultiplayerGame = (matchData, socket, playerColor) => {
	const [game, setGame] = useState(() => new Chess());
	const [lastMove, setLastMove] = useState(null);
	const [premoves, setPremoves] = useState([]);
	const premovesRef = useRef([]);
	const [history, setHistory] = useState([
		{ fen: new Chess().fen(), lastMove: null },
	]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [kingInCheck, setKingInCheck] = useState(null);
	const [isGameOver, setIsGameOver] = useState(false);
	const [gameEndReason, setGameEndReason] = useState(null);
	const [pgn, setPgn] = useState("");
	const [currentPlayer, setCurrentPlayer] = useState("white");
	const [highlightedSquares, setHighlightedSquares] = useState({});
	const [optionSquares, setOptionSquares] = useState({});
	const [moveFrom, setMoveFrom] = useState("");
	const [rightClickedSquares, setRightClickedSquares] = useState({});
	const [boardOrientation, setBoardOrientation] = useState(
		playerColor === "black" ? "black" : "white"
	);

	const getInitialTime = useCallback(() => {
		const gameState = matchData?.gameState;
		if (gameState?.whiteTimeRemaining !== undefined) {
			return {
				white: gameState.whiteTimeRemaining,
				black: gameState.blackTimeRemaining,
			};
		}

		const timeControlMinutes = matchData?.timeControl || 10;
		const timeInCentiseconds = timeControlMinutes * 60 * 100;

		return {
			white: timeInCentiseconds,
			black: timeInCentiseconds,
		};
	}, [matchData]);

	const initialTimes = useMemo(() => getInitialTime(), [getInitialTime]);

	// Timer state
	const [displayWhiteTime, setDisplayWhiteTime] = useState(
		Math.ceil(initialTimes.white / 100)
	);
	const [displayBlackTime, setDisplayBlackTime] = useState(
		Math.ceil(initialTimes.black / 100)
	);

	const serverTimeRef = useRef({
		whiteTime: initialTimes.white,
		blackTime: initialTimes.black,
		timestamp: Date.now(),
	});

	const animationRef = useRef();

	// Timer animation
	const animateTimer = useCallback(() => {
		if (isGameOver) return;

		const now = Date.now();
		const elapsed = now - serverTimeRef.current.timestamp;
		const elapsedCentiseconds = Math.floor(elapsed / 10);

		let newWhiteTime = serverTimeRef.current.whiteTime;
		let newBlackTime = serverTimeRef.current.blackTime;

		if (currentPlayer === "white") {
			newWhiteTime = Math.max(
				0,
				serverTimeRef.current.whiteTime - elapsedCentiseconds
			);
		} else {
			newBlackTime = Math.max(
				0,
				serverTimeRef.current.blackTime - elapsedCentiseconds
			);
		}

		setDisplayWhiteTime(Math.max(0, Math.ceil(newWhiteTime / 100)));
		setDisplayBlackTime(Math.max(0, Math.ceil(newBlackTime / 100)));

		animationRef.current = requestAnimationFrame(animateTimer);
	}, [currentPlayer, isGameOver]);

	// Timer effect
	useEffect(() => {
		if (!isGameOver) {
			animationRef.current = requestAnimationFrame(animateTimer);
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [animateTimer, isGameOver]);

	// Server time updates
	const updateServerTimes = useCallback(
		({ whiteTime, blackTime, timestamp }) => {
			serverTimeRef.current = {
				whiteTime,
				blackTime,
				timestamp: timestamp || Date.now(),
			};
		},
		[]
	);

	// Helper function to create move history
	const createMoveHistory = useCallback((moves) => {
		const newHistory = [{ fen: new Chess().fen(), lastMove: null }];
		const tempGame = new Chess();

		moves.forEach((move) => {
			const gameMove = tempGame.move(move);
			if (gameMove) {
				newHistory.push({
					fen: tempGame.fen(),
					lastMove: gameMove,
				});
			}
		});

		return newHistory;
	}, []);

	// Helper function to set move highlights
	const setMoveHighlights = useCallback((move) => {
		if (move) {
			setHighlightedSquares({
				[move.from]: {
					backgroundColor: "rgba(252, 220, 77, 0.4)",
				},
				[move.to]: {
					backgroundColor: "rgba(252, 220, 77, 0.4)",
				},
			});
		} else {
			setHighlightedSquares({});
		}
	}, []);

	// Initialize game state from server
	useEffect(() => {
		if (!matchData?.gameState) return;

		const serverState = matchData.gameState;
		const newGame = new Chess(serverState.fen);

		setGame(newGame);
		setCurrentPlayer(serverState.currentPlayer);
		setIsGameOver(serverState.isGameOver);
		setGameEndReason(serverState.gameOverReason);
		setKingInCheck(checkKingInCheck(newGame));

		updateServerTimes({
			whiteTime: serverState.whiteTimeRemaining,
			blackTime: serverState.blackTimeRemaining,
			timestamp: serverState.timestamp,
		});

		// Handle move history
		if (serverState.moves?.length > 0) {
			const newHistory = createMoveHistory(serverState.moves);
			setHistory(newHistory);
			setCurrentIndex(newHistory.length - 1);
		}

		// Handle last move highlighting
		if (serverState.lastMove) {
			setLastMove(serverState.lastMove);
			setMoveHighlights(serverState.lastMove);
		}
	}, [matchData, updateServerTimes, createMoveHistory, setMoveHighlights]);

	// Sound effects
	useEffect(() => {
		if (lastMove && currentIndex > 0) {
			moveSound.play();
			if (lastMove.captured) {
				captureSound.play();
			}
		}
	}, [lastMove, currentIndex]);

	useEffect(() => {
		if (isGameOver) {
			notifySound.play();
		}
	}, [isGameOver]);

	// Update PGN when history changes
	useEffect(() => {
		setPgn(generatePGN(history, "multiplayer"));
	}, [history]);

	// Move logic
	const makeMove = useCallback(
		(sourceSquare, targetSquare, promotion = "q") => {
			if (!socket || !matchData?.roomCode) return false;

			socket.emit("makeMove", {
				roomCode: matchData.roomCode,
				move: {
					from: sourceSquare,
					to: targetSquare,
					promotion: promotion.toLowerCase(),
				},
			});

			setOptionSquares({});
			setMoveFrom("");
			setRightClickedSquares({});

			return true;
		},
		[socket, matchData]
	);

	const syncGameState = useCallback(
		(serverState) => {
			const newGame = new Chess(serverState.fen);

			setGame(newGame);
			setCurrentPlayer(serverState.currentPlayer);
			setIsGameOver(serverState.isGameOver);
			setGameEndReason(serverState.gameOverReason);
			setKingInCheck(checkKingInCheck(newGame));

			updateServerTimes({
				whiteTime: serverState.whiteTimeRemaining,
				blackTime: serverState.blackTimeRemaining,
				timestamp: serverState.timestamp || Date.now(),
			});

			setDisplayWhiteTime(
				Math.max(0, Math.ceil(serverState.whiteTimeRemaining / 100))
			);
			setDisplayBlackTime(
				Math.max(0, Math.ceil(serverState.blackTimeRemaining / 100))
			);

			const newHistory =
				serverState.moves?.length > 0
					? createMoveHistory(serverState.moves)
					: [{ fen: new Chess().fen(), lastMove: null }];

			setHistory(newHistory);
			setCurrentIndex(newHistory.length - 1);
			setLastMove(serverState.lastMove || null);
			setMoveHighlights(serverState.lastMove);

			setMoveFrom("");
			setOptionSquares({});
			setRightClickedSquares({});
		},
		[updateServerTimes, createMoveHistory, setMoveHighlights]
	);

	const resetGame = useCallback(() => {
		if (socket && matchData?.roomCode) {
			socket.emit("requestRematch", { roomCode: matchData.roomCode });
		}
	}, [socket, matchData]);

	const navigateMove = useCallback(
		(moveIndex) => {
			if (moveIndex < 0 || moveIndex >= history.length) return;

			setGame(new Chess(history[moveIndex].fen));
			setCurrentIndex(moveIndex);
			setOptionSquares({});
			setMoveFrom("");

			if (moveIndex === history.length - 1 && lastMove) {
				setMoveHighlights(lastMove);
			} else {
				setMoveHighlights(null);
			}
		},
		[history, lastMove, setMoveHighlights]
	);

	const executePremove = useCallback(() => {
		if (premovesRef.current.length > 0) {
			const currentTurn = game.turn() === "w" ? "white" : "black";
			if (currentTurn !== playerColor) {
				return;
			}

			const nextPremove = premovesRef.current[0];
			premovesRef.current.splice(0, 1);

			setTimeout(() => {
				if (socket && matchData?.roomCode) {
					socket.emit("makeMove", {
						roomCode: matchData.roomCode,
						move: nextPremove.moveData,
					});
				}

				setPremoves([...premovesRef.current]);
			}, 100);
		}
	}, [socket, matchData, game, playerColor]);

	useEffect(() => {
		if (currentIndex === history.length - 1) {
			const currentTurn = game.turn() === "w" ? "white" : "black";
			if (currentTurn === playerColor) {
				executePremove();
			}
		}
	}, [
		currentPlayer,
		executePremove,
		currentIndex,
		history.length,
		game,
		playerColor,
	]);

	const toggleBoardOrientation = useCallback(() => {
		setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
	}, []);

	return {
		game,
		lastMove,
		premoves,
		setPremoves,
		premovesRef,
		clearPremoves: () => {
			premovesRef.current = [];
			setPremoves([]);
		},
		history,
		currentIndex,
		kingInCheck,
		isGameOver,
		gameEndReason,
		pgn,
		currentPlayer,

		whiteTime: displayWhiteTime,
		blackTime: displayBlackTime,

		highlightedSquares,
		optionSquares,
		moveFrom,
		rightClickedSquares,
		boardOrientation,

		makeMove,
		resetGame,
		navigateMove,
		toggleBoardOrientation,
		syncGameState,
		updateServerTimes,

		setHighlightedSquares,
		setOptionSquares,
		setMoveFrom,
		setRightClickedSquares,
		setHistory,
		setCurrentIndex,
		setLastMove,
		setCurrentPlayer,
		setIsGameOver,
		setGameEndReason,
		setKingInCheck,

		isKingInCheck: checkKingInCheck(game),
	};
};
