import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Chess } from "chess.js";
import { toast } from "react-toastify";
import {
	isKingInCheck as checkKingInCheck,
	findBestMove as findBestMoveUtil,
	generatePGN,
	moveSound,
	captureSound,
	notifySound,
} from "../../../data/utils.js";
import Engine from "../../game/utils/engine.js";

export const useMultiplayerGame = (matchData, socket, playerColor) => {
	const [game, setGame] = useState(() => new Chess());
	const engine = useMemo(() => new Engine(), []);
	const [lastMove, setLastMove] = useState(null);
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

	// should probably remove this..
	const [analysisMode, setAnalysisMode] = useState(false);
	const [autoFlip, setAutoFlip] = useState(false);
	const [bestMove, setBestMove] = useState(null);
	const [boardOrientation, setBoardOrientation] = useState(
		playerColor || "white"
	);

	// should probably make this dynamic if doing rooms
	const [displayWhiteTime, setDisplayWhiteTime] = useState(600);
	const [displayBlackTime, setDisplayBlackTime] = useState(600);

	// server time trackin
	const serverTimeRef = useRef({
		whiteTime: 600,
		blackTime: 600,
		timestamp: Date.now(),
	});

	const animationRef = useRef();

	const animateTimer = useCallback(() => {
		const now = Date.now();
		const elapsed = now - serverTimeRef.current.timestamp;
		const elapsedCentiseconds = Math.floor(elapsed / 10);

		// calculate display times based on server times and elapsed time
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

		if (!isGameOver) {
			animationRef.current = requestAnimationFrame(animateTimer);
		}
	}, [currentPlayer, isGameOver]);

	useEffect(() => {
		if (!isGameOver) {
			animationRef.current = requestAnimationFrame(animateTimer);
		} else {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		}

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
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

			setDisplayWhiteTime(Math.max(0, Math.ceil(whiteTime / 100)));
			setDisplayBlackTime(Math.max(0, Math.ceil(blackTime / 100)));
		},
		[]
	);

	useEffect(() => {
		if (matchData?.gameState) {
			const serverState = matchData.gameState;

			const newGame = new Chess(serverState.fen);
			setGame(newGame);
			setCurrentPlayer(serverState.currentPlayer);

			updateServerTimes({
				whiteTime: serverState.whiteTimeRemaining,
				blackTime: serverState.blackTimeRemaining,
				timestamp: serverState.timestamp,
			});

			setIsGameOver(serverState.isGameOver);
			setGameEndReason(serverState.gameOverReason);

			if (serverState.moves?.length > 0) {
				const newHistory = [{ fen: new Chess().fen(), lastMove: null }];
				const tempGame = new Chess();

				serverState.moves.forEach((move) => {
					const gameMove = tempGame.move(move);
					if (gameMove) {
						newHistory.push({
							fen: tempGame.fen(),
							lastMove: gameMove,
						});
					}
				});

				setHistory(newHistory);
				setCurrentIndex(newHistory.length - 1);
			}

			if (serverState.lastMove) {
				setLastMove(serverState.lastMove);
				setHighlightedSquares({
					[serverState.lastMove.from]: {
						backgroundColor: "rgba(252, 220, 77, 0.4)",
					},
					[serverState.lastMove.to]: {
						backgroundColor: "rgba(252, 220, 77, 0.4)",
					},
				});
			}

			setKingInCheck(checkKingInCheck(newGame));
		}
	}, [matchData, updateServerTimes]);

	const isKingInCheck = useCallback(() => {
		return checkKingInCheck(game);
	}, [game]);

	const gameFen = game.fen();
	const isGameOverOrNot = !game.isGameOver() || game.isGameOver();

	// should probably remove this since not used in multi
	const findBestMove = useCallback(() => {
		findBestMoveUtil(engine, game, analysisMode, setBestMove, () => {});
	}, [engine, game, analysisMode]);

	useEffect(() => {
		if (isGameOverOrNot && analysisMode) {
			setTimeout(findBestMove, 300);
		}
	}, [gameFen, findBestMove, game, analysisMode, isGameOverOrNot]);

	// sfx
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

	// update PGN when history changes
	useEffect(() => {
		setPgn(generatePGN(history, "multiplayer"));
	}, [history]);

	// move logic
	const makeMove = useCallback(
		(sourceSquare, targetSquare, promotion = "q") => {
			if (socket && matchData?.roomCode) {
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
			}
			return false;
		},
		[socket, matchData]
	);

	// server state sync method
	const syncGameState = useCallback(
		(serverState) => {
			const newGame = new Chess(serverState.fen);
			setGame(newGame);
			setCurrentPlayer(serverState.currentPlayer);

			updateServerTimes({
				whiteTime: serverState.whiteTimeRemaining,
				blackTime: serverState.blackTimeRemaining,
				timestamp: serverState.timestamp,
			});

			setIsGameOver(serverState.isGameOver);
			setGameEndReason(serverState.gameOverReason);

			if (serverState.lastMove) {
				setLastMove(serverState.lastMove);
				setHighlightedSquares({
					[serverState.lastMove.from]: {
						backgroundColor: "rgba(252, 220, 77, 0.4)",
					},
					[serverState.lastMove.to]: {
						backgroundColor: "rgba(252, 220, 77, 0.4)",
					},
				});
			} else {
				setLastMove(null);
				setHighlightedSquares({});
			}

			setKingInCheck(checkKingInCheck(newGame));

			if (serverState.moves?.length > 0) {
				const newHistory = [{ fen: new Chess().fen(), lastMove: null }];
				const tempGame = new Chess();

				serverState.moves.forEach((move) => {
					const gameMove = tempGame.move(move);
					if (gameMove) {
						newHistory.push({
							fen: tempGame.fen(),
							lastMove: gameMove,
						});
					}
				});

				setHistory(newHistory);
				setCurrentIndex(newHistory.length - 1);
			} else {
				setHistory([{ fen: new Chess().fen(), lastMove: null }]);
				setCurrentIndex(0);
			}

			setMoveFrom("");
			setOptionSquares({});
			setRightClickedSquares({});
		},
		[updateServerTimes]
	);

	const resetGame = useCallback(() => {
		if (socket && matchData?.roomCode) {
			socket.emit("requestRematch", { roomCode: matchData.roomCode });
		}
	}, [socket, matchData]);

	// no undo in multi
	const undoMove = useCallback(() => {}, []);

	const navigateMove = useCallback(
		(moveIndex) => {
			if (moveIndex >= 0 && moveIndex < history.length) {
				setGame(new Chess(history[moveIndex].fen));
				setCurrentIndex(moveIndex);
				setOptionSquares({});
				setMoveFrom("");

				if (moveIndex === history.length - 1 && lastMove) {
					setHighlightedSquares({
						[lastMove.from]: {
							backgroundColor: "rgba(252, 220, 77, 0.4)",
						},
						[lastMove.to]: {
							backgroundColor: "rgba(252, 220, 77, 0.4)",
						},
					});
				} else {
					setHighlightedSquares({});
				}
			}
		},
		[history, lastMove]
	);

	const toggleBoardOrientation = useCallback(() => {
		setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
	}, []);

	const toggleAutoFlip = useCallback(() => {
		if (!autoFlip) {
			toast.info("Auto-flip is enabled!", {
				position: "top-center",
				autoClose: 2000,
			});
		}
		setAutoFlip(!autoFlip);
	}, [autoFlip]);

	const toggleAnalysisMode = useCallback(() => {
		if (!analysisMode) {
			toast.info("Stockfish evaluation enabled!", {
				position: "top-center",
				autoClose: 4000,
			});
		}
		setAnalysisMode(!analysisMode);
	}, [analysisMode]);

	return {
		game,
		lastMove,
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

		analysisMode,
		autoFlip,
		bestMove,
		boardOrientation,

		makeMove,
		resetGame,
		undoMove,
		navigateMove,
		toggleBoardOrientation,
		toggleAutoFlip,
		toggleAnalysisMode,

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

		isKingInCheck: isKingInCheck(),
	};
};
