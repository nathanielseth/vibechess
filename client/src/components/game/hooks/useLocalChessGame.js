import { useState, useEffect, useCallback, useMemo } from "react";
import { Chess } from "chess.js";
import { toast } from "react-toastify";
import {
	findBestMove as findBestMoveUtil,
	generatePGN,
} from "../../../data/utils.js";
import Engine from "../../game/utils/engine.js";
import { useChessGameBase } from "./useChessGameBase.js";

export const useLocalChessGame = () => {
	const base = useChessGameBase("local");
	const engine = useMemo(() => new Engine(), []);

	const [analysisMode, setAnalysisMode] = useState(false);
	const [autoFlip, setAutoFlip] = useState(false);
	const [bestMove, setBestMove] = useState(null);

	const findBestMove = useCallback(() => {
		findBestMoveUtil(
			engine,
			base.game,
			analysisMode,
			setBestMove,
			() => {}
		);
	}, [engine, base.game, analysisMode]);

	useEffect(() => {
		if (!base.game.isGameOver() && analysisMode) {
			setTimeout(findBestMove, 300);
		}
	}, [findBestMove, analysisMode, base.game]);

	useEffect(() => {
		base.checkGameOver();
	}, [base.game, base.checkGameOver, base]);

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

			if (move) {
				base.setCurrentPlayer(
					base.currentPlayer === "white" ? "black" : "white"
				);
				base.setLastMove(move);
				base.setHistory((prevHistory) => [
					...prevHistory,
					{ fen: gameCopy.fen(), lastMove: move },
				]);
				base.highlightMove(sourceSquare, targetSquare);
				base.setCurrentIndex(base.history.length);
				base.setGame(gameCopy);
				base.clearUIState();

				return move;
			}

			return false;
		},
		[base]
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
		setAutoFlip(false);
		base.setIsGameOver(false);
		base.setGameEndReason(null);
		base.setPgn("");
		base.setCurrentPlayer("white");

		base.toastId.current = toast.info("The game has restarted", {
			position: toast.POSITION.TOP_CENTER,
			autoClose: 2000,
		});
	}, [base]);

	const undoMove = useCallback(() => {
		if (base.currentIndex > 0) {
			const newHistory = base.history.slice(0, -1);
			const newIndex = base.currentIndex - 1;

			const newGame = new Chess();
			for (let i = 1; i <= newIndex; i++) {
				newGame.move(base.history[i].lastMove);
			}

			base.setGame(newGame);
			base.setHistory(newHistory);
			base.setCurrentIndex(newIndex);
			base.setLastMove(null);
			base.setHighlightedSquares({});
			base.clearUIState();
			base.setKingInCheck(base.isKingInCheck);
			base.setPgn(generatePGN(newHistory));
			base.setCurrentPlayer(
				base.currentPlayer === "white" ? "black" : "white"
			);
		}
	}, [base]);

	const toggleAutoFlip = useCallback(() => {
		if (!autoFlip) {
			base.toastId.current = toast.info("Auto-flip is enabled!", {
				position: toast.POSITION.TOP_CENTER,
				autoClose: 2000,
			});
		}
		setAutoFlip(!autoFlip);
	}, [autoFlip, base.toastId]);

	const toggleAnalysisMode = useCallback(() => {
		if (!analysisMode) {
			base.toastId.current = toast.info("Stockfish evaluation enabled!", {
				position: toast.POSITION.TOP_CENTER,
				autoClose: 4000,
			});
		}
		setAnalysisMode(!analysisMode);
	}, [analysisMode, base.toastId]);

	return {
		game: base.game,
		lastMove: base.lastMove,
		history: base.history,
		currentIndex: base.currentIndex,
		kingInCheck: base.kingInCheck,
		isGameOver: base.isGameOver,
		gameEndReason: base.gameEndReason,
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
