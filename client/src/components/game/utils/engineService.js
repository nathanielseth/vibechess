import { Chess } from "chess.js";
import Engine from "./engine.js";

const PONDER_DELAY = 500;
const MOVE_TIMEOUT = 5000;
const PONDER_TIMEOUT = 30000;

export class EngineService {
	constructor() {
		this.mainEngineRef = null;
		this.ponderEngineRef = null;
		this.timeoutManager = {
			moveTimeout: null,
			ponderTimeout: null,
			ponderDelayTimeout: null,
			clearAll: function () {
				if (this.moveTimeout) {
					clearTimeout(this.moveTimeout);
					this.moveTimeout = null;
				}
				if (this.ponderTimeout) {
					clearTimeout(this.ponderTimeout);
					this.ponderTimeout = null;
				}
				if (this.ponderDelayTimeout) {
					clearTimeout(this.ponderDelayTimeout);
					this.ponderDelayTimeout = null;
				}
			},
		};
		this.ponderState = {
			predictedMove: null,
			resultingPosition: null,
			cachedResult: null,
			isActive: false,
			reset: function () {
				this.predictedMove = null;
				this.resultingPosition = null;
				this.cachedResult = null;
				this.isActive = false;
			},
		};
		this.operationState = {
			currentMoveOperation: null,
			currentPonderOperation: null,
			operationId: 0,
			getNextId: function () {
				return ++this.operationId;
			},
		};
	}

	initializeEngines() {
		if (!this.mainEngineRef) {
			this.mainEngineRef = new Engine();
		}
		if (!this.ponderEngineRef) {
			this.ponderEngineRef = new Engine();
		}
	}

	stopAllOperations() {
		if (this.mainEngineRef) {
			this.mainEngineRef.stop();
		}
		if (this.ponderEngineRef) {
			this.ponderEngineRef.stop();
		}

		this.timeoutManager.clearAll();
		this.ponderState.reset();
		this.operationState.currentMoveOperation = null;
		this.operationState.currentPonderOperation = null;
	}

	cleanupEngines() {
		this.stopAllOperations();

		if (this.mainEngineRef) {
			this.mainEngineRef.terminate();
			this.mainEngineRef = null;
		}
		if (this.ponderEngineRef) {
			this.ponderEngineRef.terminate();
			this.ponderEngineRef = null;
		}
	}

	async predictPlayerMove(gameCopy) {
		const moves = gameCopy.moves({ verbose: true });
		if (moves.length === 0) return null;

		const scoredMoves = moves.map((move) => {
			let score = 0;

			if (move.captured) {
				const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
				score += (pieceValues[move.captured.toLowerCase()] || 0) * 10;
			}

			if (move.san.includes("+")) score += 8;

			if (["e4", "e5", "d4", "d5"].includes(move.san)) score += 5;

			if (
				move.piece === "p" &&
				(move.to[1] === "4" || move.to[1] === "5")
			) {
				score += 3;
			}

			if (
				["n", "b"].includes(move.piece.toLowerCase()) &&
				["1", "8"].includes(move.from[1])
			) {
				score += 4;
			}

			if (move.san === "O-O" || move.san === "O-O-O") score += 6;

			return { move, score };
		});

		scoredMoves.sort((a, b) => b.score - a.score);

		return scoredMoves
			.slice(0, Math.min(3, scoredMoves.length))
			.map((sm) => sm.move);
	}

	makeBotMove(gameState, difficulty, callbacks) {
		const { dispatch, executeBotMove, isBotTurn } = callbacks;

		if (gameState.isThinking || gameState.isGameOver || !isBotTurn())
			return;

		dispatch({ type: "SET_THINKING", payload: true });

		if (this.ponderEngineRef) {
			this.ponderEngineRef.stop();
		}
		dispatch({ type: "SET_PONDERING", payload: false });

		const currentFen = gameState.game.fen();
		const operationId = this.operationState.getNextId();
		this.operationState.currentMoveOperation = operationId;

		const ponderState = this.ponderState;
		if (
			ponderState.cachedResult &&
			ponderState.resultingPosition === currentFen &&
			gameState.lastMove &&
			ponderState.predictedMove &&
			ponderState.predictedMove.from === gameState.lastMove.from &&
			ponderState.predictedMove.to === gameState.lastMove.to
		) {
			const cachedMove = ponderState.cachedResult;
			const from = cachedMove.substring(0, 2);
			const to = cachedMove.substring(2, 4);
			const promotion =
				cachedMove.length > 4 ? cachedMove.substring(4) : "q";

			if (!gameState.isGameOver && isBotTurn()) {
				const gameCopy = new Chess(currentFen);
				const move = gameCopy.move({
					from,
					to,
					promotion: promotion.toLowerCase(),
				});

				if (move) {
					executeBotMove(gameCopy, move, from, to);
					dispatch({ type: "SET_THINKING", payload: false });
					this.ponderState.reset();
					return;
				}
			}
		}

		this.ponderState.reset();

		this.initializeEngines();

		this.timeoutManager.moveTimeout = setTimeout(() => {
			if (this.operationState.currentMoveOperation === operationId) {
				if (this.mainEngineRef) {
					this.mainEngineRef.stop();
				}
			}
		}, MOVE_TIMEOUT);

		this.mainEngineRef.onReady(() => {
			if (
				this.operationState.currentMoveOperation !== operationId ||
				gameState.isGameOver ||
				!isBotTurn()
			) {
				dispatch({ type: "SET_THINKING", payload: false });
				return;
			}

			this.mainEngineRef.evaluatePosition(currentFen, difficulty);

			const handleBotMove = ({ bestMove: botBestMove, uciMessage }) => {
				if (this.operationState.currentMoveOperation !== operationId) {
					return;
				}

				if (!uciMessage.startsWith("bestmove")) return;

				if (this.timeoutManager.moveTimeout) {
					clearTimeout(this.timeoutManager.moveTimeout);
					this.timeoutManager.moveTimeout = null;
				}

				if (!botBestMove || botBestMove === "(none)") {
					const moves = gameState.game.moves({ verbose: true });
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

					if (!gameState.isGameOver && isBotTurn()) {
						const gameCopy = new Chess(currentFen);
						const move = gameCopy.move({
							from,
							to,
							promotion: promotion.toLowerCase(),
						});

						if (move) {
							executeBotMove(gameCopy, move, from, to);
						}
					}
				}

				dispatch({ type: "SET_THINKING", payload: false });
				this.operationState.currentMoveOperation = null;
			};

			const removeListener = this.mainEngineRef.onMessage(handleBotMove);
			return () => {
				if (removeListener) removeListener();
			};
		});
	}

	async startPondering(gameState, difficulty, callbacks) {
		const { dispatch, isPlayerTurn } = callbacks;

		if (gameState.isGameOver || !isPlayerTurn() || gameState.isPondering)
			return;

		const currentFen = gameState.game.fen();
		const operationId = this.operationState.getNextId();
		this.operationState.currentPonderOperation = operationId;

		this.timeoutManager.ponderDelayTimeout = setTimeout(async () => {
			if (
				this.operationState.currentPonderOperation !== operationId ||
				gameState.isGameOver ||
				!isPlayerTurn()
			) {
				return;
			}

			const gameCopy = new Chess(currentFen);
			const predictedMoves = await this.predictPlayerMove(gameCopy);

			if (!predictedMoves || predictedMoves.length === 0) return;

			const mostLikelyMove = predictedMoves[0];
			const hypotheticalGame = new Chess(currentFen);
			const hypotheticalMove = hypotheticalGame.move(mostLikelyMove);

			if (!hypotheticalMove) return;

			this.ponderState.predictedMove = mostLikelyMove;
			this.ponderState.resultingPosition = hypotheticalGame.fen();
			this.ponderState.isActive = true;

			dispatch({ type: "SET_PONDERING", payload: true });

			this.initializeEngines();

			this.timeoutManager.ponderTimeout = setTimeout(() => {
				if (
					this.operationState.currentPonderOperation === operationId
				) {
					if (this.ponderEngineRef) {
						this.ponderEngineRef.stop();
					}
				}
			}, PONDER_TIMEOUT);

			this.ponderEngineRef.onReady(() => {
				if (
					this.operationState.currentPonderOperation !==
						operationId ||
					!this.ponderState.isActive ||
					!isPlayerTurn()
				) {
					dispatch({ type: "SET_PONDERING", payload: false });
					return;
				}

				this.ponderEngineRef.evaluatePosition(
					this.ponderState.resultingPosition,
					difficulty
				);

				const handlePonderResult = ({ bestMove, uciMessage }) => {
					if (
						this.operationState.currentPonderOperation !==
						operationId
					) {
						return;
					}

					if (
						uciMessage.startsWith("bestmove") &&
						bestMove &&
						bestMove !== "(none)"
					) {
						this.ponderState.cachedResult = bestMove;

						if (this.timeoutManager.ponderTimeout) {
							clearTimeout(this.timeoutManager.ponderTimeout);
							this.timeoutManager.ponderTimeout = null;
						}
					}
				};

				const removeListener =
					this.ponderEngineRef.onMessage(handlePonderResult);
				return () => {
					if (removeListener) removeListener();
				};
			});
		}, PONDER_DELAY);
	}
}
