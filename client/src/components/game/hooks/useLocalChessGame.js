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

export const useLocalChessGame = () => {
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

	// local game settings
	const [analysisMode, setAnalysisMode] = useState(false);
	const [autoFlip, setAutoFlip] = useState(false);
	const [bestMove, setBestMove] = useState(null);
	const [boardOrientation, setBoardOrientation] = useState("white");

	const toastId = useRef(null);

	// king in check detection
	const isKingInCheck = useCallback(() => {
		return checkKingInCheck(game);
	}, [game]);

	const gameFen = game.fen();
	const isGameOverOrNot = !game.isGameOver() || game.isGameOver();

	// analysis mode logic
	const findBestMove = useCallback(() => {
		findBestMoveUtil(engine, game, analysisMode, setBestMove, () => {});
	}, [engine, game, analysisMode]);

	useEffect(() => {
		if (isGameOverOrNot && analysisMode) {
			setTimeout(findBestMove, 300);
		}
	}, [gameFen, findBestMove, game, analysisMode, isGameOverOrNot]);

	// game over logi
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

		setGameEndReason(reason);

		if (reason) {
			toastId.current = toast.info(reason, {
				position: toast.POSITION.TOP_CENTER,
				autoClose: 2000,
			});

			setTimeout(() => {
				setIsGameOver(true);
			}, 1000);
		}
	}, [game, history]);

	// sfx
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
		setPgn(generatePGN(history, "passandplay"));
	}, [game, checkGameOver, history]);

	// game move logic
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
		setCurrentPlayer("white");

		toastId.current = toast.info("The game has restarted", {
			position: toast.POSITION.TOP_CENTER,
			autoClose: 2000,
		});
	}, []);

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
		currentPlayer,

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

		// Setters for external use
		setHighlightedSquares,
		setOptionSquares,
		setMoveFrom,
		setRightClickedSquares,
		setIsGameOver,

		// Computed
		isKingInCheck: isKingInCheck(),
	};
};
