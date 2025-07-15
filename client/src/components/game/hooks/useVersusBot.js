import { useState, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import { toast } from "react-toastify";
import {
	isKingInCheck as checkKingInCheck,
	moveSound,
	captureSound,
} from "../../../data/utils.js";
import { EngineService } from "../../game/utils/engineService.js";
import { useChessGameBase } from "./useChessGameBase.js";

export const useVersusBot = (playerColor = "white", difficulty = 10) => {
	const base = useChessGameBase("versus-bot");

	const [isThinking, setIsThinking] = useState(false);
	const [isPondering, setIsPondering] = useState(false);
	const [premoves, setPremovesState] = useState([]);

	const engineServiceRef = useRef(null);
	const premovesRef = useRef([]);

	useEffect(() => {
		if (!engineServiceRef.current) {
			engineServiceRef.current = new EngineService();
			engineServiceRef.current.initializeEngines();
		}

		return () => {
			if (engineServiceRef.current) {
				engineServiceRef.current.cleanupEngines();
			}
		};
	}, []);

	const isPlayerTurn = useCallback(
		() => base.currentPlayer === playerColor,
		[base.currentPlayer, playerColor]
	);

	const isBotTurn = useCallback(
		() => base.currentPlayer !== playerColor,
		[base.currentPlayer, playerColor]
	);

	const stopAllOperations = useCallback(() => {
		if (engineServiceRef.current) {
			engineServiceRef.current.stopAllOperations();
		}
		setIsThinking(false);
		setIsPondering(false);
	}, []);

	const executeBotMove = useCallback(
		(gameCopy, move, from, to) => {
			base.setGame(gameCopy);
			base.setLastMove(move);
			base.setHistory((prev) => [
				...prev,
				{ fen: gameCopy.fen(), lastMove: move },
			]);
			base.highlightMove(from, to);
			base.setCurrentIndex(base.history.length);
			base.setCurrentPlayer(playerColor);
			base.clearUIState();

			moveSound.play();
			if (move.captured) captureSound.play();
		},
		[base, playerColor]
	);

	const makeBotMove = useCallback(() => {
		if (!engineServiceRef.current) return;

		const callbacks = {
			setIsThinking,
			executeBotMove,
			isBotTurn,
		};

		engineServiceRef.current.makeBotMove(base, difficulty, callbacks);
	}, [base, difficulty, executeBotMove, isBotTurn]);

	const startPondering = useCallback(async () => {
		if (!engineServiceRef.current) return;

		const callbacks = {
			setIsPondering,
			isPlayerTurn,
		};

		await engineServiceRef.current.startPondering(
			base,
			difficulty,
			callbacks
		);
	}, [base, difficulty, isPlayerTurn]);

	useEffect(() => {
		if (
			isBotTurn() &&
			!base.isGameOver &&
			base.currentIndex === base.history.length - 1 &&
			!isThinking
		) {
			makeBotMove();
		}
	}, [
		isBotTurn,
		base.isGameOver,
		base.currentIndex,
		base.history.length,
		isThinking,
		makeBotMove,
	]);

	useEffect(() => {
		if (
			isPlayerTurn() &&
			!base.isGameOver &&
			base.currentIndex === base.history.length - 1 &&
			!isThinking
		) {
			startPondering();
		}
	}, [
		isPlayerTurn,
		base.isGameOver,
		base.currentIndex,
		base.history.length,
		isThinking,
		startPondering,
	]);

	const checkBotGameOver = useCallback(() => {
		let reason = null;

		if (base.game.isCheckmate()) {
			const winner = base.game.turn() === "w" ? "Black" : "White";
			const isPlayerWin = winner.toLowerCase() === playerColor;
			const moves = base.history.length - 1;
			reason = isPlayerWin
				? `You won by checkmate in ${moves} moves!`
				: `Bot won by checkmate in ${moves} moves`;
		} else if (base.game.isStalemate()) {
			reason = "Game ended in stalemate";
		} else if (base.game.isDraw() || base.game.isThreefoldRepetition()) {
			reason = "Game ended in a draw";
		}

		if (reason) {
			base.setGameEndReason(reason);
			base.setIsGameOver(true);
			base.toastId.current = toast.info(reason, {
				position: toast.POSITION.TOP_CENTER,
				autoClose: 3000,
			});
		}
	}, [playerColor, base]);

	useEffect(() => {
		checkBotGameOver();
	}, [base.game, checkBotGameOver]);

	useEffect(() => {
		if (base.isGameOver) {
			stopAllOperations();
		}
	}, [base.isGameOver, stopAllOperations]);

	const makeMove = useCallback(
		(sourceSquare, targetSquare, promotion = "q") => {
			if (
				base.currentIndex !== base.history.length - 1 ||
				base.isGameOver ||
				!isPlayerTurn() ||
				isThinking
			) {
				return false;
			}

			if (engineServiceRef.current?.ponderEngineRef) {
				engineServiceRef.current.ponderEngineRef.stop();
			}
			setIsPondering(false);

			const gameCopy = new Chess(base.game.fen());
			const move = gameCopy.move({
				from: sourceSquare,
				to: targetSquare,
				promotion: promotion.toLowerCase(),
			});

			if (move) {
				base.setGame(gameCopy);
				base.setLastMove(move);
				base.setHistory((prev) => [
					...prev,
					{ fen: gameCopy.fen(), lastMove: move },
				]);
				base.highlightMove(sourceSquare, targetSquare);
				base.setCurrentIndex(base.history.length);
				base.setCurrentPlayer(
					playerColor === "white" ? "black" : "white"
				);
				base.clearUIState();

				moveSound.play();
				if (move.captured) captureSound.play();

				return move;
			}

			return false;
		},
		[base, playerColor, isPlayerTurn, isThinking]
	);

	// Premove management
	const setPremoves = useCallback((newPremoves) => {
		premovesRef.current = newPremoves;
		setPremovesState(newPremoves);
	}, []);

	const clearPremoves = useCallback(() => {
		premovesRef.current = [];
		setPremovesState([]);
	}, []);

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
				clearPremoves();
			} else {
				setPremovesState([...premovesRef.current]);
			}
		}
	}, [makeMove, isPlayerTurn, clearPremoves]);

	useEffect(() => {
		if (isPlayerTurn() && base.currentIndex === base.history.length - 1) {
			executePremove();
		}
	}, [isPlayerTurn, executePremove, base.currentIndex, base.history.length]);

	// Game controls
	const resetGame = useCallback(() => {
		stopAllOperations();

		const newGame = new Chess();
		base.setGame(newGame);
		base.setLastMove(null);
		base.setHistory([{ fen: newGame.fen(), lastMove: null }]);
		base.setCurrentIndex(0);
		base.setKingInCheck(null);
		base.setIsGameOver(false);
		base.setGameEndReason(null);
		base.setPgn("");
		base.setCurrentPlayer("white");
		base.setBoardOrientation("white");
		base.setHighlightedSquares({});
		base.clearUIState();

		if (engineServiceRef.current) {
			engineServiceRef.current.ponderState.reset();
		}
		clearPremoves();

		base.toastId.current = toast.info("New game started against bot", {
			position: toast.POSITION.TOP_CENTER,
			autoClose: 2000,
		});
	}, [stopAllOperations, base, clearPremoves]);

	const undoMove = useCallback(() => {
		if (base.currentIndex > 1 && !isThinking) {
			stopAllOperations();

			const newHistory = base.history.slice(0, -2);
			const newIndex = base.currentIndex - 2;

			const newGame = new Chess();
			for (let i = 1; i <= newIndex; i++) {
				newGame.move(base.history[i].lastMove);
			}

			base.setGame(newGame);
			base.setHistory(newHistory);
			base.setCurrentIndex(newIndex);
			base.setCurrentPlayer(playerColor);
			base.setHighlightedSquares({});
			base.clearUIState();
			base.setKingInCheck(checkKingInCheck(newGame));
		}
	}, [base, isThinking, playerColor, stopAllOperations]);

	const navigateMove = useCallback(
		(moveIndex) => {
			if (isThinking) return;
			stopAllOperations();
			base.navigateMove(moveIndex);
		},
		[base, isThinking, stopAllOperations]
	);

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

		isThinking,
		isPondering,
		playerColor,
		premoves,
		premovesRef,

		makeMove,
		resetGame,
		undoMove,
		navigateMove,
		toggleBoardOrientation: base.toggleBoardOrientation,
		setPremoves,
		clearPremoves,

		setHighlightedSquares: base.setHighlightedSquares,
		setOptionSquares: base.setOptionSquares,
		setMoveFrom: base.setMoveFrom,
		setRightClickedSquares: base.setRightClickedSquares,
		setIsGameOver: base.setIsGameOver,

		isKingInCheck: base.isKingInCheck,
		isPlayerTurn: isPlayerTurn(),
	};
};
