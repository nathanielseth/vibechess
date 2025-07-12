class Engine {
	constructor() {
		this.stockfish = new Worker("./stockfish.wasm.js");
		this.isReady = false;
		this.isDestroyed = false;
		this.messageHandlers = new Set();

		this.init();
	}

	transformSFMessageData(e) {
		const uciMessage = e?.data ?? e;

		return {
			uciMessage,
			bestMove: uciMessage.match(/bestmove\s+(\S+)/)?.[1],
			ponder: uciMessage.match(/ponder\s+(\S+)/)?.[1],
			positionEvaluation: uciMessage.match(/cp\s+(\S+)/)?.[1],
			possibleMate: uciMessage.match(/mate\s+(\S+)/)?.[1],
			pv: uciMessage.match(/ pv\s+(.*)/)?.[1],
			depth: Number(uciMessage.match(/ depth\s+(\S+)/)?.[1]) ?? 0,
		};
	}

	onMessage(callback) {
		if (this.isDestroyed) return;

		const handler = (e) => {
			if (this.isDestroyed) return;
			callback(this.transformSFMessageData(e));
		};

		this.messageHandlers.add(handler);
		this.stockfish.addEventListener("message", handler);

		return () => {
			this.messageHandlers.delete(handler);
			if (this.stockfish) {
				this.stockfish.removeEventListener("message", handler);
			}
		};
	}

	init() {
		if (this.isDestroyed) return;

		this.stockfish.postMessage("uci");
		this.stockfish.postMessage("isready");

		this.onMessage(({ uciMessage }) => {
			if (uciMessage === "readyok") {
				this.isReady = true;
			}
		});
	}

	onReady(callback) {
		if (this.isDestroyed) return;

		if (this.isReady) {
			callback();
		} else {
			this.onMessage(({ uciMessage }) => {
				if (uciMessage === "readyok") {
					callback();
				}
			});
		}
	}

	evaluatePosition(fen, depth = 24) {
		if (this.isDestroyed || !this.isReady) return;

		if (depth > 30) depth = 30;

		this.stockfish.postMessage(`position fen ${fen}`);
		this.stockfish.postMessage(`go depth ${depth}`);
	}

	stop() {
		if (this.isDestroyed || !this.stockfish) return;
		this.stockfish.postMessage("stop");
	}

	terminate() {
		if (this.isDestroyed) return;

		this.isDestroyed = true;
		this.isReady = false;

		this.messageHandlers.forEach((handler) => {
			if (this.stockfish) {
				this.stockfish.removeEventListener("message", handler);
			}
		});
		this.messageHandlers.clear();

		if (this.stockfish) {
			this.stockfish.postMessage("quit");
			this.stockfish.terminate();
			this.stockfish = null;
		}
	}
}

export default Engine;
