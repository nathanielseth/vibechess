export function isKingInCheck(game) {
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
}
