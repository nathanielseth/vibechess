import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Chess } from "chess.js";
import {
	isKingInCheck as checkKingInCheck,
	generatePGN,
	moveSound,
	captureSound,
	notifySound,
} from "../../../data/utils.js";

const HIGHLIGHT_COLOR = "rgba(252, 220, 77, 0.4)";
const PREMOVE_HIGHLIGHT_COLOR = "rgba(255, 0, 0, 0.3)";
const SOUND_DEBOUNCE_MS = 200;

export const useMultiplayerGame = (matchData, socket, playerColor) => {
	const [game, setGame] = useState(() => new Chess());
	const [lastMove, setLastMove] = useState(null);
	const [premove, setPremove] = useState(null);
	const [history, setHistory] = useState([
		{ fen: new Chess().fen(), lastMove: null },
	]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [kingInCheck, setKingInCheck] = useState(null);
	const [isGameOver, setIsGameOver] = useState(false);
	const [gameEndReason, setGameEndReason] = useState(null);
	const [pgn, setPgn] = useState("");
	const [players, setPlayers] = useState([]);
	const [currentPlayer, setCurrentPlayer] = useState("white");
	const [highlightedSquares, setHighlightedSquares] = useState({});
	const [optionSquares, setOptionSquares] = useState({});
	const [moveFrom, setMoveFrom] = useState("");
	const [rightClickedSquares, setRightClickedSquares] = useState({});
	const [premovePosition, setPremovePosition] = useState(null);
	const [boardOrientation, setBoardOrientation] = useState(
		playerColor === "black" ? "black" : "white",
	);
	const [winner, setWinner] = useState(null);

	const [optimisticGame, setOptimisticGame] = useState(() => new Chess());
	const [pendingMove, setPendingMove] = useState(null);
	const pendingMoveTimeoutRef = useRef(null);
	const [drawOfferData, setDrawOfferData] = useState({ isVisible: false });

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
		return { white: timeInCentiseconds, black: timeInCentiseconds };
	}, [matchData]);

	const initialTimes = useMemo(() => getInitialTime(), [getInitialTime]);

	const [displayWhiteTime, setDisplayWhiteTime] = useState(
		Math.ceil(initialTimes.white / 100),
	);
	const [displayBlackTime, setDisplayBlackTime] = useState(
		Math.ceil(initialTimes.black / 100),
	);

	const serverTimeRef = useRef({
		whiteTime: initialTimes.white,
		blackTime: initialTimes.black,
		timestamp: Date.now(),
	});

	const animationRef = useRef(null);
	const gameOverRef = useRef(false);

	const animateTimer = useCallback(() => {
		if (gameOverRef.current || isGameOver) {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
			}
			return;
		}

		const now = Date.now();
		const elapsed = now - serverTimeRef.current.timestamp;
		const elapsedCentiseconds = Math.floor(elapsed / 10);

		let newWhiteTime = serverTimeRef.current.whiteTime;
		let newBlackTime = serverTimeRef.current.blackTime;

		if (currentPlayer === "white") {
			newWhiteTime = Math.max(
				0,
				serverTimeRef.current.whiteTime - elapsedCentiseconds,
			);
		} else {
			newBlackTime = Math.max(
				0,
				serverTimeRef.current.blackTime - elapsedCentiseconds,
			);
		}

		const newDisplayWhiteTime = Math.max(0, Math.ceil(newWhiteTime / 100));
		const newDisplayBlackTime = Math.max(0, Math.ceil(newBlackTime / 100));

		if (
			newDisplayWhiteTime !== displayWhiteTime ||
			newDisplayBlackTime !== displayBlackTime
		) {
			setDisplayWhiteTime(newDisplayWhiteTime);
			setDisplayBlackTime(newDisplayBlackTime);
		}

		if (newWhiteTime <= 0 || newBlackTime <= 0) {
			gameOverRef.current = true;
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
			}
			return;
		}

		animationRef.current = requestAnimationFrame(animateTimer);
	}, [currentPlayer, displayWhiteTime, displayBlackTime, isGameOver]);

	useEffect(() => {
		gameOverRef.current = isGameOver;

		if (isGameOver) {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
			}
			return;
		}

		if (!animationRef.current) {
			animationRef.current = requestAnimationFrame(animateTimer);
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
			}
		};
	}, [animateTimer, isGameOver]);

	const updateServerTimes = useCallback(
		({ whiteTime, blackTime, timestamp }) => {
			serverTimeRef.current = {
				whiteTime,
				blackTime,
				timestamp: timestamp || Date.now(),
			};
		},
		[],
	);

	const createMoveHistory = useCallback((moves) => {
		const newHistory = [{ fen: new Chess().fen(), lastMove: null }];
		const tempGame = new Chess();
		moves.forEach((move) => {
			const gameMove = tempGame.move(move);
			if (gameMove) {
				newHistory.push({ fen: tempGame.fen(), lastMove: gameMove });
			}
		});
		return newHistory;
	}, []);

	const setMoveHighlights = useCallback((move) => {
		if (move) {
			setHighlightedSquares({
				[move.from]: { backgroundColor: HIGHLIGHT_COLOR },
				[move.to]: { backgroundColor: HIGHLIGHT_COLOR },
			});
		} else {
			setHighlightedSquares({});
		}
	}, []);

	const clearPremove = useCallback(() => {
		setPremove(null);
		setPremovePosition(null);
		setHighlightedSquares((prev) => {
			const next = { ...prev };
			Object.keys(next).forEach((square) => {
				if (next[square]?.backgroundColor === PREMOVE_HIGHLIGHT_COLOR) {
					delete next[square];
				}
			});
			return next;
		});
	}, []);

	const applyOptimisticMove = useCallback(
		(sourceSquare, targetSquare, promotion = "q") => {
			const newGame = new Chess(game.fen());
			let move = null;
			try {
				move = newGame.move({
					from: sourceSquare,
					to: targetSquare,
					promotion: promotion.toLowerCase(),
				});
			} catch {
				return false;
			}

			if (!move) return false;

			setOptimisticGame(newGame);
			setPendingMove({
				from: sourceSquare,
				to: targetSquare,
				promotion: promotion.toLowerCase(),
				timestamp: Date.now(),
			});

			if (pendingMoveTimeoutRef.current) {
				clearTimeout(pendingMoveTimeoutRef.current);
			}
			pendingMoveTimeoutRef.current = setTimeout(() => {
				setOptimisticGame(game);
				setPendingMove(null);
				pendingMoveTimeoutRef.current = null;
			}, 2000);

			return true;
		},
		[game],
	);

	useEffect(() => {
		if (!matchData?.gameState) return;

		const serverState = matchData.gameState;
		const newGame = new Chess(serverState.fen);

		setGame(newGame);
		setOptimisticGame(newGame);
		setCurrentPlayer(serverState.currentPlayer);
		setIsGameOver(serverState.isGameOver);
		setGameEndReason(serverState.gameOverReason);
		setWinner(serverState.winner);
		setKingInCheck(checkKingInCheck(newGame));

		updateServerTimes({
			whiteTime: serverState.whiteTimeRemaining,
			blackTime: serverState.blackTimeRemaining,
			timestamp: serverState.timestamp,
		});

		if (serverState.moves?.length > 0) {
			const newHistory = createMoveHistory(serverState.moves);
			setHistory(newHistory);
			setCurrentIndex(newHistory.length - 1);
		}

		if (serverState.lastMove) {
			setLastMove(serverState.lastMove);
			setMoveHighlights(serverState.lastMove);
		}
	}, [matchData, updateServerTimes, createMoveHistory, setMoveHighlights]);

	const lastSoundRef = useRef(0);

	useEffect(() => {
		if (!lastMove || currentIndex <= 0) return;
		const now = Date.now();
		if (now - lastSoundRef.current <= SOUND_DEBOUNCE_MS) return;

		moveSound.play();
		if (lastMove.captured) captureSound.play();
		lastSoundRef.current = now;
	}, [lastMove, currentIndex]);

	useEffect(() => {
		if (!isGameOver) return;
		const now = Date.now();
		if (now - lastSoundRef.current <= SOUND_DEBOUNCE_MS) return;

		notifySound.play();
		lastSoundRef.current = now;
	}, [isGameOver]);

	const pgnUpdateTimeoutRef = useRef(null);
	useEffect(() => {
		if (pgnUpdateTimeoutRef.current) {
			clearTimeout(pgnUpdateTimeoutRef.current);
		}
		pgnUpdateTimeoutRef.current = setTimeout(() => {
			setPgn(generatePGN(history, "multiplayer"));
		}, 100);

		return () => {
			if (pgnUpdateTimeoutRef.current) {
				clearTimeout(pgnUpdateTimeoutRef.current);
			}
		};
	}, [history]);

	const makeMove = useCallback(
		(sourceSquare, targetSquare, promotion = "q") => {
			if (isGameOver || !socket || !matchData?.roomCode) return false;

			const currentTurn = game.turn() === "w" ? "white" : "black";
			if (currentTurn !== playerColor) return false;

			setOptionSquares({});
			setMoveFrom("");
			setRightClickedSquares({});

			const optimisticSuccess = applyOptimisticMove(
				sourceSquare,
				targetSquare,
				promotion,
			);
			if (!optimisticSuccess) return false;

			socket.emit("makeMove", {
				roomCode: matchData.roomCode,
				move: {
					from: sourceSquare,
					to: targetSquare,
					promotion: promotion.toLowerCase(),
				},
			});

			return true;
		},
		[socket, matchData, applyOptimisticMove, isGameOver, game, playerColor],
	);

	const syncGameState = useCallback(
		(serverState) => {
			const newGame = new Chess(serverState.fen);

			if (pendingMove && pendingMoveTimeoutRef.current) {
				clearTimeout(pendingMoveTimeoutRef.current);
				setPendingMove(null);
				pendingMoveTimeoutRef.current = null;
			}

			setGame(newGame);
			setOptimisticGame(newGame);
			setCurrentPlayer(serverState.currentPlayer);
			setWinner(serverState.winner || null);
			setIsGameOver(serverState.isGameOver);
			setGameEndReason(serverState.gameOverReason);
			setKingInCheck(checkKingInCheck(newGame));

			setDisplayWhiteTime(
				Math.max(0, Math.ceil(serverState.whiteTimeRemaining / 100)),
			);
			setDisplayBlackTime(
				Math.max(0, Math.ceil(serverState.blackTimeRemaining / 100)),
			);

			setMoveFrom("");
			setOptionSquares({});
			setRightClickedSquares({});

			if (serverState.isGameOver) {
				gameOverRef.current = true;
				if (animationRef.current) {
					cancelAnimationFrame(animationRef.current);
					animationRef.current = null;
				}
			}

			updateServerTimes({
				whiteTime: serverState.whiteTimeRemaining,
				blackTime: serverState.blackTimeRemaining,
				timestamp: serverState.timestamp || Date.now(),
			});

			const newHistory =
				serverState.moves?.length > 0
					? createMoveHistory(serverState.moves)
					: [{ fen: new Chess().fen(), lastMove: null }];

			setHistory(newHistory);
			setCurrentIndex(newHistory.length - 1);
			setLastMove(serverState.lastMove || null);
			setMoveHighlights(serverState.lastMove);
		},
		[updateServerTimes, createMoveHistory, setMoveHighlights, pendingMove],
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
			setOptimisticGame(new Chess(history[moveIndex].fen));
			setCurrentIndex(moveIndex);
			setOptionSquares({});
			setMoveFrom("");

			if (moveIndex === history.length - 1 && lastMove) {
				setMoveHighlights(lastMove);
			} else {
				setMoveHighlights(null);
			}
		},
		[history, lastMove, setMoveHighlights],
	);

	const executePremove = useCallback(() => {
		if (!premove) return;

		const currentTurn = game.turn() === "w" ? "white" : "black";
		if (currentTurn !== playerColor) return;

		clearPremove();

		setTimeout(() => {
			if (socket && matchData?.roomCode) {
				socket.emit("makeMove", {
					roomCode: matchData.roomCode,
					move: premove.moveData,
				});
			}
		}, 100);
	}, [socket, matchData, game, playerColor, premove, clearPremove]);

	const isValidPremove = useCallback((fromSquare, toSquare, currentGame) => {
		const tempGame = new Chess(currentGame.fen());
		try {
			return (
				tempGame.move({
					from: fromSquare,
					to: toSquare,
					promotion: "q",
				}) !== null
			);
		} catch {
			return false;
		}
	}, []);

	useEffect(() => {
		if (currentIndex !== history.length - 1) return;
		const currentTurn = game.turn() === "w" ? "white" : "black";
		if (currentTurn === playerColor) executePremove();
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

	useEffect(() => {
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
			}
			if (pendingMoveTimeoutRef.current) {
				clearTimeout(pendingMoveTimeoutRef.current);
				pendingMoveTimeoutRef.current = null;
			}
			if (pgnUpdateTimeoutRef.current) {
				clearTimeout(pgnUpdateTimeoutRef.current);
				pgnUpdateTimeoutRef.current = null;
			}
			gameOverRef.current = true;
		};
	}, []);

	const displayGame = pendingMove ? optimisticGame : game;

	return {
		game: displayGame,
		lastMove,
		premove,
		setPremove,
		premovePosition,
		setPremovePosition,
		clearPremove,
		history,
		currentIndex,
		kingInCheck,
		winner,
		setWinner,
		isGameOver,
		gameEndReason,
		pgn,
		currentPlayer,
		players,
		setPlayers,

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
		isValidPremove,
		toggleBoardOrientation,
		syncGameState,
		updateServerTimes,
		drawOfferData,
		setDrawOfferData,

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

		isKingInCheck: checkKingInCheck(displayGame),
	};
};