import { useState, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import {
	isKingInCheck as checkKingInCheck,
	moveSound,
	captureSound,
} from "../../../data/utils.js";
import { EngineService } from "../../game/utils/engineService.js";
import { useChessGameBase } from "./useChessGameBase.js";

export const useVersusBot = (playerColor = "white", difficulty = 10) => {
	const base = useChessGameBase("versus-bot");
	const baseRef = useRef(base);
	baseRef.current = base;

	const [isThinking, setIsThinking] = useState(false);
	const [isPondering, setIsPondering] = useState(false);

	const engineServiceRef = useRef(null);
	const moveInProgressRef = useRef(false);

	useEffect(() => {
		if (!engineServiceRef.current) {
			engineServiceRef.current = new EngineService();
			engineServiceRef.current.initializeEngines();
		}
		return () => {
			engineServiceRef.current?.cleanupEngines();
		};
	}, []);

	const isPlayerTurn = useCallback(
		() => baseRef.current.currentPlayer === playerColor,
		[playerColor],
	);

	const isBotTurn = useCallback(
		() => baseRef.current.currentPlayer !== playerColor,
		[playerColor],
	);

	const isPlayerTurnNow = base.currentPlayer === playerColor;
	const isBotTurnNow = base.currentPlayer !== playerColor;

	const stopAllOperations = useCallback(() => {
		engineServiceRef.current?.stopAllOperations();
		setIsThinking(false);
		setIsPondering(false);
		moveInProgressRef.current = false;
	}, []);

	const applyMove = useCallback((gameCopy, move, from, to, nextPlayer) => {
		const b = baseRef.current;
		b.setGame(gameCopy);
		b.setLastMove(move);
		b.setHistory((prev) => {
			const next = [...prev, { fen: gameCopy.fen(), lastMove: move }];
			b.setCurrentIndex(next.length - 1);
			return next;
		});
		b.highlightMove(from, to);
		b.setCurrentPlayer(nextPlayer);
		b.clearUIState();

		moveSound.play();
		if (move.captured) captureSound.play();
	}, []);

	useEffect(() => {
		if (
			!isBotTurnNow ||
			base.isGameOver ||
			base.currentIndex !== base.history.length - 1
		) {
			return;
		}

		let cancelled = false;
		const fen = base.game.fen();

		setIsThinking(true);
		setIsPondering(false);

		engineServiceRef.current
			?.requestBotMove(fen, difficulty, { isBotTurn })
			.then((result) => {
				if (cancelled || !result) {
					setIsThinking(false);
					return;
				}
				if (baseRef.current.isGameOver || !isBotTurn()) {
					setIsThinking(false);
					return;
				}

				const { gameCopy, move, from, to } = result;
				applyMove(gameCopy, move, from, to, playerColor);
				setIsThinking(false);
			});

		return () => {
			cancelled = true;
		};
	}, [
		isBotTurnNow,
		base.isGameOver,
		base.currentIndex,
		base.history.length,
		base.game,
		difficulty,
		playerColor,
		isBotTurn,
		applyMove,
	]);

	const startPondering = useCallback(() => {
		if (!engineServiceRef.current) return;
		engineServiceRef.current.startPondering(base.game.fen(), difficulty, {
			isPlayerTurn,
			onPonderStart: () => setIsPondering(true),
			onPonderEnd: () => setIsPondering(false),
		});
	}, [base.game, difficulty, isPlayerTurn]);

	useEffect(() => {
		if (
			isPlayerTurnNow &&
			!base.isGameOver &&
			base.currentIndex === base.history.length - 1 &&
			!isThinking
		) {
			startPondering();
		}
	}, [
		isPlayerTurnNow,
		base.isGameOver,
		base.currentIndex,
		base.history.length,
		isThinking,
		startPondering,
	]);

	const checkBotGameOver = useCallback(() => {
		let reason = null;
		let gameWinner = null;
		if (base.game.isCheckmate()) {
			const loserColor = base.game.turn();
			gameWinner = loserColor === "w" ? "black" : "white";
			reason = `Checkmate in ${base.history.length - 1} moves`;
		} else if (base.game.isStalemate()) {
			reason = "Stalemate";
		} else if (base.game.isDraw() || base.game.isThreefoldRepetition()) {
			reason = "Draw";
		}
		if (reason) {
			base.setGameEndReason(reason);
			base.setWinner(gameWinner);
			base.setIsGameOver(true);
		}
	}, [base]);

	useEffect(() => {
		checkBotGameOver();
	}, [base.game, checkBotGameOver]);

	useEffect(() => {
		if (base.isGameOver) stopAllOperations();
	}, [base.isGameOver, stopAllOperations]);

	const needsPromotion = useCallback((sourceSquare, targetSquare, game) => {
		const piece = game.get(sourceSquare);
		if (!piece || piece.type !== "p") return false;
		const targetRank = targetSquare[1];
		return (
			(piece.color === "w" && targetRank === "8") ||
			(piece.color === "b" && targetRank === "1")
		);
	}, []);

	const makeMove = useCallback(
		(sourceSquare, targetSquare, promotion = "q") => {
			if (
				base.currentIndex !== base.history.length - 1 ||
				base.isGameOver ||
				!isPlayerTurn() ||
				isThinking ||
				moveInProgressRef.current
			) {
				return false;
			}

			moveInProgressRef.current = true;
			engineServiceRef.current?.ponderEngine?.stop();
			setIsPondering(false);

			const gameCopy = new Chess(base.game.fen());
			const moveOptions = { from: sourceSquare, to: targetSquare };
			if (needsPromotion(sourceSquare, targetSquare, gameCopy)) {
				moveOptions.promotion = promotion.toLowerCase();
			}

			let move = null;
			try {
				move = gameCopy.move(moveOptions);
			} catch {
				// illegal move, `move` stays null
			}

			moveInProgressRef.current = false;

			if (!move) return false;

			applyMove(
				gameCopy,
				move,
				sourceSquare,
				targetSquare,
				playerColor === "white" ? "black" : "white",
			);
			return move;
		},
		[
			base,
			playerColor,
			isPlayerTurn,
			isThinking,
			needsPromotion,
			applyMove,
		],
	);

	const executePremove = useCallback(() => {
		if (!base.premove || !isPlayerTurn() || moveInProgressRef.current)
			return;
		if (base.currentIndex !== base.history.length - 1) return;
		if (base.isGameOver || isThinking) return;

		moveInProgressRef.current = true;
		engineServiceRef.current?.ponderEngine?.stop();
		setIsPondering(false);

		const gameCopy = new Chess(base.game.fen());
		const availableMoves = gameCopy.moves({ verbose: true });
		const isLegal = availableMoves.some(
			(m) =>
				m.from === base.premove.sourceSquare &&
				m.to === base.premove.targetSquare,
		);

		if (!isLegal) {
			moveInProgressRef.current = false;
			base.clearPremove();
			return;
		}

		const moveOptions = {
			from: base.premove.sourceSquare,
			to: base.premove.targetSquare,
		};
		if (
			needsPromotion(
				base.premove.sourceSquare,
				base.premove.targetSquare,
				gameCopy,
			)
		) {
			moveOptions.promotion = (
				base.premove.moveData?.promotion || "q"
			).toLowerCase();
		}

		try {
			const move = gameCopy.move(moveOptions);
			if (move) {
				applyMove(
					gameCopy,
					move,
					base.premove.sourceSquare,
					base.premove.targetSquare,
					playerColor === "white" ? "black" : "white",
				);
			}
		} catch {
			// illegal premove, drop it silently
		}

		moveInProgressRef.current = false;
		base.clearPremove();
	}, [
		base,
		isPlayerTurn,
		isThinking,
		needsPromotion,
		playerColor,
		applyMove,
	]);

	useEffect(() => {
		if (
			isPlayerTurnNow &&
			base.currentIndex === base.history.length - 1 &&
			!isThinking &&
			!base.isGameOver
		) {
			executePremove();
		}
	}, [
		isPlayerTurnNow,
		executePremove,
		base.currentIndex,
		base.history.length,
		isThinking,
		base.isGameOver,
	]);

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
		base.setWinner(null);
		base.setPgn("");
		base.setCurrentPlayer("white");
		base.setBoardOrientation("white");
		base.setHighlightedSquares({});
		base.clearUIState();
		base.clearPremove();
	}, [stopAllOperations, base]);

	const undoMove = useCallback(() => {
		if (base.currentIndex <= 1 || isThinking) return;

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
		base.clearPremove();
		base.setKingInCheck(checkKingInCheck(newGame));
	}, [base, isThinking, playerColor, stopAllOperations]);

	const navigateMove = useCallback(
		(moveIndex) => {
			if (isThinking) return;
			stopAllOperations();
			base.navigateMove(moveIndex);
		},
		[base, isThinking, stopAllOperations],
	);

	const setPremovePosition = useCallback(
		(position) => base.setPremovePosition?.(position),
		[base],
	);

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
		isThinking,
		isPondering,
		playerColor,
		premove: base.premove,
		premovePosition: base.premovePosition,
		makeMove,
		resetGame,
		undoMove,
		navigateMove,
		toggleBoardOrientation: base.toggleBoardOrientation,
		setPremove: base.setPremove,
		clearPremove: base.clearPremove,
		setPremovePosition,
		setHighlightedSquares: base.setHighlightedSquares,
		setOptionSquares: base.setOptionSquares,
		setMoveFrom: base.setMoveFrom,
		setRightClickedSquares: base.setRightClickedSquares,
		setIsGameOver: base.setIsGameOver,
		isKingInCheck: base.isKingInCheck,
		isPlayerTurn: isPlayerTurnNow,
	};
};