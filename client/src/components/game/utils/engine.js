const stockfish = new Worker("./stockfish.wasm.js");

class Engine {
	constructor() {
		this.stockfish = stockfish;
		this.isReady = false;
		this.onMessage = (callback) => {
			this.stockfish.addEventListener("message", (e) => {
				callback(this.transformSFMessageData(e));
			});
		};
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

	init() {
		this.stockfish.postMessage("uci");
		this.stockfish.postMessage("isready");
		this.onMessage(({ uciMessage }) => {
			if (uciMessage === "readyok") {
				this.isReady = true;
			}
		});
	}

	onReady(callback) {
		this.onMessage(({ uciMessage }) => {
			if (uciMessage === "readyok") {
				callback();
			}
		});
	}

	evaluatePosition(fen, depth = 24) {
		if (depth > 30) depth = 30;

		this.stockfish.postMessage(`position fen ${fen}`);
		this.stockfish.postMessage(`go depth ${depth}`);
	}

	stop() {
		this.stockfish.postMessage("stop");
	}

	terminate() {
		this.isReady = false;
		this.stockfish.postMessage("quit");
	}
}

export default Engine;
