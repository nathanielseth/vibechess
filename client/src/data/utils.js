import { Howl } from "howler";

export const moveSound = new Howl({
	src: ["/sound/move.mp3"],
	volume: 0.7,
});

export const captureSound = new Howl({
	src: ["/sound/capture.mp3"],
	volume: 0.7,
});

export const tenSecondsSound = new Howl({
	src: ["/sound/tenseconds.mp3"],
	volume: 1.0,
});

export const notifySound = new Howl({
	src: ["/sound/notify.mp3"],
	volume: 0.2,
});

export const generatePGN = (history, gameMode) => {
	const formatGameMode = (mode) => {
		if (mode === "multiplayer") {
			return "Multiplayer";
		} else if (mode === "passandplay") {
			return "Pass And Play";
		} else if (mode === "bot") {
			return "Versus Bot";
		} else {
			return mode;
		}
	};

	const formattedGameMode = formatGameMode(gameMode);

	let pgn = `[Event "${formattedGameMode}"]\n`;
	pgn += `[Site "VibeChess"]\n`;
	pgn += `[Date "${new Date().toLocaleDateString()}"]\n`;
	pgn += `[White "${window.localStorage.getItem("username")}"]\n`;
	pgn += `[Black "${window.localStorage.getItem("username")}"]\n\n`;

	for (let i = 0; i < history.length; i += 2) {
		const whiteMove = history[i].lastMove
			? `${history[i].lastMove.san} `
			: "";
		const blackMove =
			i + 1 < history.length && history[i + 1].lastMove
				? `${history[i + 1].lastMove.san} `
				: "";

		pgn += `${whiteMove}${blackMove}\n`;
	}

	return pgn;
};

export const findBestMove = (
	engine,
	game,
	analysisMode,
	setBestMove,
	setChessBoardPosition
) => {
	if (!analysisMode) return;
	engine.evaluatePosition(game.fen(), 10);
	engine.onMessage(({ bestMove }) => {
		if (bestMove) {
			setBestMove(bestMove);
			setChessBoardPosition(game.fen());
		}
	});
};

export const isKingInCheck = (game) => {
	if (game.inCheck()) {
		const pieces = game.board();
		for (let i = 0; i < 8; i++) {
			for (let j = 0; j < 8; j++) {
				const piece = pieces[i][j];
				if (
					piece &&
					piece.type === "k" &&
					piece.color === game.turn()
				) {
					return String.fromCharCode(97 + j) + (8 - i);
				}
			}
		}
	}
	return null;
};
