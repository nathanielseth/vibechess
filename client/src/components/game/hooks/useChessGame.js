import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Chess } from "chess.js";
import { toast } from "react-toastify";
import {
	isKingInCheck as checkKingInCheck,
	findBestMove as findBestMoveUtil,
	generatePGN,
	moveSound,
	captureSound,
	tenSecondsSound,
	notifySound,
} from "../../../data/utils.js";
import Engine from "../../game/utils/engine.js";

export const useChessGame = (gameMode = "passandplay") => {
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

	const [highlightedSquares, setHighlightedSquares] = useState({});
	const [optionSquares, setOptionSquares] = useState({});
	const [moveFrom, setMoveFrom] = useState("");
	const [rightClickedSquares, setRightClickedSquares] = useState({});

	// settings state
	const [analysisMode, setAnalysisMode] = useState(false);
	const [autoFlip, setAutoFlip] = useState(false);
	const [bestMove, setBestMove] = useState(null);
	const [boardOrientation, setBoardOrientation] = useState("white");

	// timer state (for multi)
	const [whiteTime, setWhiteTime] = useState(10 * 60);
	const [blackTime, setBlackTime] = useState(10 * 60);
	const [currentPlayer, setCurrentPlayer] = useState("white");
	const [hasPlayed, setHasPlayed] = useState({ white: false, black: false });

	const toastId = useRef(null);

	// check for king in check
	const isKingInCheck = useCallback(() => {
		return checkKingInCheck(game);
	}, [game]);

	const gameFen = game.fen();
	const isGameOverOrNot = !game.isGameOver() || game.isGameOver();

	// timer for multi
	useEffect(() => {
		if (gameMode === "multiplayer") {
			const timer = setInterval(() => {
				if (!isGameOver) {
					if (currentPlayer === "white") {
						setWhiteTime((prevTime) =>
							prevTime > 0 ? prevTime - 0.1 : 0
						);
					} else {
						setBlackTime((prevTime) =>
							prevTime > 0 ? prevTime - 0.1 : 0
						);
					}

					if (
						(currentPlayer === "white" &&
							whiteTime <= 10 &&
							!hasPlayed.white) ||
						(currentPlayer === "black" &&
							blackTime <= 10 &&
							!hasPlayed.black)
					) {
						tenSecondsSound.play();
						if (currentPlayer === "white") {
							setHasPlayed((prevState) => ({
								...prevState,
								white: true,
							}));
						} else {
							setHasPlayed((prevState) => ({
								...prevState,
								black: true,
							}));
						}
					}
				}
			}, 100);

			return () => clearInterval(timer);
		}
	}, [currentPlayer, isGameOver, whiteTime, blackTime, hasPlayed, gameMode]);

	// analysis mode logic
	const findBestMove = useCallback(() => {
		findBestMoveUtil(engine, game, analysisMode, setBestMove, () => {});
	}, [engine, game, analysisMode]);

	useEffect(() => {
		if (isGameOverOrNot && analysisMode) {
			setTimeout(findBestMove, 300);
		}
	}, [gameFen, findBestMove, game, analysisMode, isGameOverOrNot]);

	// game over logic
	const checkGameOver = useCallback(() => {
		let reason = null;

		if (game.isCheckmate()) {
			const loserColor = game.turn() === "w" ? "Black" : "White";
			const moves = history.length - 1;
			reason = `${loserColor} got checkmated in ${moves} moves`;
		} else if (game.isStalemate()) {
			reason = "oops... that's a stalemate...";
		} else if (game.isDraw() || game.isThreefoldRepetition()) {
			reason = "nobody won this one..";
		}

		// check for time out
		if (!reason && gameMode === "multiplayer") {
			if (currentPlayer === "white" && whiteTime <= 0) {
				reason = "White ran out of time!";
			} else if (currentPlayer === "black" && blackTime <= 0) {
				reason = "Black ran out of time!";
			}
		}

		setGameEndReason(reason);

		if (reason) {
			if (gameMode === "passandplay") {
				toastId.current = toast.info(reason, {
					position: toast.POSITION.TOP_CENTER,
					autoClose: 2000,
				});
			}

			setTimeout(() => {
				setIsGameOver(true);
			}, 1000);
		}
	}, [game, history, gameMode, currentPlayer, whiteTime, blackTime]);

	// sound effects
	useEffect(() => {
		if (lastMove && currentIndex > history.length - 2) {
			moveSound.play();
			if (lastMove.captured) {
				captureSound.play();
			}
			setKingInCheck(isKingInCheck());
		}
	}, [lastMove, currentIndex, history, isKingInCheck]);

	useEffect(() => {
		if (isGameOver) {
			notifySound.play();
		}
	}, [isGameOver]);

	// update PGN and check game over
	useEffect(() => {
		checkGameOver();
		setPgn(generatePGN(history, gameMode));
	}, [
		game,
		gameMode,
		checkGameOver,
		history,
		currentPlayer,
		whiteTime,
		blackTime,
	]);

	// game actions
	const makeMove = useCallback(
		(sourceSquare, targetSquare, promotion = "q") => {
			if (currentIndex !== history.length - 1 || isGameOver) {
				return false;
			}

			const gameCopy = new Chess(game.fen());
			const move = gameCopy.move({
				from: sourceSquare,
				to: targetSquare,
				promotion: promotion.toLowerCase(),
			});

			if (move) {
				setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
				setLastMove(move);
				setHistory((prevHistory) => [
					...prevHistory,
					{ fen: gameCopy.fen(), lastMove: move },
				]);
				setHighlightedSquares({
					[sourceSquare]: {
						backgroundColor: "rgba(252, 220, 77, 0.4)",
					},
					[targetSquare]: {
						backgroundColor: "rgba(252, 220, 77, 0.4)",
					},
				});
				setKingInCheck(checkKingInCheck(gameCopy));
				setCurrentIndex(history.length);
				setGame(gameCopy);
				setOptionSquares({});
				setMoveFrom("");
				return move;
			}

			return false;
		},
		[currentIndex, history, isGameOver, game, currentPlayer]
	);

	const resetGame = useCallback(() => {
		const newGame = new Chess();
		setGame(newGame);
		setLastMove(null);
		setRightClickedSquares({});
		setHighlightedSquares({});
		setOptionSquares({});
		setMoveFrom("");
		setHistory([{ fen: newGame.fen(), lastMove: null }]);
		setCurrentIndex(0);
		setKingInCheck(null);
		setAutoFlip(false);
		setIsGameOver(false);
		setGameEndReason(null);
		setPgn("");
		setWhiteTime(10 * 60);
		setBlackTime(10 * 60);
		setHasPlayed({ white: false, black: false });
		setCurrentPlayer("white");

		if (gameMode === "passandplay") {
			toastId.current = toast.info("The game has restarted", {
				position: toast.POSITION.TOP_CENTER,
				autoClose: 2000,
			});
		}
	}, [gameMode]);

	const undoMove = useCallback(() => {
		if (currentIndex > 0) {
			const newHistory = history.slice(0, -1);
			const newIndex = currentIndex - 1;

			const newGame = new Chess();
			for (let i = 1; i <= newIndex; i++) {
				newGame.move(history[i].lastMove);
			}

			setGame(newGame);
			setHistory(newHistory);
			setCurrentIndex(newIndex);
			setLastMove(null);
			setHighlightedSquares({});
			setRightClickedSquares({});
			setOptionSquares({});
			setMoveFrom("");
			setKingInCheck(checkKingInCheck(newGame));
			setPgn(generatePGN(newHistory));
			setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
		}
	}, [currentIndex, history, currentPlayer]);

	const navigateMove = useCallback(
		(moveIndex) => {
			setGame(new Chess(history[moveIndex].fen));
			setCurrentIndex(moveIndex);
			setOptionSquares({});

			// if navigating back to the current index, restore the last move's highlights
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
		},
		[history, lastMove]
	);

	const toggleBoardOrientation = useCallback(() => {
		setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
	}, []);

	const toggleAutoFlip = useCallback(() => {
		if (!autoFlip) {
			toastId.current = toast.info("Auto-flip is enabled!", {
				position: toast.POSITION.TOP_CENTER,
				autoClose: 2000,
			});
		}
		setAutoFlip(!autoFlip);
	}, [autoFlip]);

	const toggleAnalysisMode = useCallback(() => {
		if (!analysisMode) {
			toastId.current = toast.info("Stockfish evaluation enabled!", {
				position: toast.POSITION.TOP_CENTER,
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
		highlightedSquares,
		optionSquares,
		moveFrom,
		rightClickedSquares,
		setHighlightedSquares,
		setOptionSquares,
		setMoveFrom,
		setRightClickedSquares,
		analysisMode,
		autoFlip,
		bestMove,
		boardOrientation,
		whiteTime,
		blackTime,
		currentPlayer,
		makeMove,
		resetGame,
		undoMove,
		navigateMove,
		toggleBoardOrientation,
		toggleAutoFlip,
		toggleAnalysisMode,
		setIsGameOver,
		isKingInCheck: isKingInCheck(),
	};
};
