import { useState, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import { toast } from "react-toastify";
import {
	isKingInCheck as checkKingInCheck,
	generatePGN,
	moveSound,
	captureSound,
	notifySound,
} from "../../../data/utils.js";
import Engine from "../../game/utils/engine.js";

export const useVersusBot = (playerColor = "white", difficulty = 18) => {
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
	const [isThinking, setIsThinking] = useState(false);

	// Board interaction states
	const [highlightedSquares, setHighlightedSquares] = useState({});
	const [optionSquares, setOptionSquares] = useState({});
	const [moveFrom, setMoveFrom] = useState("");
	const [rightClickedSquares, setRightClickedSquares] = useState({});
	const [boardOrientation, setBoardOrientation] = useState(playerColor);

	const botEngineRef = useRef(null);
	const botMoveTimeoutRef = useRef(null);
	const toastId = useRef(null);

	const isKingInCheck = useCallback(() => checkKingInCheck(game), [game]);

	const cleanupBotEngine = useCallback(() => {
		if (botEngineRef.current) {
			botEngineRef.current.terminate();
			botEngineRef.current = null;
		}
		if (botMoveTimeoutRef.current) {
			clearTimeout(botMoveTimeoutRef.current);
			botMoveTimeoutRef.current = null;
		}
	}, []);

	const isPlayerTurn = useCallback(
		() => currentPlayer === playerColor,
		[currentPlayer, playerColor]
	);
	const isBotTurn = useCallback(
		() => currentPlayer !== playerColor,
		[currentPlayer, playerColor]
	);

	const makeBotMove = useCallback(() => {
		if (isThinking || isGameOver || !isBotTurn()) return;

		setIsThinking(true);
		cleanupBotEngine();

		botEngineRef.current = new Engine();

		// Timeout fallback
		botMoveTimeoutRef.current = setTimeout(() => {
			if (botEngineRef.current) {
				botEngineRef.current.stop();
			}
		}, 3000);

		botEngineRef.current.onReady(() => {
			if (isGameOver || !isBotTurn()) {
				setIsThinking(false);
				cleanupBotEngine();
				return;
			}

			const currentFen = game.fen();
			botEngineRef.current.evaluatePosition(currentFen, difficulty);

			const handleBotMove = ({ bestMove: botBestMove, uciMessage }) => {
				if (!uciMessage.startsWith("bestmove")) return;

				if (botMoveTimeoutRef.current) {
					clearTimeout(botMoveTimeoutRef.current);
					botMoveTimeoutRef.current = null;
				}

				// Fallback to random move if no best move
				if (!botBestMove || botBestMove === "(none)") {
					const moves = game.moves({ verbose: true });
					if (moves.length > 0) {
						const randomMove =
							moves[Math.floor(Math.random() * moves.length)];
						botBestMove =
							randomMove.from +
							randomMove.to +
							(randomMove.promotion || "");
					}
				}

				if (botBestMove && botBestMove !== "(none)") {
					const from = botBestMove.substring(0, 2);
					const to = botBestMove.substring(2, 4);
					const promotion =
						botBestMove.length > 4 ? botBestMove.substring(4) : "q";

					setTimeout(() => {
						if (isGameOver || !isBotTurn()) {
							setIsThinking(false);
							cleanupBotEngine();
							return;
						}

						const gameCopy = new Chess(currentFen);
						const move = gameCopy.move({
							from,
							to,
							promotion: promotion.toLowerCase(),
						});

						if (move) {
							setGame(gameCopy);
							setCurrentPlayer(playerColor);
							setLastMove(move);
							setHistory((prev) => [
								...prev,
								{ fen: gameCopy.fen(), lastMove: move },
							]);
							setHighlightedSquares({
								[from]: {
									backgroundColor: "rgba(255, 0, 0, 0.4)",
								},
								[to]: {
									backgroundColor: "rgba(255, 0, 0, 0.4)",
								},
							});
							setKingInCheck(checkKingInCheck(gameCopy));
							setCurrentIndex((prev) => prev + 1);

							moveSound.play();
							if (move.captured) captureSound.play();
						}

						setIsThinking(false);
						cleanupBotEngine();
					}, Math.random() * 100 + 300);
				} else {
					setIsThinking(false);
					cleanupBotEngine();
				}
			};

			botEngineRef.current.onMessage(handleBotMove);
		});
	}, [
		game,
		playerColor,
		difficulty,
		isThinking,
		isGameOver,
		isBotTurn,
		cleanupBotEngine,
	]);

	// Trigger bot move when it's bot's turn
	useEffect(() => {
		if (
			isBotTurn() &&
			!isGameOver &&
			currentIndex === history.length - 1 &&
			!isThinking
		) {
			const timer = setTimeout(makeBotMove, 200);
			return () => clearTimeout(timer);
		}
	}, [
		currentPlayer,
		isGameOver,
		currentIndex,
		history.length,
		isThinking,
		isBotTurn,
		makeBotMove,
	]);

	const checkGameOver = useCallback(() => {
		let reason = null;

		if (game.isCheckmate()) {
			const winner = game.turn() === "w" ? "Black" : "White";
			const isPlayerWin = winner.toLowerCase() === playerColor;
			const moves = history.length - 1;
			reason = isPlayerWin
				? `You won by checkmate in ${moves} moves!`
				: `Bot won by checkmate in ${moves} moves`;
		} else if (game.isStalemate()) {
			reason = "Game ended in stalemate";
		} else if (game.isDraw() || game.isThreefoldRepetition()) {
			reason = "Game ended in a draw";
		}

		if (reason) {
			setGameEndReason(reason);
			toastId.current = toast.info(reason, {
				position: toast.POSITION.TOP_CENTER,
				autoClose: 3000,
			});
			setTimeout(() => setIsGameOver(true), 1000);
		}
	}, [game, history, playerColor]);

	// Update game state effects
	useEffect(() => {
		if (lastMove && currentIndex > 0 && isPlayerTurn()) {
			setKingInCheck(isKingInCheck());
		}
	}, [lastMove, currentIndex, isPlayerTurn, isKingInCheck]);

	useEffect(() => {
		if (isGameOver) notifySound.play();
	}, [isGameOver]);

	useEffect(() => {
		checkGameOver();
		setPgn(generatePGN(history, "versus-bot"));
	}, [game, checkGameOver, history]);

	const makeMove = useCallback(
		(sourceSquare, targetSquare, promotion = "q") => {
			if (
				currentIndex !== history.length - 1 ||
				isGameOver ||
				!isPlayerTurn() ||
				isThinking
			) {
				return false;
			}

			const gameCopy = new Chess(game.fen());
			const move = gameCopy.move({
				from: sourceSquare,
				to: targetSquare,
				promotion: promotion.toLowerCase(),
			});

			if (move) {
				setGame(gameCopy);
				setCurrentPlayer(playerColor === "white" ? "black" : "white");
				setLastMove(move);
				setHistory((prev) => [
					...prev,
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
				setCurrentIndex((prev) => prev + 1);
				setOptionSquares({});
				setMoveFrom("");

				moveSound.play();
				if (move.captured) captureSound.play();

				return move;
			}

			return false;
		},
		[
			currentIndex,
			history,
			isGameOver,
			game,
			isPlayerTurn,
			playerColor,
			isThinking,
		]
	);

	const resetGame = useCallback(() => {
		cleanupBotEngine();
		setIsThinking(false);

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
		setIsGameOver(false);
		setGameEndReason(null);
		setPgn("");
		setCurrentPlayer("white");

		toastId.current = toast.info("New game started against bot", {
			position: toast.POSITION.TOP_CENTER,
			autoClose: 2000,
		});
	}, [cleanupBotEngine]);

	const executePremove = useCallback(() => {
		if (premovesRef.current.length > 0 && isPlayerTurn()) {
			const nextPremove = premovesRef.current[0];
			premovesRef.current.splice(0, 1);

			setTimeout(() => {
				const move = makeMove(
					nextPremove.sourceSquare,
					nextPremove.targetSquare,
					nextPremove.moveData.promotion
				);

				if (!move) {
					premovesRef.current = [];
				}

				setPremoves([...premovesRef.current]);
			}, 100);
		}
	}, [makeMove, isPlayerTurn]);

	useEffect(() => {
		if (isPlayerTurn() && currentIndex === history.length - 1) {
			executePremove();
		}
	}, [isPlayerTurn, executePremove, currentIndex, history.length]);

	const undoMove = useCallback(() => {
		if (currentIndex > 1 && !isThinking) {
			cleanupBotEngine();
			setIsThinking(false);

			const newHistory = history.slice(0, -2); // Remove both player and bot moves
			const newIndex = currentIndex - 2;

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
			setPgn(generatePGN(newHistory, "versus-bot"));
			setCurrentPlayer(playerColor);
		}
	}, [currentIndex, history, playerColor, isThinking, cleanupBotEngine]);

	const navigateMove = useCallback(
		(moveIndex) => {
			if (isThinking) return;

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
		[history, lastMove, isThinking]
	);

	const toggleBoardOrientation = useCallback(() => {
		setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => cleanupBotEngine();
	}, [cleanupBotEngine]);

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
		isThinking,
		playerColor,
		highlightedSquares,
		optionSquares,
		moveFrom,
		rightClickedSquares,
		boardOrientation,
		makeMove,
		resetGame,
		undoMove,
		navigateMove,
		toggleBoardOrientation,
		setHighlightedSquares,
		setOptionSquares,
		setMoveFrom,
		setRightClickedSquares,
		setIsGameOver,
		isKingInCheck: isKingInCheck(),
		isPlayerTurn: isPlayerTurn(),
	};
};
