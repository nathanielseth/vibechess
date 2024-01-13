import { styles } from "../../../styles/styles";

export const moveOptionsHandler =
	(
		game,
		currentIndex,
		history,
		setOptionSquares,
		setHighlightedSquares,
		yellowSquare
	) =>
	(square) => {
		const moves = game.moves({
			square,
			verbose: true,
		});

		if (moves.length === 0) {
			setOptionSquares({});
			return false;
		}

		if (currentIndex !== history.length - 1) {
			setOptionSquares({});
			setHighlightedSquares({});
			return false;
		}

		const newSquares = {};
		moves.forEach((move) => {
			const isCapture = move.flags.includes("c");
			newSquares[move.to] = isCapture
				? styles.captureSquareStyle
				: {
						background:
							game.get(move.to) &&
							game.get(move.to).color !== game.get(square).color
								? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
								: "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
						borderRadius: "50%",
				  };
		});

		newSquares[square] = {
			background: yellowSquare,
		};

		setOptionSquares(newSquares);
		return true;
	};

export const handleSquareRightClick = (
	square,
	rightClickedSquares,
	setRightClickedSquares
) => {
	const updatedRightClickedSquares = { ...rightClickedSquares };
	updatedRightClickedSquares[square] = {
		backgroundColor: "rgba(196, 144, 209, 0.5)",
	};
	setRightClickedSquares(updatedRightClickedSquares);
};

export const formatTime = (time) => {
	let minutes = Math.floor(time / 60);
	let seconds = Math.floor(time % 60);
	let tenths = "";
	if (time <= 10) {
		tenths = Math.floor((time - Math.floor(time)) * 10);
	}
	return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}${
		tenths ? "." + tenths : ""
	}`;
};
