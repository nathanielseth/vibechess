import { useState, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import {
	isKingInCheck as checkKingInCheck,
	generatePGN,
	moveSound,
	captureSound,
	notifySound,
} from "../../../data/utils.js";

export const useChessGameBase = (gameMode = "local") => {
	const [game, setGame] = useState(() => new Chess());
	const [lastMove, setLastMove] = useState(null);
	const [history, setHistory] = useState([
		{ fen: new Chess().fen(), lastMove: null },
	]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [kingInCheck, setKingInCheck] = useState(null);
	const [isGameOver, setIsGameOver] = useState(false);
	const [gameEndReason, setGameEndReason] = useState(null);
	const [winner, setWinner] = useState(null);
	const [pgn, setPgn] = useState("");
	const [currentPlayer, setCurrentPlayer] = useState("white");
	const [boardOrientation, setBoardOrientation] = useState("white");

	const [highlightedSquares, setHighlightedSquares] = useState({});
	const [optionSquares, setOptionSquares] = useState({});
	const [moveFrom, setMoveFrom] = useState("");
	const [rightClickedSquares, setRightClickedSquares] = useState({});

	const toastId = useRef(null);

	const checkGameOver = useCallback(() => {
		let reason = null;
		let gameWinner = null;

		if (game.isCheckmate()) {
			const loserColor = game.turn();
			gameWinner = loserColor === "w" ? "black" : "white";
			const moves = history.length - 1;
			reason = `Checkmate in ${moves} moves`;
		} else if (game.isStalemate()) {
			reason = "Stalemate";
		} else if (game.isDraw() || game.isThreefoldRepetition()) {
			reason = "Draw";
		}

		if (reason) {
			setGameEndReason(reason);
			setWinner(gameWinner);
			setIsGameOver(true);
			notifySound.play();
		}
	}, [game, history]);

	useEffect(() => {
		if (lastMove && currentIndex > history.length - 2) {
			moveSound.play();
			if (lastMove.captured) {
				captureSound.play();
			}
			setKingInCheck(checkKingInCheck(game));
		}
	}, [lastMove, currentIndex, history, game]);

	// Update PGN
	useEffect(() => {
		setPgn(generatePGN(history, gameMode));
	}, [history, gameMode]);

	// Common move highlighting
	const highlightMove = useCallback((sourceSquare, targetSquare) => {
		setHighlightedSquares({
			[sourceSquare]: {
				backgroundColor: "rgba(252, 220, 77, 0.4)",
			},
			[targetSquare]: {
				backgroundColor: "rgba(252, 220, 77, 0.4)",
			},
		});
	}, []);

	// Common UI clearing
	const clearUIState = useCallback(() => {
		setMoveFrom("");
		setOptionSquares({});
		setRightClickedSquares({});
	}, []);

	// Navigation logic
	const navigateMove = useCallback(
		(moveIndex) => {
			setGame(new Chess(history[moveIndex].fen));
			setCurrentIndex(moveIndex);
			setOptionSquares({});

			if (moveIndex === history.length - 1 && lastMove) {
				highlightMove(lastMove.from, lastMove.to);
			} else {
				setHighlightedSquares({});
			}
		},
		[history, lastMove, highlightMove]
	);

	// Board orientation toggle
	const toggleBoardOrientation = useCallback(() => {
		setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
	}, []);

	return {
		game,
		setGame,
		lastMove,
		setLastMove,
		history,
		setHistory,
		currentIndex,
		setCurrentIndex,
		kingInCheck,
		setKingInCheck,
		isGameOver,
		setIsGameOver,
		gameEndReason,
		setGameEndReason,
		winner,
		setWinner,
		pgn,
		setPgn,
		currentPlayer,
		setCurrentPlayer,
		boardOrientation,
		setBoardOrientation,

		highlightedSquares,
		setHighlightedSquares,
		optionSquares,
		setOptionSquares,
		moveFrom,
		setMoveFrom,
		rightClickedSquares,
		setRightClickedSquares,

		checkGameOver,
		highlightMove,
		clearUIState,
		navigateMove,
		toggleBoardOrientation,

		isKingInCheck: checkKingInCheck(game),
		toastId,
	};
};
