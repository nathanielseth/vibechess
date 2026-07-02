import { Chess } from "chess.js";
import Engine from "./engine.js";

const PONDER_DELAY = 500;
const MOVE_TIMEOUT = 5000;
const PONDER_TIMEOUT = 30000;

const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export class EngineService {
	constructor() {
		this.mainEngine = null;
		this.ponderEngine = null;

		this.unsubscribers = [];

		this.timeouts = {
			move: null,
			ponder: null,
			ponderDelay: null,
		};

		this.ponderState = {
			predictedMove: null,
			resultingFen: null,
			cachedBestMove: null,
		};

		this.currentOperationId = 0;
	}

	initializeEngines() {
		if (!this.mainEngine) this.mainEngine = new Engine();
		if (!this.ponderEngine) this.ponderEngine = new Engine();
	}

	_clearTimeouts() {
		Object.keys(this.timeouts).forEach((key) => {
			if (this.timeouts[key]) {
				clearTimeout(this.timeouts[key]);
				this.timeouts[key] = null;
			}
		});
	}

	_clearListeners() {
		this.unsubscribers.forEach((unsub) => unsub && unsub());
		this.unsubscribers = [];
	}

	_resetPonderState() {
		this.ponderState.predictedMove = null;
		this.ponderState.resultingFen = null;
		this.ponderState.cachedBestMove = null;
	}

	stopAllOperations() {
		this.currentOperationId += 1;

		if (this.mainEngine) this.mainEngine.stop();
		if (this.ponderEngine) this.ponderEngine.stop();

		this._clearTimeouts();
		this._clearListeners();
		this._resetPonderState();
	}

	cleanupEngines() {
		this.stopAllOperations();
		if (this.mainEngine) {
			this.mainEngine.terminate();
			this.mainEngine = null;
		}
		if (this.ponderEngine) {
			this.ponderEngine.terminate();
			this.ponderEngine = null;
		}
	}

	predictPlayerMove(gameCopy) {
		const moves = gameCopy.moves({ verbose: true });
		if (moves.length === 0) return null;

		const scored = moves.map((move) => {
			let score = 0;
			if (move.captured) {
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

		scored.sort((a, b) => b.score - a.score);
		return scored[0].move;
	}

	requestBotMove(fen, difficulty, { isBotTurn }) {
		this.initializeEngines();

		this.currentOperationId += 1;
		const operationId = this.currentOperationId;

		this._clearTimeouts();
		this._clearListeners();

		if (this.ponderEngine) this.ponderEngine.stop();

		const usableCache =
			this.ponderState.cachedBestMove &&
			this.ponderState.resultingFen === fen;

		this._resetPonderState();

		return new Promise((resolve) => {
			const isStale = () =>
				this.currentOperationId !== operationId || !isBotTurn();

			const resolveWithMove = (bestMoveUci) => {
				if (isStale()) {
					resolve(null);
					return;
				}
				const applied = this._applyUciMove(fen, bestMoveUci);
				resolve(applied);
			};

			if (usableCache) {
				resolveWithMove(this.ponderState.cachedBestMove);
				return;
			}

			this.timeouts.move = setTimeout(() => {
				if (!isStale() && this.mainEngine) this.mainEngine.stop();
			}, MOVE_TIMEOUT);

			const readyUnsub = this.mainEngine.onReady(() => {
				if (isStale()) {
					resolve(null);
					return;
				}

				this.mainEngine.evaluatePosition(fen, difficulty);

				const messageUnsub = this.mainEngine.onMessage(
					({ bestMove, uciMessage }) => {
						if (this.currentOperationId !== operationId) return;
						if (!uciMessage.startsWith("bestmove")) return;

						if (this.timeouts.move) {
							clearTimeout(this.timeouts.move);
							this.timeouts.move = null;
						}

						resolveWithMove(bestMove);
					},
				);
				this.unsubscribers.push(messageUnsub);
			});
			this.unsubscribers.push(readyUnsub);
		});
	}

	_applyUciMove(fen, uciMove) {
		const gameCopy = new Chess(fen);

		let from, to, promotion;
		if (!uciMove || uciMove === "(none)") {
			const moves = gameCopy.moves({ verbose: true });
			if (moves.length === 0) return null;
			const randomMove = moves[Math.floor(Math.random() * moves.length)];
			from = randomMove.from;
			to = randomMove.to;
			promotion = randomMove.promotion || "q";
		} else {
			from = uciMove.substring(0, 2);
			to = uciMove.substring(2, 4);
			promotion = uciMove.length > 4 ? uciMove.substring(4) : "q";
		}

		const move = gameCopy.move({
			from,
			to,
			promotion: promotion.toLowerCase(),
		});
		if (!move) return null;

		return { move, gameCopy, from, to };
	}

	startPondering(
		fen,
		difficulty,
		{ isPlayerTurn, onPonderStart, onPonderEnd },
	) {
		this.currentOperationId += 1;
		const operationId = this.currentOperationId;

		this.timeouts.ponderDelay = setTimeout(() => {
			if (this.currentOperationId !== operationId || !isPlayerTurn())
				return;

			const gameCopy = new Chess(fen);
			const predictedMove = this.predictPlayerMove(gameCopy);
			if (!predictedMove) return;

			const hypotheticalGame = new Chess(fen);
			const hypotheticalMove = hypotheticalGame.move(predictedMove);
			if (!hypotheticalMove) return;

			this.ponderState.predictedMove = predictedMove;
			this.ponderState.resultingFen = hypotheticalGame.fen();

			this.initializeEngines();
			onPonderStart?.();

			this.timeouts.ponder = setTimeout(() => {
				if (
					this.currentOperationId === operationId &&
					this.ponderEngine
				) {
					this.ponderEngine.stop();
				}
			}, PONDER_TIMEOUT);

			const readyUnsub = this.ponderEngine.onReady(() => {
				if (
					this.currentOperationId !== operationId ||
					!isPlayerTurn()
				) {
					onPonderEnd?.();
					return;
				}

				this.ponderEngine.evaluatePosition(
					this.ponderState.resultingFen,
					difficulty,
				);

				const messageUnsub = this.ponderEngine.onMessage(
					({ bestMove, uciMessage }) => {
						if (this.currentOperationId !== operationId) return;

						if (
							uciMessage.startsWith("bestmove") &&
							bestMove &&
							bestMove !== "(none)"
						) {
							this.ponderState.cachedBestMove = bestMove;
							if (this.timeouts.ponder) {
								clearTimeout(this.timeouts.ponder);
								this.timeouts.ponder = null;
							}
							onPonderEnd?.();
						}
					},
				);
				this.unsubscribers.push(messageUnsub);
			});
			this.unsubscribers.push(readyUnsub);
		}, PONDER_DELAY);
	}
}