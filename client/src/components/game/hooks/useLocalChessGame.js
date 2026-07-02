import { useState, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import { generatePGN } from "../../../data/utils.js";
import Engine from "../../game/utils/engine.js";
import { useChessGameBase } from "./useChessGameBase.js";

const ANALYSIS_DEPTH = 10;
const ANALYSIS_POLL_MS = 300;

export const useLocalChessGame = () => {
	const base = useChessGameBase("local");
	const baseRef = useRef(base);
	baseRef.current = base;

	const engineRef = useRef(null);
	if (!engineRef.current) {
		engineRef.current = new Engine();
	}

	useEffect(() => {
		return () => {
			engineRef.current?.terminate();
			engineRef.current = null;
		};
	}, []);

	const [analysisMode, setAnalysisMode] = useState(false);
	const [autoFlip, setAutoFlip] = useState(false);
	const [bestMove, setBestMove] = useState(null);

	useEffect(() => {
		if (!analysisMode) {
			setBestMove(null);
			return;
		}

		const engine = engineRef.current;
		if (!engine) return;

		let cancelled = false;
		let pollTimeout = null;

		const unsubscribe = engine.onMessage(({ bestMove: move }) => {
			if (cancelled || !move) return;
			setBestMove(move);
		});

		const poll = () => {
			if (cancelled) return;
			if (!baseRef.current.game.isGameOver()) {
				engine.evaluatePosition(
					baseRef.current.game.fen(),
					ANALYSIS_DEPTH,
				);
			}
			pollTimeout = setTimeout(poll, ANALYSIS_POLL_MS);
		};
		poll();

		return () => {
			cancelled = true;
			if (pollTimeout) clearTimeout(pollTimeout);
			unsubscribe?.();
		};
	}, [analysisMode]);

	useEffect(() => {
		base.checkGameOver();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [base.game]);

	const makeMove = useCallback(
		(sourceSquare, targetSquare, promotion = "q") => {
			if (
				base.currentIndex !== base.history.length - 1 ||
				base.isGameOver
			) {
				return false;
			}

			const gameCopy = new Chess(base.game.fen());
			const move = gameCopy.move({
				from: sourceSquare,
				to: targetSquare,
				promotion: promotion.toLowerCase(),
			});

			if (!move) return false;

			const nextPlayer = gameCopy.turn() === "w" ? "white" : "black";

			base.setCurrentPlayer(nextPlayer);
			base.setLastMove(move);
			base.setHistory((prevHistory) => {
				const nextHistory = [
					...prevHistory,
					{ fen: gameCopy.fen(), lastMove: move },
				];
				base.setCurrentIndex(nextHistory.length - 1);
				return nextHistory;
			});
			base.highlightMove(sourceSquare, targetSquare);
			base.setGame(gameCopy);
			base.clearUIState();

			if (autoFlip) {
				base.setBoardOrientation(nextPlayer);
			}

			return move;
		},
		[base, autoFlip],
	);

	const resetGame = useCallback(() => {
		const newGame = new Chess();
		base.setGame(newGame);
		base.setLastMove(null);
		base.setHighlightedSquares({});
		base.clearUIState();
		base.setHistory([{ fen: newGame.fen(), lastMove: null }]);
		base.setCurrentIndex(0);
		base.setKingInCheck(null);
		base.setIsGameOver(false);
		base.setGameEndReason(null);
		base.setWinner(null);
		base.setPgn("");
		base.setCurrentPlayer("white");
		base.setBoardOrientation("white");
		setAutoFlip(false);
		setBestMove(null);
	}, [base]);

	const undoMove = useCallback(() => {
		if (base.currentIndex <= 0) return;

		const newHistory = base.history.slice(0, -1);
		const newIndex = base.currentIndex - 1;

		const newGame = new Chess();
		for (let i = 1; i <= newIndex; i++) {
			newGame.move(base.history[i].lastMove);
		}

		const nextPlayer = newGame.turn() === "w" ? "white" : "black";

		base.setGame(newGame);
		base.setHistory(newHistory);
		base.setCurrentIndex(newIndex);
		base.setLastMove(newIndex > 0 ? newHistory[newIndex].lastMove : null);
		base.setHighlightedSquares({});
		base.clearUIState();
		base.setKingInCheck(base.isKingInCheck);
		base.setPgn(generatePGN(newHistory, "local"));
		base.setCurrentPlayer(nextPlayer);

		base.setIsGameOver(false);
		base.setGameEndReason(null);
		base.setWinner(null);
	}, [base]);

	const toggleAutoFlip = useCallback(() => {
		setAutoFlip((prev) => !prev);
	}, []);

	const toggleAnalysisMode = useCallback(() => {
		setAnalysisMode((prev) => !prev);
	}, []);

	return {
		game: base.game,
		lastMove: base.lastMove,
		history: base.history,
		currentIndex: base.currentIndex,
		kingInCheck: base.kingInCheck,
		isGameOver: base.isGameOver,
		gameEndReason: base.gameEndReason,
		winner: base.winner,
		pgn: base.pgn,
		currentPlayer: base.currentPlayer,
		boardOrientation: base.boardOrientation,

		highlightedSquares: base.highlightedSquares,
		optionSquares: base.optionSquares,
		moveFrom: base.moveFrom,
		rightClickedSquares: base.rightClickedSquares,

		analysisMode,
		autoFlip,
		bestMove,

		makeMove,
		resetGame,
		undoMove,
		navigateMove: base.navigateMove,
		toggleBoardOrientation: base.toggleBoardOrientation,
		toggleAutoFlip,
		toggleAnalysisMode,

		setHighlightedSquares: base.setHighlightedSquares,
		setOptionSquares: base.setOptionSquares,
		setMoveFrom: base.setMoveFrom,
		setRightClickedSquares: base.setRightClickedSquares,
		setIsGameOver: base.setIsGameOver,

		isKingInCheck: base.isKingInCheck,
	};
};