export const getKingInCheck = (chess) => {
	if (!chess.inCheck()) return null;

	const board = chess.board();
	const turn = chess.turn();

	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const piece = board[row][col];
			if (piece?.type === "k" && piece.color === turn) {
				return String.fromCharCode(97 + col) + (8 - row);
			}
		}
	}
	return null;
};

export const isPromotionMove = (chess, from, to) => {
	const piece = chess.get(from);
	return (
		piece?.type === "p" &&
		((piece.color === "w" && to[1] === "8") ||
			(piece.color === "b" && to[1] === "1"))
	);
};

export const formatTimeRemaining = (centiseconds) => {
	const totalSeconds = Math.floor(centiseconds / 100);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes.toString().padStart(2, "0")}:${seconds
		.toString()
		.padStart(2, "0")}`;
};

export const calculateElapsedTime = (startTime, endTime = Date.now()) => {
	return Math.floor((endTime - startTime) / 10);
};

export const switchPlayer = (currentPlayer) => {
	return currentPlayer === "white" ? "black" : "white";
};

export const getOpponentColor = (color) => {
	return color === "white" ? "black" : "white";
};

export const isGameEndCondition = (chess) => {
	return (
		chess.isCheckmate() ||
		chess.isStalemate() ||
		chess.isDraw() ||
		chess.isThreefoldRepetition() ||
		chess.isInsufficientMaterial()
	);
};

export const getGameEndReason = (chess) => {
	if (chess.isCheckmate()) return "checkmate";
	if (chess.isStalemate()) return "stalemate";
	if (chess.isDraw()) return "draw";
	if (chess.isThreefoldRepetition()) return "threefold repetition";
	if (chess.isInsufficientMaterial()) return "insufficient material";
	return null;
};

export const getWinnerFromCheckmate = (chess) => {
	return chess.turn() === "w" ? "black" : "white";
};
